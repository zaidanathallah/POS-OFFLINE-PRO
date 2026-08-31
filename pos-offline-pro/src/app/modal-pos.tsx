import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useCartStore } from "@/stores/useCartStore";
import { Product } from "@/db";
import { getAllProducts, getProductByBarcode } from "@/db/productRepository";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckoutModal } from "@/components/CheckoutModal";
import { ReceiptModal } from "@/components/ReceiptModal";
import { ReceiptData } from "@/util/printerService";
import { formatRupiah } from "@/util/formatters";
import {
  ArrowLeft,
  Search,
  Barcode,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Inbox,
} from "lucide-react-native";

export default function PosModalScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [isCartExpanded, setIsCartExpanded] = useState(false);

  // Modals
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<ReceiptData | null>(null);

  // Cart Store
  const {
    items,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    getTotalOmset,
    getTotalHpp,
    getTotalLabaKotor,
    getTotalItemCount,
  } = useCartStore();

  const categories = ["Semua", "Makanan", "Minuman", "Retail / Toko", "Jasa", "Lainnya"];

  const loadProducts = useCallback(async () => {
    try {
      const data = await getAllProducts(searchQuery, selectedCategory);
      setProducts(data);
    } catch (err) {
      console.error("Gagal load produk:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleAddToCart = (product: Product) => {
    const res = addItem(product);
    if (!res.success) {
      Alert.alert("Stok Tidak Cukup", res.message || "Produk melebihi stok yang ada.");
    }
  };

  const handleBarcodeSearch = async (code: string) => {
    if (!code.trim()) return;
    const found = await getProductByBarcode(code.trim());
    if (found) {
      handleAddToCart(found);
      setSearchQuery("");
    } else {
      Alert.alert("Barcode Tidak Ditemukan", `Tidak ada produk dengan barcode ${code}`);
    }
  };

  const handleCheckoutSuccess = (receipt: ReceiptData) => {
    setCompletedReceipt(receipt);
    setReceiptVisible(true);
    loadProducts(); // Refresh catalog to update decremented stock
  };

  const handleNewTransaction = () => {
    setReceiptVisible(false);
    setCompletedReceipt(null);
    clearCart();
    setIsCartExpanded(false);
  };

  const totalOmset = getTotalOmset();
  const totalLaba = getTotalLabaKotor();
  const totalItemCount = getTotalItemCount();

  return (
    <SafeAreaView className="flex-1 bg-zinc-100 dark:bg-zinc-950">
      {/* Top POS Header */}
      <View className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex-row items-center justify-between">
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-lg items-center justify-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color="#71717a" />
          </TouchableOpacity>
          <View className="ml-2">
            <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Kasir POS
            </Text>
            <Text className="text-[11px] text-zinc-500">
              Pilih produk & proses transaksi
            </Text>
          </View>
        </View>

        {/* Floating Cart Trigger */}
        <TouchableOpacity
          onPress={() => setIsCartExpanded(!isCartExpanded)}
          className="flex-row items-center bg-blue-600 px-3 py-1.5 rounded-lg shadow-sm"
          activeOpacity={0.8}
        >
          <ShoppingCart size={15} color="#ffffff" />
          <Text className="text-xs font-bold text-white ml-1.5">
            {totalItemCount} Item
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search & Category Tabs */}
      <View className="px-4 pt-2.5 pb-2 bg-white dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
        <Input
          placeholder="Cari produk atau ketik barcode..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => handleBarcodeSearch(searchQuery)}
          leftIcon={<Search size={16} color="#71717a" />}
          rightIcon={
            <TouchableOpacity
              onPress={() => {
                Alert.alert("Barcode Scanner", "Fitur scan barcode siap digunakan.");
              }}
            >
              <Barcode size={18} color="#3b82f6" />
            </TouchableOpacity>
          }
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2.5 flex-row pb-0.5"
        >
          {categories.map((cat, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setSelectedCategory(cat)}
              className={`mr-2 px-3 py-1 rounded-lg border transition-all ${
                selectedCategory === cat
                  ? "bg-blue-600 border-blue-600"
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

      {/* Main Screen Layout: Products Catalog */}
      <ScrollView
        className="flex-1 px-4 pt-3"
        contentContainerStyle={{ paddingBottom: isCartExpanded ? 240 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : products.length === 0 ? (
          <View className="py-16 items-center justify-center">
            <Inbox size={32} color="#71717a" />
            <Text className="text-xs text-zinc-500 mt-2">
              Tidak ada produk ditemukan.
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {products.map((product) => {
              const inCartItem = items.find((i) => i.product.id === product.id);
              const inCartQty = inCartItem ? inCartItem.qty : 0;
              const isOutOfStock = product.stock <= 0;

              return (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => handleAddToCart(product)}
                  disabled={isOutOfStock}
                  activeOpacity={0.75}
                  className={`w-[48.5%] mb-3 rounded-xl border p-3 bg-white dark:bg-zinc-900 shadow-sm ${
                    inCartQty > 0
                      ? "border-blue-500 dark:border-blue-500 bg-blue-50/20"
                      : "border-zinc-200 dark:border-zinc-800"
                  } ${isOutOfStock ? "opacity-50" : ""}`}
                >
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Badge variant="secondary">
                      <Text className="text-[10px]">{product.category}</Text>
                    </Badge>
                    {inCartQty > 0 && (
                      <View className="w-5 h-5 rounded-full bg-blue-600 items-center justify-center">
                        <Text className="text-[10px] font-bold text-white">
                          {inCartQty}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    numberOfLines={2}
                    className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1"
                  >
                    {product.name}
                  </Text>

                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                      {formatRupiah(product.harga_jual)}
                    </Text>
                    <Text
                      className={`text-[10px] ${
                        product.stock <= 5
                          ? "text-amber-500 font-bold"
                          : "text-zinc-400"
                      }`}
                    >
                      Stok: {product.stock}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Expanded Cart Drawer / Bottom Sheet */}
      {isCartExpanded && (
        <View className="absolute bottom-20 left-0 right-0 max-h-72 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-2xl z-20">
          <View className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex-row items-center justify-between">
            <Text className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Daftar Keranjang ({items.length} item)
            </Text>
            <TouchableOpacity onPress={clearCart} activeOpacity={0.7}>
              <Text className="text-xs text-red-500 font-semibold">
                Kosongkan
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="max-h-48 px-4 py-2" showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <View
                key={item.product.id}
                className="flex-row items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/60"
              >
                <View className="flex-1 pr-2">
                  <Text className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {item.product.name}
                  </Text>
                  <Text className="text-[11px] text-zinc-400">
                    {formatRupiah(item.product.harga_jual)}
                  </Text>
                </View>

                {/* Counter buttons */}
                <View className="flex-row items-center space-x-2">
                  <TouchableOpacity
                    onPress={() => updateQty(item.product.id, item.qty - 1)}
                    className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 items-center justify-center"
                  >
                    <Minus size={13} color="#71717a" />
                  </TouchableOpacity>

                  <Text className="w-6 text-center text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {item.qty}
                  </Text>

                  <TouchableOpacity
                    onPress={() => updateQty(item.product.id, item.qty + 1)}
                    className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 items-center justify-center"
                  >
                    <Plus size={13} color="#3b82f6" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => removeItem(item.product.id)}
                    className="w-7 h-7 rounded-md bg-red-50 dark:bg-red-950/40 items-center justify-center ml-1"
                  >
                    <Trash2 size={13} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Floating Bottom Bar: Cart Summary & Bayar CTA */}
      <View className="absolute bottom-0 left-0 right-0 p-3.5 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex-row items-center justify-between shadow-lg">
        <TouchableOpacity
          onPress={() => setIsCartExpanded(!isCartExpanded)}
          className="flex-1 mr-3"
          activeOpacity={0.8}
        >
          <View className="flex-row items-center">
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
              Total ({totalItemCount} pcs)
            </Text>
            <Badge variant="success" className="ml-2">
              <Text className="text-[10px]">Laba: +{formatRupiah(totalLaba)}</Text>
            </Badge>
          </View>
          <Text className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
            {formatRupiah(totalOmset)}
          </Text>
        </TouchableOpacity>

        <View className="w-40">
          <Button
            variant="default"
            size="default"
            disabled={items.length === 0}
            leftIcon={<DollarSign size={16} color="#ffffff" />}
            onPress={() => setCheckoutVisible(true)}
          >
            Bayar Sekarang
          </Button>
        </View>
      </View>

      {/* Modals */}
      <CheckoutModal
        visible={checkoutVisible}
        onClose={() => setCheckoutVisible(false)}
        onSuccess={handleCheckoutSuccess}
      />

      <ReceiptModal
        visible={receiptVisible}
        receiptData={completedReceipt}
        onClose={() => setReceiptVisible(false)}
        onNewTransaction={handleNewTransaction}
      />
    </SafeAreaView>
  );
}
