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
  const { width } = useWindowDimensions();
  const isLandscape = width >= 768;

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

      try {
        const catList = await getAllCategories();
        if (catList.length > 0) {
          setCategories(["Semua", ...catList.map((c) => c.name)]);
        }
      } catch (e) {
        console.error("Gagal load categories in POS:", e);
      }

      const ppnSetting = await getSetting("feature_ppn", "1");
      const ppnVal = Number(await getSetting("ppn_rate", "11")) || 11;
      const fTable = await getSetting("feature_table_number", "0");
      const fCustomer = await getSetting("feature_customer", "0");
      const fOpenBill = await getSetting("feature_open_bill", "0");
      const fBarcode = await getSetting("feature_barcode", "1");
      const fVariants = await getSetting("feature_variants", "1");
      const fAutoPrint = await getSetting("feature_auto_print", "0");

      const qrisImg = await getSetting("store_qris", "");
      const logoImg = await getSetting("store_logo", "");
      const sName = await getSetting("store_name", "POS Offline Pro");
      const sAddr = await getSetting("store_address", "Jl. Alamat No 99 Makassar");
      const sPhone = await getSetting("store_phone", "08111111111");
      const sFooter = await getSetting("store_receipt_footer", "Terima Kasih Atas Kunjungan Anda!");

      setIsPpnActive(ppnSetting === "1");
      setPpnRate(ppnVal);
      setFeatureTable(fTable === "1");
      setFeatureCustomer(fCustomer === "1");
      setFeatureOpenBill(fOpenBill === "1");
      setFeatureBarcode(fBarcode === "1");
      setFeatureVariants(fVariants === "1");
      setFeatureAutoPrint(fAutoPrint === "1");

      setStoreQris(qrisImg);
      setStoreLogo(logoImg);
      setStoreName(sName);
      setStoreAddress(sAddr);
      setStorePhone(sPhone);
      setStoreFooter(sFooter);

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
    if (featureVariants && product.has_variants === 1) {
      setSelectedProductForModal(product);
      setVariantModalVisible(true);
    } else if (
      product.is_decimal === 1 ||
      product.category === "Buah" ||
      product.unit === "kg" ||
      product.unit === "gram" ||
      product.unit === "liter"
    ) {
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
   */
  const handleBarcodeScanned = useCallback(
    async (code: string) => {
      if (!code || !code.trim()) return;
      const cleanCode = code.trim();

      // 1. Local catalog check
      const found = await getProductByBarcode(cleanCode);
      if (found) {
        handleProductPress(found);
        setNotificationBanner(`✓ ${found.name} dimasukkan ke keranjang`);
        setTimeout(() => setNotificationBanner(""), 3500);
        return;
      }

      // 2. Supermarket FMCG lookup
      const supermarketItem =
        lookupSupermarketBarcode(cleanCode) ||
        generateSmartSupermarketProduct(cleanCode);

      if (supermarketItem) {
        try {
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

          addItem(newProd, 1);
          loadSettingsAndProducts();

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
    [addItem, loadSettingsAndProducts, featureVariants]
  );

  // Hardware Scanner Gun Listener
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

  // Checkout Handler
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
        table_number: featureTable ? tableNumber : undefined,
        customer_name: featureCustomer ? customerName : undefined,
        is_open_bill: 0,
      });

      const receipt: ReceiptData = {
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
        tableNumber: result.transaction.table_number,
        customerName: result.transaction.customer_name,
        footerNote: storeFooter,
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
      setTableNumber("");
      setCustomerName("");
      loadSettingsAndProducts();

      // Automatic Receipt Print Trigger if Enabled
      if (featureAutoPrint) {
        printBluetoothReceipt58mm(receipt).catch((e) => console.log("Auto-print note:", e));
      }
    } catch (err: any) {
      console.error("Gagal Checkout:", err);
      const errMsg = err?.message || "Terjadi kesalahan sistem saat menyimpan transaksi.";
      Alert.alert("Gagal Checkout", errMsg);
    }
  };

  // Save Open Bill Handler
  const handleSaveOpenBill = async () => {
    try {
      const subtotal = getSubtotal();
      const ppnAmount = getPpnAmount();
      const grandTotal = getGrandTotal();
      const totalHpp = getTotalHpp();
      const totalLaba = getTotalLabaKotor();

      await processCheckout({
        items,
        subtotal,
        ppn_percent: isPpnActive ? ppnRate : 0,
        ppn_amount: ppnAmount,
        grand_total: grandTotal,
        total_hpp: totalHpp,
        laba_kotor: totalLaba,
        payment_method: "CASH",
        cash_tendered: 0,
        change_amount: 0,
        table_number: featureTable ? tableNumber : undefined,
        customer_name: featureCustomer ? customerName : undefined,
        is_open_bill: 1,
      });

      setCheckoutModalVisible(false);
      clearCart();
      setTableNumber("");
      setCustomerName("");
      loadSettingsAndProducts();
      Alert.alert("Open Bill Tersimpan", "Pesanan telah disimpan di daftar Open Bill.");
    } catch (e: any) {
      Alert.alert("Gagal Simpan Open Bill", e.message || "Terjadi kesalahan.");
    }
  };

  const handleSettleOpenBillFromModal = (bill: Transaction) => {
    setOpenBillModalVisible(false);
    // Settle directly
    settleOpenBill(bill.id, "CASH", bill.omset, 0).then(async () => {
      const receipt: ReceiptData = {
        invoiceNumber: bill.invoice_no || bill.id,
        date: new Date().toLocaleString("id-ID"),
        storeName: storeName,
        storeAddress: storeAddress,
        storePhone: storePhone,
        tableNumber: bill.table_number,
        customerName: bill.customer_name,
        footerNote: storeFooter,
        items: [{ name: `Pelunasan Open Bill (${bill.invoice_no})`, qty: 1, price: bill.omset, subtotal: bill.omset, unit: "pcs" }],
        totalAmount: bill.omset,
        paymentMethod: "CASH",
        cashTendered: bill.omset,
        changeAmount: 0,
      };
      setCompletedReceipt(receipt);
      setReceiptModalVisible(true);
      if (featureAutoPrint) {
        printBluetoothReceipt58mm(receipt).catch((e) => console.log("Auto-print note:", e));
      }
    });
  };

  const subtotal = getSubtotal();
  const ppnAmount = getPpnAmount();
  const grandTotal = getGrandTotal();
  const totalItemCount = getTotalItemCount();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9F7F4" }}>
      {/* Toast Notification Banner */}
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
          {/* Top Bar */}
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

              {/* Barcode Scanner Button (conditionally rendered) */}
              {featureBarcode && (
                <TouchableOpacity
                  onPress={() => setBarcodeModalVisible(true)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#ecfeff",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: "#a5f3fc",
                  }}
                >
                  <Barcode size={14} color="#0097A7" />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#0097A7", marginLeft: 6 }}>
                    Scan
                  </Text>
                </TouchableOpacity>
              )}

              {/* Open Bill List Button (conditionally rendered) */}
              {featureOpenBill && (
                <TouchableOpacity
                  onPress={() => setOpenBillModalVisible(true)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#fef3c7",
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 20,
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: "#fde68a",
                  }}
                >
                  <Receipt size={14} color="#d97706" />
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#b45309", marginLeft: 4 }}>
                    Open Bill
                  </Text>
                </TouchableOpacity>
              )}

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
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(tabs)");
                }
              }}
              activeOpacity={0.8}
              style={{
                backgroundColor: "#0097A7",
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff" }}>
                Selesai Menjual
              </Text>
            </TouchableOpacity>
          </View>

          {/* Product Grid */}
          <ScrollView
            contentContainerStyle={{
              padding: 16,
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
                <Text style={{ fontSize: 14, color: "#71717a", marginTop: 8 }}>
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
                    width: isLandscape ? "23.5%" : "48%",
                    backgroundColor: "#ffffff",
                    borderRadius: 16,
                    padding: 12,
                    marginBottom: 12,
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
                      height: 80,
                      borderRadius: 12,
                      backgroundColor: "#f4f4f5",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 8,
                      overflow: "hidden",
                    }}
                  >
                    {p.image_uri ? (
                      <Image source={{ uri: p.image_uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    ) : (
                      <Package size={28} color="#a1a1aa" />
                    )}
                  </View>

                  <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: "#18181b" }}>
                    {p.name}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#0097A7", marginTop: 2 }}>
                    {formatRupiah(p.harga_jual)}
                  </Text>
                  <Text style={{ fontSize: 10, color: "#71717a", marginTop: 2 }}>
                    Stok: {p.stock} {p.unit || "pcs"}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* Right Column: Cart & Checkout Panel */}
        <View
          style={{
            width: isLandscape ? 360 : "100%",
            backgroundColor: "#ffffff",
            borderTopWidth: isLandscape ? 0 : 1,
            borderTopColor: "#e5e7eb",
            display: "flex",
            flexDirection: "column",
            maxHeight: isLandscape ? "100%" : 320,
          }}
        >
          {/* Cart Header */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ShoppingCart size={18} color="#0097A7" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b", marginLeft: 8 }}>
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
          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
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
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        backgroundColor: "#f4f4f5",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Minus size={12} color="#3f3f46" />
                    </TouchableOpacity>

                    <Text style={{ minWidth: 28, textAlign: "center", fontSize: 12, fontWeight: "700", color: "#18181b" }}>
                      {item.qty}
                    </Text>

                    <TouchableOpacity
                      onPress={() => updateQty(item.id, item.qty + (item.product.is_decimal ? 0.5 : 1))}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        backgroundColor: "#f4f4f5",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Plus size={12} color="#3f3f46" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Cart Footer: Summary & Checkout Button */}
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb", backgroundColor: "#f9fafb" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 11, color: "#71717a" }}>Subtotal</Text>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#18181b" }}>{formatRupiah(subtotal)}</Text>
            </View>

            {isPpnActive && ppnAmount > 0 && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ fontSize: 11, color: "#71717a" }}>PPN {ppnRate}%</Text>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#18181b" }}>{formatRupiah(ppnAmount)}</Text>
              </View>
            )}

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181b" }}>Total</Text>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#0097A7" }}>{formatRupiah(grandTotal)}</Text>
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
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff" }}>
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
        onConfirmPayment={handleConfirmPayment}
        onSaveOpenBill={handleSaveOpenBill}
      />

      <OpenBillManagerModal
        visible={openBillModalVisible}
        onClose={() => setOpenBillModalVisible(false)}
        onSelectSettleBill={handleSettleOpenBillFromModal}
      />

      <ReceiptModal
        visible={receiptModalVisible}
        receiptData={completedReceipt}
        onClose={() => setReceiptModalVisible(false)}
        onNewTransaction={() => {
          setReceiptModalVisible(false);
          setCompletedReceipt(null);
        }}
      />
    </SafeAreaView>
  );
}
