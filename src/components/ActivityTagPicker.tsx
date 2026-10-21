import { Pressable, View } from "react-native";
import { AppText } from "./AppText";
import { useTheme } from "@/theme/useTheme";
import { activityTags, type ActivityTag } from "@/domain/records/annotations";
export function ActivityTagPicker({
  selected,
  onChange,
  disabled = false,
  label = "Activity tags",
}: {
  selected: ActivityTag[];
  onChange: (tags: ActivityTag[]) => void;
  disabled?: boolean;
  label?: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.small }}>
      <AppText variant="label">{label}</AppText>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.spacing.small,
        }}
      >
        {activityTags.map((tag) => {
          const checked = selected.includes(tag);
          return (
            <Pressable
              key={tag}
              accessibilityRole="checkbox"
              accessibilityLabel={tag}
              accessibilityState={{ checked, disabled }}
              disabled={disabled}
              onPress={() =>
                onChange(
                  checked
                    ? selected.filter((t) => t !== tag)
                    : [...selected, tag],
                )
              }
              style={{
                minHeight: 48,
                minWidth: 64,
                justifyContent: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: theme.colors.primary,
                backgroundColor: checked
                  ? theme.colors.primary
                  : theme.colors.surface,
              }}
            >
              <AppText
                style={{
                  color: checked
                    ? theme.colors.onPrimary
                    : theme.colors.primary,
                }}
              >
                {tag}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
