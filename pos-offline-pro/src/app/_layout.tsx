import "../global.css";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useThemeStore } from "@/stores/useThemeStore";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
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
    <SafeAreaProvider>
      <View
        style={{ flex: 1, width: "100%", height: "100%" }}
        className={`flex-1 ${isDark ? "dark bg-zinc-950" : "bg-[#F9F7F4]"}`}
      >
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { flex: 1, backgroundColor: isDark ? "#09090b" : "#F9F7F4" },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal-pos"
            options={{
              headerShown: false,
              presentation: "fullScreenModal",
            }}
          />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}
