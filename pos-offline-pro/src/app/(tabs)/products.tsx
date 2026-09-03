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
  Image,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { ProductFormModal } from "@/components/ProductFormModal";
import { CategoryManagerModal } from "@/components/CategoryManagerModal";
import { StockAdjustmentModal } from "@/components/StockAdjustmentModal";
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
import { getAllCategories } from "@/db/categoryRepository";
import { formatRupiah } from "@/util/formatters";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Inbox,
  Package,
  Layers,
  Tag,
  Settings,
  AlertTriangle,
} from "lucide-react-native";

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [categories, setCategories] = useState<string[]>([
    "Semua",
    "Buah",
    "Makanan",
    "Minuman",
    "Retail",
    "Jasa",
    "Lainnya",
  ]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryManagerVisible, setCategoryManagerVisible] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [selectedProductForAdjustment, setSelectedProductForAdjustment] = useState<Product | null>(null);

  // Secure Action Hook for PIN Protection
  const {
    pinModalVisible,
    actionTitle,
    executeSecureAction,
    handlePinSuccess,
    handlePinClose,
  } = useSecureAction();

  const loadCategories = useCallback(async () => {
    try {
      const list = await getAllCategories();
      if (list.length > 0) {
        setCategories(["Semua", ...list.map((c) => c.name)]);
      }
    } catch (e) {
      console.error("Gagal memuat kategori:", e);
    }
  }, []);

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

  // Real-time automatic synchronization on tab focus
  useFocusEffect(
    useCallback(() => {
      loadCategories();
      loadProducts();
    }, [loadCategories, loadProducts])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadCategories();
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

        <View style={{ flexDirection: "row", gap: 8 }}>
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

        {/* Category Pills & Manage Button */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 10 }}
          contentContainerStyle={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          {categories.map((cat, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setSelectedCategory(cat)}
              style={{
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

          {/* Manage Category Button */}
          <TouchableOpacity
            onPress={() => setCategoryManagerVisible(true)}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: "#ecfeff",
              borderWidth: 1,
              borderColor: "#a5f3fc",
            }}
          >
            <Tag size={12} color="#0097A7" />
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7", marginLeft: 4 }}>
              Kelola Kategori
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Product List Content */}
      <ScrollView
        style={{ flex: 1, padding: 16 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#0097A7" />
          </View>
        ) : products.length === 0 ? (
          <View
            style={{
              paddingVertical: 60,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Inbox size={48} color="#a1a1aa" />
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#18181b", marginTop: 12 }}>
              Belum Ada Produk
            </Text>
            <Text style={{ fontSize: 12, color: "#71717a", marginTop: 4, textAlign: "center" }}>
              Mulai tambahkan produk untuk mengelola katalog kasir offline Anda.
            </Text>
            <TouchableOpacity
              onPress={handleOpenCreateModal}
              activeOpacity={0.8}
              style={{
                marginTop: 16,
                backgroundColor: "#0097A7",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 14,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff" }}>
                + Tambah Produk Baru
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          products.map((product) => {
            const labaKotor = Math.max(0, product.harga_jual - product.modal_hpp);
            const marginPercent =
              product.harga_jual > 0
                ? ((labaKotor / product.harga_jual) * 100).toFixed(0)
                : 0;

            return (
              <View
                key={product.id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 20,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 1,
                }}
              >
                {/* Header Row: Category Badge, Stock & Actions */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                        backgroundColor: "#f4f4f5",
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: "600", color: "#52525b" }}>
                        {product.category}
                      </Text>
                    </View>

                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                        backgroundColor: product.stock <= 5 ? "#fef2f2" : "#f4f4f5",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "600",
                          color: product.stock <= 5 ? "#ef4444" : "#52525b",
                        }}
                      >
                        {product.stock > 500 ? "Stok tanpa batas" : `Stok: ${product.stock} ${product.unit}`}
                      </Text>
                    </View>
                  </View>

                  {/* Actions (Edit / Delete) */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => handleOpenEditModal(product)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: "#ecfeff",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Edit2 size={14} color="#0097A7" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteProduct(product)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: "#fef2f2",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Product Main Info with Image Thumbnail */}
                <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 4 }}>
                  {product.image_uri ? (
                    <Image
                      source={{ uri: product.image_uri }}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        marginRight: 12,
                        backgroundColor: "#f4f4f5",
                      }}
                      resizeMode="cover"
                    />
                  ) : null}

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#18181b" }}>
                      {product.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>
                      SKU: {product.barcode || "-"}
                    </Text>
                  </View>
                </View>

                {/* Pricing & Profit Grid */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 10,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: "#f4f4f5",
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 10, color: "#71717a" }}>Harga Jual</Text>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: "#18181b", marginTop: 2 }}>
                      {formatRupiah(product.harga_jual)}
                      {product.is_decimal ? ` / ${product.unit}` : ""}
                    </Text>
                  </View>

                  <View>
                    <Text style={{ fontSize: 10, color: "#71717a" }}>Modal (HPP)</Text>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#52525b", marginTop: 2 }}>
                      {formatRupiah(product.modal_hpp)}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 10, color: "#16a34a", fontWeight: "600" }}>
                      Laba (+{marginPercent}%)
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#16a34a", marginTop: 2 }}>
                      +{formatRupiah(labaKotor)}
                    </Text>
                  </View>
                </View>

                {/* Has Variants Badge */}
                {product.has_variants === 1 && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 8,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: "#f4f4f5",
                    }}
                  >
                    <Layers size={12} color="#0097A7" />
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#0097A7", marginLeft: 4 }}>
                      Memiliki Varian Produk
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Product Create/Edit Modal */}
      <ProductFormModal
        visible={modalVisible}
        productToEdit={productToEdit}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveProduct}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        visible={categoryManagerVisible}
        onClose={() => setCategoryManagerVisible(false)}
        onCategoriesChanged={() => {
          loadCategories();
          loadProducts();
        }}
      />

      {/* Supervisor PIN Protection Modal */}
      <PinPromptModal
        visible={pinModalVisible}
        actionTitle={actionTitle}
        onSuccess={handlePinSuccess}
        onClose={handlePinClose}
      />
    </SafeAreaView>
  );
}
