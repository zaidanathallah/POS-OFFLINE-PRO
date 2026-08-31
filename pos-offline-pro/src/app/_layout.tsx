import "../global.css";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useThemeStore } from "@/stores/useThemeStore";
import { View } from "react-native";
import { initDatabase } from "@/db";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { isDark } = useThemeStore();

  useEffect(() => {
    const prepare = async () => {
      try {
        await initDatabase().catch((err) => console.log("DB init info:", err));
      } finally {
        await SplashScreen.hideAsync().catch(() => {});
      }
    };
    prepare();
  }, []);

  return (
    <View className={`flex-1 ${isDark ? "dark bg-zinc-950" : "bg-zinc-50"}`}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}
