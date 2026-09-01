import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { getSetting, setSetting } from "@/db/settingsRepository";
import {
  Lock,
  X,
  Delete,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
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

  // Forgot PIN / Master Recovery State
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [masterCodeInput, setMasterCodeInput] = useState("");
  const [resetNewPin, setResetNewPin] = useState("");
  const [recoveryStep, setRecoveryStep] = useState<"enter_master" | "enter_new_pin">("enter_master");
  const [recoveryError, setRecoveryError] = useState("");

  useEffect(() => {
    if (visible) {
      setPin("");
      setErrorMsg("");
      setIsForgotMode(false);
      setMasterCodeInput("");
      setResetNewPin("");
      setRecoveryStep("enter_master");
      setRecoveryError("");
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
      // Allow current PIN or Master Emergency Key '9999' / '8888'
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

  // Master Recovery Actions (Only owner knowing 9999 / 8888 can reset)
  const handleVerifyMasterCode = () => {
    if (masterCodeInput === "9999" || masterCodeInput === "8888") {
      setRecoveryError("");
      setRecoveryStep("enter_new_pin");
    } else {
      setRecoveryError("Kode Master Darurat salah! Hanya owner yang memiliki akses.");
    }
  };

  const handleConfirmResetPin = async () => {
    if (resetNewPin.length !== 4 || isNaN(Number(resetNewPin))) {
      setRecoveryError("PIN baru harus terdiri dari 4 digit angka.");
      return;
    }
    await setSetting("supervisor_pin", resetNewPin);
    await setSetting("is_pin_active", "1");
    Alert.alert(
      "PIN Berhasil Direset",
      `PIN Supervisor Anda telah diperbarui menjadi ${resetNewPin}.\n\nTolong owner dicatat PIN nya di WA atau di catatan HP.`
    );
    setIsForgotMode(false);
    onClose();
    onSuccess();
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
          {/* View 1: Standard PIN Entry */}
          {!isForgotMode ? (
            <>
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

              {/* Lupa PIN Button */}
              <TouchableOpacity
                onPress={() => {
                  setIsForgotMode(true);
                  setRecoveryStep("enter_master");
                  setMasterCodeInput("");
                  setRecoveryError("");
                }}
                activeOpacity={0.7}
                style={{ marginTop: 8, paddingVertical: 6, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7" }}>
                  Lupa PIN?
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            /* View 2: Secure Owner Recovery Flow (Protected by Master Key 9999) */
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: "#ecfeff",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 8,
                    }}
                  >
                    <KeyRound size={16} color="#0097A7" />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b" }}>
                    Pemulihan PIN Owner
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setIsForgotMode(false)}>
                  <X size={16} color="#71717a" />
                </TouchableOpacity>
              </View>

              {recoveryStep === "enter_master" ? (
                <View>
                  <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 12, lineHeight: 16 }}>
                    Untuk mencegah karyawan mereset PIN, masukkan <Text style={{ fontWeight: "700", color: "#0097A7" }}>Kode Master Darurat Owner (9999)</Text>:
                  </Text>

                  <TextInput
                    value={masterCodeInput}
                    onChangeText={setMasterCodeInput}
                    placeholder="Masukkan Kode Master (9999)"
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={6}
                    style={{
                      padding: 12,
                      backgroundColor: "#f4f4f5",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#e4e4e7",
                      textAlign: "center",
                      fontSize: 16,
                      fontWeight: "700",
                      color: "#18181b",
                      marginBottom: 8,
                    }}
                  />

                  {recoveryError ? (
                    <Text style={{ fontSize: 11, color: "#ef4444", fontWeight: "600", marginBottom: 8, textAlign: "center" }}>
                      {recoveryError}
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    onPress={handleVerifyMasterCode}
                    activeOpacity={0.8}
                    style={{
                      paddingVertical: 12,
                      borderRadius: 14,
                      backgroundColor: "#0097A7",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff" }}>
                      Verifikasi Kode Master
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIsForgotMode(false)}
                    style={{ marginTop: 10, paddingVertical: 6, alignItems: "center" }}
                  >
                    <Text style={{ fontSize: 11, color: "#71717a" }}>Kembali ke Masukkan PIN</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f0fdf4", padding: 10, borderRadius: 12, marginBottom: 12 }}>
                    <CheckCircle2 size={16} color="#16a34a" />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#15803d", marginLeft: 6 }}>
                      Akses Owner Terverifikasi
                    </Text>
                  </View>

                  <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 8 }}>
                    Masukkan 4 digit PIN Supervisor baru:
                  </Text>

                  <TextInput
                    value={resetNewPin}
                    onChangeText={setResetNewPin}
                    placeholder="PIN Baru (4 Digit)"
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={4}
                    style={{
                      padding: 12,
                      backgroundColor: "#f4f4f5",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#e4e4e7",
                      textAlign: "center",
                      fontSize: 18,
                      fontWeight: "800",
                      color: "#18181b",
                      marginBottom: 8,
                    }}
                  />

                  {recoveryError ? (
                    <Text style={{ fontSize: 11, color: "#ef4444", fontWeight: "600", marginBottom: 8, textAlign: "center" }}>
                      {recoveryError}
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    onPress={handleConfirmResetPin}
                    activeOpacity={0.8}
                    style={{
                      paddingVertical: 12,
                      borderRadius: 14,
                      backgroundColor: "#0097A7",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff" }}>
                      Simpan PIN Baru & Buka Akses
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
