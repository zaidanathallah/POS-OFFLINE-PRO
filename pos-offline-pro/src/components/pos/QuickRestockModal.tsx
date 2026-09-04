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
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Product, ProductVariant } from "@/db";
import { restockProduct } from "@/db/productRepository";
import { formatRupiah } from "@/util/formatters";
import { PackagePlus, X, Plus, Check } from "lucide-react-native";

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

  const unit = product.unit || "pcs";
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = currentStock <= 0;

  const addedQtyNum = parseFloat(addQtyText.replace(/,/g, ".")) || 0;
  const newProjectedStock = currentStock + addedQtyNum;

  const handleQuickAdd = (increment: number) => {
    const currentInputVal = parseFloat(addQtyText.replace(/,/g, ".")) || 0;
    setAddQtyText(String(currentInputVal + increment));
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
      const parsedHpp = newHppText.trim() ? parseFloat(newHppText.replace(/[^0-9]/g, "")) : null;

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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.65)",
            padding: 16,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 440,
              backgroundColor: "#ffffff",
              borderRadius: 24,
              padding: 22,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.2,
              shadowRadius: 14,
              elevation: 8,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 14,
                borderBottomWidth: 1,
                borderBottomColor: "#F4F0EA",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: "#E0F7FA",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <PackagePlus size={20} color="#0097A7" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: "#1C1917" }}>
                    Tambah Stok Langsung
                  </Text>
                  <Text style={{ fontSize: 11, color: "#78716C", marginTop: 1 }}>
                    Restok instan tanpa keluar dari kasir
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: "#F5F3EF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} color="#78716C" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* Product Info Card */}
              <View
                style={{
                  backgroundColor: isOutOfStock ? "#FFF5F5" : "#FAF8F5",
                  borderWidth: 1,
                  borderColor: isOutOfStock ? "#FECACA" : "#EAE5DC",
                  borderRadius: 16,
                  padding: 12,
                  marginTop: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: "800", color: "#1C1917" }}>
                    {product.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#78716C", marginTop: 2 }}>
                    Kategori: {product.category || "Umum"} | {formatRupiah(product.harga_jual)}
                  </Text>
                </View>

                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 10,
                    backgroundColor: isOutOfStock ? "#EF4444" : "#E6F4EA",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "800",
                      color: isOutOfStock ? "#FFFFFF" : "#137333",
                    }}
                  >
                    {isOutOfStock ? "Stok: 0 (HABIS)" : `Stok: ${currentStock} ${unit}`}
                  </Text>
                </View>
              </View>

              {/* Variant Selector if has variants */}
              {variants.length > 0 && (
                <View style={{ marginTop: 14 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#44403C", marginBottom: 6 }}>
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
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 12,
                            borderWidth: 1.5,
                            borderColor: isSelected ? "#0097A7" : "#E7E5E4",
                            backgroundColor: isSelected ? "#E0F7FA" : "#FFFFFF",
                            marginRight: 8,
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: isSelected ? "800" : "600",
                              color: isSelected ? "#00838F" : "#292524",
                            }}
                          >
                            {v.name}
                          </Text>
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "700",
                              color: vOutOfStock ? "#DC2626" : "#78716C",
                              marginTop: 2,
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

              {/* Quantity Input Area */}
              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#44403C", marginBottom: 6 }}>
                  Jumlah Tambahan Stok (+{unit}):
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#FFFFFF",
                    borderWidth: 1.5,
                    borderColor: "#0097A7",
                    borderRadius: 14,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Plus size={18} color="#0097A7" />
                  <TextInput
                    value={addQtyText}
                    onChangeText={setAddQtyText}
                    keyboardType={product.is_decimal ? "decimal-pad" : "number-pad"}
                    placeholder="0"
                    selectTextOnFocus
                    style={{
                      flex: 1,
                      marginLeft: 8,
                      fontSize: 18,
                      fontWeight: "800",
                      color: "#1C1917",
                      paddingVertical: 4,
                    }}
                  />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#78716C" }}>
                    {unit}
                  </Text>
                </View>

                {/* Quick Add Pills */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8, gap: 6 }}>
                  {(product.is_decimal ? [1, 2, 5, 10, 20] : [5, 10, 20, 50, 100]).map((num) => (
                    <TouchableOpacity
                      key={num}
                      onPress={() => handleSetQuickVal(num)}
                      style={{
                        paddingVertical: 5,
                        paddingHorizontal: 10,
                        backgroundColor: "#F5F3EF",
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: "#EAE6DF",
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#44403C" }}>
                        +{num} {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Stock Simulation Summary Box */}
              <View
                style={{
                  marginTop: 14,
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: "#E6F4EA",
                  borderWidth: 1,
                  borderColor: "#CEEAD6",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 12, color: "#137333", fontWeight: "600" }}>
                  Stok Sebelumnya: {currentStock} {unit}
                </Text>
                <Text style={{ fontSize: 13, color: "#137333", fontWeight: "800" }}>
                  Stok Baru: {newProjectedStock} {unit}
                </Text>
              </View>

              {/* Optional HPP Field */}
              <View style={{ marginTop: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#78716C", marginBottom: 4 }}>
                  Harga Modal HPP (Opsional jika ada perubahan):
                </Text>
                <TextInput
                  value={newHppText}
                  onChangeText={setNewHppText}
                  keyboardType="number-pad"
                  placeholder="Harga modal baru..."
                  placeholderTextColor="#A8A29E"
                  style={{
                    backgroundColor: "#FAF8F5",
                    borderWidth: 1,
                    borderColor: "#E7E5E4",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    fontSize: 12,
                    color: "#292524",
                  }}
                />
              </View>

              {/* Notes Field */}
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#78716C", marginBottom: 4 }}>
                  Catatan Mutasi Stok:
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Catatan restok..."
                  placeholderTextColor="#A8A29E"
                  style={{
                    backgroundColor: "#FAF8F5",
                    borderWidth: 1,
                    borderColor: "#E7E5E4",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    fontSize: 12,
                    color: "#292524",
                  }}
                />
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", marginTop: 18, gap: 10 }}>
              <TouchableOpacity
                onPress={onClose}
                disabled={loading}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 14,
                  backgroundColor: "#F5F3EF",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#EAE6DF",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#57534E" }}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveRestock}
                disabled={loading}
                style={{
                  flex: 1.5,
                  paddingVertical: 12,
                  borderRadius: 14,
                  backgroundColor: "#0097A7",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#0097A7",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.25,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFFFFF" }}>
                      Simpan & Tambah Stok
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
