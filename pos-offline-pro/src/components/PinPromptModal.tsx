import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { getSetting } from "@/db/settingsRepository";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck,
  Lock,
  X,
  Delete,
  KeyRound,
  AlertTriangle,
} from "lucide-react-native";

interface PinPromptModalProps {
  visible: boolean;
  actionTitle?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function PinPromptModal({
  visible,
  actionTitle = "Konfirmasi Aksi Sensitif",
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
      if (enteredPin === storedPin) {
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

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/75 px-5">
        <View className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center space-x-2">
              <View className="w-8 h-8 rounded-lg bg-red-500/10 items-center justify-center">
                <Lock size={16} color="#ef4444" />
              </View>
              <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50 ml-2">
                Proteksi Data (PIN)
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-7 h-7 rounded-full items-center justify-center bg-zinc-100 dark:bg-zinc-800"
            >
              <X size={14} color="#71717a" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 text-center">
            {actionTitle}
          </Text>

          {/* 4-Digit Pin Dots */}
          <View className="flex-row justify-center space-x-4 my-2">
            {[0, 1, 2, 3].map((index) => {
              const isFilled = index < pin.length;
              return (
                <View
                  key={index}
                  className={`w-11 h-12 rounded-xl mx-1.5 items-center justify-center border-2 transition-all ${
                    isFilled
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40"
                      : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60"
                  }`}
                >
                  <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {isFilled ? "•" : ""}
                  </Text>
                </View>
              );
            })}
          </View>

          {errorMsg ? (
            <Text className="text-xs text-red-500 font-semibold text-center my-2">
              {errorMsg}
            </Text>
          ) : (
            <Text className="text-[11px] text-zinc-400 text-center my-2">
              Default PIN Supervisor: 1234
            </Text>
          )}

          {/* Keypad Grid */}
          <View className="mt-3">
            {[
              ["1", "2", "3"],
              ["4", "5", "6"],
              ["7", "8", "9"],
              ["cancel", "0", "delete"],
            ].map((row, rIdx) => (
              <View key={rIdx} className="flex-row justify-between mb-2">
                {row.map((item, cIdx) => {
                  if (item === "cancel") {
                    return (
                      <TouchableOpacity
                        key={cIdx}
                        onPress={onClose}
                        className="w-[30%] h-12 rounded-xl items-center justify-center bg-zinc-100 dark:bg-zinc-800/80 active:opacity-70"
                      >
                        <Text className="text-xs font-semibold text-zinc-500">
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
                        className="w-[30%] h-12 rounded-xl items-center justify-center bg-zinc-100 dark:bg-zinc-800/80 active:opacity-70"
                      >
                        <Delete size={18} color="#71717a" />
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={cIdx}
                      onPress={() => handleKeyPress(item)}
                      className="w-[30%] h-12 rounded-xl items-center justify-center bg-zinc-100 dark:bg-zinc-800 active:bg-blue-600 active:text-white border border-zinc-200 dark:border-zinc-700/60"
                      activeOpacity={0.65}
                    >
                      <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
