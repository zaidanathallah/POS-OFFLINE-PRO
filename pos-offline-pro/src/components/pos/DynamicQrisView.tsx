import React, { useMemo } from "react";
import { View, Text, Platform } from "react-native";
import Svg, { Rect, Path } from "react-native-svg";
import { convertToDynamicQris, parseQrisMetadata, DEFAULT_BASE_QRIS } from "@/util/qrisEngine";
import { generateQrMatrix } from "@/util/qrGenerator";
import { formatRupiah } from "@/util/formatters";
import { QrCode, ShieldCheck, Smartphone } from "lucide-react-native";

interface DynamicQrisViewProps {
  amount: number;
  baseQrisPayload?: string;
  storeName?: string;
  size?: number;
}

export function DynamicQrisView({
  amount,
  baseQrisPayload,
  storeName = "SUKRIMU FROZEN MILK",
  size = 170,
}: DynamicQrisViewProps) {
  // 1. Generate Official Dynamic QRIS String
  const qrisString = useMemo(() => {
    return convertToDynamicQris(baseQrisPayload || DEFAULT_BASE_QRIS, amount);
  }, [baseQrisPayload, amount]);

  // 2. Parse merchant metadata
  const metadata = useMemo(() => {
    return parseQrisMetadata(qrisString);
  }, [qrisString]);

  // 3. Generate QR boolean matrix
  const matrix = useMemo(() => {
    try {
      return generateQrMatrix(qrisString);
    } catch (e) {
      console.error("Failed to generate QR Matrix:", e);
      return [];
    }
  }, [qrisString]);

  const moduleCount = matrix.length;
  const cellSize = moduleCount > 0 ? size / moduleCount : 0;

  return (
    <View style={{ alignItems: "center" }}>
      {/* Dynamic Amount Banner */}
      <View
        style={{
          backgroundColor: "#ecfeff",
          paddingHorizontal: 16,
          paddingVertical: 7,
          borderRadius: 14,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: "#a5f3fc",
          alignItems: "center",
          shadowColor: "#0097A7",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 1,
        }}
      >
        <Text style={{ fontSize: 10, color: "#0891b2", fontWeight: "700", textTransform: "uppercase" }}>
          Total Nominal Otomatis
        </Text>
        <Text style={{ fontSize: 18, fontWeight: "900", color: "#0097A7", marginTop: 1 }}>
          {formatRupiah(amount)}
        </Text>
      </View>

      {/* QRIS Card Container */}
      <View
        style={{
          padding: 12,
          borderRadius: 20,
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#e5e7eb",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        {/* QRIS National Header Banner */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: size,
            marginBottom: 8,
            paddingBottom: 6,
            borderBottomWidth: 1,
            borderBottomColor: "#f4f4f5",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                backgroundColor: "#dc2626",
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
                marginRight: 4,
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>
                QRIS
              </Text>
            </View>
            <Text style={{ fontSize: 9, fontWeight: "800", color: "#18181b" }}>
              DINAMIS
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ShieldCheck size={12} color="#16a34a" style={{ marginRight: 2 }} />
            <Text style={{ fontSize: 9, fontWeight: "600", color: "#16a34a" }}>
              ASPI / BI
            </Text>
          </View>
        </View>

        {/* Merchant Info */}
        <Text
          numberOfLines={1}
          style={{
            fontSize: 11,
            fontWeight: "800",
            color: "#18181b",
            textAlign: "center",
            maxWidth: size + 20,
            marginBottom: 2,
          }}
        >
          {metadata.merchantName || storeName}
        </Text>
        <Text style={{ fontSize: 9, color: "#71717a", textAlign: "center", marginBottom: 8 }}>
          NMID: {metadata.merchantCity} (ShopeePay / Semua Bank)
        </Text>

        {/* Crisp Offline SVG QR Code */}
        {moduleCount > 0 ? (
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* White Background */}
            <Rect x={0} y={0} width={size} height={size} fill="#ffffff" />
            {/* QR Modules */}
            {matrix.map((row, rIdx) =>
              row.map((isDark, cIdx) =>
                isDark ? (
                  <Rect
                    key={`${rIdx}-${cIdx}`}
                    x={cIdx * cellSize}
                    y={rIdx * cellSize}
                    width={cellSize + 0.1}
                    height={cellSize + 0.1}
                    fill="#18181b"
                  />
                ) : null
              )
            )}
          </Svg>
        ) : (
          <View
            style={{
              width: size,
              height: size,
              backgroundColor: "#f4f4f5",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
            }}
          >
            <QrCode size={40} color="#a1a1aa" />
            <Text style={{ fontSize: 10, color: "#71717a", marginTop: 6 }}>Membuat QR...</Text>
          </View>
        )}
      </View>

      {/* Helpful Guidance */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 8,
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: "#f0fdf4",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#bbf7d0",
          maxWidth: size + 80,
        }}
      >
        <Smartphone size={14} color="#16a34a" style={{ marginRight: 6 }} />
        <Text style={{ fontSize: 10, fontWeight: "600", color: "#166534", flex: 1, lineHeight: 14 }}>
          Nominal otomatis terkunci saat discan via ShopeePay, BCA, GoPay, Dana, dll.
        </Text>
      </View>
    </View>
  );
}
