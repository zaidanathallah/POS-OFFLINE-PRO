import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { UserCheck, X, Check, Clock, Sparkles } from "lucide-react-native";

interface CashierShiftModalProps {
  visible: boolean;
  currentCashier: string;
  onClose: () => void;
  onSelectCashier: (name: string) => void;
}

const QUICK_CASHIERS = [
  "Kasir 1",
  "Kasir 2",
  "Shift Pagi",
  "Shift Siang",
  "Shift Malam",
  "Admin / Owner",
];

export function CashierShiftModal({
  visible,
  currentCashier,
  onClose,
  onSelectCashier,
}: CashierShiftModalProps) {
  const [cashierInput, setCashierInput] = useState(currentCashier || "Kasir 1");

  useEffect(() => {
    if (visible) {
      setCashierInput(currentCashier || "Kasir 1");
    }
  }, [visible, currentCashier]);

  const handleSave = () => {
    const trimmed = cashierInput.trim();
    if (!trimmed) {
      onSelectCashier("Kasir 1");
    } else {
      onSelectCashier(trimmed);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          padding: 16,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 380,
            backgroundColor: "#ffffff",
            borderRadius: 24,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
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
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#f4f4f5",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: "#f0fdfa",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <UserCheck size={20} color="#0d9488" />
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#18181b" }}>
                  Ganti Kasir / Shift
                </Text>
                <Text style={{ fontSize: 11, color: "#71717a", marginTop: 1 }}>
                  Nama kasir akan otomatis tercetak di struk invoice
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "#f4f4f5",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={15} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Current Active Indicator */}
          <View
            style={{
              backgroundColor: "#f0fdfa",
              borderRadius: 14,
              padding: 10,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 14,
              borderWidth: 1,
              borderColor: "#ccfbf1",
            }}
          >
            <Clock size={14} color="#0d9488" />
            <Text style={{ fontSize: 12, color: "#115e59", marginLeft: 6, fontWeight: "600" }}>
              Kasir Bertugas Saat Ini:{" "}
              <Text style={{ fontWeight: "800", color: "#0f766e" }}>{currentCashier || "Kasir 1"}</Text>
            </Text>
          </View>

          {/* Input field */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#3f3f46", marginBottom: 6 }}>
              Ketik Nama Kasir / Karyawan:
            </Text>
            <TextInput
              value={cashierInput}
              onChangeText={setCashierInput}
              placeholder="Misal: Siti / Zaidan / Kasir Pagi"
              autoFocus
              style={{
                backgroundColor: "#f9fafb",
                borderWidth: 1.5,
                borderColor: "#0097a7",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontSize: 14,
                fontWeight: "700",
                color: "#18181b",
              }}
            />
          </View>

          {/* Quick Preset Chips */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#71717a", marginBottom: 8 }}>
              Pilihan Cepat / Shift:
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {QUICK_CASHIERS.map((preset, idx) => {
                const isSelected = cashierInput.trim().toLowerCase() === preset.toLowerCase();
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setCashierInput(preset)}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 10,
                      backgroundColor: isSelected ? "#0097a7" : "#f4f4f5",
                      borderWidth: 1,
                      borderColor: isSelected ? "#0097a7" : "#e4e4e7",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: isSelected ? "800" : "600",
                        color: isSelected ? "#ffffff" : "#3f3f46",
                      }}
                    >
                      {preset}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Save Action Button */}
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#0097A7",
              paddingVertical: 12,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#0097A7",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.25,
              shadowRadius: 5,
              elevation: 4,
            }}
          >
            <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#ffffff" }}>
              Terapkan Kasir Bertugas
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
