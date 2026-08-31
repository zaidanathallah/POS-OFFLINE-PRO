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
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Product, ProductVariant, Category } from "@/db";
import { ProductInput } from "@/db/productRepository";
import { getAllCategories } from "@/db/categoryRepository";
import { formatRupiah } from "@/util/formatters";
import {
  X,
  Package,
  TrendingUp,
  Plus,
  Trash2,
  Scale,
  Layers,
  Camera,
  ImageIcon,
  Upload,
} from "lucide-react-native";

interface ProductFormModalProps {
  visible: boolean;
  productToEdit?: Product | null;
  onClose: () => void;
  onSave: (data: ProductInput, id?: string) => Promise<void>;
}

const UNITS = ["pcs", "kg", "porsi", "cup", "liter", "box", "gram"];

export function ProductFormModal({
  visible,
  productToEdit,
  onClose,
  onSave,
}: ProductFormModalProps) {
  const [categories, setCategories] = useState<string[]>([
    "Buah",
    "Makanan",
    "Minuman",
    "Retail",
    "Jasa",
    "Lainnya",
  ]);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Makanan");
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

  // Load dynamic categories
  useEffect(() => {
    if (visible) {
      (async () => {
        try {
          const catList = await getAllCategories();
          if (catList.length > 0) {
            setCategories(catList.map((c) => c.name));
          }
        } catch (e) {
          console.error("Gagal load categories in modal:", e);
        }
      })();
    }
  }, [visible]);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category || "Makanan");
      setUnit(productToEdit.unit || "pcs");
      setIsDecimal(productToEdit.is_decimal === 1 || productToEdit.category === "Buah");
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

  // Auto-activate decimal / scale mode when category is Buah
  const handleSelectCategory = (catName: string) => {
    setCategory(catName);
    if (catName === "Buah") {
      setIsDecimal(true);
      if (unit === "pcs" || unit === "porsi") {
        setUnit("kg");
      }
    }
  };

  const handleSelectUnit = (u: string) => {
    setUnit(u);
    if (u === "kg" || u === "liter" || u === "gram") {
      setIsDecimal(true);
    }
  };

  // Image Picker (Gallery / File)
  const handlePickImage = async () => {
    try {
      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e: any) => {
          const file = e.target?.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              if (reader.result) {
                setImageUri(reader.result.toString());
              }
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Izin Ditolak", "Izin akses galeri foto diperlukan untuk mengunggah gambar produk.");
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          if (asset.base64) {
            setImageUri(`data:image/jpeg;base64,${asset.base64}`);
          } else {
            setImageUri(asset.uri);
          }
        }
      }
    } catch (err: any) {
      console.error("Gagal memilih gambar:", err);
      Alert.alert("Gagal Memilih Gambar", err.message || "Terjadi kesalahan.");
    }
  };

  // Image Picker (Camera)
  const handleTakePhoto = async () => {
    try {
      if (Platform.OS === "web") {
        handlePickImage();
      } else {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Izin Ditolak", "Izin kamera diperlukan untuk mengambil foto produk.");
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          if (asset.base64) {
            setImageUri(`data:image/jpeg;base64,${asset.base64}`);
          } else {
            setImageUri(asset.uri);
          }
        }
      }
    } catch (err: any) {
      console.error("Gagal mengambil foto:", err);
      Alert.alert("Gagal Kamera", err.message || "Terjadi kesalahan.");
    }
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

  const validate = () => {
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
      await onSave(
        {
          name: name.trim(),
          category: category,
          unit: unit,
          is_decimal: isDecimal || category === "Buah" ? 1 : 0,
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

          {/* Form Scroll Area */}
          <ScrollView
            style={{ paddingHorizontal: 20, paddingTop: 16 }}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Foto Produk Section (Upload/Camera) */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#3f3f46", marginBottom: 6 }}>
                Foto Produk
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {/* Preview Box */}
                <View
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 16,
                    backgroundColor: "#f4f4f5",
                    borderWidth: 1,
                    borderColor: "#e4e4e7",
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Package size={28} color="#a1a1aa" />
                  )}
                </View>

                {/* Upload Buttons */}
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <TouchableOpacity
                      onPress={handlePickImage}
                      activeOpacity={0.8}
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        backgroundColor: "#ecfeff",
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: "#a5f3fc",
                      }}
                    >
                      <ImageIcon size={14} color="#0097A7" />
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7", marginLeft: 4 }}>
                        Galeri / File
                      </Text>
                    </TouchableOpacity>

                    {Platform.OS !== "web" && (
                      <TouchableOpacity
                        onPress={handleTakePhoto}
                        activeOpacity={0.8}
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                          backgroundColor: "#f4f4f5",
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: "#e4e4e7",
                        }}
                      >
                        <Camera size={14} color="#52525b" />
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#52525b", marginLeft: 4 }}>
                          Kamera
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {imageUri ? (
                    <TouchableOpacity
                      onPress={() => setImageUri("")}
                      style={{ alignSelf: "flex-start", paddingVertical: 2 }}
                    >
                      <Text style={{ fontSize: 11, color: "#ef4444", fontWeight: "600" }}>
                        Hapus Foto
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={{ fontSize: 10, color: "#71717a" }}>
                      Format: JPG, PNG, WebP (Tersimpan di SQLite)
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Nama Produk */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#3f3f46", marginBottom: 6 }}>
                Nama Produk *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Contoh: Nasi Kuning, Anggur, Apel..."
                placeholderTextColor="#a1a1aa"
                style={{
                  backgroundColor: "#f9fafb",
                  borderWidth: 1,
                  borderColor: errors.name ? "#ef4444" : "#e5e7eb",
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 14,
                  color: "#18181b",
                }}
              />
              {errors.name && (
                <Text style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>
                  {errors.name}
                </Text>
              )}
            </View>

            {/* Kategori Pills */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#3f3f46", marginBottom: 6 }}>
                Kategori
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {categories.map((c) => {
                    const isSelected = category === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        onPress={() => handleSelectCategory(c)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: isSelected ? "#0097A7" : "#f4f4f5",
                          borderWidth: 1,
                          borderColor: isSelected ? "#0097A7" : "#e5e7eb",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: isSelected ? "700" : "500",
                            color: isSelected ? "#ffffff" : "#52525b",
                          }}
                        >
                          {c}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Mode Timbangan & Satuan */}
            <View
              style={{
                backgroundColor: isDecimal ? "#f0fdfa" : "#f9fafb",
                borderWidth: 1,
                borderColor: isDecimal ? "#99f6e4" : "#e5e7eb",
                borderRadius: 18,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Scale size={16} color={isDecimal ? "#0097A7" : "#71717a"} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: isDecimal ? "#0f766e" : "#18181b",
                      marginLeft: 6,
                    }}
                  >
                    Mode Timbangan (Desimal / kg)
                  </Text>
                </View>
                <Switch
                  value={isDecimal}
                  onValueChange={(val) => {
                    setIsDecimal(val);
                    if (val && unit === "pcs") setUnit("kg");
                  }}
                  trackColor={{ false: "#e4e4e7", true: "#0097A7" }}
                  thumbColor="#ffffff"
                />
              </View>

              <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 6 }}>
                Satuan Unit Penjualan
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    onPress={() => handleSelectUnit(u)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                      backgroundColor: unit === u ? "#0097A7" : "#ffffff",
                      borderWidth: 1,
                      borderColor: unit === u ? "#0097A7" : "#e5e7eb",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: unit === u ? "#ffffff" : "#52525b",
                      }}
                    >
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pricing Section (Harga Jual & Modal HPP) */}
            {!hasVariants && (
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#3f3f46", marginBottom: 6 }}>
                    Harga Jual (Rp / {unit}) *
                  </Text>
                  <TextInput
                    value={hargaJual}
                    onChangeText={setHargaJual}
                    keyboardType="numeric"
                    placeholder="Contoh: 50000"
                    placeholderTextColor="#a1a1aa"
                    style={{
                      backgroundColor: "#f9fafb",
                      borderWidth: 1,
                      borderColor: errors.hargaJual ? "#ef4444" : "#e5e7eb",
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      fontSize: 14,
                      color: "#18181b",
                    }}
                  />
                  {errors.hargaJual && (
                    <Text style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>
                      {errors.hargaJual}
                    </Text>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#3f3f46", marginBottom: 6 }}>
                    Modal HPP (Rp)
                  </Text>
                  <TextInput
                    value={modalHpp}
                    onChangeText={setModalHpp}
                    keyboardType="numeric"
                    placeholder="Contoh: 35000"
                    placeholderTextColor="#a1a1aa"
                    style={{
                      backgroundColor: "#f9fafb",
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      fontSize: 14,
                      color: "#18181b",
                    }}
                  />
                </View>
              </View>
            )}

            {/* Real-time Profit Margin Indicator */}
            {!hasVariants && numHargaJual > 0 && (
              <View
                style={{
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: "#f0fdf4",
                  borderWidth: 1,
                  borderColor: "#bbf7d0",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TrendingUp size={16} color="#16a34a" />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#15803d", marginLeft: 6 }}>
                    Laba Bersih per {unit}:
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#16a34a" }}>
                    +{formatRupiah(labaKotor)} ({marginPercent}%)
                  </Text>
                </View>
              </View>
            )}

            {/* Stock & Barcode Section */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#3f3f46", marginBottom: 6 }}>
                  Stok ({unit}) *
                </Text>
                <TextInput
                  value={stock}
                  onChangeText={setStock}
                  keyboardType="numeric"
                  placeholder="50"
                  placeholderTextColor="#a1a1aa"
                  style={{
                    backgroundColor: "#f9fafb",
                    borderWidth: 1,
                    borderColor: errors.stock ? "#ef4444" : "#e5e7eb",
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 14,
                    color: "#18181b",
                  }}
                />
                {errors.stock && (
                  <Text style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>
                    {errors.stock}
                  </Text>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#3f3f46", marginBottom: 6 }}>
                  Barcode / SKU
                </Text>
                <TextInput
                  value={barcode}
                  onChangeText={setBarcode}
                  placeholder="899..."
                  placeholderTextColor="#a1a1aa"
                  style={{
                    backgroundColor: "#f9fafb",
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 14,
                    color: "#18181b",
                  }}
                />
              </View>
            </View>

            {/* Variants Toggle */}
            <View
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Layers size={16} color="#0097A7" />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#18181b", marginLeft: 6 }}>
                    Produk Memiliki Varian (Rasa / Ukuran)
                  </Text>
                </View>
                <Switch
                  value={hasVariants}
                  onValueChange={(val) => {
                    setHasVariants(val);
                    if (val && variants.length === 0) {
                      handleAddVariant();
                    }
                  }}
                  trackColor={{ false: "#e4e4e7", true: "#0097A7" }}
                  thumbColor="#ffffff"
                />
              </View>

              {hasVariants && (
                <View style={{ marginTop: 12 }}>
                  {variants.map((v, index) => (
                    <View
                      key={v.id}
                      style={{
                        backgroundColor: "#ffffff",
                        borderRadius: 14,
                        padding: 12,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#18181b" }}>
                          Varian #{index + 1}
                        </Text>
                        {variants.length > 1 && (
                          <TouchableOpacity
                            onPress={() => handleRemoveVariant(v.id)}
                            style={{ padding: 4 }}
                          >
                            <Trash2 size={14} color="#ef4444" />
                          </TouchableOpacity>
                        )}
                      </View>

                      <TextInput
                        value={v.name}
                        onChangeText={(val) => handleUpdateVariant(v.id, "name", val)}
                        placeholder="Nama Varian (cth: Jumbo, Pedas, Small)"
                        placeholderTextColor="#a1a1aa"
                        style={{
                          backgroundColor: "#f9fafb",
                          borderWidth: 1,
                          borderColor: "#e5e7eb",
                          borderRadius: 10,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          fontSize: 12,
                          marginBottom: 6,
                        }}
                      />

                      <View style={{ flexDirection: "row", gap: 6 }}>
                        <TextInput
                          value={v.harga_jual.toString()}
                          onChangeText={(val) =>
                            handleUpdateVariant(v.id, "harga_jual", parseFloat(val) || 0)
                          }
                          keyboardType="numeric"
                          placeholder="Harga Jual"
                          placeholderTextColor="#a1a1aa"
                          style={{
                            flex: 1,
                            backgroundColor: "#f9fafb",
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            borderRadius: 10,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            fontSize: 12,
                          }}
                        />
                        <TextInput
                          value={v.modal_hpp.toString()}
                          onChangeText={(val) =>
                            handleUpdateVariant(v.id, "modal_hpp", parseFloat(val) || 0)
                          }
                          keyboardType="numeric"
                          placeholder="HPP Modal"
                          placeholderTextColor="#a1a1aa"
                          style={{
                            flex: 1,
                            backgroundColor: "#f9fafb",
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            borderRadius: 10,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            fontSize: 12,
                          }}
                        />
                        <TextInput
                          value={v.stock.toString()}
                          onChangeText={(val) =>
                            handleUpdateVariant(v.id, "stock", parseFloat(val) || 0)
                          }
                          keyboardType="numeric"
                          placeholder="Stok"
                          placeholderTextColor="#a1a1aa"
                          style={{
                            flex: 0.8,
                            backgroundColor: "#f9fafb",
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            borderRadius: 10,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            fontSize: 12,
                          }}
                        />
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={handleAddVariant}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: "#ecfeff",
                      borderWidth: 1,
                      borderColor: "#a5f3fc",
                    }}
                  >
                    <Plus size={14} color="#0097A7" />
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
