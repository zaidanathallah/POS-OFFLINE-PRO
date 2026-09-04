import React, { useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Package, Coffee, Utensils, Apple, ShoppingBag, Tag } from "lucide-react-native";

interface ProductImageProps {
  uri?: string | null;
  name: string;
  category?: string;
  size?: number;
  borderRadius?: number;
  isOutOfStock?: boolean;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; iconColor: string }> = {
  Makanan: { bg: "#FEF3C7", text: "#D97706", iconColor: "#B45309" },
  Minuman: { bg: "#CFFAFE", text: "#0891B2", iconColor: "#0E7490" },
  Buah: { bg: "#DCFCE7", text: "#16A34A", iconColor: "#15803D" },
  Retail: { bg: "#EDE9FE", text: "#7C3AED", iconColor: "#6D28D9" },
  Jasa: { bg: "#FCE7F3", text: "#DB2777", iconColor: "#BE185D" },
  Umum: { bg: "#F3F4F6", text: "#4B5563", iconColor: "#374151" },
};

export function ProductImage({
  uri,
  name,
  category = "Umum",
  size = 48,
  borderRadius = 12,
  isOutOfStock = false,
}: ProductImageProps) {
  const [loadError, setLoadError] = useState(false);

  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS["Umum"];
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "P";

  const renderIcon = () => {
    const iconSize = Math.max(14, Math.round(size * 0.35));
    if (category === "Minuman") return <Coffee size={iconSize} color={isOutOfStock ? "#DC2626" : colors.iconColor} />;
    if (category === "Makanan") return <Utensils size={iconSize} color={isOutOfStock ? "#DC2626" : colors.iconColor} />;
    if (category === "Buah") return <Apple size={iconSize} color={isOutOfStock ? "#DC2626" : colors.iconColor} />;
    if (category === "Retail") return <ShoppingBag size={iconSize} color={isOutOfStock ? "#DC2626" : colors.iconColor} />;
    return <Package size={iconSize} color={isOutOfStock ? "#DC2626" : colors.iconColor} />;
  };

  // If URI exists and hasn't failed, show Image
  if (uri && !loadError) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius,
          overflow: "hidden",
          backgroundColor: isOutOfStock ? "#FEE2E2" : "#F3F4F6",
        }}
      >
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
          onError={() => setLoadError(true)}
        />
      </View>
    );
  }

  // Fallback badge for offline / missing / failed images
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor: isOutOfStock ? "#FEE2E2" : colors.bg,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: isOutOfStock ? "#FECACA" : "rgba(0,0,0,0.04)",
      }}
    >
      {size >= 44 ? (
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          {renderIcon()}
          <Text
            style={{
              fontSize: Math.max(9, Math.round(size * 0.22)),
              fontWeight: "800",
              color: isOutOfStock ? "#DC2626" : colors.text,
              marginTop: 1,
            }}
          >
            {initials}
          </Text>
        </View>
      ) : (
        renderIcon()
      )}
    </View>
  );
}
