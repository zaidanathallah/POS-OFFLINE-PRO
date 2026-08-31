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
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.65)" }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            backgroundColor: "#ffffff",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: "92%",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  backgroundColor: "#ecfeff",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <Package size={18} color="#0097A7" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#18181b" }}>
                {productToEdit ? "Edit Data Produk" : "Tambah Produk Baru"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f4f4f5",
              }}
            >
              <X size={16} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView
            style={{ paddingHorizontal: 20, paddingVertical: 16 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Nama Produk */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#3f3f46", marginBottom: 4 }}>Nama Produk *</Text>
              <TextInput
                placeholder="Contoh: Nasi Kuning, Anggur, Apel..."
                value={name}
                onChangeText={setName}
                style={{
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: "#f4f4f5",
                  borderWidth: 1,
                  borderColor: errors.name ? "#ef4444" : "#e4e4e7",
                  fontSize: 13,
                  color: "#18181b",
                }}
              />
              {errors.name && <Text style={{ fontSize: 10, color: "#ef4444", marginTop: 2 }}>{errors.name}</Text>}
            </View>

            {/* Category selector */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#3f3f46", marginBottom: 6 }}>
                Kategori
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
                {CATEGORIES.map((cat, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setCategory(cat)}
                    style={{
                      marginRight: 8,
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 12,
                      backgroundColor: category === cat ? "#0097A7" : "#f4f4f5",
                      borderWidth: 1,
                      borderColor: category === cat ? "#0097A7" : "#e4e4e7",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: category === cat ? "#ffffff" : "#52525b",
                      }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Unit & Decimal Mode Row */}
            <View
              style={{
                marginBottom: 12,
                padding: 14,
                backgroundColor: "#f9fafb",
                borderRadius: 18,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Scale size={16} color="#0097A7" />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#18181b", marginLeft: 6 }}>
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

              <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 6 }}>Satuan Unit Penjualan</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
                {UNITS.map((u, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setUnit(u)}
                    style={{
                      marginRight: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: unit === u ? "#0097A7" : "#ffffff",
                      borderWidth: 1,
                      borderColor: unit === u ? "#0097A7" : "#e4e4e7",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: unit === u ? "#ffffff" : "#52525b",
                      }}
                    >
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Pricing Section */}
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#3f3f46", marginBottom: 4 }}>
                  Harga Jual (Rp / {unit}) *
                </Text>
                <TextInput
                  placeholder="50000"
                  keyboardType="numeric"
                  value={hargaJual}
                  onChangeText={setHargaJual}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: "#f4f4f5",
                    borderWidth: 1,
                    borderColor: errors.hargaJual ? "#ef4444" : "#e4e4e7",
                    fontSize: 13,
                    color: "#18181b",
                  }}
                />
              </View>

              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#3f3f46", marginBottom: 4 }}>
                  Modal HPP (Rp)
                </Text>
                <TextInput
                  placeholder="35000"
                  keyboardType="numeric"
                  value={modalHpp}
                  onChangeText={setModalHpp}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: "#f4f4f5",
                    borderWidth: 1,
                    borderColor: "#e4e4e7",
                    fontSize: 13,
                    color: "#18181b",
                  }}
                />
              </View>
            </View>

            {/* Live Profit Preview */}
            <View
              style={{
                marginBottom: 12,
                padding: 12,
                backgroundColor: "#ecfeff",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#a5f3fc",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TrendingUp size={15} color="#0097A7" />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#0097A7", marginLeft: 6 }}>
                    Live Profit Margin
                  </Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#16a34a" }}>
                  Margin: {marginPercent}%
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 11, color: "#52525b" }}>Laba Bersih per {unit}:</Text>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#16a34a" }}>
                  +{formatRupiah(labaKotor)}
                </Text>
              </View>
            </View>

            {/* Stock & Barcode */}
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              <View style={{ width: "35%", marginRight: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#3f3f46", marginBottom: 4 }}>
                  Stok ({unit}) *
                </Text>
                <TextInput
                  placeholder="50"
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={setStock}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: "#f4f4f5",
                    borderWidth: 1,
                    borderColor: errors.stock ? "#ef4444" : "#e4e4e7",
                    fontSize: 13,
                    color: "#18181b",
                  }}
                />
              </View>

              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#3f3f46", marginBottom: 4 }}>
                  Barcode / SKU
                </Text>
                <TextInput
                  placeholder="899..."
                  value={barcode}
                  onChangeText={setBarcode}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: "#f4f4f5",
                    borderWidth: 1,
                    borderColor: "#e4e4e7",
                    fontSize: 13,
                    color: "#18181b",
                  }}
                />
              </View>
            </View>

            {/* Variants Toggle & Section */}
            <View
              style={{
                marginBottom: 16,
                padding: 14,
                backgroundColor: "#f9fafb",
                borderRadius: 18,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Layers size={16} color="#0097A7" />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#18181b", marginLeft: 6 }}>
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
                <View style={{ marginTop: 8 }}>
                  {variants.map((v) => (
                    <View
                      key={v.id}
                      style={{
                        padding: 10,
                        marginBottom: 8,
                        backgroundColor: "#ffffff",
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <TextInput
                          value={v.name}
                          onChangeText={(t) => handleUpdateVariant(v.id, "name", t)}
                          placeholder="Nama Varian (mis. Ayam, Rendang)"
                          style={{
                            flex: 1,
                            fontWeight: "700",
                            fontSize: 12,
                            color: "#18181b",
                            paddingBottom: 4,
                            borderBottomWidth: 1,
                            borderBottomColor: "#e5e7eb",
                            marginRight: 8,
                          }}
                        />
                        <TouchableOpacity onPress={() => handleRemoveVariant(v.id)}>
                          <Trash2 size={15} color="#ef4444" />
                        </TouchableOpacity>
                      </View>

                      <View style={{ flexDirection: "row" }}>
                        <View style={{ flex: 1, marginRight: 4 }}>
                          <Text style={{ fontSize: 10, color: "#71717a" }}>Harga Jual</Text>
                          <TextInput
                            value={String(v.harga_jual)}
                            onChangeText={(t) => handleUpdateVariant(v.id, "harga_jual", Number(t) || 0)}
                            keyboardType="numeric"
                            style={{ backgroundColor: "#f4f4f5", fontSize: 12, padding: 6, borderRadius: 8 }}
                          />
                        </View>
                        <View style={{ width: 70, marginLeft: 4 }}>
                          <Text style={{ fontSize: 10, color: "#71717a" }}>Stok</Text>
                          <TextInput
                            value={String(v.stock)}
                            onChangeText={(t) => handleUpdateVariant(v.id, "stock", Number(t) || 0)}
                            keyboardType="numeric"
                            style={{ backgroundColor: "#f4f4f5", fontSize: 12, padding: 6, borderRadius: 8, textAlign: "center" }}
                          />
                        </View>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={handleAddVariant}
                    activeOpacity={0.8}
                    style={{
                      paddingVertical: 10,
                      borderRadius: 14,
                      backgroundColor: "#ecfeff",
                      borderWidth: 1,
                      borderColor: "#0097A7",
                      borderStyle: "dashed",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                    }}
                  >
                    <Plus size={15} color="#0097A7" />
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#0097A7", marginLeft: 6 }}>
                      Tambah Varian
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", marginTop: 8 }}>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 16,
                  backgroundColor: "#f4f4f5",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 6,
                  borderWidth: 1,
                  borderColor: "#e4e4e7",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#52525b" }}>
                  Batal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 16,
                  backgroundColor: "#0097A7",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 6,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff" }}>
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
