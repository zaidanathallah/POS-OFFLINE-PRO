import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Product } from "@/db";
import { ProductInput } from "@/db/productRepository";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatRupiah } from "@/util/formatters";
import {
  X,
  Package,
  DollarSign,
  Layers,
  Barcode,
  TrendingUp,
  Sparkles,
  AlertCircle,
} from "lucide-react-native";

interface ProductFormModalProps {
  visible: boolean;
  productToEdit?: Product | null;
  onClose: () => void;
  onSave: (data: ProductInput, id?: string) => Promise<void>;
}

const CATEGORIES = ["Makanan", "Minuman", "Retail / Toko", "Jasa", "Lainnya"];

export function ProductFormModal({
  visible,
  productToEdit,
  onClose,
  onSave,
}: ProductFormModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Makanan");
  const [customCategory, setCustomCategory] = useState("");
  const [hargaJual, setHargaJual] = useState("");
  const [modalHpp, setModalHpp] = useState("");
  const [stock, setStock] = useState("10");
  const [barcode, setBarcode] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      if (CATEGORIES.includes(productToEdit.category)) {
        setCategory(productToEdit.category);
        setCustomCategory("");
      } else {
        setCategory("Lainnya");
        setCustomCategory(productToEdit.category);
      }
      setHargaJual(productToEdit.harga_jual.toString());
      setModalHpp(productToEdit.modal_hpp.toString());
      setStock(productToEdit.stock.toString());
      setBarcode(productToEdit.barcode || "");
    } else {
      resetForm();
    }
    setErrors({});
  }, [productToEdit, visible]);

  const resetForm = () => {
    setName("");
    setCategory("Makanan");
    setCustomCategory("");
    setHargaJual("");
    setModalHpp("");
    setStock("10");
    setBarcode("");
  };

  // Real-time calculations
  const numHargaJual = parseFloat(hargaJual) || 0;
  const numModalHpp = parseFloat(modalHpp) || 0;
  const labaKotor = Math.max(0, numHargaJual - numModalHpp);
  const marginPercent =
    numHargaJual > 0 ? ((labaKotor / numHargaJual) * 100).toFixed(1) : "0.0";

  const handleGenerateBarcode = () => {
    const randomCode = "899" + Math.floor(1000000 + Math.random() * 9000000);
    setBarcode(randomCode);
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = "Nama produk wajib diisi.";
    }

    if (!hargaJual.trim() || isNaN(numHargaJual) || numHargaJual <= 0) {
      newErrors.hargaJual = "Harga jual harus lebih dari 0.";
    }

    if (modalHpp.trim() && (isNaN(numModalHpp) || numModalHpp < 0)) {
      newErrors.modalHpp = "Modal HPP tidak boleh bernilai negatif.";
    }

    if (!stock.trim() || isNaN(parseInt(stock, 10)) || parseInt(stock, 10) < 0) {
      newErrors.stock = "Stok harus berupa angka bulat positif.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const finalCategory =
        category === "Lainnya" && customCategory.trim()
          ? customCategory.trim()
          : category;

      await onSave(
        {
          name: name.trim(),
          category: finalCategory,
          harga_jual: numHargaJual,
          modal_hpp: numModalHpp,
          stock: parseInt(stock, 10) || 0,
          barcode: barcode.trim() || null,
          image_uri: null,
        },
        productToEdit?.id
      );
      onClose();
    } catch (error: any) {
      Alert.alert("Gagal Menyimpan", error.message || "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="bg-white dark:bg-zinc-900 rounded-t-2xl max-h-[90%] overflow-hidden border-t border-zinc-200 dark:border-zinc-800"
        >
          {/* Header */}
          <View className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-row items-center justify-between">
            <View className="flex-row items-center space-x-2">
              <View className="w-8 h-8 rounded-lg bg-blue-500/10 items-center justify-center">
                <Package size={18} color="#3b82f6" />
              </View>
              <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50 ml-2">
                {productToEdit ? "Edit Data Produk" : "Tambah Produk Baru"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full items-center justify-center bg-zinc-100 dark:bg-zinc-800"
              activeOpacity={0.7}
            >
              <X size={16} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView
            className="px-5 py-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Input: Nama Produk */}
            <View className="mb-3.5">
              <Input
                label="Nama Produk *"
                placeholder="Contoh: Kopi Susu Gula Aren"
                value={name}
                onChangeText={setName}
                error={errors.name}
              />
            </View>

            {/* Selector: Kategori Produk */}
            <View className="mb-4">
              <Text className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Kategori Usaha
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row pb-1"
              >
                {CATEGORIES.map((cat, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setCategory(cat)}
                    className={`mr-2 px-3 py-1.5 rounded-lg border transition-all ${
                      category === cat
                        ? "bg-blue-600 border-blue-600"
                        : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        category === cat
                          ? "text-white"
                          : "text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {category === "Lainnya" && (
                <View className="mt-2">
                  <Input
                    placeholder="Tulis nama kategori baru..."
                    value={customCategory}
                    onChangeText={setCustomCategory}
                  />
                </View>
              )}
            </View>

            {/* Input Grid: Harga Jual & Modal HPP */}
            <View className="flex-row space-x-3 mb-3">
              <View className="flex-1 mr-2">
                <Input
                  label="Harga Jual (Rp) *"
                  placeholder="25000"
                  keyboardType="numeric"
                  value={hargaJual}
                  onChangeText={setHargaJual}
                  error={errors.hargaJual}
                />
              </View>

              <View className="flex-1 ml-2">
                <Input
                  label="Modal HPP (Rp) *"
                  placeholder="12000"
                  keyboardType="numeric"
                  value={modalHpp}
                  onChangeText={setModalHpp}
                  error={errors.modalHpp}
                />
              </View>
            </View>

            {/* Real-time Profit & Margin Card */}
            <Card className="mb-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 p-3">
              <View className="flex-row items-center justify-between mb-1.5">
                <View className="flex-row items-center">
                  <TrendingUp size={14} color="#3b82f6" />
                  <Text className="text-xs font-semibold text-blue-900 dark:text-blue-300 ml-1.5">
                    Estimasi Keuntungan
                  </Text>
                </View>
                <Badge variant="success">Margin: {marginPercent}%</Badge>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                  Laba Kotor / Satuan:
                </Text>
                <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  +{formatRupiah(labaKotor)}
                </Text>
              </View>
            </Card>

            {/* Input Grid: Stok & Barcode */}
            <View className="flex-row space-x-3 mb-4">
              <View className="w-1/3 mr-2">
                <Input
                  label="Stok *"
                  placeholder="10"
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={setStock}
                  error={errors.stock}
                />
              </View>

              <View className="flex-1 ml-2">
                <Input
                  label="Barcode / SKU (Opsional)"
                  placeholder="899..."
                  value={barcode}
                  onChangeText={setBarcode}
                  rightIcon={
                    <TouchableOpacity
                      onPress={handleGenerateBarcode}
                      className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded"
                    >
                      <Text className="text-[10px] font-bold text-blue-500">
                        Auto
                      </Text>
                    </TouchableOpacity>
                  }
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-3 pt-2">
              <View className="flex-1 mr-2">
                <Button variant="outline" onPress={onClose} disabled={isSubmitting}>
                  Batal
                </Button>
              </View>
              <View className="flex-1 ml-2">
                <Button
                  variant="default"
                  loading={isSubmitting}
                  onPress={handleSubmit}
                >
                  {productToEdit ? "Simpan Perubahan" : "Tambah Produk"}
                </Button>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
