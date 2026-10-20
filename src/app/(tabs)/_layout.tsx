import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon, type IconName } from "@/components/AppIcon";
import { theme } from "@/theme/tokens";
const destinations: {
  name: string;
  title: string;
  icon: IconName;
  active: IconName;
}[] = [
  {
    name: "dashboard",
    title: "Dashboard",
    icon: "grid-outline",
    active: "grid",
  },
  {
    name: "records",
    title: "Records",
    icon: "reader-outline",
    active: "reader",
  },
  {
    name: "insights",
    title: "Insights",
    icon: "bar-chart-outline",
    active: "bar-chart",
  },
  {
    name: "settings",
    title: "Settings",
    icon: "settings-outline",
    active: "settings",
  },
];
export const unstable_settings = { anchor: "dashboard" };
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarActiveBackgroundColor: theme.colors.primarySoft,
        tabBarLabelPosition: "below-icon",
        tabBarLabelStyle: theme.typography.caption,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          elevation: 0,
          height: theme.size.tabBar + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: theme.spacing.small,
        },
      }}
    >
      {destinations.map(({ name, title, icon, active }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarAccessibilityLabel: title,
            tabBarIcon: ({ focused }) => (
              <AppIcon
                name={focused ? active : icon}
                color={focused ? theme.colors.primary : theme.colors.muted}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
