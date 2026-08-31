import React from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView } from "react-native";
import { Product, ProductVariant } from "@/db";
import { formatRupiah } from "@/util/formatters";
import { X } from "lucide-react-native";

interface VariantSelectionModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSelectVariant: (product: Product, variant: ProductVariant) => void;
}

export function VariantSelectionModal({
  visible,
  product,
  onClose,
  onSelectVariant,
}: VariantSelectionModalProps) {
  if (!product) return null;

  let variants: ProductVariant[] = [];
  try {
    if (product.variants_json) {
      variants = JSON.parse(product.variants_json);
    }
  } catch (e) {
    console.log("Parse variants error:", e);
  }

  if (variants.length === 0) {
    // Fallback default
    variants = [
      { id: "VAR-1", name: "Standar", harga_jual: product.harga_jual, modal_hpp: product.modal_hpp, stock: product.stock }
    ];
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/60 px-5">
        <View className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-2xl border border-zinc-100 dark:border-zinc-800">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-2">
            <View>
              <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                {product.name}
              </Text>
              <Text className="text-xs text-zinc-400 mt-0.5">
                Pilih varian untuk ditambahkan ke keranjang
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center"
            >
              <X size={14} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* List of Variants */}
          <ScrollView className="max-h-72 mt-2" showsVerticalScrollIndicator={false}>
            {variants.map((v) => (
              <TouchableOpacity
                key={v.id}
                onPress={() => {
                  onSelectVariant(product, v);
                  onClose();
                }}
                activeOpacity={0.7}
                className="my-1.5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex-row items-center justify-between"
              >
                <View>
                  <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {v.name}
                  </Text>
                  <Text className="text-[11px] text-zinc-400 mt-0.5">
                    Stok: {v.stock}
                  </Text>
                </View>

                <Text className="text-sm font-bold text-[#0097A7]">
                  {formatRupiah(v.harga_jual)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
