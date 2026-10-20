import { StyleSheet, TextInput, View } from "react-native";
import { AppText } from "./AppText";
import { theme } from "@/theme/tokens";
export function MeasurementField({
  label,
  value,
  onChange,
  error,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={
          error || "Enter a non-negative whole number; zero is allowed."
        }
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        inputMode="numeric"
        editable={!disabled}
        maxLength={18}
        placeholder="0"
        placeholderTextColor={theme.colors.muted}
        selectTextOnFocus
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
const styles = StyleSheet.create({
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
