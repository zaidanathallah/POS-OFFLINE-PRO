import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Product, StockMovementType } from "@/db";
import { getAllProducts } from "@/db/productRepository";
import { recordStockMovement } from "@/db/stockMovementRepository";
import { X, AlertTriangle, Package, Check, ArrowDownRight, ArrowUpRight, RotateCcw } from "lucide-react-native";

interface StockAdjustmentModalProps {
  visible: boolean;
  selectedProduct?: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function StockAdjustmentModal({
  visible,
  selectedProduct = null,
  onClose,
  onSuccess,
}: StockAdjustmentModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [targetProduct, setTargetProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<StockMovementType>("DAMAGE");
  const [qtyStr, setQtyStr] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (selectedProduct) {
        setTargetProduct(selectedProduct);
      }
      getAllProducts().then((data) => {
        setProducts(data);
        if (!selectedProduct && data.length > 0) {
          setTargetProduct(data[0]);
        }
      });
      setQtyStr("");
      setNotes("");
      setMovementType("DAMAGE");
    }
  }, [visible, selectedProduct]);

  const movementOptions: { type: StockMovementType; label: string; icon: any; color: string; desc: string }[] = [
    {
      type: "DAMAGE",
      label: "Barang Rusak",
      icon: AlertTriangle,
      color: "#ef4444",
      desc: "Stok berkurang karena cacat/rusak",
    },
    {
      type: "EXPIRED",
      label: "Kadaluarsa",
      icon: RotateCcw,
      color: "#f97316",
      desc: "Stok berkurang karena lewat masa expired",
    },
    {
      type: "LOST",
      label: "Barang Hilang",
      icon: ArrowDownRight,
      color: "#a855f7",
      desc: "Stok berkurang karena kehilangan/selisih fisik",
    },
    {
      type: "ADJUSTMENT",
      label: "Koreksi Opname",
      icon: Package,
      color: "#3b82f6",
      desc: "Atur jumlah stok fisik yang sebenarnya",
    },
    {
      type: "IN",
      label: "Stok Masuk / Pembelian",
      icon: ArrowUpRight,
      color: "#10b981",
      desc: "Menambah stok dari restock / kulakan",
    },
  ];

  const handleSave = async () => {
    if (!targetProduct) {
      Alert.alert("Perhatian", "Pilih produk terlebih dahulu.");
      return;
    }

    const qty = parseFloat(qtyStr);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Perhatian", "Jumlah kuantitas harus lebih dari 0.");
      return;
    }

    setIsSaving(true);
    try {
      await recordStockMovement({
        product_id: targetProduct.id,
        product_name: targetProduct.name,
        type: movementType,
        qty,
        unit: targetProduct.unit || "pcs",
        notes: notes.trim() || `Penyesuaian: ${movementType}`,
      });

      Alert.alert("Berhasil", "Pergerakan stok telah berhasil dicatat.");
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert("Gagal", err.message || "Terjadi kesalahan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 items-center justify-center p-4">
        <View className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90%]">
          {/* Header */}
          <View className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-row items-center justify-between">
            <View className="flex-row items-center space-x-2">
              <View className="w-8 h-8 rounded-full bg-red-500/10 items-center justify-center">
                <AlertTriangle size={18} color="#ef4444" />
              </View>
              <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Catat Stok Keluar & Penyesuaian
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <X size={20} color="#71717a" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-5" keyboardShouldPersistTaps="handled">
            {/* Product Selector */}
            <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              Pilih Produk
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row space-x-2 mb-4">
              {products.map((p) => {
                const isSelected = targetProduct?.id === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setTargetProduct(p)}
                    className={`px-3.5 py-2.5 rounded-xl border ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500"
                        : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? "text-blue-600 dark:text-blue-400" : "text-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      {p.name}
                    </Text>
                    <Text className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      Stok: {p.stock} {p.unit}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Movement Type Radio Cards */}
            <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              Jenis Pergerakan / Alasan
            </Text>
            <View className="space-y-2 mb-4">
              {movementOptions.map((opt) => {
                const isSelected = movementType === opt.type;
                const IconComponent = opt.icon;
                return (
                  <TouchableOpacity
                    key={opt.type}
                    onPress={() => setMovementType(opt.type)}
                    className={`p-3 rounded-2xl border flex-row items-center justify-between ${
                      isSelected
                        ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-600"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <View className="flex-row items-center space-x-3">
                      <View
                        style={{ backgroundColor: `${opt.color}15` }}
                        className="w-8 h-8 rounded-full items-center justify-center"
                      >
                        <IconComponent size={16} color={opt.color} />
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {opt.label}
                        </Text>
                        <Text className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          {opt.desc}
                        </Text>
                      </View>
                    </View>
                    {isSelected && <Check size={16} color="#3b82f6" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Qty Input */}
            <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              Jumlah Kuantitas ({targetProduct?.unit || "pcs"}) *
            </Text>
            <TextInput
              value={qtyStr}
              onChangeText={setQtyStr}
              keyboardType="numeric"
              placeholder="Contoh: 2"
              placeholderTextColor="#a1a1aa"
              className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3"
            />

            {/* Notes */}
            <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              Keterangan / Catatan Tambahan (Opsional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Contoh: Kemasan bocor saat pengiriman"
              placeholderTextColor="#a1a1aa"
              className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-2"
            />
          </ScrollView>

          {/* Footer */}
          <View className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex-row space-x-2 bg-zinc-50 dark:bg-zinc-900">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 items-center justify-center"
            >
              <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl bg-red-600 items-center justify-center"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-xs font-bold text-white">Simpan Penyesuaian</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
