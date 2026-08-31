import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Product, ProductVariant } from "@/db";
import { getVariantsByProductId } from "@/db/productRepository";
import { formatRupiah } from "@/util/formatters";
import { X } from "lucide-react-native";

interface VariantSelectionModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSelectVariant: (product: Product, variant: ProductVariant) => void;
}

export function VariantSelectionModal({
  visible,
  product,
  onClose,
  onSelectVariant,
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
                    onPress={() => {
                      onSelectVariant(product, v);
                      onClose();
                    }}
                    disabled={isOutOfStock}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 16,
                      backgroundColor: "#f9fafb",
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      marginBottom: 8,
                      opacity: isOutOfStock ? 0.45 : 1,
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181b" }}>
                        {v.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>
                        {isOutOfStock ? "Habis" : `Stok: ${v.stock}`}
                      </Text>
                    </View>

                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#0097A7" }}>
                      {formatRupiah(price)}
                    </Text>
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
