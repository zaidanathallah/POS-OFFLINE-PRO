import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Product, ProductVariant } from "@/db";
import { restockProduct } from "@/db/productRepository";
import { formatRupiah } from "@/util/formatters";
import { PackagePlus, X, Plus, Minus, Check } from "lucide-react-native";

interface QuickRestockModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onRestockSuccess: (updatedProduct: Product, addedQty: number) => void;
}

export function QuickRestockModal({
  visible,
  product,
  onClose,
  onRestockSuccess,
}: QuickRestockModalProps) {
  const { height, width } = useWindowDimensions();
  const isShortScreen = height < 500;
  const isSmallScreen = width < 380 || height < 600;

  const [addQtyText, setAddQtyText] = useState("10");
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [newHppText, setNewHppText] = useState("");
  const [notes, setNotes] = useState("Restok cepat dari kasir");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && product) {
      setAddQtyText(product.is_decimal ? "5" : "10");
      setNotes("Restok cepat dari kasir");
      setNewHppText(product.modal_hpp ? String(product.modal_hpp) : "");

      if (product.has_variants && product.variants_json) {
        try {
          const parsed: ProductVariant[] = JSON.parse(product.variants_json);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setVariants(parsed);
            setSelectedVariantId(parsed[0].id);
            setNewHppText(String(parsed[0].modal_hpp || ""));
            return;
          }
        } catch (e) {}
      }
      setVariants([]);
      setSelectedVariantId(null);
    }
  }, [visible, product]);

  if (!product) return null;

  const unit = product.unit || (product.is_decimal ? "kg" : "pcs");
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = currentStock <= 0;

  const addedQtyNum = parseFloat(addQtyText.replace(/,/g, ".")) || 0;
  const newProjectedStock = parseFloat((currentStock + addedQtyNum).toFixed(3));

  const handleStepQty = (delta: number) => {
    const currentInputVal = parseFloat(addQtyText.replace(/,/g, ".")) || 0;
    const step = product.is_decimal ? (delta > 0 ? 0.5 : -0.5) : delta;
    const newVal = Math.max(0, parseFloat((currentInputVal + step).toFixed(2)));
    setAddQtyText(String(newVal));
  };

  const handleSetQuickVal = (val: number) => {
    setAddQtyText(String(val));
  };

  const handleVariantSelect = (v: ProductVariant) => {
    setSelectedVariantId(v.id);
    setNewHppText(String(v.modal_hpp || ""));
  };

  const handleSaveRestock = async () => {
    if (addedQtyNum <= 0) {
      Alert.alert("Input Salah", "Jumlah tambahan stok harus lebih besar dari 0.");
      return;
    }

    setLoading(true);
    try {
      const parsedHpp = newHppText.trim() ? parseFloat(newHppText.replace(/[^0-9.]/g, "")) : null;

      const updated = await restockProduct({
        productId: product.id,
        addQty: addedQtyNum,
        variantId: selectedVariantId,
        newHpp: parsedHpp,
        notes: notes.trim() || "Restok cepat dari kasir",
      });

      onRestockSuccess(updated, addedQtyNum);
      onClose();
    } catch (err: any) {
      Alert.alert("Gagal Restok", err.message || "Terjadi kesalahan saat menambah stok.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.65)",
          padding: isShortScreen ? 6 : (isSmallScreen ? 8 : 16),
        }}
      >
        {/* Backdrop click to close */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        {/* Modal Dialog Card */}
        <View
          style={{
            width: "100%",
            maxWidth: 460,
            maxHeight: isShortScreen ? "96%" : "92%",
            backgroundColor: "#ffffff",
            borderRadius: isShortScreen ? 16 : 24,
            padding: isShortScreen ? 12 : 18,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 14,
            elevation: 8,
            zIndex: 10,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: isShortScreen ? 8 : 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F4F0EA",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: "#E0F7FA",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <PackagePlus size={18} color="#0097A7" />
              </View>
              <View>
                <Text style={{ fontSize: isShortScreen ? 14 : 16, fontWeight: "800", color: "#1C1917" }}>
                  Tambah Stok Langsung
                </Text>
                <Text style={{ fontSize: 10, color: "#78716C", marginTop: 1 }}>
                  Restok instan tanpa keluar dari kasir
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "#F5F3EF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={15} color="#78716C" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ maxHeight: isShortScreen ? height * 0.6 : height * 0.7 }}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Product Info Card */}
            <View
              style={{
                backgroundColor: isOutOfStock ? "#FFF5F5" : "#FAF8F5",
                borderWidth: 1,
                borderColor: isOutOfStock ? "#FECACA" : "#EAE5DC",
                borderRadius: 14,
                padding: 10,
                marginTop: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#1C1917" }}>
                  {product.name}
                </Text>
                <Text style={{ fontSize: 10, color: "#78716C", marginTop: 1 }}>
                  Kategori: {product.category || "Umum"} | {formatRupiah(product.harga_jual)}
                </Text>
              </View>

              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  backgroundColor: isOutOfStock ? "#EF4444" : "#E6F4EA",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "800",
                    color: isOutOfStock ? "#FFFFFF" : "#137333",
                  }}
                >
                  {isOutOfStock ? "Stok: 0 (HABIS)" : `Stok: ${currentStock} ${unit}`}
                </Text>
              </View>
            </View>

            {/* Variant Selector if product has variants */}
            {variants.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#44403C", marginBottom: 4 }}>
                  Pilih Varian yang Direstok:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {variants.map((v) => {
                    const isSelected = v.id === selectedVariantId;
                    const vOutOfStock = v.stock <= 0;
                    return (
                      <TouchableOpacity
                        key={v.id}
                        onPress={() => handleVariantSelect(v)}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          borderRadius: 10,
                          borderWidth: 1.5,
                          borderColor: isSelected ? "#0097A7" : "#E7E5E4",
                          backgroundColor: isSelected ? "#E0F7FA" : "#FFFFFF",
                          marginRight: 6,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: isSelected ? "800" : "600",
                            color: isSelected ? "#00838F" : "#292524",
                          }}
                        >
                          {v.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: "700",
                            color: vOutOfStock ? "#DC2626" : "#78716C",
                            marginTop: 1,
                          }}
                        >
                          {vOutOfStock ? "Stok: 0" : `Stok: ${v.stock}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* 1. Quantity Input Area (Fully editable manually + quick steppers) */}
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#44403C", marginBottom: 4 }}>
                Jumlah Tambahan Stok (+{unit}):
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1.5,
                  borderColor: "#0097A7",
                  borderRadius: 12,
                  paddingHorizontal: 6,
                  paddingVertical: 3,
                }}
              >
                {/* Decrement Button */}
                <TouchableOpacity
                  onPress={() => handleStepQty(-1)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: "#F0FDFA",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#CCFBF1",
                  }}
                >
                  <Minus size={15} color="#0097A7" />
                </TouchableOpacity>

                {/* Manual Text Input */}
                <TextInput
                  value={addQtyText}
                  onChangeText={(val) => setAddQtyText(val)}
                  keyboardType={product.is_decimal ? "decimal-pad" : "number-pad"}
                  placeholder="0"
                  placeholderTextColor="#A8A29E"
                  selectTextOnFocus
                  editable={true}
                  style={{
                    flex: 1,
                    fontSize: 18,
                    fontWeight: "800",
                    color: "#1C1917",
                    textAlign: "center",
                    paddingVertical: 4,
                    paddingHorizontal: 6,
                  }}
                />

                {/* Increment Button */}
                <TouchableOpacity
                  onPress={() => handleStepQty(1)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: "#F0FDFA",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#CCFBF1",
                    marginRight: 4,
                  }}
                >
                  <Plus size={15} color="#0097A7" />
                </TouchableOpacity>

                {/* Unit Tag */}
                <View
                  style={{
                    paddingHorizontal: 6,
                    paddingVertical: 3,
                    backgroundColor: "#F5F3EF",
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#57534E" }}>
                    {unit}
                  </Text>
                </View>
              </View>

              {/* Quick Preset Pills */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6, gap: 5 }}>
                {(product.is_decimal ? [1, 2, 5, 10, 20] : [1, 5, 10, 20, 50, 100]).map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => handleSetQuickVal(num)}
                    style={{
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      backgroundColor: addedQtyNum === num ? "#E0F7FA" : "#F5F3EF",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: addedQtyNum === num ? "#0097A7" : "#EAE6DF",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: addedQtyNum === num ? "#00838F" : "#44403C",
                      }}
                    >
                      +{num} {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Stock Simulation Summary Box */}
            <View
              style={{
                marginTop: 10,
                padding: 8,
                borderRadius: 10,
                backgroundColor: "#E6F4EA",
                borderWidth: 1,
                borderColor: "#CEEAD6",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 11, color: "#137333", fontWeight: "600" }}>
                Stok Sebelum: {currentStock} {unit}
              </Text>
              <Text style={{ fontSize: 12, color: "#137333", fontWeight: "800" }}>
                Stok Baru: {newProjectedStock} {unit}
              </Text>
            </View>

            {/* 2. Optional HPP Field */}
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#44403C", marginBottom: 3 }}>
                Harga Modal HPP (Opsional jika ada perubahan):
              </Text>
              <TextInput
                value={newHppText}
                onChangeText={(val) => setNewHppText(val)}
                keyboardType="numeric"
                placeholder="cth: 22000"
                placeholderTextColor="#A8A29E"
                selectTextOnFocus
                editable={true}
                style={{
                  backgroundColor: "#FAF8F5",
                  borderWidth: 1,
                  borderColor: "#D6D3D1",
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  fontSize: 12,
                  fontWeight: "600",
                  color: "#1C1917",
                }}
              />
            </View>

            {/* 3. Notes Field */}
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#44403C", marginBottom: 3 }}>
                Catatan Mutasi Stok:
              </Text>
              <TextInput
                value={notes}
                onChangeText={(val) => setNotes(val)}
                placeholder="cth: Restok Kulakan Supplier / Stok Opname..."
                placeholderTextColor="#A8A29E"
                selectTextOnFocus
                editable={true}
                style={{
                  backgroundColor: "#FAF8F5",
                  borderWidth: 1,
                  borderColor: "#D6D3D1",
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  fontSize: 12,
                  color: "#1C1917",
                }}
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={{ flexDirection: "row", marginTop: 12, gap: 8 }}>
            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: "#F5F3EF",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#EAE6DF",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#57534E" }}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSaveRestock}
              disabled={loading}
              style={{
                flex: 1.5,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: "#0097A7",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#0097A7",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#FFFFFF" }}>
                    Simpan & Tambah Stok
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
