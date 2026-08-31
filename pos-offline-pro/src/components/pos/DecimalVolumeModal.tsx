import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
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

  // Calculations
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 justify-center items-center bg-black/60 px-5">
          <View className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-100 dark:border-zinc-800">
            {/* Title & Subtitle */}
            <Text className="text-center text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {product.name}
            </Text>
            <Text className="text-center text-xs text-zinc-400 mt-0.5">
              Stok tersedia: {product.stock} {unit}
            </Text>

            {/* Mode Switcher: Volume vs Nominal */}
            <View className="flex-row mt-4 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl">
              <TouchableOpacity
                onPress={() => setTab("volume")}
                activeOpacity={0.8}
                className={`flex-1 py-2 rounded-lg items-center justify-center transition-all ${
                  tab === "volume"
                    ? "bg-[#0097A7] shadow-sm"
                    : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    tab === "volume" ? "text-white" : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  Volume
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTab("nominal")}
                activeOpacity={0.8}
                className={`flex-1 py-2 rounded-lg items-center justify-center transition-all ${
                  tab === "nominal"
                    ? "bg-[#0097A7] shadow-sm"
                    : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    tab === "nominal" ? "text-white" : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  Nominal
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input Box */}
            <View className="mt-4">
              {tab === "volume" ? (
                <View className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 items-center justify-center">
                  <TextInput
                    value={volumeInput}
                    onChangeText={setVolumeInput}
                    keyboardType="numeric"
                    placeholder="cth: 0.5"
                    placeholderTextColor="#a1a1aa"
                    className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 text-center w-full"
                    autoFocus
                  />
                </View>
              ) : (
                <View className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 items-center justify-center">
                  <TextInput
                    value={nominalInput}
                    onChangeText={setNominalInput}
                    keyboardType="number-pad"
                    placeholder="cth: 20000"
                    placeholderTextColor="#a1a1aa"
                    className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 text-center w-full"
                    autoFocus
                  />
                </View>
              )}
            </View>

            {/* Calculated Calculation Result Note */}
            <View className="mt-3 py-2 px-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 items-center justify-center">
              {tab === "volume" ? (
                <Text className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                  {volumeInput || "0"} {unit} x {formatRupiah(price)} ={" "}
                  <Text className="font-bold text-[#0097A7]">
                    {formatRupiah(calculatedNominalFromVol)}
                  </Text>
                </Text>
              ) : (
                <Text className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                  {calculatedVolumeFromNom} {unit} x {formatRupiah(price)} ={" "}
                  <Text className="font-bold text-[#0097A7]">
                    {formatRupiah(numericNominal)}
                  </Text>
                </Text>
              )}
            </View>

            {/* Buttons */}
            <View className="flex-row space-x-3 mt-5">
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 items-center justify-center mr-2 border border-zinc-200 dark:border-zinc-700"
              >
                <Text className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Batal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.8}
                className="flex-1 py-3 rounded-xl bg-[#0097A7] items-center justify-center ml-2 shadow-sm"
              >
                <Text className="text-xs font-bold text-white">Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
