import React from "react";
import { TextInput, TextInputProps, View, Text } from "react-native";
import { cn } from "@/lib/utils";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      className,
      containerClassName,
      label,
      error,
      leftIcon,
      rightIcon,
      placeholderTextColor = "#71717a",
      ...props
    },
    ref
  ) => {
    return (
      <View className={cn("w-full space-y-1.5", containerClassName)}>
        {label && (
          <Text className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {label}
          </Text>
        )}
        <View
          className={cn(
            "flex-row items-center h-11 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3",
            error && "border-red-500",
            className
          )}
        >
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <TextInput
            ref={ref}
            placeholderTextColor={placeholderTextColor}
            className="flex-1 text-sm text-zinc-900 dark:text-zinc-100 py-1"
            {...props}
          />
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </View>
        {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
      </View>
    );
  }
);

Input.displayName = "Input";
