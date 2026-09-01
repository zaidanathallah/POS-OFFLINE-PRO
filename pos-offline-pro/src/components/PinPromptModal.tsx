import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { getSetting, setSetting } from "@/db/settingsRepository";
import {
  Lock,
  X,
  Delete,
  HelpCircle,
} from "lucide-react-native";

interface PinPromptModalProps {
  visible: boolean;
  actionTitle?: string;
  hintText?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function PinPromptModal({
  visible,
  actionTitle = "Konfirmasi Aksi Sensitif",
  hintText,
  onClose,
  onSuccess,
}: PinPromptModalProps) {
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (visible) {
      setPin("");
      setErrorMsg("");
    }
  }, [visible]);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMsg("");
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMsg("");
    }
  };

  const verifyPin = async (enteredPin: string) => {
    try {
      const storedPin = await getSetting("supervisor_pin", "1234");
      // Support stored PIN or Master Emergency Recovery Code '9999' / '8888'
      if (enteredPin === storedPin || enteredPin === "9999" || enteredPin === "8888") {
        onClose();
        onSuccess();
      } else {
        setErrorMsg("PIN yang dimasukkan salah!");
        setPin("");
      }
    } catch (error) {
      setErrorMsg("Gagal memverifikasi PIN.");
    }
  };

  const handleForgotPin = () => {
    Alert.alert(
      "Solusi Lupa PIN Owner",
      "Gunakan Kode Pemulihan Darurat Master '9999' atau '8888' untuk membuka akses dan segera ubah PIN Anda di menu Keamanan PIN.\n\nCatatan: Pastikan owner menyimpan PIN di WhatsApp / catatan HP pribadi.",
      [{ text: "Mengerti", style: "default" }]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 360,
            backgroundColor: "#ffffff",
            borderRadius: 24,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
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
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: "#fee2e2",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                }}
              >
                <Lock size={16} color="#ef4444" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b" }}>
                Proteksi Data (PIN)
              </Text>
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
              <X size={14} color="#71717a" />
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 12, color: "#71717a", marginBottom: 16, textAlign: "center" }}>
            {actionTitle}
          </Text>

          {/* 4-Digit Pin Dots */}
          <View style={{ flexDirection: "row", justifyContent: "center", marginVertical: 8 }}>
            {[0, 1, 2, 3].map((index) => {
              const isFilled = index < pin.length;
              return (
                <View
                  key={index}
                  style={{
                    width: 44,
                    height: 48,
                    borderRadius: 14,
                    marginHorizontal: 6,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: isFilled ? "#0097A7" : "#e4e4e7",
                    backgroundColor: isFilled ? "#ecfeff" : "#f9fafb",
                  }}
                >
                  <Text style={{ fontSize: 22, fontWeight: "800", color: "#18181b" }}>
                    {isFilled ? "•" : ""}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Error Message or Custom Hint (Only shown when explicitly set in Keamanan PIN) */}
          {errorMsg ? (
            <Text style={{ fontSize: 12, color: "#ef4444", fontWeight: "600", textAlign: "center", marginVertical: 8 }}>
              {errorMsg}
            </Text>
          ) : hintText ? (
            <Text style={{ fontSize: 11, color: "#d97706", fontWeight: "600", textAlign: "center", marginVertical: 8 }}>
              {hintText}
            </Text>
          ) : (
            <View style={{ height: 16 }} />
          )}

          {/* Keypad Grid */}
          <View style={{ marginTop: 8 }}>
            {[
              ["1", "2", "3"],
              ["4", "5", "6"],
              ["7", "8", "9"],
              ["cancel", "0", "delete"],
            ].map((row, rIdx) => (
              <View key={rIdx} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                {row.map((item, cIdx) => {
                  if (item === "cancel") {
                    return (
                      <TouchableOpacity
                        key={cIdx}
                        onPress={onClose}
                        style={{
                          width: "31%",
                          height: 48,
                          borderRadius: 14,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#f4f4f5",
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#71717a" }}>
                          Batal
                        </Text>
                      </TouchableOpacity>
                    );
                  }

                  if (item === "delete") {
                    return (
                      <TouchableOpacity
                        key={cIdx}
                        onPress={handleDelete}
                        style={{
                          width: "31%",
                          height: 48,
                          borderRadius: 14,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#f4f4f5",
                        }}
                      >
                        <Delete size={18} color="#71717a" />
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={cIdx}
                      onPress={() => handleKeyPress(item)}
                      style={{
                        width: "31%",
                        height: 48,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f4f4f5",
                      }}
                    >
                      <Text style={{ fontSize: 18, fontWeight: "700", color: "#18181b" }}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Forgot PIN Recovery Link */}
          <TouchableOpacity
            onPress={handleForgotPin}
            style={{ marginTop: 8, paddingVertical: 6, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#0097A7" }}>
              Lupa PIN?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
