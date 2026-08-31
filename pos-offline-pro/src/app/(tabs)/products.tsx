import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { ProductFormModal } from "@/components/ProductFormModal";
import { PinPromptModal } from "@/components/PinPromptModal";
import { useSecureAction } from "@/hooks/useSecureAction";
import { Product } from "@/db";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  ProductInput,
} from "@/db/productRepository";
import { formatRupiah } from "@/util/formatters";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Inbox,
} from "lucide-react-native";

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // Secure Action Hook for PIN Protection
  const {
    pinModalVisible,
    actionTitle,
    executeSecureAction,
    handlePinSuccess,
    handlePinClose,
  } = useSecureAction();

  const categories = ["Semua", "Buah", "Makanan", "Minuman", "Retail", "Jasa", "Lainnya"];

  const loadProducts = useCallback(async () => {
    try {
      const data = await getAllProducts(searchQuery, selectedCategory);
      setProducts(data);
    } catch (error) {
      console.error("Gagal memuat produk:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleOpenCreateModal = () => {
    setProductToEdit(null);
    setModalVisible(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setProductToEdit(product);
    setModalVisible(true);
  };

  const handleSaveProduct = async (data: ProductInput, id?: string) => {
    if (id) {
      await updateProduct(id, data);
    } else {
      await createProduct(data);
    }
    await loadProducts();
  };

  const handleDeleteProduct = (product: Product) => {
    executeSecureAction(async () => {
      try {
        await deleteProduct(product.id);
        await loadProducts();
        Alert.alert("Sukses", `Produk "${product.name}" telah dihapus dari database.`);
      } catch (error: any) {
        Alert.alert("Gagal Menghapus", error.message || "Terjadi kesalahan.");
      }
    }, `Masukkan PIN Supervisor untuk menghapus produk "${product.name}"`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9F7F4" }}>
      {/* Top Bar Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: "#e5e7eb",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#18181b" }}>
            Master Produk
          </Text>
          <Text style={{ fontSize: 12, color: "#71717a", marginTop: 1 }}>
            Katalog & Manajemen HPP Lokal
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleOpenCreateModal}
          activeOpacity={0.8}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#0097A7",
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 14,
            shadowColor: "#0097A7",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff", marginLeft: 6 }}>
            + Tambah
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search & Category Filter Section */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 10,
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: "#e5e7eb",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#f4f4f5",
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: "#e4e4e7",
          }}
        >
          <Search size={16} color="#71717a" />
          <TextInput
            placeholder="Cari nama produk atau barcode..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#a1a1aa"
            style={{ flex: 1, marginLeft: 8, fontSize: 13, color: "#18181b" }}
          />
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 10, flexDirection: "row" }}
        >
          {categories.map((cat, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setSelectedCategory(cat)}
              style={{
                marginRight: 8,
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: selectedCategory === cat ? "#0097A7" : "#f4f4f5",
                borderWidth: 1,
                borderColor: selectedCategory === cat ? "#0097A7" : "#e4e4e7",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: selectedCategory === cat ? "#ffffff" : "#52525b",
                }}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product List Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#0097A7" />
            <Text style={{ fontSize: 12, color: "#71717a", marginTop: 8 }}>Memuat produk...</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 }}>
            <Inbox size={40} color="#9ca3af" />
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b", marginTop: 10, marginBottom: 4 }}>
              Belum Ada Produk
            </Text>
            <Text style={{ fontSize: 12, color: "#71717a", textAlign: "center", marginBottom: 16 }}>
              {searchQuery
                ? `Tidak ditemukan produk dengan kata kunci "${searchQuery}"`
                : "Mulai tambahkan produk untuk mengelola katalog kasir offline Anda."}
            </Text>
            <TouchableOpacity
              onPress={handleOpenCreateModal}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 10,
                backgroundColor: "#0097A7",
                borderRadius: 14,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff" }}>+ Tambah Produk Baru</Text>
            </TouchableOpacity>
          </View>
        ) : (
          products.map((product) => {
            const labaKotor = product.harga_jual - product.modal_hpp;
            const margin =
              product.harga_jual > 0
                ? ((labaKotor / product.harga_jual) * 100).toFixed(0)
                : "0";

            return (
              <View
                key={product.id}
                style={{
                  marginBottom: 12,
                  padding: 16,
                  borderRadius: 22,
                  backgroundColor: "#ffffff",
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: "#f4f4f5", marginRight: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: "600", color: "#52525b" }}>{product.category}</Text>
                      </View>
                      {product.has_variants === 1 && (
                        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: "#ecfeff", marginRight: 6 }}>
                          <Text style={{ fontSize: 10, fontWeight: "700", color: "#0097A7" }}>Varian</Text>
                        </View>
                      )}
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: "#f4f4f5" }}>
                        <Text style={{ fontSize: 10, color: "#71717a" }}>
                          {product.stock > 500 ? "Stok tanpa batas" : `Stok: ${product.stock} ${product.unit || "pcs"}`}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#18181b" }}>
                      {product.name}
                    </Text>

                    {product.barcode && (
                      <Text style={{ fontSize: 11, color: "#71717a", fontFamily: "monospace", marginTop: 2 }}>
                        SKU: {product.barcode}
                      </Text>
                    )}
                  </View>

                  {/* Actions: Edit & Delete */}
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                      onPress={() => handleOpenEditModal(product)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f4f4f5",
                        marginRight: 6,
                      }}
                      activeOpacity={0.7}
                    >
                      <Edit2 size={14} color="#0097A7" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteProduct(product)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#fef2f2",
                      }}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Price, Cost, and Profit Matrix */}
                <View
                  style={{
                    marginTop: 12,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: "#f4f4f5",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 11, color: "#71717a" }}>Harga Jual</Text>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b", marginTop: 2 }}>
                      {formatRupiah(product.harga_jual)}
                      {product.unit === "kg" ? "/kg" : ""}
                    </Text>
                  </View>

                  <View>
                    <Text style={{ fontSize: 11, color: "#71717a" }}>Modal (HPP)</Text>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#3f3f46", marginTop: 2 }}>
                      {formatRupiah(product.modal_hpp)}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 11, color: "#16a34a", fontWeight: "600" }}>
                      Laba (+{margin}%)
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#16a34a", marginTop: 2 }}>
                      +{formatRupiah(labaKotor)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add / Edit Product Modal */}
      <ProductFormModal
        visible={modalVisible}
        productToEdit={productToEdit}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveProduct}
      />

      {/* Secure PIN Prompt Modal */}
      <PinPromptModal
        visible={pinModalVisible}
        actionTitle={actionTitle}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
      />
    </SafeAreaView>
  );
}
