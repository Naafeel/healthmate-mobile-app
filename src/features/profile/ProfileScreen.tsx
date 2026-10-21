import { useState } from "react";
import { TextInput } from "react-native";
import { router } from "expo-router";
import { AppScreen } from "@/components/AppScreen";
import { AppHeader } from "@/components/AppHeader";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
import { usePersonalization } from "@/store/personalization";
import { emptyProfile, validateProfile } from "@/domain/profile/profile";
import { useTheme } from "@/theme/useTheme";
import { useDataMaintenance } from "@/store/dataMaintenance";
export function ProfileScreen() {
  const revision = useDataMaintenance((s) => s.revision);
  const loaded = usePersonalization((s) => s.loaded);
  return <ProfileForm key={String(revision) + loaded} />;
}
function ProfileForm() {
  const theme = useTheme();
  const state = usePersonalization();

  const [draft, setDraft] = useState({
    name: state.profile.name,
    birthYear:
      state.profile.birthYear === null ? "" : String(state.profile.birthYear),
    height: state.profile.height === null ? "" : String(state.profile.height),
    weight: state.profile.weight === null ? "" : String(state.profile.weight),
    waterUnit: state.profile.waterUnit,
  });
  const [message, setMessage] = useState("");
  async function save() {
    try {
      for (const k of ["birthYear", "height", "weight"] as const)
        if (draft[k] && !/^\d+(?:\.\d+)?$/.test(draft[k]))
          throw new Error(
            "Enter plain positive numbers or leave optional fields blank.",
          );
      const p = validateProfile({
        ...draft,
        birthYear: draft.birthYear ? Number(draft.birthYear) : null,
        height: draft.height ? Number(draft.height) : null,
        weight: draft.weight ? Number(draft.weight) : null,
      });
      setMessage(
        (await state.saveProfile(p))
          ? "Profile saved on this device."
          : "Profile was not saved. Check the error and retry.",
      );
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  return (
    <AppScreen tab={false} keyboard>
      <AppHeader title="My Profile" onBack={() => router.back()} />
      <AppText muted>
        Everything is optional. This is a local profile, with no account or
        medical interpretation. Your details are included in complete JSON
        backups; protect those files.
      </AppText>
      <AppCard>
        {(["name", "birthYear", "height", "weight"] as const).map((key, i) => (
          <AppCard key={key}>
            <AppText variant="label">
              {["Display name", "Birth year", "Height (cm)", "Weight (kg)"][i]}
            </AppText>
            <TextInput
              accessibilityLabel={
                [
                  "Display name",
                  "Birth year",
                  "Height in centimeters",
                  "Weight in kilograms",
                ][i]
              }
              value={draft[key]}
              maxLength={key === "name" ? 60 : 8}
              keyboardType={
                key === "name"
                  ? "default"
                  : key === "birthYear"
                    ? "number-pad"
                    : "decimal-pad"
              }
              editable={state.loaded && !state.busy}
              onChangeText={(value) =>
                setDraft((d) => ({ ...d, [key]: value }))
              }
              style={{
                color: theme.colors.text,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 12,
                padding: 16,
                minHeight: 52,
              }}
            />
          </AppCard>
        ))}
        <AppText variant="label">Water display format</AppText>
        {(["ml", "L"] as const).map((unit) => (
          <AppButton
            key={unit}
            label={`${draft.waterUnit === unit ? "Selected: " : ""}${unit === "L" ? "Liters (L)" : "Milliliters (ml)"}`}
            variant="secondary"
            onPress={() => setDraft((d) => ({ ...d, waterUnit: unit }))}
          />
        ))}
        <AppText muted>
          Water is always stored and edited in whole milliliters. This
          preference changes display only.
        </AppText>
        <AppButton
          label="Save profile"
          disabled={!state.loaded || state.busy}
          onPress={() => void save()}
        />
        <AppButton
          label="Clear profile fields"
          variant="secondary"
          disabled={!state.loaded || state.busy}
          onPress={() => {
            setDraft({
              name: "",
              birthYear: "",
              height: "",
              weight: "",
              waterUnit: emptyProfile.waterUnit,
            });
            setMessage("Fields cleared. Save profile to apply.");
          }}
        />
        {(message || state.error) && (
          <AppText accessibilityRole="alert">{message || state.error}</AppText>
        )}
        {!state.loaded && (
          <AppButton
            label="Retry loading profile"
            onPress={() => void state.refresh()}
          />
        )}
      </AppCard>
    </AppScreen>
  );
}
