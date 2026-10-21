import { Text, type TextProps } from "react-native";
import { theme as baseTheme } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

type Props = TextProps & {
  variant?: keyof typeof baseTheme.typography;
  muted?: boolean;
};
export function AppText({
  variant = "body",
  muted = false,
  style,
  ...props
}: Props) {
  const theme = useTheme();
  return (
    <Text
      {...props}
      style={[
        theme.typography[variant],
        { color: muted ? theme.colors.muted : theme.colors.text },
        style,
      ]}
    />
  );
}
