import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Zap, Keyboard as KeyboardIcon, Check, X, Camera } from "lucide-react-native";

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
    onScan(manualCode.trim());
    setManualCode("");
    setIsManualInput(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 420,
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
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
              Scan Barcode Produk
            </Text>
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

          {/* Scanner Viewfinder Box matching screenshot 170459.png */}
          <View
            style={{
              height: 220,
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
                <Text style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 10 }}>
                  Ketik Barcode / SKU Manual
                </Text>
                <TextInput
                  value={manualCode}
                  onChangeText={setManualCode}
                  placeholder="899276100..."
                  placeholderTextColor="#71717a"
                  style={{
                    width: "100%",
                    backgroundColor: "#27272a",
                    color: "#ffffff",
                    fontFamily: "monospace",
                    textAlign: "center",
                    fontSize: 18,
                    padding: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#3f3f46",
                  }}
                  autoFocus
                  onSubmitEditing={handleConfirmManual}
                />
              </View>
            ) : (
              <>
                <Camera size={44} color="#3f3f46" />
                {/* Laser scan rect */}
                <View
                  style={{
                    width: 240,
                    height: 120,
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
                    bottom: 12,
                  }}
                >
                  Arahkan garis kamera ke barcode produk
                </Text>
              </>
            )}
          </View>

          {/* Bottom Action Buttons matching screenshot 170459 */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 16,
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
              onPress={isManualInput ? handleConfirmManual : () => onScan("8992761001")}
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
