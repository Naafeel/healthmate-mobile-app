import { Pressable, View } from "react-native";
import { AppText } from "@/components/AppText";
import { theme } from "@/theme/tokens";
export function SelectionControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; color?: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={{ gap: theme.spacing.small }}>
      <AppText variant="label">{label}</AppText>
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.spacing.small,
        }}
      >
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: value === option.value }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => ({
              minHeight: theme.size.touch,
              flexGrow: 1,
              borderRadius: theme.radius.small,
              borderWidth: 1,
              borderColor:
                value === option.value
                  ? (option.color ?? theme.colors.primary)
                  : theme.colors.border,
              backgroundColor:
                value === option.value
                  ? theme.colors.primarySoft
                  : theme.colors.surface,
              padding: theme.spacing.compact,
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <AppText
              variant="label"
              style={{
                color: option.color ?? theme.colors.primary,
                textAlign: "center",
              }}
            >
              {option.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
