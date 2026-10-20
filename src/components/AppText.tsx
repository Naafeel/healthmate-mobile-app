import { Text, type TextProps } from "react-native";
import { theme } from "@/theme/tokens";

type Props = TextProps & {
  variant?: keyof typeof theme.typography;
  muted?: boolean;
};
export function AppText({
  variant = "body",
  muted = false,
  style,
  ...props
}: Props) {
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
