import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface BluetoothSignalIndicatorProps {
  rssi?: number;
  level?: number; // 1 to 4
  distanceEstimate?: string;
  showText?: boolean;
}

export function BluetoothSignalIndicator({
  rssi = -55,
  level,
  distanceEstimate,
  showText = true,
}: BluetoothSignalIndicatorProps) {
  // Calculate signal level (1 to 4) if not explicitly provided
  let computedLevel = level;
  if (computedLevel === undefined) {
    if (rssi >= -55) computedLevel = 4;
    else if (rssi >= -68) computedLevel = 3;
    else if (rssi >= -80) computedLevel = 2;
    else computedLevel = 1;
  }

  // Color theme based on signal level
  const activeColor =
    computedLevel === 4
      ? "#16A34A" // Emerald Green (Closest/Excellent)
      : computedLevel === 3
      ? "#0097A7" // Cyan/Teal (Good)
      : computedLevel === 2
      ? "#F59E0B" // Amber (Fair)
      : "#EF4444"; // Red (Weak)

  const inactiveColor = "#E4E4E7";

  const getSignalLabel = () => {
    if (computedLevel === 4) return "Sangat Dekat (~1m)";
    if (computedLevel === 3) return "Dekat (1-3m)";
    if (computedLevel === 2) return "Sedang (3-5m)";
    return "Jauh (>5m)";
  };

  const heights = [4, 8, 12, 16]; // Bar heights

  return (
    <View style={styles.container}>
      {/* 4 Signal Bars */}
      <View style={styles.barsContainer}>
        {heights.map((barHeight, idx) => {
          const isFilled = idx < computedLevel;
          return (
            <View
              key={idx}
              style={[
                styles.bar,
                {
                  height: barHeight,
                  backgroundColor: isFilled ? activeColor : inactiveColor,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Signal Text & RSSI */}
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.signalLabel, { color: activeColor }]}>
            {distanceEstimate || getSignalLabel()}
          </Text>
          <Text style={styles.rssiText}>{rssi} dBm</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 16,
    gap: 2,
    paddingHorizontal: 2,
  },
  bar: {
    width: 3.5,
    borderRadius: 1.5,
  },
  textContainer: {
    flexDirection: "column",
  },
  signalLabel: {
    fontSize: 9,
    fontWeight: "700",
  },
  rssiText: {
    fontSize: 8,
    color: "#71717A",
    fontFamily: "monospace",
  },
});
