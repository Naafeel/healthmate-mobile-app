import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { useTheme } from "@/theme/useTheme";
export type IconName = ComponentProps<typeof Ionicons>["name"];
export function AppIcon({
  name,
  color,
  size,
}: {
  name: IconName;
  color?: ComponentProps<typeof Ionicons>["color"];
  size?: number;
}) {
  const theme = useTheme();
  return (
    <Ionicons
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      name={name}
      color={color ?? theme.colors.primary}
      size={size ?? theme.icon.medium}
    />
  );
}
