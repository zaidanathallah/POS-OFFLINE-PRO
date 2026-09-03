import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { CartItem } from "@/stores/useCartStore";
import { formatRupiah } from "@/util/formatters";
import { X, Percent, Tag, Check, Trash2 } from "lucide-react-native";

interface ItemDiscountModalProps {
  visible: boolean;
  item: CartItem | null;
  onClose: () => void;
  onApplyDiscount: (
    itemId: string,
    discountType: "PERCENT" | "NOMINAL",
    discountValue: number
  ) => void;
  onClearDiscount: (itemId: string) => void;
}

export function ItemDiscountModal({
  visible,
  item,
  onClose,
  onApplyDiscount,
  onClearDiscount,
}: ItemDiscountModalProps) {
  const [discountType, setDiscountType] = useState<"PERCENT" | "NOMINAL">("PERCENT");
  const [valueStr, setValueStr] = useState("");

  useEffect(() => {
    if (visible && item) {
      if (item.discountType) {
        setDiscountType(item.discountType);
        setValueStr(item.discountValue ? item.discountValue.toString() : "");
      } else {
        setDiscountType("PERCENT");
        setValueStr("");
      }
    }
  }, [visible, item]);

  if (!item) return null;

  const rawSubtotal = item.qty * item.unitPrice;
  const numValue = parseFloat(valueStr) || 0;

  let calculatedDiscount = 0;
  if (discountType === "PERCENT") {
    calculatedDiscount = Math.round((rawSubtotal * Math.min(100, numValue)) / 100);
  } else {
    calculatedDiscount = Math.min(rawSubtotal, Math.round(numValue));
  }

  const finalSubtotal = Math.max(0, rawSubtotal - calculatedDiscount);

  const quickPercents = [5, 10, 15, 20, 25, 50];
  const quickNominals = [1000, 2000, 5000, 10000, 20000, 50000].filter((n) => n <= rawSubtotal);

  const handleApply = () => {
    if (numValue <= 0) {
      onClearDiscount(item.id);
    } else {
      onApplyDiscount(item.id, discountType, numValue);
    }
    onClose();
  };

  const handleClear = () => {
    onClearDiscount(item.id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 items-center justify-center p-4">
        <View className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800">
          {/* Header */}
          <View className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-row items-center justify-between">
            <View className="flex-row items-center space-x-2">
              <View className="w-8 h-8 rounded-full bg-amber-500/10 items-center justify-center">
                <Percent size={18} color="#f59e0b" />
              </View>
              <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Diskon Item Produk
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <X size={20} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Product Info */}
          <View className="px-5 pt-4 pb-3 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
            <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100" numberOfLines={1}>
              {item.product.name} {item.variant ? `(${item.variant.name})` : ""}
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {item.qty} {item.unit} × {formatRupiah(item.unitPrice)} ={" "}
              <Text className="font-bold text-zinc-700 dark:text-zinc-300">
                {formatRupiah(rawSubtotal)}
              </Text>
            </Text>
          </View>

          {/* Body */}
          <ScrollView className="p-5" keyboardShouldPersistTaps="handled">
            {/* Type Switcher */}
            <View className="flex-row bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl mb-4">
              <TouchableOpacity
                onPress={() => setDiscountType("PERCENT")}
                className={`flex-1 py-2.5 rounded-lg items-center justify-center flex-row space-x-1.5 ${
                  discountType === "PERCENT"
                    ? "bg-amber-500 shadow-sm"
                    : "bg-transparent"
                }`}
              >
                <Percent size={15} color={discountType === "PERCENT" ? "#ffffff" : "#71717a"} />
                <Text
                  className={`text-xs font-bold ${
                    discountType === "PERCENT" ? "text-white" : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  Persen (%)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDiscountType("NOMINAL")}
                className={`flex-1 py-2.5 rounded-lg items-center justify-center flex-row space-x-1.5 ${
                  discountType === "NOMINAL"
                    ? "bg-amber-500 shadow-sm"
                    : "bg-transparent"
                }`}
              >
                <Tag size={15} color={discountType === "NOMINAL" ? "#ffffff" : "#71717a"} />
                <Text
                  className={`text-xs font-bold ${
                    discountType === "NOMINAL" ? "text-white" : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  Nominal (Rp)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input Field */}
            <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              {discountType === "PERCENT" ? "Besar Diskon (%)" : "Besar Potongan Harga (Rp)"}
            </Text>
            <View className="flex-row items-center border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2.5 bg-white dark:bg-zinc-800/80 mb-3">
              {discountType === "NOMINAL" && (
                <Text className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mr-2">
                  Rp
                </Text>
              )}
              <TextInput
                value={valueStr}
                onChangeText={setValueStr}
                keyboardType="numeric"
                placeholder={discountType === "PERCENT" ? "Contoh: 10" : "Contoh: 5000"}
                placeholderTextColor="#a1a1aa"
                className="flex-1 text-base font-bold text-zinc-900 dark:text-zinc-100 p-0"
              />
              {discountType === "PERCENT" && (
                <Text className="text-sm font-bold text-zinc-500 dark:text-zinc-400 ml-2">
                  %
                </Text>
              )}
            </View>

            {/* Quick Chips */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {discountType === "PERCENT"
                ? quickPercents.map((p) => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setValueStr(p.toString())}
                      className={`px-3 py-1.5 rounded-lg border ${
                        valueStr === p.toString()
                          ? "bg-amber-500/15 border-amber-500"
                          : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          valueStr === p.toString()
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {p}%
                      </Text>
                    </TouchableOpacity>
                  ))
                : quickNominals.map((n) => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setValueStr(n.toString())}
                      className={`px-3 py-1.5 rounded-lg border ${
                        valueStr === n.toString()
                          ? "bg-amber-500/15 border-amber-500"
                          : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          valueStr === n.toString()
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {formatRupiah(n)}
                      </Text>
                    </TouchableOpacity>
                  ))}
            </View>

            {/* Calculation Preview Box */}
            <View className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 rounded-2xl p-3.5 mb-2">
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-zinc-600 dark:text-zinc-400">Harga Normal:</Text>
                <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatRupiah(rawSubtotal)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-1.5">
                <Text className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Potongan Diskon:
                </Text>
                <Text className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  - {formatRupiah(calculatedDiscount)}
                </Text>
              </View>
              <View className="h-[1px] bg-amber-500/20 my-1" />
              <View className="flex-row justify-between items-center pt-0.5">
                <Text className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Subtotal Akhir:
                </Text>
                <Text className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(finalSubtotal)}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex-row space-x-2 bg-zinc-50 dark:bg-zinc-900">
            {item.discountAmount ? (
              <TouchableOpacity
                onPress={handleClear}
                className="px-3.5 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 items-center justify-center flex-row space-x-1"
              >
                <Trash2 size={16} color="#ef4444" />
                <Text className="text-xs font-bold text-red-600 dark:text-red-400">Hapus</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 items-center justify-center"
            >
              <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApply}
              className="flex-1 py-3 rounded-xl bg-amber-500 items-center justify-center flex-row space-x-1.5 shadow-md shadow-amber-500/20"
            >
              <Check size={16} color="#ffffff" />
              <Text className="text-xs font-bold text-white">Terapkan Diskon</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
