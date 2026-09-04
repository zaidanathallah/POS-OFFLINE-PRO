import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Product, ProductVariant } from "@/db";
import { getVariantsByProductId } from "@/db/productRepository";
import { formatRupiah } from "@/util/formatters";
import { X, Plus } from "lucide-react-native";

interface VariantSelectionModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSelectVariant: (product: Product, variant: ProductVariant) => void;
  onRestockVariant?: (product: Product, variant?: ProductVariant) => void;
}

export function VariantSelectionModal({
  visible,
  product,
  onClose,
  onSelectVariant,
  onRestockVariant,
}: VariantSelectionModalProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && product) {
      if (product.variants_json) {
        try {
          const parsed = JSON.parse(product.variants_json);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setVariants(parsed);
            return;
          }
        } catch (e) {}
      }

      setLoading(true);
      getVariantsByProductId(product.id)
        .then((vars) => setVariants(vars))
        .catch((err) => console.log("Load variants error:", err))
        .finally(() => setLoading(false));
    }
  }, [visible, product]);

  if (!product) return null;

  const handleVariantClick = (v: ProductVariant) => {
    if (v.stock <= 0) {
      Alert.alert(
        "Stok Varian Habis!",
        `Stok untuk varian "${product.name} (${v.name})" saat ini sudah habis (0). Tolong isi stok terlebih dahulu.`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "+ Tambah Stok",
            onPress: () => {
              onClose();
              if (onRestockVariant) {
                onRestockVariant(product, v);
              }
            },
          },
        ]
      );
      return;
    }
    onSelectVariant(product, v);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.65)", padding: 20 }}>
        <View
          style={{
            width: "100%",
            maxWidth: 380,
            backgroundColor: "#ffffff",
            borderRadius: 24,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#18181b" }}>
                Pilih Varian
              </Text>
              <Text style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{product.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={18} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Variants List */}
          {loading ? (
            <View style={{ paddingVertical: 30, alignItems: "center" }}>
              <ActivityIndicator size="small" color="#0097A7" />
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {variants.map((v) => {
                const isOutOfStock = v.stock <= 0;
                const price = v.harga_jual || (v as any).price || 0;
                return (
                  <TouchableOpacity
                    key={v.id}
                    onPress={() => handleVariantClick(v)}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 16,
                      backgroundColor: isOutOfStock ? "#FFF5F5" : "#f9fafb",
                      borderWidth: 1,
                      borderColor: isOutOfStock ? "#FECACA" : "#e5e7eb",
                      marginBottom: 8,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: isOutOfStock ? "#7F1D1D" : "#18181b" }}>
                        {v.name}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: isOutOfStock ? "700" : "500", color: isOutOfStock ? "#DC2626" : "#71717a", marginTop: 2 }}>
                        {isOutOfStock ? "Stok: 0 (HABIS)" : `Stok: ${v.stock}`}
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: "800", color: isOutOfStock ? "#9CA3AF" : "#0097A7" }}>
                        {formatRupiah(price)}
                      </Text>
                      {isOutOfStock && onRestockVariant && (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            onClose();
                            onRestockVariant(product, v);
                          }}
                          style={{
                            paddingVertical: 4,
                            paddingHorizontal: 8,
                            backgroundColor: "#0097A7",
                            borderRadius: 8,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: "800", color: "#FFFFFF" }}>
                            + Stok
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
