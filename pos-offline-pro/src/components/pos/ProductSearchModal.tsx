import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { Product } from "@/db";
import { formatRupiah } from "@/util/formatters";
import { Search, Plus, X } from "lucide-react-native";

interface ProductSearchModalProps {
  visible: boolean;
  products: Product[];
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export function ProductSearchModal({
  visible,
  products,
  onClose,
  onSelectProduct,
}: ProductSearchModalProps) {
  const [query, setQuery] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.barcode && p.barcode.includes(query))
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/60 px-5">
        <View className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-2xl border border-zinc-100 dark:border-zinc-800">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3">
            <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Cari Produk
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center"
            >
              <X size={14} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Search Input Box */}
          <View className="flex-row items-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2">
            <Search size={16} color="#9ca3af" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ketik nama produk..."
              placeholderTextColor="#9ca3af"
              className="flex-1 ml-2 text-sm text-zinc-900 dark:text-zinc-100"
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <X size={14} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          {/* Product Results */}
          <ScrollView className="max-h-80 mt-3" showsVerticalScrollIndicator={false}>
            {filtered.length === 0 ? (
              <View className="py-8 items-center justify-center">
                <Text className="text-xs text-zinc-400">Tidak ada produk yang cocok</Text>
              </View>
            ) : (
              filtered.map((p) => {
                const isOutOfStock = p.stock <= 0;
                return (
                  <View
                    key={p.id}
                    className="py-2.5 border-b border-zinc-100 dark:border-zinc-800/80 flex-row items-center justify-between"
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {p.name}
                      </Text>
                      <Text className="text-xs text-zinc-400 mt-0.5">
                        {formatRupiah(p.harga_jual)} | {p.stock > 500 ? "Stok tanpa batas" : `Stok ${p.stock} ${p.unit || "pcs"}`}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        onSelectProduct(p);
                      }}
                      disabled={isOutOfStock}
                      className={`w-8 h-8 rounded-full items-center justify-center ${
                        isOutOfStock
                          ? "bg-zinc-100 dark:bg-zinc-800"
                          : "bg-[#0097A7] shadow-sm"
                      }`}
                    >
                      <Plus size={15} color={isOutOfStock ? "#a1a1aa" : "#ffffff"} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
