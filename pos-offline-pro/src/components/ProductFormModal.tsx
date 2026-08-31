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
  Switch,
  TextInput,
} from "react-native";
import { Product, ProductVariant } from "@/db";
import { ProductInput } from "@/db/productRepository";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatRupiah } from "@/util/formatters";
import {
  X,
  Package,
  TrendingUp,
  Plus,
  Trash2,
  Scale,
  Layers,
} from "lucide-react-native";

interface ProductFormModalProps {
  visible: boolean;
  productToEdit?: Product | null;
  onClose: () => void;
  onSave: (data: ProductInput, id?: string) => Promise<void>;
}

const CATEGORIES = ["Buah", "Makanan", "Minuman", "Retail", "Jasa", "Lainnya"];
const UNITS = ["pcs", "kg", "porsi", "cup", "liter", "box"];

export function ProductFormModal({
  visible,
  productToEdit,
  onClose,
  onSave,
}: ProductFormModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Makanan");
  const [customCategory, setCustomCategory] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [isDecimal, setIsDecimal] = useState(false);
  const [hargaJual, setHargaJual] = useState("");
  const [modalHpp, setModalHpp] = useState("");
  const [stock, setStock] = useState("50");
  const [barcode, setBarcode] = useState("");
  const [imageUri, setImageUri] = useState("");

  // Variants state
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

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
      setUnit(productToEdit.unit || "pcs");
      setIsDecimal(productToEdit.is_decimal === 1);
      setHargaJual(productToEdit.harga_jual.toString());
      setModalHpp(productToEdit.modal_hpp.toString());
      setStock(productToEdit.stock.toString());
      setBarcode(productToEdit.barcode || "");
      setImageUri(productToEdit.image_uri || "");
      setHasVariants(productToEdit.has_variants === 1);

      try {
        if (productToEdit.variants_json) {
          setVariants(JSON.parse(productToEdit.variants_json));
        } else {
          setVariants([]);
        }
      } catch (e) {
        setVariants([]);
      }
    } else {
      resetForm();
    }
    setErrors({});
  }, [productToEdit, visible]);

  const resetForm = () => {
    setName("");
    setCategory("Makanan");
    setCustomCategory("");
    setUnit("pcs");
    setIsDecimal(false);
    setHargaJual("");
    setModalHpp("");
    setStock("50");
    setBarcode("");
    setImageUri("");
    setHasVariants(false);
    setVariants([]);
  };

  // Real-time calculations
  const numHargaJual = parseFloat(hargaJual) || 0;
  const numModalHpp = parseFloat(modalHpp) || 0;
  const labaKotor = Math.max(0, numHargaJual - numModalHpp);
  const marginPercent =
    numHargaJual > 0 ? ((labaKotor / numHargaJual) * 100).toFixed(1) : "0.0";

  const handleAddVariant = () => {
    const newVar: ProductVariant = {
      id: `VAR-${Date.now()}`,
      name: `Varian ${variants.length + 1}`,
      harga_jual: numHargaJual || 15000,
      modal_hpp: numModalHpp || 10000,
      stock: 50,
    };
    setVariants([...variants, newVar]);
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleUpdateVariant = (id: string, field: keyof ProductVariant, value: any) => {
    setVariants(
      variants.map((v) => {
        if (v.id === id) {
          return { ...v, [field]: value };
        }
        return v;
      })
    );
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = "Nama produk wajib diisi.";
    }

    if (!hasVariants && (!hargaJual.trim() || isNaN(numHargaJual) || numHargaJual <= 0)) {
      newErrors.hargaJual = "Harga jual harus lebih dari 0.";
    }

    if (!stock.trim() || isNaN(parseFloat(stock)) || parseFloat(stock) < 0) {
      newErrors.stock = "Stok harus berupa angka positif.";
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
          unit: unit,
          is_decimal: isDecimal ? 1 : 0,
          harga_jual: numHargaJual,
          modal_hpp: numModalHpp,
          stock: parseFloat(stock) || 0,
          barcode: barcode.trim() || null,
          image_uri: imageUri.trim() || null,
          has_variants: hasVariants ? 1 : 0,
          variants_json: hasVariants && variants.length > 0 ? JSON.stringify(variants) : null,
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="bg-white dark:bg-zinc-900 rounded-t-3xl max-h-[92%] overflow-hidden border-t border-zinc-200 dark:border-zinc-800"
        >
          {/* Header */}
          <View className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 items-center justify-center mr-2.5">
                <Package size={17} color="#0097A7" />
              </View>
              <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                {productToEdit ? "Edit Data Produk" : "Tambah Produk Baru"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full items-center justify-center bg-zinc-100 dark:bg-zinc-800"
            >
              <X size={15} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView
            className="px-5 py-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            {/* Input: Nama Produk */}
            <View className="mb-3">
              <Input
                label="Nama Produk *"
                placeholder="Contoh: Nasi Kuning, Anggur, Apel..."
                value={name}
                onChangeText={setName}
                error={errors.name}
              />
            </View>

            {/* Category selector */}
            <View className="mb-3">
              <Text className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Kategori
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {CATEGORIES.map((cat, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setCategory(cat)}
                    className={`mr-2 px-3 py-1.5 rounded-xl border transition-all ${
                      category === cat
                        ? "bg-[#0097A7] border-[#0097A7]"
                        : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        category === cat ? "text-white" : "text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Unit & Decimal Mode Row */}
            <View className="mb-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <View className="flex-row items-center justify-between mb-2.5">
                <View className="flex-row items-center">
                  <Scale size={15} color="#0097A7" />
                  <Text className="text-xs font-bold text-zinc-800 dark:text-zinc-200 ml-1.5">
                    Mode Timbangan (Desimal / kg)
                  </Text>
                </View>
                <Switch
                  value={isDecimal}
                  onValueChange={(val) => {
                    setIsDecimal(val);
                    if (val) setUnit("kg");
                  }}
                  trackColor={{ false: "#e4e4e7", true: "#0097A7" }}
                />
              </View>

              <Text className="text-[11px] text-zinc-400 mb-2">Satuan Unit Penjualan</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {UNITS.map((u, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setUnit(u)}
                    className={`mr-2 px-3 py-1 rounded-lg border ${
                      unit === u
                        ? "bg-[#0097A7] border-[#0097A7]"
                        : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        unit === u ? "text-white" : "text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Pricing Section */}
            <View className="flex-row space-x-3 mb-3">
              <View className="flex-1 mr-2">
                <Input
                  label={`Harga Jual (Rp / ${unit}) *`}
                  placeholder="50000"
                  keyboardType="numeric"
                  value={hargaJual}
                  onChangeText={setHargaJual}
                  error={errors.hargaJual}
                />
              </View>

              <View className="flex-1 ml-2">
                <Input
                  label="Modal HPP (Rp)"
                  placeholder="35000"
                  keyboardType="numeric"
                  value={modalHpp}
                  onChangeText={setModalHpp}
                />
              </View>
            </View>

            {/* Live Profit Preview */}
            <Card className="mb-3 bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-900/50 p-3">
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center">
                  <TrendingUp size={14} color="#0097A7" />
                  <Text className="text-xs font-semibold text-cyan-900 dark:text-cyan-300 ml-1.5">
                    Live Profit Margin
                  </Text>
                </View>
                <Badge variant="success">Margin: {marginPercent}%</Badge>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-zinc-500">Laba Bersih per {unit}:</Text>
                <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  +{formatRupiah(labaKotor)}
                </Text>
              </View>
            </Card>

            {/* Stock & Barcode */}
            <View className="flex-row space-x-3 mb-3">
              <View className="w-1/3 mr-2">
                <Input
                  label={`Stok (${unit}) *`}
                  placeholder="50"
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={setStock}
                  error={errors.stock}
                />
              </View>

              <View className="flex-1 ml-2">
                <Input
                  label="Barcode / SKU"
                  placeholder="899..."
                  value={barcode}
                  onChangeText={setBarcode}
                />
              </View>
            </View>

            {/* Variants Toggle & Section */}
            <View className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Layers size={15} color="#0097A7" />
                  <Text className="text-xs font-bold text-zinc-800 dark:text-zinc-200 ml-1.5">
                    Produk Memiliki Varian (Rasa / Ukuran)
                  </Text>
                </View>
                <Switch
                  value={hasVariants}
                  onValueChange={setHasVariants}
                  trackColor={{ false: "#e4e4e7", true: "#0097A7" }}
                />
              </View>

              {hasVariants && (
                <View className="mt-2">
                  {variants.map((v, idx) => (
                    <View
                      key={v.id}
                      className="p-2.5 mb-2 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <TextInput
                          value={v.name}
                          onChangeText={(t) => handleUpdateVariant(v.id, "name", t)}
                          placeholder="Nama Varian (mis. Ayam, Rendang)"
                          className="flex-1 font-bold text-xs text-zinc-900 dark:text-zinc-100 p-1 border-b border-zinc-200 dark:border-zinc-700 mr-2"
                        />
                        <TouchableOpacity onPress={() => handleRemoveVariant(v.id)}>
                          <Trash2 size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>

                      <View className="flex-row space-x-2">
                        <View className="flex-1 mr-1">
                          <Text className="text-[10px] text-zinc-400">Harga Jual</Text>
                          <TextInput
                            value={String(v.harga_jual)}
                            onChangeText={(t) => handleUpdateVariant(v.id, "harga_jual", Number(t) || 0)}
                            keyboardType="numeric"
                            className="bg-zinc-50 dark:bg-zinc-700 text-xs p-1.5 rounded"
                          />
                        </View>
                        <View className="w-16 ml-1">
                          <Text className="text-[10px] text-zinc-400">Stok</Text>
                          <TextInput
                            value={String(v.stock)}
                            onChangeText={(t) => handleUpdateVariant(v.id, "stock", Number(t) || 0)}
                            keyboardType="numeric"
                            className="bg-zinc-50 dark:bg-zinc-700 text-xs p-1.5 rounded text-center"
                          />
                        </View>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={handleAddVariant}
                    activeOpacity={0.8}
                    className="py-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-dashed border-[#0097A7] items-center justify-center flex-row"
                  >
                    <Plus size={14} color="#0097A7" />
                    <Text className="text-xs font-bold text-[#0097A7] ml-1">
                      Tambah Varian
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-3 pt-2">
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                className="flex-1 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 items-center justify-center mr-2 border border-zinc-200 dark:border-zinc-700"
              >
                <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Batal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
                className="flex-1 py-3.5 rounded-2xl bg-[#0097A7] items-center justify-center ml-2 shadow-sm"
              >
                <Text className="text-xs font-bold text-white">
                  {productToEdit ? "Simpan Perubahan" : "Tambah Produk"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
