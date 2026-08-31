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
} from "react-native";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
  Barcode,
  Package,
  Edit2,
  Trash2,
  Inbox,
  Layers,
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
    <SafeAreaView className="flex-1 bg-[#F9F7F4] dark:bg-zinc-950">
      <View className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 flex-row items-center justify-between">
        <View>
          <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Master Produk
          </Text>
          <Text className="text-xs text-zinc-400">
            Katalog & Manajemen HPP Lokal
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleOpenCreateModal}
          activeOpacity={0.8}
          className="flex-row items-center bg-[#0097A7] px-3 py-2 rounded-xl shadow-sm"
        >
          <Plus size={15} color="#ffffff" />
          <Text className="text-xs font-bold text-white ml-1.5">
            + Tambah
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search & Category Filter Section */}
      <View className="px-4 pt-3 pb-2 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800">
        <Input
          placeholder="Cari nama produk atau barcode..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={16} color="#71717a" />}
        />

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2.5 flex-row pb-1"
        >
          {categories.map((cat, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setSelectedCategory(cat)}
              className={`mr-2 px-3 py-1.5 rounded-full border transition-all ${
                selectedCategory === cat
                  ? "bg-[#0097A7] border-[#0097A7]"
                  : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  selectedCategory === cat
                    ? "text-white"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product List Content */}
      <ScrollView
        className="flex-1 px-4 pt-3"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color="#0097A7" />
            <Text className="text-xs text-zinc-400 mt-2">Memuat produk...</Text>
          </View>
        ) : products.length === 0 ? (
          <View className="py-16 items-center justify-center px-4">
            <Inbox size={36} color="#9ca3af" />
            <Text className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-2 mb-1">
              Belum Ada Produk
            </Text>
            <Text className="text-xs text-zinc-400 text-center mb-4">
              {searchQuery
                ? `Tidak ditemukan produk dengan kata kunci "${searchQuery}"`
                : "Mulai tambahkan produk untuk mengelola katalog kasir offline Anda."}
            </Text>
            <TouchableOpacity
              onPress={handleOpenCreateModal}
              className="px-4 py-2 bg-[#0097A7] rounded-xl shadow-sm"
            >
              <Text className="text-xs font-bold text-white">+ Tambah Produk Baru</Text>
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
                className="mb-3 p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center space-x-2 mb-1">
                      <Badge variant="secondary">{product.category}</Badge>
                      {product.has_variants === 1 && (
                        <View className="ml-1.5 px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/40">
                          <Text className="text-[10px] font-bold text-[#0097A7]">Varian</Text>
                        </View>
                      )}
                      <View className="ml-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                        <Text className="text-[10px] text-zinc-500">
                          {product.stock > 500 ? "Stok tanpa batas" : `Stok: ${product.stock} ${product.unit || "pcs"}`}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {product.name}
                    </Text>

                    {product.barcode && (
                      <Text className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        SKU: {product.barcode}
                      </Text>
                    )}
                  </View>

                  {/* Actions: Edit & Delete */}
                  <View className="flex-row items-center space-x-1.5">
                    <TouchableOpacity
                      onPress={() => handleOpenEditModal(product)}
                      className="w-8 h-8 rounded-xl items-center justify-center bg-zinc-100 dark:bg-zinc-800 mr-1"
                      activeOpacity={0.7}
                    >
                      <Edit2 size={13} color="#0097A7" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteProduct(product)}
                      className="w-8 h-8 rounded-xl items-center justify-center bg-red-50 dark:bg-red-950/40"
                      activeOpacity={0.7}
                    >
                      <Trash2 size={13} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Price, Cost, and Profit Matrix */}
                <View className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex-row items-center justify-between">
                  <View>
                    <Text className="text-[11px] text-zinc-400">Harga Jual</Text>
                    <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {formatRupiah(product.harga_jual)}
                      {product.unit === "kg" ? "/kg" : ""}
                    </Text>
                  </View>

                  <View>
                    <Text className="text-[11px] text-zinc-400">Modal (HPP)</Text>
                    <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      {formatRupiah(product.modal_hpp)}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Laba (+{margin}%)
                    </Text>
                    <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
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
