import { usePersonalization } from "@/store/personalization";
import { displayWater } from "@/domain/profile/profile";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { AppHeader } from "@/components/AppHeader";
import { AppText } from "@/components/AppText";
import { AppCard } from "@/components/AppCard";
import { AppButton } from "@/components/AppButton";
import { DateField } from "@/components/DateField";
import { EmptyState } from "@/components/EmptyState";
import { healthRecordStore, useHealthRecords } from "@/store/healthRecords";
import type { HealthRecord } from "@/domain/models/HealthRecord";
import type { Theme } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
export function RecordsScreen() {
  const waterUnit = usePersonalization((s) => s.profile.waterUnit);
  const theme = useTheme();
  const styles = createStyles(theme);
  const records = useHealthRecords((s) => s.records),
    loading = useHealthRecords((s) => s.loading),
    busy = useHealthRecords((s) => s.mutating);
  const error = useHealthRecords((s) => s.error),
    success = useHealthRecords((s) => s.success);
  const [filter, setFilter] = useState("");
  const dialogOpen = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (
        healthRecordStore.getState().success?.startsWith("Record saved") ||
        healthRecordStore.getState().success?.startsWith("Record updated")
      )
        setFilter("");
      void healthRecordStore.getState().refresh();
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") void healthRecordStore.getState().refresh();
      });
      return () => subscription.remove();
    }, []),
  );
  function confirmDelete(record: HealthRecord) {
    if (dialogOpen.current || healthRecordStore.getState().mutating) return;
    dialogOpen.current = true;
    Alert.alert(
      "Delete daily record?",
      "Delete the record for " + record.date + "? This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            dialogOpen.current = false;
          },
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            dialogOpen.current = false;
            void healthRecordStore.getState().remove(record.id);
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          dialogOpen.current = false;
        },
      },
    );
  }
  const visible = filter
    ? records.filter((record) => record.date === filter)
    : records;
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <FlatList
        data={visible}
        keyExtractor={(record) => String(record.id)}
        contentContainerStyle={styles.content}
        refreshing={loading}
        onRefresh={() => {
          void healthRecordStore.getState().refresh();
        }}
        ItemSeparatorComponent={() => (
          <View style={{ height: theme.spacing.medium }} />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppHeader eyebrow="YOUR HEALTH JOURNAL" title="Records" />
            <AppText muted>Your daily summaries, saved on this device.</AppText>
            <AppButton
              label="Calendar View"
              icon="calendar-outline"
              variant="secondary"
              onPress={() => router.push("/calendar")}
            />
            <AppButton
              label="Add Record"
              icon="add"
              disabled={busy}
              onPress={() => {
                healthRecordStore.getState().clearFeedback();
                router.push("/add-record");
              }}
            />
            <AppCard>
              <DateField
                label="Filter by date"
                value={filter}
                onChange={setFilter}
                disabled={busy}
              />
              {filter && (
                <AppButton
                  label="Clear date filter"
                  variant="secondary"
                  onPress={() => setFilter("")}
                />
              )}
            </AppCard>
            {loading && (
              <ActivityIndicator
                accessibilityLabel="Loading records"
                color={theme.colors.primary}
              />
            )}
            {success && (
              <AppText
                accessibilityLiveRegion="polite"
                style={{ color: theme.colors.primary }}
              >
                {success}
              </AppText>
            )}
            {error && (
              <AppCard>
                <AppText
                  accessibilityRole="alert"
                  style={{ color: theme.colors.error }}
                >
                  {error}
                </AppText>
                <AppButton
                  label="Retry loading records"
                  onPress={() => {
                    void healthRecordStore.getState().refresh();
                  }}
                />
              </AppCard>
            )}
            <AppText variant="heading" accessibilityRole="header">
              {filter ? "Records for " + filter : "Record history"}
            </AppText>
          </View>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <EmptyState
              icon="reader-outline"
              title={
                filter ? "No record for this date" : "Your story starts here"
              }
              description={
                filter
                  ? "Choose another date or clear the filter to see all saved records."
                  : "Tap Add Record to save your first daily health summary. Zero measurements are welcome."
              }
            />
          ) : undefined
        }
        renderItem={({ item }) => (
          <AppCard>
            <AppText variant="heading" accessibilityRole="header">
              {item.date}
            </AppText>
            <AppText>Steps walked: {item.steps.toLocaleString()} steps</AppText>
            <AppText>
              Calories burned: {item.calories.toLocaleString()} kcal
            </AppText>
            <AppText>
              Water intake: {displayWater(item.water, waterUnit)}
            </AppText>
            {!!item.note && <AppText>{item.note}</AppText>}
            {!!item.tags?.length && (
              <AppText muted>{item.tags.join(" � ")}</AppText>
            )}
            <AppButton
              label="Edit Record"
              accessibilityLabel={"Edit record for " + item.date}
              variant="secondary"
              disabled={busy}
              onPress={() =>
                router.push({
                  pathname: "/edit-record/[id]",
                  params: { id: String(item.id) },
                })
              }
            />
            <AppButton
              label={busy ? "Please wait…" : "Delete Record"}
              accessibilityLabel={"Delete record for " + item.date}
              variant="secondary"
              disabled={busy}
              onPress={() => confirmDelete(item)}
            />
          </AppCard>
        )}
      />
    </SafeAreaView>
  );
}
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    content: {
      padding: theme.spacing.large,
      maxWidth: theme.size.content,
      width: "100%",
      alignSelf: "center",
      paddingBottom: theme.spacing.roomy,
    },
    header: { gap: theme.spacing.large, marginBottom: theme.spacing.large },
  });
