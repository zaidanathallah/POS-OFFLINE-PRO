import React from "react";
import { Tabs } from "expo-router";
import { useColorScheme, View } from "react-native";
import {
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
} from "lucide-react-native";
import { useThemeStore } from "@/stores/useThemeStore";

export default function TabLayout() {
  const { isDark } = useThemeStore();
  const systemTheme = useColorScheme();
  const activeDark = isDark ?? (systemTheme === "dark");

  const activeColor = "#3b82f6"; // Blue 500
  const inactiveColor = activeDark ? "#71717a" : "#94a3b8";
  const bgColor = activeDark ? "#09090b" : "#ffffff";
  const borderColor = activeDark ? "#27272a" : "#e2e8f0";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: bgColor,
          borderTopColor: borderColor,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size, focused }) => (
            <View className={focused ? "scale-105" : ""}>
              <LayoutDashboard size={size || 22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Produk",
          tabBarIcon: ({ color, size, focused }) => (
            <View className={focused ? "scale-105" : ""}>
              <Package size={size || 22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Riwayat",
          tabBarIcon: ({ color, size, focused }) => (
            <View className={focused ? "scale-105" : ""}>
              <Receipt size={size || 22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Pengaturan",
          tabBarIcon: ({ color, size, focused }) => (
            <View className={focused ? "scale-105" : ""}>
              <Settings size={size || 22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
