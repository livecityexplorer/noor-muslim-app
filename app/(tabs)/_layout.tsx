import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

const TABS = [
  { name: "index", title: "Home", icon: "house.fill" as const, activeColor: "#7C3AED" },
  { name: "quran", title: "Quran", icon: "book.fill" as const, activeColor: "#4FC3F7" },
  { name: "prayer", title: "Prayer", icon: "moon.stars.fill" as const, activeColor: "#F59E0B" },
  { name: "qibla", title: "Qibla", icon: "location.north.fill" as const, activeColor: "#22C55E" },
  { name: "scanner", title: "Scanner", icon: "qrcode.viewfinder" as const, activeColor: "#4ADE80" },
  { name: "more", title: "More", icon: "ellipsis" as const, activeColor: "#EC4899" },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: "#0D0D20",
          borderTopColor: "#2A2A4A",
          borderTopWidth: 0.5,
          elevation: 20,
          shadowColor: "#7C3AED",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: "#7C3AED",
        tabBarInactiveTintColor: "#4A4A6A",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                {focused && (
                  <View style={[styles.iconGlow, { backgroundColor: tab.activeColor + "20" }]} />
                )}
                <IconSymbol
                  size={focused ? 26 : 24}
                  name={tab.icon}
                  color={focused ? tab.activeColor : color}
                />
              </View>
            ),
            tabBarActiveTintColor: tab.activeColor,
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 32,
    borderRadius: 16,
  },
  iconContainerActive: {
    // Active state handled by glow
  },
  iconGlow: {
    position: "absolute",
    width: 44,
    height: 32,
    borderRadius: 16,
  },
});
