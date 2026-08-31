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
      <View className="flex-1 justify-center items-center bg-black/85 px-4">
        <View className="w-full max-w-lg bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-white">
              Scan Barcode Produk
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center"
            >
              <X size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Scanner Viewfinder Box matching screenshot 170459.png */}
          <View className="h-56 bg-zinc-950 rounded-2xl relative overflow-hidden items-center justify-center border border-zinc-800">
            {isManualInput ? (
              <View className="p-4 w-full items-center">
                <Text className="text-xs text-zinc-400 mb-2">Ketik Barcode / SKU Manual</Text>
                <TextInput
                  value={manualCode}
                  onChangeText={setManualCode}
                  placeholder="899276100..."
                  placeholderTextColor="#71717a"
                  className="w-full bg-zinc-800 text-white font-mono text-center text-lg p-3 rounded-xl border border-zinc-700"
                  autoFocus
                  onSubmitEditing={handleConfirmManual}
                />
              </View>
            ) : (
              <>
                <Camera size={48} color="#3f3f46" />
                <View className="w-64 h-32 border-2 border-dashed border-[#0097A7] rounded-xl absolute items-center justify-center">
                  <View className="w-full h-0.5 bg-[#0097A7] absolute shadow-lg" />
                </View>
                <Text className="text-[11px] text-zinc-500 absolute bottom-3">
                  Arahkan garis kamera ke barcode produk
                </Text>
              </>
            )}
          </View>

          {/* Bottom Action Buttons matching screenshot 170459 */}
          <View className="flex-row items-center justify-between mt-4">
            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => setFlashlight(!flashlight)}
                activeOpacity={0.7}
                className={`flex-row items-center px-3 py-2 rounded-xl mr-2 ${
                  flashlight ? "bg-amber-500/20 border border-amber-500/40" : "bg-zinc-800 border border-zinc-700"
                }`}
              >
                <Zap size={14} color={flashlight ? "#f59e0b" : "#9ca3af"} />
                <Text className="text-xs font-semibold text-zinc-300 ml-1.5">
                  Senter
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsManualInput(!isManualInput)}
                activeOpacity={0.7}
                className="flex-row items-center px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700"
              >
                <KeyboardIcon size={14} color="#9ca3af" />
                <Text className="text-xs font-semibold text-zinc-300 ml-1.5">
                  {isManualInput ? "Mode Kamera" : "Ketik barcode"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={isManualInput ? handleConfirmManual : () => onScan("8992761001")}
              activeOpacity={0.8}
              className="px-5 py-2 rounded-xl bg-[#0097A7] items-center justify-center shadow-sm"
            >
              <Text className="text-xs font-bold text-white">OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
