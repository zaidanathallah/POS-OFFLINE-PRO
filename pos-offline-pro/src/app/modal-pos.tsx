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
  const isLandscape = width >= 768;

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
      loadSettingsAndProducts();
    } catch (err: any) {
      Alert.alert("Gagal Checkout", err.message || "Terjadi kesalahan sistem saat menyimpan transaksi.");
    }
  };

  const subtotal = getSubtotal();
  const ppnAmount = getPpnAmount();
  const grandTotal = getGrandTotal();
  const totalItemCount = getTotalItemCount();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9F7F4" }}>
      {/* Main Dual-Column Container */}
      <View style={{ flex: 1, flexDirection: isLandscape ? "row" : "column" }}>
        {/* Left Column: Product Selection Area */}
        <View style={{ flex: 1, borderRightWidth: isLandscape ? 1 : 0, borderRightColor: "#e5e7eb" }}>
          {/* Top Bar: Search button, Category pills, and Exit button */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: "#ffffff",
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
              {/* Cari Button matching screenshot 170117 */}
              <TouchableOpacity
                onPress={() => setSearchModalVisible(true)}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#f4f4f5",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: "#e4e4e7",
                }}
              >
                <Search size={14} color="#0097A7" />
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#3f3f46", marginLeft: 6 }}>
                  Cari
                </Text>
              </TouchableOpacity>

              {/* Category Pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
                {categories.map((cat, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.8}
                    style={{
                      marginRight: 8,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
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

            {/* Selesai Menjual Button matching screenshot 170117 */}
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#d4d4d8",
                backgroundColor: "#ffffff",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#3f3f46" }}>
                Selesai Menjual
              </Text>
            </TouchableOpacity>
          </View>

          {/* Product Grid Area matching screenshot 170117 & 170213 */}
          <ScrollView
            style={{ flex: 1, padding: 16 }}
            contentContainerStyle={{ paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={{ paddingVertical: 80, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator size="large" color="#0097A7" />
              </View>
            ) : products.length === 0 ? (
              <View style={{ paddingVertical: 80, alignItems: "center", justifyContent: "center" }}>
                <Inbox size={40} color="#9ca3af" />
                <Text style={{ fontSize: 13, color: "#71717a", marginTop: 8 }}>
                  Belum ada produk di kategori ini
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
                {products.map((product) => {
                  const inCart = items.find((i) => i.product.id === product.id);
                  const isOutOfStock = product.stock <= 0;

                  return (
                    <TouchableOpacity
                      key={product.id}
                      onPress={() => handleProductPress(product)}
                      disabled={isOutOfStock}
                      activeOpacity={0.8}
                      style={{
                        width: isLandscape ? "23.5%" : "48%",
                        marginBottom: 14,
                        borderRadius: 22,
                        padding: 12,
                        backgroundColor: inCart ? "#ecfeff" : "#ffffff",
                        borderWidth: 1,
                        borderColor: inCart ? "#0097A7" : "#e5e7eb",
                        opacity: isOutOfStock ? 0.45 : 1,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
                    >
                      {/* Product Image / Icon */}
                      <View
                        style={{
                          width: "100%",
                          height: 90,
                          borderRadius: 16,
                          backgroundColor: "#f4f4f5",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          marginBottom: 10,
                        }}
                      >
                        {product.image_uri ? (
                          <Image
                            source={{ uri: product.image_uri }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Package size={34} color="#a1a1aa" />
                        )}
                      </View>

                      {/* Product Name */}
                      <Text
                        numberOfLines={1}
                        style={{ fontSize: 13, fontWeight: "700", color: "#18181b", textAlign: "center" }}
                      >
                        {product.name}
                      </Text>

                      {/* Price per unit */}
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "800",
                          color: "#0097A7",
                          textAlign: "center",
                          marginTop: 3,
                        }}
                      >
                        {formatRupiah(product.harga_jual)}
                        {product.unit === "kg" ? " / kg" : ""}
                      </Text>

                      {/* Stock / Variant status */}
                      <Text style={{ fontSize: 10, color: "#71717a", textAlign: "center", marginTop: 2 }}>
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
        <View
          style={{
            width: isLandscape ? 340 : "100%",
            backgroundColor: "#ffffff",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 16,
            borderTopWidth: isLandscape ? 0 : 1,
            borderTopColor: "#e5e7eb",
            shadowColor: "#000",
            shadowOffset: { width: -2, height: 0 },
            shadowOpacity: 0.05,
            shadowRadius: 5,
            elevation: 3,
          }}
        >
          <View style={{ flex: 1 }}>
            {/* Cart Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#f4f4f5",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ShoppingCart size={18} color="#0097A7" />
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b", marginLeft: 8 }}>
                  Keranjang
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() => setBarcodeModalVisible(true)}
                  activeOpacity={0.7}
                  style={{
                    padding: 6,
                    borderRadius: 10,
                    backgroundColor: "#f4f4f5",
                    borderWidth: 1,
                    borderColor: "#e4e4e7",
                    marginRight: 8,
                  }}
                >
                  <Barcode size={16} color="#0097A7" />
                </TouchableOpacity>

                {items.length > 0 && (
                  <TouchableOpacity onPress={clearCart} activeOpacity={0.7}>
                    <Text style={{ fontSize: 12, color: "#ef4444", fontWeight: "600" }}>
                      Kosongkan
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Cart Content Area */}
            {items.length === 0 ? (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
                <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                  Keranjang masih kosong
                </Text>
              </View>
            ) : (
              <ScrollView style={{ flex: 1, marginTop: 8 }} showsVerticalScrollIndicator={false}>
                {items.map((item) => (
                  <View
                    key={item.id}
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
                      <Text
                        numberOfLines={1}
                        style={{ fontSize: 12, fontWeight: "700", color: "#18181b" }}
                      >
                        {item.product.name}
                        {item.variant ? ` (${item.variant.name})` : ""}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#0097A7", fontWeight: "700", marginTop: 2 }}>
                        {formatRupiah(item.subtotal)}
                      </Text>
                    </View>

                    {/* Counter Buttons */}
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <TouchableOpacity
                        onPress={() => updateQty(item.id, item.qty - (item.unit === "kg" ? 0.5 : 1))}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 8,
                          backgroundColor: "#f4f4f5",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Minus size={12} color="#71717a" />
                      </TouchableOpacity>

                      <Text style={{ width: 34, textAlign: "center", fontSize: 12, fontWeight: "700", color: "#18181b" }}>
                        {item.qty}
                      </Text>

                      <TouchableOpacity
                        onPress={() => updateQty(item.id, item.qty + (item.unit === "kg" ? 0.5 : 1))}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 8,
                          backgroundColor: "#f4f4f5",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Plus size={12} color="#0097A7" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => removeItem(item.id)}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 8,
                          backgroundColor: "#fef2f2",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: 6,
                        }}
                      >
                        <Trash2 size={12} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Cart Bottom Checkout Panel matching screenshot 170117 */}
          <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f4f4f5" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#71717a" }}>Total</Text>
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#18181b" }}>
                {formatRupiah(grandTotal)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setCheckoutModalVisible(true)}
              disabled={items.length === 0}
              activeOpacity={0.8}
              style={{
                width: "100%",
                paddingVertical: 14,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: items.length > 0 ? "#0097A7" : "#e4e4e7",
                shadowColor: "#0097A7",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: items.length > 0 ? 0.25 : 0,
                shadowRadius: 4,
                elevation: items.length > 0 ? 2 : 0,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: items.length > 0 ? "#ffffff" : "#a1a1aa" }}>
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
