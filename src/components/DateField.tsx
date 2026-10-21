import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { View } from "react-native";
import { AppText } from "./AppText";
import { AppButton } from "./AppButton";
import { calendarDate, localDate } from "@/domain/records/validation";
import { useTheme } from "@/theme/useTheme";
export function DateField({
  value,
  onChange,
  label = "Date",
  error,
  disabled = false,
}: {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.small }}>
      <AppText variant="label">{label}</AppText>
      <AppButton
        variant="secondary"
        label={value || "Choose date"}
        icon="calendar-outline"
        disabled={disabled}
        accessibilityLabel={label + ": " + (value || "Choose date")}
        accessibilityHint="Opens the Android date picker"
        onPress={() =>
          DateTimePickerAndroid.open({
            value: value ? calendarDate(value) : new Date(),
            mode: "date",
            maximumDate: new Date(),
            minimumDate: calendarDate("1900-01-01"),
            onValueChange: (_event, date) => onChange(localDate(date)),
          })
        }
      />
      {error && (
        <AppText
          accessibilityLiveRegion="polite"
          style={{ color: theme.colors.error }}
        >
          {error}
        </AppText>
      )}
    </View>
  );
}
