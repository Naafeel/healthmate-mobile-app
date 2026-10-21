import { usePreferences } from "@/store/preferences";
import { Appearance } from "react-native";
import { useEffect } from "react";
import { healthRecordStore } from "@/store/healthRecords";
import { healthGoalStore } from "@/store/healthGoals";
import { cleanExpiredExports } from "@/data/export/nativeRecordExport";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useTheme } from "@/theme/useTheme";

export const unstable_settings = { anchor: "index" };
export default function RootLayout() {
  const theme = useTheme();
  const mode = usePreferences(s=>s.preferences.theme);
  useEffect(()=>{ Appearance.setColorScheme(mode === "system" ? "unspecified" : mode); },[mode]);
  useEffect(() => {
    void usePreferences.getState().refresh();
    void healthRecordStore.getState().refresh();
    void healthGoalStore.getState().refresh();
    try {
      cleanExpiredExports();
    } catch {
      /* Cache cleanup must not block record access. */
    }
  }, []);
  return (
    <SafeAreaProvider>
      <StatusBar style={theme.colors.background === "#101C19" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-record" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="edit-record/[id]" />
      </Stack>
    </SafeAreaProvider>
  );
}
