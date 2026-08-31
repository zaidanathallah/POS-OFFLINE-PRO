import React from "react";
import { Text, TextProps } from "react-native";
import { cn } from "@/lib/utils";

export const H1 = ({ className, ...props }: TextProps) => (
  <Text
    className={cn(
      "text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50",
      className
    )}
    {...props}
  />
);

export const H2 = ({ className, ...props }: TextProps) => (
  <Text
    className={cn(
      "text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50",
      className
    )}
    {...props}
  />
);

export const H3 = ({ className, ...props }: TextProps) => (
  <Text
    className={cn(
      "text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50",
      className
    )}
    {...props}
  />
);

export const Paragraph = ({ className, ...props }: TextProps) => (
  <Text
    className={cn(
      "text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed",
      className
    )}
    {...props}
  />
);

export const Muted = ({ className, ...props }: TextProps) => (
  <Text
    className={cn("text-xs text-zinc-500 dark:text-zinc-400", className)}
    {...props}
  />
);
