import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Zap, Keyboard as KeyboardIcon, Check, X, Camera, Sparkles } from "lucide-react-native";
import { SUPERMARKET_BARCODE_DATABASE } from "@/util/supermarketBarcodeDb";

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScannerModal({
  visible,
  onClose,
  onScan,
}: BarcodeScannerModalProps) {
  const [manualCode, setManualCode] = useState("");
  const [isManualInput, setIsManualInput] = useState(false);
  const [flashlight, setFlashlight] = useState(false);

  const handleConfirmManual = () => {
    if (!manualCode.trim()) {
      Alert.alert("Perhatian", "Masukkan kode barcode terlebih dahulu.");
      return;
    }
    const code = manualCode.trim();
    setManualCode("");
    setIsManualInput(false);
    onClose();
    onScan(code);
  };

  const handlePresetScan = (barcode: string) => {
    onClose();
    onScan(barcode);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 16,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 440,
            backgroundColor: "#18181b",
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: "#27272a",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
                Scan Barcode Produk
              </Text>
              <Text style={{ fontSize: 11, color: "#a1a1aa", marginTop: 2 }}>
                Support Barcode Toko & Produk Supermarket / FMCG
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#27272a",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Scanner Viewfinder Box */}
          <View
            style={{
              height: 200,
              backgroundColor: "#09090b",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#27272a",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {isManualInput ? (
              <View style={{ padding: 16, width: "100%", alignItems: "center" }}>
                <Text style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 8 }}>
                  Ketik Barcode / SKU Produk (8 - 13 Digit)
                </Text>
                <TextInput
                  value={manualCode}
                  onChangeText={setManualCode}
                  onChange={(e: any) => {
                    if (e?.target?.value !== undefined) {
                      setManualCode(e.target.value);
                    }
                  }}
                  placeholder="8998866200224..."
                  placeholderTextColor="#71717a"
                  style={{
                    width: "100%",
                    backgroundColor: "#27272a",
                    color: "#ffffff",
                    fontFamily: "monospace",
                    textAlign: "center",
                    fontSize: 16,
                    padding: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#3f3f46",
                  }}
                  autoFocus
                  keyboardType="numeric"
                  onSubmitEditing={handleConfirmManual}
                />
              </View>
            ) : (
              <>
                <Camera size={40} color="#3f3f46" />
                {/* Laser guide */}
                <View
                  style={{
                    width: 220,
                    height: 110,
                    borderWidth: 2,
                    borderStyle: "dashed",
                    borderColor: "#0097A7",
                    borderRadius: 14,
                    position: "absolute",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width: "100%",
                      height: 2,
                      backgroundColor: "#0097A7",
                      shadowColor: "#0097A7",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 6,
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    color: "#71717a",
                    position: "absolute",
                    bottom: 10,
                  }}
                >
                  Arahkan garis kamera ke barcode produk supermarket
                </Text>
              </>
            )}
          </View>

          {/* Quick Supermarket Barcode Presets */}
          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Sparkles size={12} color="#0097A7" />
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#a1a1aa", marginLeft: 4 }}>
                Deteksi Instan Produk Supermarket:
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 36 }}>
              {SUPERMARKET_BARCODE_DATABASE.slice(0, 8).map((item) => (
                <TouchableOpacity
                  key={item.barcode}
                  onPress={() => handlePresetScan(item.barcode)}
                  style={{
                    backgroundColor: "#27272a",
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    marginRight: 6,
                    borderWidth: 1,
                    borderColor: "#3f3f46",
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: "600", color: "#e4e4e7" }}>
                    {item.name.split(" ")[0]} {item.name.split(" ")[1]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Bottom Action Buttons */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 14,
            }}
          >
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={() => setFlashlight(!flashlight)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  marginRight: 8,
                  backgroundColor: flashlight ? "rgba(245, 158, 11, 0.2)" : "#27272a",
                  borderWidth: 1,
                  borderColor: flashlight ? "#f59e0b" : "#3f3f46",
                }}
              >
                <Zap size={14} color={flashlight ? "#f59e0b" : "#a1a1aa"} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: flashlight ? "#f59e0b" : "#d4d4d8",
                    marginLeft: 6,
                  }}
                >
                  Senter
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsManualInput(!isManualInput)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: isManualInput ? "#0097A7" : "#27272a",
                  borderWidth: 1,
                  borderColor: isManualInput ? "#0097A7" : "#3f3f46",
                }}
              >
                <KeyboardIcon size={14} color={isManualInput ? "#ffffff" : "#a1a1aa"} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: isManualInput ? "#ffffff" : "#d4d4d8",
                    marginLeft: 6,
                  }}
                >
                  {isManualInput ? "Mode Kamera" : "Ketik barcode"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={isManualInput ? handleConfirmManual : () => handlePresetScan("8998866200224")}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: "#0097A7",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
