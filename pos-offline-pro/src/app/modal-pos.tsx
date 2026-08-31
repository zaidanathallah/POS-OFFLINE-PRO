import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { useCartStore, CartItem } from "@/stores/useCartStore";
import { Product, ProductVariant } from "@/db";
import { getAllProducts, getProductByBarcode } from "@/db/productRepository";
import { processCheckout } from "@/db/transactionRepository";
import { getSetting } from "@/db/settingsRepository";
import { ReceiptData } from "@/util/printerService";
import { formatRupiah } from "@/util/formatters";
import { DecimalVolumeModal } from "@/components/pos/DecimalVolumeModal";
import { VariantSelectionModal } from "@/components/pos/VariantSelectionModal";
import { ProductSearchModal } from "@/components/pos/ProductSearchModal";
import { BarcodeScannerModal } from "@/components/pos/BarcodeScannerModal";
import { CheckoutLandscapeModal } from "@/components/pos/CheckoutLandscapeModal";
import { ReceiptModal } from "@/components/ReceiptModal";
import {
  Search,
  Barcode,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Inbox,
  Package,
} from "lucide-react-native";

export default function PosModalScreen() {
  const { width } = useWindowDimensions();
  const isLandscape = width >= 600;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [categories, setCategories] = useState(["Semua", "Buah", "Makanan", "Minuman", "Retail", "Jasa"]);

  // Feature settings from SQLite
  const [isPpnActive, setIsPpnActive] = useState(true);
  const [ppnRate, setPpnRate] = useState(11);
  const [storeQris, setStoreQris] = useState("");
  const [storeLogo, setStoreLogo] = useState("");
  const [storeName, setStoreName] = useState("POS Offline Pro");
  const [storeAddress, setStoreAddress] = useState("Jl. Alamat No 99 Makassar");
  const [storePhone, setStorePhone] = useState("08111111111");

  // Interactive Modals
  const [decimalModalVisible, setDecimalModalVisible] = useState(false);
  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);

  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<ReceiptData | null>(null);

  // Cart State
  const {
    items,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    getSubtotal,
    getPpnAmount,
    getGrandTotal,
    getTotalHpp,
    getTotalLabaKotor,
    getTotalItemCount,
    setPpnEnabled,
    setPpnRate: setCartPpnRate,
  } = useCartStore();

  const loadSettingsAndProducts = useCallback(async () => {
    try {
      const data = await getAllProducts("", selectedCategory);
      setProducts(data);

      const ppnSetting = await getSetting("feature_ppn", "1");
      const ppnVal = Number(await getSetting("ppn_rate", "11")) || 11;
      const qrisImg = await getSetting("store_qris", "");
      const logoImg = await getSetting("store_logo", "");
      const sName = await getSetting("store_name", "POS Offline Pro");
      const sAddr = await getSetting("store_address", "Jl. Alamat No 99 Makassar");
      const sPhone = await getSetting("store_phone", "08111111111");

      setIsPpnActive(ppnSetting === "1");
      setPpnRate(ppnVal);
      setStoreQris(qrisImg);
      setStoreLogo(logoImg);
      setStoreName(sName);
      setStoreAddress(sAddr);
      setStorePhone(sPhone);

      setPpnEnabled(ppnSetting === "1");
      setCartPpnRate(ppnVal);
    } catch (err) {
      console.error("Gagal memuat produk & setting POS:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, setPpnEnabled, setCartPpnRate]);

  useEffect(() => {
    loadSettingsAndProducts();
  }, [loadSettingsAndProducts]);

  const handleProductPress = (product: Product) => {
    if (product.has_variants === 1) {
      setSelectedProductForModal(product);
      setVariantModalVisible(true);
    } else if (product.is_decimal === 1) {
      setSelectedProductForModal(product);
      setDecimalModalVisible(true);
    } else {
      const res = addItem(product, 1);
      if (!res.success) {
        Alert.alert("Stok Tidak Cukup", res.message || "Produk melebihi stok yang ada.");
      }
    }
  };

  const handleDecimalConfirm = (
    product: Product,
    calculatedQty: number,
    customSubtotal?: number
  ) => {
    const res = addItem(product, calculatedQty);
    if (!res.success) {
      Alert.alert("Stok Tidak Cukup", res.message || "Jumlah melebihi stok yang ada.");
    }
  };

  const handleVariantSelect = (product: Product, variant: ProductVariant) => {
    const res = addItem(product, 1, variant);
    if (!res.success) {
      Alert.alert("Stok Tidak Cukup", res.message || "Stok varian tidak mencukupi.");
    }
  };

  const handleBarcodeScanned = async (code: string) => {
    const found = await getProductByBarcode(code);
    if (found) {
      handleProductPress(found);
    } else {
      Alert.alert("Barcode Tidak Ditemukan", `Tidak ada produk dengan barcode ${code}`);
    }
  };

  const handleConfirmPayment = async (
    method: "CASH" | "QRIS",
    cashTendered: number,
    changeAmount: number
  ) => {
    try {
      const subtotal = getSubtotal();
      const ppnAmount = getPpnAmount();
      const grandTotal = getGrandTotal();
      const totalHpp = getTotalHpp();
      const totalLaba = getTotalLabaKotor();

      const result = await processCheckout({
        items,
        subtotal,
        ppn_percent: isPpnActive ? ppnRate : 0,
        ppn_amount: ppnAmount,
        grand_total: grandTotal,
        total_hpp: totalHpp,
        laba_kotor: totalLaba,
        payment_method: method,
        cash_tendered: cashTendered,
        change_amount: changeAmount,
      });

      const receipt: ReceiptData = {
        invoiceNumber: result.transaction.invoice_no,
        date: new Date(result.transaction.created_at).toLocaleString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        storeName: storeName,
        storeAddress: storeAddress,
        storePhone: storePhone,
        items: result.details.map((d) => ({
          name: d.product_name,
          qty: d.qty,
          price: d.harga_jual,
          subtotal: d.subtotal,
          unit: d.unit,
        })),
        totalAmount: result.transaction.omset,
        paymentMethod: result.payment_method,
        cashTendered: result.cash_tendered,
        changeAmount: result.change_amount,
        ppnPercent: result.transaction.ppn_percent,
        ppnAmount: result.transaction.ppn_amount,
        subtotalBeforeTax: result.transaction.subtotal_before_tax,
      };

      setCheckoutModalVisible(false);
      setCompletedReceipt(receipt);
      setReceiptModalVisible(true);
      clearCart();
      loadSettingsAndProducts(); // refresh decremented stock
    } catch (err: any) {
      Alert.alert("Gagal Checkout", err.message || "Terjadi kesalahan sistem saat menyimpan transaksi.");
    }
  };

  const subtotal = getSubtotal();
  const ppnAmount = getPpnAmount();
  const grandTotal = getGrandTotal();
  const totalItemCount = getTotalItemCount();

  return (
    <SafeAreaView className="flex-1 bg-[#F9F7F4] dark:bg-zinc-950">
      {/* Main Dual-Column Container */}
      <View className="flex-1 flex-col md:flex-row">
        {/* Left Column: Product Selection Area */}
        <View className="flex-1 flex-col border-r border-zinc-200/80 dark:border-zinc-800">
          {/* Top Bar: Search button, Category pills, and Exit button */}
          <View className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              {/* Cari Button matching screenshot 170117 */}
              <TouchableOpacity
                onPress={() => setSearchModalVisible(true)}
                activeOpacity={0.8}
                className="flex-row items-center bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full mr-2 border border-zinc-200 dark:border-zinc-700"
              >
                <Search size={14} color="#0097A7" />
                <Text className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 ml-1.5">
                  Cari
                </Text>
              </TouchableOpacity>

              {/* Category Pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {categories.map((cat, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.8}
                    className={`mr-2 px-3 py-1.5 rounded-full transition-all ${
                      selectedCategory === cat
                        ? "bg-[#0097A7] shadow-sm"
                        : "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
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

            {/* Selesai Menjual Button matching screenshot 170117 */}
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm"
            >
              <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Selesai Menjual
              </Text>
            </TouchableOpacity>
          </View>

          {/* Product Grid Area matching screenshot 170117 & 170213 */}
          <ScrollView
            className="flex-1 p-4"
            contentContainerStyle={{ paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View className="py-20 items-center justify-center">
                <ActivityIndicator size="large" color="#0097A7" />
              </View>
            ) : products.length === 0 ? (
              <View className="py-20 items-center justify-center">
                <Inbox size={36} color="#9ca3af" />
                <Text className="text-xs text-zinc-400 mt-2">
                  Belum ada produk di kategori ini
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {products.map((product) => {
                  const inCart = items.find((i) => i.product.id === product.id);
                  const isOutOfStock = product.stock <= 0;

                  return (
                    <TouchableOpacity
                      key={product.id}
                      onPress={() => handleProductPress(product)}
                      disabled={isOutOfStock}
                      activeOpacity={0.8}
                      className={`w-[48.5%] mb-3.5 rounded-3xl p-3.5 bg-white dark:bg-zinc-900 border ${
                        inCart
                          ? "border-[#0097A7] bg-cyan-50/20"
                          : "border-zinc-200/90 dark:border-zinc-800"
                      } ${isOutOfStock ? "opacity-45" : ""} shadow-sm`}
                    >
                      {/* Product Image / Icon */}
                      <View className="w-full h-24 rounded-2xl bg-zinc-50 dark:bg-zinc-800 items-center justify-center overflow-hidden mb-2.5">
                        {product.image_uri ? (
                          <Image
                            source={{ uri: product.image_uri }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <Package size={32} color="#9ca3af" />
                        )}
                      </View>

                      {/* Product Name */}
                      <Text
                        numberOfLines={1}
                        className="text-sm font-bold text-zinc-900 dark:text-zinc-100 text-center"
                      >
                        {product.name}
                      </Text>

                      {/* Price per unit */}
                      <Text className="text-xs font-bold text-[#0097A7] text-center mt-1">
                        {formatRupiah(product.harga_jual)}
                        {product.unit === "kg" ? " / kg" : ""}
                      </Text>

                      {/* Stock / Variant status */}
                      <Text className="text-[11px] text-zinc-400 text-center mt-0.5">
                        {product.has_variants === 1
                          ? "PILIH VARIAN"
                          : product.stock > 500
                          ? "Stok Tanpa Batas"
                          : `Stok ${product.stock} ${product.unit || "pcs"}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>

        {/* Right Column: Cart Panel matching screenshot 170117 & 170213 */}
        <View className="w-full md:w-80 lg:w-96 bg-white dark:bg-zinc-900 flex-col justify-between p-4 shadow-xl border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800">
          <View className="flex-1">
            {/* Cart Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <View className="flex-row items-center">
                <ShoppingCart size={17} color="#0097A7" />
                <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50 ml-2">
                  Keranjang
                </Text>
              </View>

              <View className="flex-row items-center space-x-2">
                <TouchableOpacity
                  onPress={() => setBarcodeModalVisible(true)}
                  activeOpacity={0.7}
                  className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mr-2"
                >
                  <Barcode size={15} color="#0097A7" />
                </TouchableOpacity>

                {items.length > 0 && (
                  <TouchableOpacity onPress={clearCart} activeOpacity={0.7}>
                    <Text className="text-xs text-red-500 font-semibold">
                      Kosongkan
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Cart Content Area */}
            {items.length === 0 ? (
              <View className="flex-1 items-center justify-center py-16">
                <Text className="text-xs text-zinc-400">
                  Keranjang masih kosong
                </Text>
              </View>
            ) : (
              <ScrollView className="flex-1 mt-2" showsVerticalScrollIndicator={false}>
                {items.map((item) => (
                  <View
                    key={item.id}
                    className="py-2.5 border-b border-zinc-100 dark:border-zinc-800/80 flex-row items-center justify-between"
                  >
                    <View className="flex-1 pr-2">
                      <Text
                        className="text-xs font-bold text-zinc-900 dark:text-zinc-100"
                        numberOfLines={1}
                      >
                        {item.product.name}
                        {item.variant ? ` (${item.variant.name})` : ""}
                      </Text>
                      <Text className="text-[11px] text-[#0097A7] font-semibold">
                        {formatRupiah(item.subtotal)}
                      </Text>
                    </View>

                    {/* Counter Buttons */}
                    <View className="flex-row items-center space-x-1.5">
                      <TouchableOpacity
                        onPress={() => updateQty(item.id, item.qty - (item.unit === "kg" ? 0.5 : 1))}
                        className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 items-center justify-center"
                      >
                        <Minus size={11} color="#71717a" />
                      </TouchableOpacity>

                      <Text className="w-8 text-center text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {item.qty}
                      </Text>

                      <TouchableOpacity
                        onPress={() => updateQty(item.id, item.qty + (item.unit === "kg" ? 0.5 : 1))}
                        className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 items-center justify-center"
                      >
                        <Plus size={11} color="#0097A7" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => removeItem(item.id)}
                        className="w-6 h-6 rounded-md bg-red-50 dark:bg-red-950/40 items-center justify-center ml-1"
                      >
                        <Trash2 size={11} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Cart Bottom Checkout Panel matching screenshot 170117 */}
          <View className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-bold text-zinc-500">Total</Text>
              <Text className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                {formatRupiah(grandTotal)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setCheckoutModalVisible(true)}
              disabled={items.length === 0}
              activeOpacity={0.8}
              className={`w-full py-3 rounded-2xl items-center justify-center ${
                items.length > 0
                  ? "bg-[#0097A7] shadow-md"
                  : "bg-zinc-200 dark:bg-zinc-800 opacity-50"
              }`}
            >
              <Text className="text-xs font-bold text-white">
                Lanjutkan ke Pembayaran
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Popups & Modals */}
      <DecimalVolumeModal
        visible={decimalModalVisible}
        product={selectedProductForModal}
        onClose={() => setDecimalModalVisible(false)}
        onConfirm={handleDecimalConfirm}
      />

      <VariantSelectionModal
        visible={variantModalVisible}
        product={selectedProductForModal}
        onClose={() => setVariantModalVisible(false)}
        onSelectVariant={handleVariantSelect}
      />

      <ProductSearchModal
        visible={searchModalVisible}
        products={products}
        onClose={() => setSearchModalVisible(false)}
        onSelectProduct={(p) => {
          setSearchModalVisible(false);
          handleProductPress(p);
        }}
      />

      <BarcodeScannerModal
        visible={barcodeModalVisible}
        onClose={() => setBarcodeModalVisible(false)}
        onScan={handleBarcodeScanned}
      />

      <CheckoutLandscapeModal
        visible={checkoutModalVisible}
        items={items}
        subtotal={subtotal}
        ppnPercent={isPpnActive ? ppnRate : 0}
        ppnAmount={ppnAmount}
        grandTotal={grandTotal}
        storeQrisImage={storeQris}
        onClose={() => setCheckoutModalVisible(false)}
        onConfirmPayment={handleConfirmPayment}
      />

      <ReceiptModal
        visible={receiptModalVisible}
        receiptData={completedReceipt}
        onClose={() => setReceiptModalVisible(false)}
        onNewTransaction={() => {
          setReceiptModalVisible(false);
          setCompletedReceipt(null);
          clearCart();
        }}
      />
    </SafeAreaView>
  );
}
