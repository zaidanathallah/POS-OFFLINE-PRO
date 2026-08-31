import React from "react";
import {
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
  ActivityIndicator,
  View,
} from "react-native";
import { cn } from "@/lib/utils";

export interface ButtonProps extends TouchableOpacityProps {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "success";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  textClassName?: string;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<View, ButtonProps>(
  (
    {
      className,
      textClassName,
      variant = "default",
      size = "default",
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseButton =
      "flex-row items-center justify-center rounded-lg active:opacity-80 transition-all";
    const baseText = "font-semibold text-center";

    // Variant styles
    const variantButton = {
      default: "bg-blue-600 active:bg-blue-700 shadow-sm",
      secondary: "bg-zinc-800 active:bg-zinc-700 border border-zinc-700",
      outline: "border border-zinc-700 bg-transparent active:bg-zinc-800/50",
      ghost: "bg-transparent active:bg-zinc-800/40",
      destructive: "bg-red-600 active:bg-red-700",
      success: "bg-emerald-600 active:bg-emerald-700",
    }[variant];

    const variantText = {
      default: "text-white",
      secondary: "text-zinc-100",
      outline: "text-zinc-200",
      ghost: "text-zinc-300",
      destructive: "text-white",
      success: "text-white",
    }[variant];

    // Size styles
    const sizeButton = {
      default: "h-11 px-4 py-2.5",
      sm: "h-9 px-3 py-1.5 rounded-md",
      lg: "h-13 px-6 py-3.5 rounded-xl",
      icon: "h-10 w-10 p-0 items-center justify-center",
    }[size];

    const sizeText = {
      default: "text-sm",
      sm: "text-xs",
      lg: "text-base",
      icon: "text-sm",
    }[size];

    const isDisabled = disabled || loading;

    return (
      <TouchableOpacity
        ref={ref as any}
        className={cn(
          baseButton,
          variantButton,
          sizeButton,
          isDisabled && "opacity-50",
          className
        )}
        disabled={isDisabled}
        activeOpacity={0.75}
        {...props}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={
              variant === "outline" || variant === "ghost"
                ? "#a1a1aa"
                : "#ffffff"
            }
          />
        ) : (
          <>
            {leftIcon && <View className="mr-2">{leftIcon}</View>}
            {typeof children === "string" ? (
              <Text className={cn(baseText, variantText, sizeText, textClassName)}>
                {children}
              </Text>
            ) : (
              children
            )}
            {rightIcon && <View className="ml-2">{rightIcon}</View>}
          </>
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = "Button";
