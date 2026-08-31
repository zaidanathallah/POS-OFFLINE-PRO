import React from "react";
import { View, Text, ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export interface BadgeProps extends ViewProps {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "success"
    | "destructive"
    | "warning"
    | "indigo";
  children: React.ReactNode;
  textClassName?: string;
}

export function Badge({
  className,
  textClassName,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const variantBadge = {
    default: "bg-blue-600/15 border-blue-500/30",
    secondary: "bg-zinc-800/60 border-zinc-700/60",
    outline: "bg-transparent border-zinc-300 dark:border-zinc-700",
    success: "bg-emerald-500/15 border-emerald-500/30",
    destructive: "bg-red-500/15 border-red-500/30",
    warning: "bg-amber-500/15 border-amber-500/30",
    indigo: "bg-indigo-500/15 border-indigo-500/30",
  }[variant];

  const variantText = {
    default: "text-blue-600 dark:text-blue-400",
    secondary: "text-zinc-600 dark:text-zinc-300",
    outline: "text-zinc-700 dark:text-zinc-300",
    success: "text-emerald-600 dark:text-emerald-400",
    destructive: "text-red-600 dark:text-red-400",
    warning: "text-amber-600 dark:text-amber-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
  }[variant];

  return (
    <View
      className={cn(
        "inline-flex flex-row items-center rounded-full border px-2.5 py-0.5 self-start",
        variantBadge,
        className
      )}
      {...props}
    >
      {typeof children === "string" ? (
        <Text
          className={cn(
            "text-[11px] font-semibold tracking-wide",
            variantText,
            textClassName
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
