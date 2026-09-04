import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { Product } from "@/db";
import { formatRupiah } from "@/util/formatters";

interface DecimalVolumeModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (product: Product, calculatedQty: number, customSubtotal?: number) => void;
}

export function DecimalVolumeModal({
  visible,
  product,
  onClose,
  onConfirm,
}: DecimalVolumeModalProps) {
  const [tab, setTab] = useState<"volume" | "nominal">("volume");
  const [volumeInput, setVolumeInput] = useState("1");
  const [nominalInput, setNominalInput] = useState("");

  useEffect(() => {
    if (visible) {
      setTab("volume");
      setVolumeInput("1");
      setNominalInput("");
    }
  }, [visible]);

  if (!product) return null;

  const unit = product.unit || "kg";
  const price = product.harga_jual;

  const numericVolume = parseFloat(volumeInput.replace(/,/g, ".")) || 0;
  const calculatedNominalFromVol = Math.round(numericVolume * price);

  const numericNominal = parseFloat(nominalInput.replace(/[^0-9]/g, "")) || 0;
  const calculatedVolumeFromNom = price > 0 ? parseFloat((numericNominal / price).toFixed(3)) : 0;

  const handleSave = () => {
    if (tab === "volume") {
      if (numericVolume <= 0) return;
      onConfirm(product, numericVolume, calculatedNominalFromVol);
    } else {
      if (numericNominal <= 0 || calculatedVolumeFromNom <= 0) return;
      onConfirm(product, calculatedVolumeFromNom, numericNominal);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.65)", padding: 20 }}>
        {/* Backdrop click to close */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={{
            width: "100%",
            maxWidth: 380,
            backgroundColor: "#ffffff",
            borderRadius: 24,
            padding: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 5,
            zIndex: 10,
          }}
        >
          {/* Title & Subtitle */}
          <Text style={{ textAlign: "center", fontSize: 18, fontWeight: "700", color: "#18181b" }}>
            {product.name}
          </Text>
          <Text style={{ textAlign: "center", fontSize: 12, color: "#71717a", marginTop: 2 }}>
            Stok tersedia: {product.stock} {unit}
          </Text>

          {/* Mode Switcher: Volume vs Nominal */}
          <View
            style={{
              flexDirection: "row",
              marginTop: 16,
              padding: 4,
              backgroundColor: "#f4f4f5",
              borderRadius: 14,
            }}
          >
            <TouchableOpacity
              onPress={() => setTab("volume")}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: tab === "volume" ? "#0097A7" : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: tab === "volume" ? "#ffffff" : "#52525b",
                }}
              >
                Volume
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTab("nominal")}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: tab === "nominal" ? "#0097A7" : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: tab === "nominal" ? "#ffffff" : "#52525b",
                }}
              >
                Nominal
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input Box */}
          <View style={{ marginTop: 16 }}>
            {tab === "volume" ? (
              <View
                style={{
                  backgroundColor: "#f9fafb",
                  borderWidth: 1.5,
                  borderColor: "#0097A7",
                  borderRadius: 16,
                  padding: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TextInput
                  value={volumeInput}
                  onChangeText={setVolumeInput}
                  keyboardType="numeric"
                  placeholder="cth: 0.5"
                  placeholderTextColor="#a1a1aa"
                  selectTextOnFocus
                  editable={true}
                  style={{
                    fontSize: 24,
                    fontWeight: "800",
                    color: "#18181b",
                    textAlign: "center",
                    width: "100%",
                  }}
                  autoFocus
                />
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: "#f9fafb",
                  borderWidth: 1.5,
                  borderColor: "#0097A7",
                  borderRadius: 16,
                  padding: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TextInput
                  value={nominalInput}
                  onChangeText={setNominalInput}
                  keyboardType="number-pad"
                  placeholder="cth: 20000"
                  placeholderTextColor="#a1a1aa"
                  selectTextOnFocus
                  editable={true}
                  style={{
                    fontSize: 24,
                    fontWeight: "800",
                    color: "#18181b",
                    textAlign: "center",
                    width: "100%",
                  }}
                  autoFocus
                />
              </View>
            )}
          </View>

          {/* Calculated Calculation Result Note */}
          <View
            style={{
              marginTop: 12,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: "#ecfeff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {tab === "volume" ? (
              <Text style={{ fontSize: 12, color: "#3f3f46", fontWeight: "600" }}>
                {volumeInput || "0"} {unit} x {formatRupiah(price)} ={" "}
                <Text style={{ fontWeight: "800", color: "#0097A7" }}>
                  {formatRupiah(calculatedNominalFromVol)}
                </Text>
              </Text>
            ) : (
              <Text style={{ fontSize: 12, color: "#3f3f46", fontWeight: "600" }}>
                {calculatedVolumeFromNom} {unit} x {formatRupiah(price)} ={" "}
                <Text style={{ fontWeight: "800", color: "#0097A7" }}>
                  {formatRupiah(numericNominal)}
                </Text>
              </Text>
            )}
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: "row", marginTop: 20 }}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: "#f4f4f5",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,
                borderWidth: 1,
                borderColor: "#e4e4e7",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#52525b" }}>
                Batal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: "#0097A7",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: 8,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff" }}>Simpan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
