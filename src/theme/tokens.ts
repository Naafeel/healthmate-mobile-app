import type { TextStyle } from "react-native";

export const theme = {
  colors: {
    background: "#F4F8F7",
    error: "#9C2F28",
    surface: "#FFFFFF",
    primary: "#126B57",
    primaryPressed: "#0C5142",
    primarySoft: "#E2F2EB",
    text: "#183B33",
    muted: "#4B655E",
    border: "#D5E5DF",
    onPrimary: "#FFFFFF",
    disabled: "#E3E9E6",
    disabledText: "#53665E",
  },
  metrics: {
    steps: { foreground: "#126B57", background: "#E2F2EB" },
    calories: { foreground: "#9C431B", background: "#FFF0E6" },
    water: { foreground: "#185E91", background: "#E8F2FA" },
  },
  typography: {
    hero: { fontSize: 38, lineHeight: 46, fontWeight: "700" },
    title: { fontSize: 30, lineHeight: 38, fontWeight: "700" },
    heading: { fontSize: 20, lineHeight: 28, fontWeight: "600" },
    body: { fontSize: 16, lineHeight: 25 },
    label: { fontSize: 15, lineHeight: 22, fontWeight: "600" },
    caption: { fontSize: 13, lineHeight: 20 },
    eyebrow: {
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "700",
      letterSpacing: 1.6,
    },
  } satisfies Record<string, TextStyle>,
  spacing: {
    tiny: 4,
    small: 8,
    compact: 12,
    medium: 16,
    large: 24,
    roomy: 32,
    extraLarge: 40,
  },
  radius: { small: 12, button: 16, card: 24, icon: 24, pill: 999 },
  border: { width: 1 },
  elevation: { card: 0 },
  icon: { small: 20, medium: 24, large: 32, hero: 44 },
  size: {
    touch: 48,
    button: 52,
    tabBar: 68,
    content: 640,
    welcome: 480,
    iconTile: 64,
  },
} as const;

export type Theme = Omit<typeof theme, "colors" | "metrics"> & {
  colors: { [K in keyof typeof theme.colors]: string };
  metrics: {
    [K in keyof typeof theme.metrics]: {
      foreground: string;
      background: string;
    };
  };
};
export const darkTheme: Theme = {
  ...theme,
  colors: {
    background: "#101C19",
    surface: "#192B25",
    primary: "#82DDBB",
    primaryPressed: "#A3E8CD",
    primarySoft: "#233F34",
    text: "#EDF8F2",
    muted: "#B3C9BF",
    border: "#486457",
    onPrimary: "#10291F",
    error: "#FFB4AA",
    disabled: "#2D3F36",
    disabledText: "#A9BDB2",
  },
  metrics: {
    steps: { foreground: "#82DDBB", background: "#233F34" },
    calories: { foreground: "#FFBF96", background: "#422F24" },
    water: { foreground: "#9ECFFD", background: "#213849" },
  },
};
