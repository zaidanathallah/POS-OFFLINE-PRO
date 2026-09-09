import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  X,
  Check,
  Barcode as BarcodeIcon,
  Sparkles,
  ShoppingBag,
  TrendingUp,
} from "lucide-react-native";
import { ProductInput } from "@/db/productRepository";
import { SupermarketProduct } from "@/util/supermarketBarcodeDb";
import { formatRupiah } from "@/util/formatters";

export interface QuickProductRegisterModalProps {
  visible: boolean;
  barcode: string;
  prefillData?: Partial<SupermarketProduct> | null;
  onClose: () => void;
  onSave: (product: ProductInput) => Promise<void>;
}

const CATEGORIES = ["Retail", "Makanan", "Minuman", "Buah", "Lainnya"];
const UNITS = ["pcs", "botol", "box", "sachet", "tube", "pouch", "pack", "bks", "strip", "kg", "cup"];

export function QuickProductRegisterModal({
  visible,
  barcode,
  prefillData,
  onClose,
  onSave,
}: QuickProductRegisterModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Retail");
  const [hargaJual, setHargaJual] = useState("");
  const [modalHpp, setModalHpp] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [stock, setStock] = useState("100");
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoDetected, setIsAutoDetected] = useState(false);

  useEffect(() => {
    if (visible) {
      if (prefillData && prefillData.name) {
        setName(prefillData.name);
        setCategory(prefillData.category || "Retail");
        setHargaJual(prefillData.harga_jual ? prefillData.harga_jual.toString() : "");
        setModalHpp(prefillData.modal_hpp ? prefillData.modal_hpp.toString() : "");
        setUnit(prefillData.unit || "pcs");
        setIsAutoDetected(true);
      } else {
        setName("");
        setCategory("Retail");
        setHargaJual("");
        setModalHpp("");
        setUnit("pcs");
        setIsAutoDetected(false);
      }
      setStock("100");
      setIsSaving(false);
    }
  }, [visible, prefillData, barcode]);

  const numHargaJual = Number(hargaJual.replace(/\D/g, "")) || 0;
  const numModalHpp = Number(modalHpp.replace(/\D/g, "")) || 0;
  const labaKotor = Math.max(0, numHargaJual - numModalHpp);
  const marginPercent =
    numHargaJual > 0 && numModalHpp > 0
      ? Math.round(((numHargaJual - numModalHpp) / numHargaJual) * 100)
      : 0;

  const handleConfirmSave = async () => {
    if (!name.trim()) {
      Alert.alert("Perhatian", "Silakan ketik nama produk terlebih dahulu.");
      return;
    }

    if (numHargaJual <= 0) {
      Alert.alert("Perhatian", "Silakan masukkan harga jual produk yang valid.");
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        name: name.trim(),
        category: category.trim(),
        harga_jual: numHargaJual,
        modal_hpp: numModalHpp || Math.round(numHargaJual * 0.8),
        stock: Number(stock) || 100,
        unit: unit.trim() || "pcs",
        barcode: barcode.trim(),
        is_decimal: unit === "kg" || category === "Buah" ? 1 : 0,
        image_uri: prefillData?.image_uri || null,
      });
      onClose();
    } catch (err: any) {
      Alert.alert("Gagal Menyimpan", err.message || "Terjadi kesalahan saat menyimpan produk.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            backgroundColor: "#18181b",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: "92%",
            overflow: "hidden",
            borderTopWidth: 1,
            borderTopColor: "#27272a",
          }}
        >
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#27272a",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: "rgba(0, 151, 167, 0.15)",
                  borderWidth: 1,
                  borderColor: "rgba(0, 151, 167, 0.3)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                {isAutoDetected ? (
                  <Sparkles size={18} color="#0097A7" />
                ) : (
                  <ShoppingBag size={18} color="#0097A7" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
                  {isAutoDetected ? "Produk Terdeteksi!" : "Daftarkan Produk Baru"}
                </Text>
                <Text style={{ fontSize: 11, color: "#a1a1aa", marginTop: 2 }}>
                  {isAutoDetected
                    ? "Ditemukan di katalog retail. Sesuaikan harga jika perlu:"
                    : "Barcode baru terdeteksi. Masukkan nama & harga toko:"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#27272a",
              }}
            >
              <X size={16} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView
            style={{ paddingHorizontal: 20, paddingTop: 14 }}
            contentContainerStyle={{ paddingBottom: 36 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Barcode Badge */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#09090b",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#27272a",
                marginBottom: 14,
              }}
            >
              <BarcodeIcon size={16} color="#0097A7" />
              <Text style={{ fontSize: 11, color: "#a1a1aa", marginLeft: 6, marginRight: 6 }}>
                Barcode:
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                  fontWeight: "700",
                  color: "#38bdf8",
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {barcode}
              </Text>
            </View>

            {/* Nama Produk */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#e4e4e7", marginBottom: 6 }}>
                Nama Produk *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                autoFocus={!isAutoDetected}
                placeholder="Ketik nama produk (misal: Zwitsal Baby Bath 200ml)..."
                placeholderTextColor="#71717a"
                style={{
                  backgroundColor: "#27272a",
                  borderWidth: 1,
                  borderColor: name ? "#0097A7" : "#3f3f46",
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 14,
                  color: "#ffffff",
                }}
              />
            </View>

            {/* Harga Jual & Modal HPP */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#e4e4e7", marginBottom: 6 }}>
                  Harga Jual (Rp) *
                </Text>
                <TextInput
                  value={hargaJual}
                  onChangeText={(val) => setHargaJual(val.replace(/\D/g, ""))}
                  keyboardType="numeric"
                  placeholder="Contoh: 28000"
                  placeholderTextColor="#71717a"
                  style={{
                    backgroundColor: "#27272a",
                    borderWidth: 1,
                    borderColor: numHargaJual > 0 ? "#0097A7" : "#3f3f46",
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#38bdf8",
                  }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#a1a1aa", marginBottom: 6 }}>
                  Modal HPP (Rp)
                </Text>
                <TextInput
                  value={modalHpp}
                  onChangeText={(val) => setModalHpp(val.replace(/\D/g, ""))}
                  keyboardType="numeric"
                  placeholder="Contoh: 23000"
                  placeholderTextColor="#71717a"
                  style={{
                    backgroundColor: "#27272a",
                    borderWidth: 1,
                    borderColor: "#3f3f46",
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 14,
                    color: "#ffffff",
                  }}
                />
              </View>
            </View>

            {/* Profit Margin Indicator */}
            {numHargaJual > 0 && numModalHpp > 0 && (
              <View
                style={{
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: "rgba(34, 197, 94, 0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(34, 197, 94, 0.3)",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TrendingUp size={14} color="#4ade80" />
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#4ade80", marginLeft: 6 }}>
                    Estimasi Laba Bersih:
                  </Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: "800", color: "#4ade80" }}>
                  +{formatRupiah(labaKotor)} ({marginPercent}%)
                </Text>
              </View>
            )}

            {/* Kategori Selector */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#e4e4e7", marginBottom: 6 }}>
                Kategori Produk
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {CATEGORIES.map((c) => {
                    const isSelected = category === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setCategory(c)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 16,
                          backgroundColor: isSelected ? "#0097A7" : "#27272a",
                          borderWidth: 1,
                          borderColor: isSelected ? "#0097A7" : "#3f3f46",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: isSelected ? "700" : "500",
                            color: isSelected ? "#ffffff" : "#d4d4d8",
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

            {/* Satuan Unit Selector */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#e4e4e7", marginBottom: 6 }}>
                Satuan Unit
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {UNITS.map((u) => {
                    const isSelected = unit === u;
                    return (
                      <TouchableOpacity
                        key={u}
                        onPress={() => setUnit(u)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 12,
                          backgroundColor: isSelected ? "#0097A7" : "#27272a",
                          borderWidth: 1,
                          borderColor: isSelected ? "#0097A7" : "#3f3f46",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: isSelected ? "700" : "500",
                            color: isSelected ? "#ffffff" : "#d4d4d8",
                          }}
                        >
                          {u}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Stok Awal */}
            <View style={{ marginBottom: 18 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#e4e4e7", marginBottom: 6 }}>
                Stok Awal ({unit})
              </Text>
              <TextInput
                value={stock}
                onChangeText={(val) => setStock(val.replace(/\D/g, ""))}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor="#71717a"
                style={{
                  backgroundColor: "#27272a",
                  borderWidth: 1,
                  borderColor: "#3f3f46",
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: "#ffffff",
                }}
              />
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={onClose}
                disabled={isSaving}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  paddingVertical: 13,
                  borderRadius: 14,
                  backgroundColor: "#27272a",
                  borderWidth: 1,
                  borderColor: "#3f3f46",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#a1a1aa" }}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmSave}
                disabled={isSaving}
                activeOpacity={0.8}
                style={{
                  flex: 2,
                  flexDirection: "row",
                  paddingVertical: 13,
                  borderRadius: 14,
                  backgroundColor: "#0097A7",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#0097A7",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Check size={16} color="#ffffff" />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: "#ffffff",
                        marginLeft: 6,
                      }}
                    >
                      + Simpan & Masuk Kasir
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
