import { useDataMaintenance } from "@/store/dataMaintenance";
import { Pressable, StyleSheet, View, type PressableProps } from "react-native";
import { AppText } from "./AppText";
import { AppIcon, type IconName } from "./AppIcon";
import type { Theme } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
type Props = Omit<PressableProps, "children" | "style"> & {
  label: string;
  icon?: IconName;
  variant?: "primary" | "secondary";
};
export function AppButton({
  label,
  icon,
  variant = "primary",
  disabled: disabledProp,
  ...props
}: Props) {
  const maintenance = useDataMaintenance((s) => s.busy);
  const disabled = disabledProp || maintenance;
  const theme = useTheme();
  const styles = createStyles(theme);
  const primary = variant === "primary";
  const color = disabled
    ? theme.colors.disabledText
    : primary
      ? theme.colors.onPrimary
      : theme.colors.primary;
  return (
    <Pressable
      {...props}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled
            ? theme.colors.disabled
            : primary
              ? pressed
                ? theme.colors.primaryPressed
                : theme.colors.primary
              : theme.colors.primarySoft,
          opacity: pressed && !primary ? 0.75 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        {icon && <AppIcon name={icon} color={color} />}
        <AppText
          variant="label"
          style={{ color, flexShrink: 1, textAlign: "center" }}
        >
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      minHeight: theme.size.button,
      borderRadius: theme.radius.button,
      padding: theme.spacing.medium,
      justifyContent: "center",
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.small,
    },
  });
