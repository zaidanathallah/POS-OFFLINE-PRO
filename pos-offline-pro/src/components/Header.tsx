import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useThemeStore } from "@/stores/useThemeStore";
import { Badge } from "@/components/ui/Badge";
import { Moon, Sun, WifiOff } from "lucide-react-native";

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export function Header({ title, subtitle, rightAction }: HeaderProps) {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <View className="px-5 pt-3 pb-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center space-x-2">
            <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {title}
            </Text>
            <Badge variant="success" className="ml-2">
              <View className="flex-row items-center">
                <WifiOff size={10} color="#10b981" />
                <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 ml-1">
                  100% OFFLINE
                </Text>
              </View>
            </Badge>
          </View>
          {subtitle && (
            <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {subtitle}
            </Text>
          )}
        </View>

        <View className="flex-row items-center space-x-2">
          {rightAction}
          <TouchableOpacity
            onPress={toggleTheme}
            className="w-9 h-9 rounded-lg items-center justify-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
            activeOpacity={0.7}
          >
            {isDark ? (
              <Sun size={17} color="#fbbf24" />
            ) : (
              <Moon size={17} color="#64748b" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
