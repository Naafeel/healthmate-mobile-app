import { StyleSheet, TextInput, View } from "react-native";
import { AppText } from "./AppText";
import type { Theme } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
export function MeasurementField({
  label,
  value,
  onChange,
  error,
  disabled,
  optional = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  optional?: boolean;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={
          error ||
          (optional
            ? "Enter a positive whole number, or leave blank to unset this goal."
            : "Enter a non-negative whole number; zero is allowed.")
        }
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        inputMode="numeric"
        editable={!disabled}
        maxLength={18}
        placeholder={optional ? "Not set" : "0"}
        placeholderTextColor={theme.colors.muted}
        selectTextOnFocus={false}
        cursorColor={theme.colors.primary}
        selectionColor={theme.colors.primary}
        style={[
          styles.input,
          error ? { borderColor: theme.colors.error } : undefined,
        ]}
      />
      {error && (
        <AppText accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </AppText>
      )}
    </View>
  );
}
const createStyles = (theme: Theme) => StyleSheet.create({
  field: { gap: theme.spacing.small },
  input: {
    ...theme.typography.body,
    minHeight: theme.size.button,
    borderWidth: theme.border.width,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.small,
    padding: theme.spacing.medium,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  error: { color: theme.colors.error },
});
