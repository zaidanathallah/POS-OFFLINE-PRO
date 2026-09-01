import React from "react";
import { Tabs } from "expo-router";
import { useColorScheme, View, Platform, Text } from "react-native";
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

  const activeColor = "#0097A7";
  const inactiveColor = activeDark ? "#94a3b8" : "#64748b";

  // Glassmorphic translucent colors ala iPhone
  const glassBgColor = activeDark
    ? "rgba(18, 18, 20, 0.88)"
    : "rgba(255, 255, 255, 0.88)";
  const glassBorderColor = activeDark
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.08)";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: "bottom",
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: glassBgColor,
          borderTopColor: glassBorderColor,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 82 : 66,
          paddingBottom: Platform.OS === "ios" ? 22 : 8,
          paddingTop: 6,
          elevation: 12,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          // Web blur support
          ...(Platform.OS === "web"
            ? ({
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              } as any)
            : {}),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarLabel: ({ color, focused }) => (
            <Text
              style={{
                fontSize: 11,
                fontWeight: focused ? "800" : "600",
                color: focused ? "#0097A7" : inactiveColor,
                marginTop: 2,
              }}
            >
              Dashboard
            </Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 3,
                borderRadius: 14,
                backgroundColor: focused ? "rgba(0, 151, 167, 0.12)" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LayoutDashboard
                size={20}
                color={focused ? "#0097A7" : inactiveColor}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Produk",
          tabBarLabel: ({ color, focused }) => (
            <Text
              style={{
                fontSize: 11,
                fontWeight: focused ? "800" : "600",
                color: focused ? "#0097A7" : inactiveColor,
                marginTop: 2,
              }}
            >
              Produk
            </Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 3,
                borderRadius: 14,
                backgroundColor: focused ? "rgba(0, 151, 167, 0.12)" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Package
                size={20}
                color={focused ? "#0097A7" : inactiveColor}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Riwayat",
          tabBarLabel: ({ color, focused }) => (
            <Text
              style={{
                fontSize: 11,
                fontWeight: focused ? "800" : "600",
                color: focused ? "#0097A7" : inactiveColor,
                marginTop: 2,
              }}
            >
              Riwayat
            </Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 3,
                borderRadius: 14,
                backgroundColor: focused ? "rgba(0, 151, 167, 0.12)" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Receipt
                size={20}
                color={focused ? "#0097A7" : inactiveColor}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Pengaturan",
          tabBarLabel: ({ color, focused }) => (
            <Text
              style={{
                fontSize: 11,
                fontWeight: focused ? "800" : "600",
                color: focused ? "#0097A7" : inactiveColor,
                marginTop: 2,
              }}
            >
              Pengaturan
            </Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 3,
                borderRadius: 14,
                backgroundColor: focused ? "rgba(0, 151, 167, 0.12)" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Settings
                size={20}
                color={focused ? "#0097A7" : inactiveColor}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
