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
import { getAllProducts, getProductByBarcode, createProduct } from "@/db/productRepository";
import { processCheckout } from "@/db/transactionRepository";
import { getSetting } from "@/db/settingsRepository";
import { ReceiptData } from "@/util/printerService";
import { formatRupiah } from "@/util/formatters";
import {
  lookupSupermarketBarcode,
  generateSmartSupermarketProduct,
} from "@/util/supermarketBarcodeDb";
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
  Sparkles,
  CheckCircle2,
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

  // Notification Banner
  const [notificationBanner, setNotificationBanner] = useState<string>("");

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

  /**
   * Universal Barcode Scanner Handler
   * Detects local products AND automatically identifies & registers external supermarket goods (FMCG).
   */
  const handleBarcodeScanned = useCallback(
    async (code: string) => {
      if (!code || !code.trim()) return;
      const cleanCode = code.trim();

      // 1. Check in local products catalog first
      const found = await getProductByBarcode(cleanCode);
      if (found) {
        handleProductPress(found);
        setNotificationBanner(`✓ ${found.name} dimasukkan ke keranjang`);
        setTimeout(() => setNotificationBanner(""), 3500);
        return;
      }

      // 2. Not in local catalog: Check offline supermarket FMCG database or generate smart product
      const supermarketItem =
        lookupSupermarketBarcode(cleanCode) ||
        generateSmartSupermarketProduct(cleanCode);

      if (supermarketItem) {
        try {
          // Auto create into local SQLite products table
          const newProd = await createProduct({
            name: supermarketItem.name,
            harga_jual: supermarketItem.harga_jual,
            modal_hpp: supermarketItem.modal_hpp,
            stock: 100,
            unit: supermarketItem.unit || "pcs",
            is_decimal: 0,
            barcode: cleanCode,
            image_uri: supermarketItem.image_uri || null,
            category: supermarketItem.category || "Retail",
            has_variants: 0,
          });

          // Add to cart directly
          addItem(newProd, 1);

          // Refresh catalog in background
          loadSettingsAndProducts();

          // Show banner
          setNotificationBanner(
            `✨ ${supermarketItem.name} (${formatRupiah(supermarketItem.harga_jual)}) otomatis terdeteksi & masuk keranjang!`
          );
          setTimeout(() => setNotificationBanner(""), 4500);
        } catch (err: any) {
          console.error("Gagal auto-add supermarket product:", err);
          Alert.alert("Gagal Tambah Produk", err.message || "Terjadi kesalahan.");
        }
      }
    },
    [addItem, loadSettingsAndProducts]
  );

  // Hardware USB/Bluetooth Barcode Scanner Gun Listener
  useEffect(() => {
    if (typeof window !== "undefined") {
      let buffer = "";
      let lastKeyTime = Date.now();

      const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
          return;
        }

        const now = Date.now();
        if (now - lastKeyTime > 180) {
          buffer = "";
        }
        lastKeyTime = now;

        if (e.key === "Enter") {
          if (buffer.length >= 4) {
            handleBarcodeScanned(buffer);
          }
          buffer = "";
        } else if (e.key.length === 1 && /[0-9a-zA-Z]/.test(e.key)) {
          buffer += e.key;
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleBarcodeScanned]);

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
      console.error("Gagal Checkout:", err);
      const errMsg = err?.message || "Terjadi kesalahan sistem saat menyimpan transaksi.";
      if (typeof window !== "undefined" && window.alert) {
        window.alert(`Gagal Checkout: ${errMsg}`);
      } else {
        Alert.alert("Gagal Checkout", errMsg);
      }
    }
  };

  const subtotal = getSubtotal();
  const ppnAmount = getPpnAmount();
  const grandTotal = getGrandTotal();
  const totalItemCount = getTotalItemCount();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9F7F4" }}>
      {/* Toast Notification Banner for Barcode Auto-Detection */}
      {notificationBanner ? (
        <View
          style={{
            position: "absolute",
            top: 12,
            left: 20,
            right: 20,
            zIndex: 999,
            backgroundColor: "#0097A7",
            borderRadius: 14,
            paddingVertical: 10,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 8,
          }}
        >
          <Sparkles size={16} color="#ffffff" />
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff", marginLeft: 8, textAlign: "center" }}>
            {notificationBanner}
          </Text>
        </View>
      ) : null}

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
              {/* Cari Button */}
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

            {/* Selesai Menjual Exit Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.8}
              style={{
                borderWidth: 1,
                borderColor: "#d4d4d8",
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: "#ffffff",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#3f3f46" }}>
                Selesai Menjual
              </Text>
            </TouchableOpacity>
          </View>

          {/* Product Grid Area */}
          <ScrollView
            style={{ flex: 1, padding: 16 }}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={{ paddingVertical: 60, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#0097A7" />
              </View>
            ) : products.length === 0 ? (
              <View style={{ paddingVertical: 60, alignItems: "center" }}>
                <Package size={40} color="#a1a1aa" />
                <Text style={{ fontSize: 14, color: "#71717a", marginTop: 8 }}>
                  Belum ada produk di kategori ini
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
                {products.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  return (
                    <View
                      key={product.id}
                      style={{
                        width: isLandscape ? "25%" : "50%",
                        paddingHorizontal: 6,
                        marginBottom: 12,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => handleProductPress(product)}
                        disabled={isOutOfStock}
                        activeOpacity={0.7}
                        style={{
                          backgroundColor: "#ffffff",
                          borderRadius: 20,
                          padding: 12,
                          borderWidth: 1,
                          borderColor: product.has_variants ? "#0097A7" : "#e5e7eb",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.05,
                          shadowRadius: 4,
                          elevation: 2,
                          opacity: isOutOfStock ? 0.5 : 1,
                          minHeight: 180,
                          justifyContent: "space-between",
                        }}
                      >
                        {/* Product Image Box */}
                        <View
                          style={{
                            width: "100%",
                            height: 100,
                            borderRadius: 14,
                            backgroundColor: "#f4f4f5",
                            overflow: "hidden",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 8,
                          }}
                        >
                          {product.image_uri ? (
                            <Image
                              source={{ uri: product.image_uri }}
                              style={{ width: "100%", height: "100%" }}
                              resizeMode="cover"
                            />
                          ) : (
                            <Package size={32} color="#a1a1aa" />
                          )}
                        </View>

                        {/* Product Info */}
                        <View style={{ alignItems: "center" }}>
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: 13,
                              fontWeight: "700",
                              color: "#18181b",
                              textAlign: "center",
                            }}
                          >
                            {product.name}
                          </Text>

                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: "800",
                              color: "#0097A7",
                              marginTop: 2,
                            }}
                          >
                            {formatRupiah(product.harga_jual)}
                            {product.is_decimal ? ` / ${product.unit}` : ""}
                          </Text>

                          <Text
                            style={{
                              fontSize: 10,
                              color: isOutOfStock ? "#ef4444" : "#71717a",
                              marginTop: 2,
                              fontWeight: product.has_variants ? "700" : "400",
                            }}
                          >
                            {product.has_variants
                              ? "PILIH VARIAN"
                              : isOutOfStock
                              ? "Stok Habis"
                              : product.stock > 500
                              ? "Stok Tanpa Batas"
                              : `Stok ${product.stock} ${product.unit}`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>

        {/* Right Column: Interactive Cart Panel matching screenshot 170117 */}
        <View
          style={{
            width: isLandscape ? 360 : "100%",
            backgroundColor: "#ffffff",
            borderLeftWidth: isLandscape ? 1 : 0,
            borderLeftColor: "#e5e7eb",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Cart Header */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ShoppingCart size={18} color="#0097A7" />
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#18181b", marginLeft: 8 }}>
                Keranjang
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {/* Barcode Scanner Button */}
              <TouchableOpacity
                onPress={() => setBarcodeModalVisible(true)}
                activeOpacity={0.7}
                style={{
                  padding: 6,
                  borderRadius: 10,
                  backgroundColor: "#ecfeff",
                  marginRight: 8,
                }}
              >
                <Barcode size={18} color="#0097A7" />
              </TouchableOpacity>

              {items.length > 0 && (
                <TouchableOpacity onPress={clearCart} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 11, color: "#ef4444", fontWeight: "600" }}>
                    Kosongkan
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Cart Items List */}
          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
            {items.length === 0 ? (
              <View style={{ paddingVertical: 80, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 12, color: "#a1a1aa" }}>
                  Keranjang masih kosong
                </Text>
              </View>
            ) : (
              items.map((item) => (
                <View
                  key={item.id}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f4f4f5",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: "#18181b" }}>
                      {item.product.name}
                      {item.variant ? ` (${item.variant.name})` : ""}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#0097A7", marginTop: 2 }}>
                      {formatRupiah(item.subtotal)}
                    </Text>
                  </View>

                  {/* Quantity Stepper */}
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
                      <Minus size={13} color="#71717a" />
                    </TouchableOpacity>

                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#18181b", marginHorizontal: 8 }}>
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
                      <Plus size={13} color="#71717a" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => removeItem(item.id)}
                      style={{ marginLeft: 8, padding: 4 }}
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Cart Footer Total & Checkout Action */}
          <View
            style={{
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: "#e5e7eb",
              backgroundColor: "#ffffff",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 14, color: "#71717a" }}>Total</Text>
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#18181b" }}>
                {formatRupiah(grandTotal)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setCheckoutModalVisible(true)}
              disabled={items.length === 0}
              activeOpacity={0.8}
              style={{
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: items.length > 0 ? "#0097A7" : "#d4d4d8",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#ffffff" }}>
                Lanjutkan ke Pembayaran
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* --- ALL COMPONENT MODALS --- */}
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
        onSelectProduct={(prod) => {
          setSearchModalVisible(false);
          handleProductPress(prod);
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
        onNewTransaction={() => setReceiptModalVisible(false)}
      />
    </SafeAreaView>
  );
}
