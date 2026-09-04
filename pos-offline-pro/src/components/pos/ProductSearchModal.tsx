import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Product } from "@/db";
import { formatRupiah } from "@/util/formatters";
import { Search, Plus, X, PackagePlus } from "lucide-react-native";

interface ProductSearchModalProps {
  visible: boolean;
  products: Product[];
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onRestockProduct?: (product: Product) => void;
}

export function ProductSearchModal({
  visible,
  products,
  onClose,
  onSelectProduct,
  onRestockProduct,
}: ProductSearchModalProps) {
  const [query, setQuery] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.barcode && p.barcode.includes(query))
  );

  const handleProductClick = (p: Product) => {
    if (p.stock <= 0) {
      Alert.alert(
        "Stok Habis!",
        `Stok untuk produk "${p.name}" saat ini sudah habis (0 ${p.unit || "pcs"}). Tolong isi stok terlebih dahulu.`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "+ Tambah Stok",
            onPress: () => {
              onClose();
              if (onRestockProduct) {
                onRestockProduct(p);
              }
            },
          },
        ]
      );
      return;
    }
    onSelectProduct(p);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          padding: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 440,
            backgroundColor: "#ffffff",
            borderRadius: 24,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 6,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 12,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#18181b" }}>
              Cari Produk
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "#f4f4f5",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={15} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Search Input Box */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#f4f4f5",
              borderWidth: 1,
              borderColor: "#e4e4e7",
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Search size={16} color="#71717a" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ketik nama produk atau barcode..."
              placeholderTextColor="#a1a1aa"
              style={{ flex: 1, marginLeft: 8, fontSize: 13, color: "#18181b" }}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <X size={15} color="#71717a" />
              </TouchableOpacity>
            )}
          </View>

          {/* Product Results */}
          <ScrollView style={{ maxHeight: 300, marginTop: 12 }} showsVerticalScrollIndicator={false}>
            {filtered.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 12, color: "#a1a1aa" }}>Tidak ada produk yang cocok</Text>
              </View>
            ) : (
              filtered.map((p) => {
                const isOutOfStock = p.stock <= 0;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => handleProductClick(p)}
                    activeOpacity={0.7}
                    style={{
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: "#f4f4f5",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: isOutOfStock ? "#7F1D1D" : "#18181b" }}>
                        {p.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: isOutOfStock ? "700" : "400",
                          color: isOutOfStock ? "#DC2626" : "#71717a",
                          marginTop: 2,
                        }}
                      >
                        {formatRupiah(p.harga_jual)} | {isOutOfStock ? "Stok: 0 (HABIS)" : p.stock > 500 ? "Stok tanpa batas" : `Stok ${p.stock} ${p.unit || "pcs"}`}
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      {isOutOfStock && onRestockProduct && (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            onClose();
                            onRestockProduct(p);
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

                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isOutOfStock ? "#FEE2E2" : "#0097A7",
                        }}
                      >
                        <Plus size={15} color={isOutOfStock ? "#DC2626" : "#ffffff"} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
