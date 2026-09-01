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
import * as ScreenOrientation from "expo-screen-orientation";
import { useCartStore, CartItem } from "@/stores/useCartStore";
import { Product, ProductVariant, Transaction } from "@/db";
import { getAllProducts, getProductByBarcode, createProduct } from "@/db/productRepository";
import { getAllCategories } from "@/db/categoryRepository";
import {
  processCheckout,
  getOpenBills,
  settleOpenBill,
} from "@/db/transactionRepository";
import { getSetting } from "@/db/settingsRepository";
import { ReceiptData, printBluetoothReceipt58mm } from "@/util/printerService";
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
import { OpenBillManagerModal } from "@/components/pos/OpenBillManagerModal";
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
  Receipt,
  Users,
  Hash,
} from "lucide-react-native";

export default function PosModalScreen() {
  const { width, height } = useWindowDimensions();

  // Auto Lock to Landscape when entering cashier mode
  useEffect(() => {
    async function lockLandscape() {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch (e) {
        console.log("ScreenOrientation lock error (web/unsupported):", e);
      }
    }
    lockLandscape();

    return () => {
      try {
        ScreenOrientation.unlockAsync();
      } catch (e) {
        console.log("ScreenOrientation unlock error:", e);
      }
    };
  }, []);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [categories, setCategories] = useState(["Semua", "Buah", "Makanan", "Minuman", "Retail", "Jasa"]);

  // Dynamic feature settings from SQLite
  const [isPpnActive, setIsPpnActive] = useState(true);
  const [ppnRate, setPpnRate] = useState(11);
  const [featureTable, setFeatureTable] = useState(false);
  const [featureCustomer, setFeatureCustomer] = useState(false);
  const [featureOpenBill, setFeatureOpenBill] = useState(false);
  const [featureBarcode, setFeatureBarcode] = useState(true);
  const [featureVariants, setFeatureVariants] = useState(true);
  const [featureAutoPrint, setFeatureAutoPrint] = useState(false);

  // Store Profile & Footer
  const [storeQris, setStoreQris] = useState("");
  const [storeLogo, setStoreLogo] = useState("");
  const [storeName, setStoreName] = useState("POS Offline Pro");
  const [storeAddress, setStoreAddress] = useState("Jl. Alamat No 99 Makassar");
  const [storePhone, setStorePhone] = useState("08111111111");
  const [storeFooter, setStoreFooter] = useState("Terima Kasih Atas Kunjungan Anda!");

  // Transaction metadata
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");

  // Notification Banner
  const [notificationBanner, setNotificationBanner] = useState<string>("");

  // Interactive Modals
  const [decimalModalVisible, setDecimalModalVisible] = useState(false);
  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [openBillModalVisible, setOpenBillModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);

  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<ReceiptData | null>(null);

  // Cart State
  const {
    items,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    getSubtotal,
    getPpnAmount,
    getGrandTotal,
    getTotalItemCount,
  } = useCartStore();

  const subtotal = getSubtotal();
  const ppnAmount = isPpnActive ? Math.round((subtotal * ppnRate) / 100) : 0;
  const grandTotal = subtotal + ppnAmount;
  const totalItemCount = getTotalItemCount();

  const loadData = useCallback(async () => {
    try {
      const dbCategories = await getAllCategories();
      if (dbCategories.length > 0) {
        setCategories(["Semua", ...dbCategories.map((c) => c.name)]);
      }
      const data = await getAllProducts(selectedCategory === "Semua" ? undefined : selectedCategory);
      setProducts(data);

      const fPpn = await getSetting("feature_ppn", "1");
      const pRate = await getSetting("ppn_rate", "11");
      const fTable = await getSetting("feature_table_number", "0");
      const fCust = await getSetting("feature_customer", "0");
      const fOpen = await getSetting("feature_open_bill", "0");
      const fBar = await getSetting("feature_barcode", "1");
      const fVar = await getSetting("feature_variants", "1");
      const fAuto = await getSetting("feature_auto_print", "0");

      setIsPpnActive(fPpn === "1");
      setPpnRate(Number(pRate) || 11);
      setFeatureTable(fTable === "1");
      setFeatureCustomer(fCust === "1");
      setFeatureOpenBill(fOpen === "1");
      setFeatureBarcode(fBar === "1");
      setFeatureVariants(fVar === "1");
      setFeatureAutoPrint(fAuto === "1");

      const sLogo = await getSetting("store_logo", "");
      const sQris = await getSetting("store_qris", "");
      const sName = await getSetting("store_name", "POS Offline Pro");
      const sAddr = await getSetting("store_address", "Jl. Alamat No 99 Makassar");
      const sPhone = await getSetting("store_phone", "08111111111");
      const sFooter = await getSetting("store_receipt_footer", "Terima Kasih Atas Kunjungan Anda!");

      setStoreLogo(sLogo);
      setStoreQris(sQris);
      setStoreName(sName);
      setStoreAddress(sAddr);
      setStorePhone(sPhone);
      setStoreFooter(sFooter);
    } catch (e) {
      console.log("Error loading POS data:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProductPress = (product: Product) => {
    if (product.is_decimal) {
      setSelectedProductForModal(product);
      setDecimalModalVisible(true);
      return;
    }
    if (product.has_variants && product.variants_json && featureVariants) {
      setSelectedProductForModal(product);
      setVariantModalVisible(true);
      return;
    }
    addItem(product, 1);
  };

  const handleDecimalConfirm = (product: Product, volume: number) => {
    addItem(product, volume);
    setDecimalModalVisible(false);
    setSelectedProductForModal(null);
  };

  const handleVariantSelect = (product: Product, variant: ProductVariant) => {
    addItem(product, 1, variant);
    setVariantModalVisible(false);
    setSelectedProductForModal(null);
  };

  const handleBarcodeScanned = async (scannedCode: string) => {
    try {
      const matched = await getProductByBarcode(scannedCode);
      if (matched) {
        handleProductPress(matched);
        setNotificationBanner(`✓ ${matched.name} ditambahkan!`);
        setTimeout(() => setNotificationBanner(""), 3000);
        return;
      }

      const supermarketItem = lookupSupermarketBarcode(scannedCode);
      if (supermarketItem) {
        const smartProduct = generateSmartSupermarketProduct(scannedCode);
        const newProd = await createProduct({
          name: smartProduct.name,
          category: smartProduct.category,
          harga_jual: smartProduct.harga_jual,
          modal_hpp: smartProduct.modal_hpp,
          stock: 100,
          unit: smartProduct.unit,
          barcode: smartProduct.barcode,
          is_decimal: 0,
          image_uri: smartProduct.image_uri,
        });

        await loadData();
        handleProductPress(newProd);
        setNotificationBanner(`✓ [Supermarket] ${newProd.name} terdeteksi & otomatis dibuat!`);
        setTimeout(() => setNotificationBanner(""), 4000);
        return;
      }

      Alert.alert(
        "Barcode Tidak Terdaftar",
        `Barcode "${scannedCode}" belum ada di database toko.`,
        [{ text: "Tutup", style: "cancel" }]
      );
    } catch (err: any) {
      Alert.alert("Scan Error", err.message || "Gagal memproses barcode.");
    }
  };

  const handleCheckoutSuccess = async (
    paymentMethod: "CASH" | "QRIS",
    cashTendered: number,
    changeAmount: number,
    isOpenBill: boolean = false
  ) => {
    try {
      const totalHpp = items.reduce(
        (acc, i) => acc + (i.modalHpp || i.product.modal_hpp || 0) * i.qty,
        0
      );
      const labaKotor = Math.max(0, subtotal - totalHpp);

      const result = await processCheckout({
        items,
        subtotal,
        ppn_percent: isPpnActive ? ppnRate : 0,
        ppn_amount: ppnAmount,
        grand_total: grandTotal,
        total_hpp: totalHpp,
        laba_kotor: labaKotor,
        payment_method: paymentMethod,
        cash_tendered: cashTendered,
        change_amount: changeAmount,
        table_number: tableNumber || undefined,
        customer_name: customerName || undefined,
        is_open_bill: isOpenBill ? 1 : 0,
      });

      const receiptData: ReceiptData = {
        invoiceNumber: result.transaction.invoice_no || result.transaction.id,
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
          unit: d.unit || "pcs",
        })),
        totalAmount: result.transaction.omset,
        subtotalBeforeTax: result.transaction.subtotal_before_tax,
        ppnPercent: result.transaction.ppn_percent,
        ppnAmount: result.transaction.ppn_amount,
        cashTendered: result.transaction.cash_tendered,
        changeAmount: result.transaction.change_amount,
        paymentMethod: result.transaction.payment_method,
        cashierName: "Kasir 1",
        tableNumber: result.transaction.table_number || undefined,
        customerName: result.transaction.customer_name || undefined,
        footerNote: storeFooter,
      };

      setCompletedReceipt(receiptData);
      clearCart();
      setCheckoutModalVisible(false);
      setTableNumber("");
      setCustomerName("");

      if (featureAutoPrint) {
        try {
          await printBluetoothReceipt58mm(receiptData);
        } catch (printErr) {
          console.log("Auto-print error:", printErr);
        }
      }

      setReceiptModalVisible(true);
      await loadData();
    } catch (err: any) {
      Alert.alert("Gagal Transaksi", err.message || "Terjadi kesalahan checkout.");
    }
  };

  const handleExitPOS = () => {
    try {
      ScreenOrientation.unlockAsync();
    } catch (e) {}
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9F7F4" }}>
      {/* Top Floating Notification */}
      {notificationBanner ? (
        <View
          style={{
            position: "absolute",
            top: 10,
            left: "20%",
            right: "20%",
            zIndex: 9999,
            backgroundColor: "#0097A7",
            borderRadius: 16,
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

      {/* Main Dual-Column Landscape Workstation */}
      <View style={{ flex: 1, flexDirection: "row" }}>
        {/* Left Column: Product Catalog & Categories (65% width) */}
        <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: "#e5e7eb" }}>
          {/* Top Bar */}
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
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
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  borderRadius: 18,
                  marginRight: 6,
                  borderWidth: 1,
                  borderColor: "#e4e4e7",
                }}
              >
                <Search size={13} color="#0097A7" />
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#3f3f46", marginLeft: 4 }}>
                  Cari
                </Text>
              </TouchableOpacity>

              {/* Barcode Scanner Button */}
              {featureBarcode && (
                <TouchableOpacity
                  onPress={() => setBarcodeModalVisible(true)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#ecfeff",
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                    borderRadius: 18,
                    marginRight: 6,
                    borderWidth: 1,
                    borderColor: "#a5f3fc",
                  }}
                >
                  <Barcode size={13} color="#0097A7" />
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7", marginLeft: 4 }}>
                    Scan
                  </Text>
                </TouchableOpacity>
              )}

              {/* Open Bill List Button */}
              {featureOpenBill && (
                <TouchableOpacity
                  onPress={() => setOpenBillModalVisible(true)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#fef3c7",
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                    borderRadius: 18,
                    marginRight: 6,
                    borderWidth: 1,
                    borderColor: "#fde68a",
                  }}
                >
                  <Receipt size={13} color="#d97706" />
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#b45309", marginLeft: 4 }}>
                    Open Bill
                  </Text>
                </TouchableOpacity>
              )}

              {/* Category Filter Pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
                {categories.map((cat, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.8}
                    style={{
                      marginRight: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 18,
                      backgroundColor: selectedCategory === cat ? "#0097A7" : "#f4f4f5",
                      borderWidth: 1,
                      borderColor: selectedCategory === cat ? "#0097A7" : "#e4e4e7",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
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
              onPress={handleExitPOS}
              activeOpacity={0.8}
              style={{
                backgroundColor: "#0097A7",
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 18,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#ffffff" }}>
                Selesai Menjual
              </Text>
            </TouchableOpacity>
          </View>

          {/* Product Grid */}
          <ScrollView
            contentContainerStyle={{
              padding: 12,
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={{ width: "100%", paddingVertical: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#0097A7" />
              </View>
            ) : products.length === 0 ? (
              <View style={{ width: "100%", paddingVertical: 40, alignItems: "center" }}>
                <Inbox size={40} color="#a1a1aa" />
                <Text style={{ fontSize: 13, color: "#71717a", marginTop: 8 }}>
                  Tidak ada produk dalam kategori ini
                </Text>
              </View>
            ) : (
              products.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => handleProductPress(p)}
                  activeOpacity={0.8}
                  style={{
                    width: "31.5%",
                    backgroundColor: "#ffffff",
                    borderRadius: 16,
                    padding: 10,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <View
                    style={{
                      width: "100%",
                      height: 75,
                      borderRadius: 12,
                      backgroundColor: "#f4f4f5",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 6,
                      overflow: "hidden",
                    }}
                  >
                    {p.image_uri ? (
                      <Image source={{ uri: p.image_uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    ) : (
                      <Package size={26} color="#a1a1aa" />
                    )}
                  </View>

                  <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "700", color: "#18181b" }}>
                    {p.name}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#0097A7", marginTop: 2 }}>
                    {formatRupiah(p.harga_jual)}
                  </Text>
                  <Text style={{ fontSize: 9, color: "#71717a", marginTop: 1 }}>
                    Stok: {p.stock} {p.unit || "pcs"}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* Right Column: Cart & Checkout Panel (35% width) */}
        <View
          style={{
            width: 330,
            backgroundColor: "#ffffff",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Cart Header */}
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ShoppingCart size={16} color="#0097A7" />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181b", marginLeft: 6 }}>
                Keranjang ({totalItemCount})
              </Text>
            </View>
            {items.length > 0 && (
              <TouchableOpacity onPress={clearCart} activeOpacity={0.7}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#ef4444" }}>
                  Kosongkan
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Cart Items List */}
          <ScrollView style={{ flex: 1, paddingHorizontal: 12 }} showsVerticalScrollIndicator={false}>
            {items.length === 0 ? (
              <View style={{ paddingVertical: 30, alignItems: "center" }}>
                <ShoppingCart size={32} color="#d4d4d8" />
                <Text style={{ fontSize: 12, color: "#a1a1aa", marginTop: 8 }}>
                  Keranjang masih kosong
                </Text>
              </View>
            ) : (
              items.map((item) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f4f4f5",
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "700", color: "#18181b" }}>
                      {item.product.name}
                    </Text>
                    {item.variant && (
                      <Text style={{ fontSize: 10, color: "#0097A7" }}>
                        Varian: {item.variant.name}
                      </Text>
                    )}
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#52525b" }}>
                      {formatRupiah(item.subtotal)}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                      onPress={() => updateQty(item.id, item.qty - (item.product.is_decimal ? 0.5 : 1))}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 7,
                        backgroundColor: "#f4f4f5",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Minus size={11} color="#3f3f46" />
                    </TouchableOpacity>

                    <Text style={{ minWidth: 26, textAlign: "center", fontSize: 12, fontWeight: "700", color: "#18181b" }}>
                      {item.qty}
                    </Text>

                    <TouchableOpacity
                      onPress={() => updateQty(item.id, item.qty + (item.product.is_decimal ? 0.5 : 1))}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 7,
                        backgroundColor: "#f4f4f5",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Plus size={11} color="#3f3f46" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Cart Footer: Summary & Checkout Button */}
          <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: "#e5e7eb", backgroundColor: "#f9fafb" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
              <Text style={{ fontSize: 11, color: "#71717a" }}>Subtotal</Text>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#18181b" }}>{formatRupiah(subtotal)}</Text>
            </View>

            {isPpnActive && ppnAmount > 0 && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                <Text style={{ fontSize: 11, color: "#71717a" }}>PPN {ppnRate}%</Text>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#18181b" }}>{formatRupiah(ppnAmount)}</Text>
              </View>
            )}

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#18181b" }}>Total</Text>
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#0097A7" }}>{formatRupiah(grandTotal)}</Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (items.length === 0) {
                  Alert.alert("Keranjang Kosong", "Pilih produk terlebih dahulu.");
                  return;
                }
                setCheckoutModalVisible(true);
              }}
              activeOpacity={0.8}
              style={{
                backgroundColor: items.length > 0 ? "#0097A7" : "#d4d4d8",
                paddingVertical: 11,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 4,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff" }}>
                Bayar {formatRupiah(grandTotal)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modals */}
      {selectedProductForModal && (
        <DecimalVolumeModal
          visible={decimalModalVisible}
          product={selectedProductForModal}
          onClose={() => {
            setDecimalModalVisible(false);
            setSelectedProductForModal(null);
          }}
          onConfirm={handleDecimalConfirm}
        />
      )}

      {selectedProductForModal && (
        <VariantSelectionModal
          visible={variantModalVisible}
          product={selectedProductForModal}
          onClose={() => {
            setVariantModalVisible(false);
            setSelectedProductForModal(null);
          }}
          onSelectVariant={handleVariantSelect}
        />
      )}

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
        onScan={(code: string) => {
          setBarcodeModalVisible(false);
          handleBarcodeScanned(code);
        }}
      />

      <CheckoutLandscapeModal
        visible={checkoutModalVisible}
        items={items}
        subtotal={subtotal}
        ppnPercent={isPpnActive ? ppnRate : 0}
        ppnAmount={ppnAmount}
        grandTotal={grandTotal}
        storeQrisImage={storeQris}
        tableNumber={tableNumber}
        customerName={customerName}
        onTableNumberChange={setTableNumber}
        onCustomerNameChange={setCustomerName}
        featureTable={featureTable}
        featureCustomer={featureCustomer}
        featureOpenBill={featureOpenBill}
        onClose={() => setCheckoutModalVisible(false)}
        onConfirmPayment={async (method, tendered, change) => {
          await handleCheckoutSuccess(method, tendered, change, false);
        }}
        onSaveOpenBill={async () => {
          await handleCheckoutSuccess("CASH", grandTotal, 0, true);
        }}
      />

      <OpenBillManagerModal
        visible={openBillModalVisible}
        onClose={() => setOpenBillModalVisible(false)}
        onSelectSettleBill={async (bill: Transaction) => {
          setOpenBillModalVisible(false);
          setTableNumber(bill.table_number || "");
          setCustomerName(bill.customer_name || "");
          setCheckoutModalVisible(true);
        }}
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
