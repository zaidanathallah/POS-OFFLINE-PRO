import React from "react";
import { View, Text, ViewProps, TextProps } from "react-native";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<View, ViewProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-sm p-4",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<View, ViewProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("flex flex-col space-y-1.5 pb-3", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<Text, TextProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(
        "text-base font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight",
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<Text, TextProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(
        "text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed",
        className
      )}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<View, ViewProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<View, ViewProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("flex-row items-center pt-3 border-t border-zinc-100 dark:border-zinc-800/60 mt-3", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";
