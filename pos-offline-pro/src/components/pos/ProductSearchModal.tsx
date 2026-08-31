import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { Product } from "@/db";
import { formatRupiah } from "@/util/formatters";
import { Search, Plus, X } from "lucide-react-native";

interface ProductSearchModalProps {
  visible: boolean;
  products: Product[];
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export function ProductSearchModal({
  visible,
  products,
  onClose,
  onSelectProduct,
}: ProductSearchModalProps) {
  const [query, setQuery] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.barcode && p.barcode.includes(query))
  );

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
                  <View
                    key={p.id}
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
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181b" }}>
                        {p.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>
                        {formatRupiah(p.harga_jual)} | {p.stock > 500 ? "Stok tanpa batas" : `Stok ${p.stock} ${p.unit || "pcs"}`}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        onSelectProduct(p);
                      }}
                      disabled={isOutOfStock}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isOutOfStock ? "#f4f4f5" : "#0097A7",
                      }}
                    >
                      <Plus size={15} color={isOutOfStock ? "#a1a1aa" : "#ffffff"} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
