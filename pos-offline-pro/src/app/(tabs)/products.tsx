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
  Layers,
  Edit2,
  Trash2,
  AlertTriangle,
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

  const categories = ["Semua", "Makanan", "Minuman", "Retail / Toko", "Jasa", "Lainnya"];

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
    // Intercept with PIN security protection
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
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <Header
        title="Master Produk"
        subtitle="Katalog & Input Modal (HPP)"
        rightAction={
          <Button
            size="sm"
            variant="default"
            leftIcon={<Plus size={15} color="#ffffff" />}
            onPress={handleOpenCreateModal}
          >
            Tambah
          </Button>
        }
      />

      {/* Search & Category Filter Section */}
      <View className="px-4 pt-3 pb-2 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/60">
        <Input
          placeholder="Cari nama produk atau barcode..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={17} color="#71717a" />}
          rightIcon={
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert("Scan Barcode", "Arahkan kamera ke barcode produk.");
              }}
            >
              <Barcode size={20} color="#3b82f6" />
            </TouchableOpacity>
          }
        />

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 flex-row pb-1"
        >
          {categories.map((cat, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setSelectedCategory(cat)}
              className={`mr-2 px-3 py-1.5 rounded-lg border transition-all ${
                selectedCategory === cat
                  ? "bg-blue-600 border-blue-600"
                  : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
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
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Daftar Produk ({products.length})
          </Text>
          <Text className="text-xs text-zinc-400">
            Disimpan di SQLite Lokal
          </Text>
        </View>

        {loading ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-xs text-zinc-400 mt-2">Memuat produk dari database...</Text>
          </View>
        ) : products.length === 0 ? (
          <View className="py-14 items-center justify-center px-4">
            <View className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 items-center justify-center mb-3">
              <Inbox size={26} color="#71717a" />
            </View>
            <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Belum Ada Produk
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400 text-center mb-4">
              {searchQuery
                ? `Tidak ditemukan produk dengan kata kunci "${searchQuery}"`
                : "Mulai tambahkan produk untuk mencatat inventaris dan HPP usaha Anda."}
            </Text>
            <Button
              variant="default"
              size="sm"
              leftIcon={<Plus size={15} color="#ffffff" />}
              onPress={handleOpenCreateModal}
            >
              Tambah Produk Baru
            </Button>
          </View>
        ) : (
          products.map((product) => {
            const labaKotor = product.harga_jual - product.modal_hpp;
            const margin =
              product.harga_jual > 0
                ? ((labaKotor / product.harga_jual) * 100).toFixed(0)
                : "0";

            return (
              <Card key={product.id} className="mb-3 p-3.5">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center space-x-2 mb-1">
                      <Badge variant="secondary">{product.category}</Badge>
                      {product.stock <= 10 ? (
                        <Badge variant="warning" className="ml-1.5">
                          <Text className="text-[10px]">Stok: {product.stock}</Text>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="ml-1.5">
                          <Text className="text-[10px]">Stok: {product.stock}</Text>
                        </Badge>
                      )}
                    </View>

                    <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
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
                      className="w-8 h-8 rounded-lg items-center justify-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                      activeOpacity={0.7}
                    >
                      <Edit2 size={13} color="#3b82f6" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteProduct(product)}
                      className="w-8 h-8 rounded-lg items-center justify-center bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 ml-1"
                      activeOpacity={0.7}
                    >
                      <Trash2 size={13} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Price, Cost, and Profit Matrix */}
                <View className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/70 flex-row items-center justify-between">
                  <View>
                    <Text className="text-[11px] text-zinc-400">Harga Jual</Text>
                    <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {formatRupiah(product.harga_jual)}
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
              </Card>
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
