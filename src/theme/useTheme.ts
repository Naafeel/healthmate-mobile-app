import { useColorScheme } from "react-native";
import { usePreferences } from "../store/preferences";
import { resolveTheme } from "../domain/preferences/preferences";
import { theme, darkTheme, type Theme } from "./tokens";
export function useTheme(): Theme {
  const mode = usePreferences((s) => s.preferences.theme);
  const system = useColorScheme();
  return resolveTheme(mode, system) === "dark" ? darkTheme : theme;
}
