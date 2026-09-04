import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useCartStore, CartItem } from "@/stores/useCartStore";
import { Product, ProductVariant, Transaction, Promo } from "@/db";
import { getAllProducts, getProductByBarcode, createProduct } from "@/db/productRepository";
import { getAllCategories } from "@/db/categoryRepository";
import { getActivePromos } from "@/db/promoRepository";
import { processCheckout } from "@/db/transactionRepository";
import { getSetting, setSetting } from "@/db/settingsRepository";
import { ReceiptData, printBluetoothReceipt58mm } from "@/util/printerService";
import { formatRupiah } from "@/util/formatters";
import { evaluateCartPromos, AppliedPromoResult } from "@/util/promoEngine";
import {
  lookupSupermarketBarcode,
  generateSmartSupermarketProduct,
} from "@/util/supermarketBarcodeDb";
import { DecimalVolumeModal } from "@/components/pos/DecimalVolumeModal";
import { VariantSelectionModal } from "@/components/pos/VariantSelectionModal";
import { ProductSearchModal } from "@/components/pos/ProductSearchModal";
import { BarcodeScannerModal } from "@/components/pos/BarcodeScannerModal";
import { CheckoutLandscapeModal } from "@/components/pos/CheckoutLandscapeModal";
import { ItemDiscountModal } from "@/components/pos/ItemDiscountModal";
import { CustomerSelectModal } from "@/components/pos/CustomerSelectModal";
import { CashierShiftModal } from "@/components/pos/CashierShiftModal";
import { getOpenBills, getTransactionDetailsWithProducts } from "@/db/transactionRepository";
import { User, Percent, UserCheck } from "lucide-react-native";
import { OpenBillManagerModal } from "@/components/pos/OpenBillManagerModal";
import { QuickRestockModal } from "@/components/pos/QuickRestockModal";
import { ReceiptModal } from "@/components/ReceiptModal";
import { ProductImage } from "@/components/ProductImage";
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
  RotateCw,
  Tag,
  Gift,
} from "lucide-react-native";

export default function PosModalScreen() {
  const { width, height } = useWindowDimensions();

  // Auto Lock to Landscape when entering cashier mode (Native only, safe from Web AbortError)
  useEffect(() => {
    if (Platform.OS !== "web") {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    }

    return () => {
      if (Platform.OS !== "web") {
        ScreenOrientation.unlockAsync().catch(() => {});
      }
    };
  }, []);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
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
  const [featurePromo, setFeaturePromo] = useState(true);
  const [activePromos, setActivePromos] = useState<Promo[]>([]);

  // Store Profile & Footer
  const [storeQris, setStoreQris] = useState("");
  const [storeLogo, setStoreLogo] = useState("");
  const [storeName, setStoreName] = useState("Padi Tech Solutions");
  const [storeBusinessType, setStoreBusinessType] = useState("Halal Food & Drink");
  const [storeAddress, setStoreAddress] = useState("Jl. Tambak Medokan Ayu GG III B");
  const [storePhone, setStorePhone] = useState("081259384244");
  const [storeFooter, setStoreFooter] = useState("Terima Kasih Atas Kunjungan Anda!");

  // Transaction metadata managed via useCartStore

  // Notification Banner
  const [notificationBanner, setNotificationBanner] = useState<string>("");

  // Interactive Modals
  const [decimalModalVisible, setDecimalModalVisible] = useState(false);
  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [openBillModalVisible, setOpenBillModalVisible] = useState(false);
  const [itemDiscountModalVisible, setItemDiscountModalVisible] = useState(false);
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState<CartItem | null>(null);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [openBillsCount, setOpenBillsCount] = useState(0);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);

  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<ReceiptData | null>(null);
  const [cashierName, setCashierName] = useState<string>("Kasir 1");
  const [cashierModalVisible, setCashierModalVisible] = useState(false);
  const [restockModalVisible, setRestockModalVisible] = useState(false);
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<Product | null>(null);

  // Cart State
  const {
    items,
    customerName,
    customerPhone,
    tableNumber,
    activeOpenBillId,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    setCustomerName,
    setCustomerPhone,
    setTableNumber,
    setItemDiscount,
    clearItemDiscount,
    loadItemsFromOpenBill,
    getSubtotal,
    getPpnAmount,
    getGrandTotal,
    getTotalItemCount,
    getTotalItemDiscount,
  } = useCartStore();

  const rawSubtotal = getSubtotal();
  const promoEvaluation = featurePromo ? evaluateCartPromos(items, activePromos) : { appliedPromos: [], totalDiscount: 0, netSubtotal: rawSubtotal };
  const discountAmount = promoEvaluation.totalDiscount;
  const appliedPromos = promoEvaluation.appliedPromos;
  const promoName = appliedPromos.map((p) => p.promo.name).join(", ");
  const subtotal = rawSubtotal;
  const subtotalAfterDiscount = promoEvaluation.netSubtotal;
  const ppnAmount = isPpnActive ? Math.round((subtotalAfterDiscount * ppnRate) / 100) : 0;
  const grandTotal = subtotalAfterDiscount + ppnAmount;
  const totalItemCount = getTotalItemCount();

  const loadData = useCallback(async () => {
    try {
      const dbCategories = await getAllCategories();
      if (dbCategories.length > 0) {
        setCategories(["Semua", ...dbCategories.map((c) => c.name)]);
      }
      const data = await getAllProducts();
      setAllProducts(data);

      const dbPromos = await getActivePromos();
      setActivePromos(dbPromos);

      const activeBills = await getOpenBills();
      setOpenBillsCount(activeBills.length);

      const fPpn = await getSetting("feature_ppn", "1");
      const pRate = await getSetting("ppn_rate", "11");
      const fTable = await getSetting("feature_table_number", "0");
      const fCust = await getSetting("feature_customer", "0");
      const fOpen = await getSetting("feature_open_bill", "0");
      const fBar = await getSetting("feature_barcode", "1");
      const fVar = await getSetting("feature_variants", "1");
      const fAuto = await getSetting("feature_auto_print", "0");
      const fPromo = await getSetting("feature_promo", "1");
      const sCashier = await getSetting("active_cashier_name", "Kasir 1");

      setIsPpnActive(fPpn === "1");
      setPpnRate(Number(pRate) || 11);
      setFeatureTable(fTable === "1");
      setFeatureCustomer(fCust === "1");
      setFeatureOpenBill(fOpen === "1");
      setFeatureBarcode(fBar === "1");
      setFeatureVariants(fVar === "1");
      setFeatureAutoPrint(fAuto === "1");
      setFeaturePromo(fPromo === "1");
      setCashierName(sCashier);

      const sLogo = await getSetting("store_logo", "");
      const sQris = await getSetting("store_qris", "");
      const sName = await getSetting("store_name", "Padi Tech Solutions");
      const sType = await getSetting("store_business_type", "Halal Food & Drink");
      const sAddr = await getSetting("store_address", "Jl. Tambak Medokan Ayu GG III B");
      const sPhone = await getSetting("store_phone", "081259384244");
      const sFooter = await getSetting("store_receipt_footer", "Terima Kasih Atas Kunjungan Anda!");

      setStoreLogo(sLogo);
      setStoreQris(sQris);
      setStoreName(sName);
      setStoreBusinessType(sType);
      setStoreAddress(sAddr);
      setStorePhone(sPhone);
      setStoreFooter(sFooter);
    } catch (e) {
      console.log("Error loading POS data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time synchronization when switching categories
  useEffect(() => {
    if (selectedCategory === "Semua") {
      setProducts(allProducts);
    } else {
      setProducts(
        allProducts.filter(
          (p) => (p.category || "").trim().toLowerCase() === selectedCategory.trim().toLowerCase()
        )
      );
    }
  }, [selectedCategory, allProducts]);

  const handleOpenRestock = (product: Product) => {
    setSelectedProductForRestock(product);
    setRestockModalVisible(true);
  };

  const handleRestockSuccess = async (updatedProduct: Product, addedQty: number) => {
    await loadData();
    setNotificationBanner(
      `✓ Berhasil menambah stok ${updatedProduct.name} (+${addedQty} ${updatedProduct.unit || "pcs"})! Stok saat ini: ${updatedProduct.stock} ${updatedProduct.unit || "pcs"}`
    );
    setTimeout(() => setNotificationBanner(""), 4500);
  };

  const handleProductPress = (product: Product) => {
    // 1. If product is completely out of stock and not a variant item, prevent adding and show alert + restock action
    if (product.stock <= 0 && (!product.has_variants || !product.variants_json)) {
      Alert.alert(
        "Stok Habis!",
        `Stok untuk produk "${product.name}" saat ini sudah habis (0 ${product.unit || "pcs"}). Tolong isi stok terlebih dahulu.`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "+ Tambah Stok",
            onPress: () => handleOpenRestock(product),
          },
        ]
      );
      return;
    }

    // 2. Decimal product
    if (product.is_decimal) {
      if (product.stock <= 0) {
        Alert.alert(
          "Stok Habis!",
          `Stok untuk produk "${product.name}" saat ini sudah habis (0 ${product.unit || "kg"}). Tolong isi stok terlebih dahulu.`,
          [
            { text: "Batal", style: "cancel" },
            {
              text: "+ Tambah Stok",
              onPress: () => handleOpenRestock(product),
            },
          ]
        );
        return;
      }
      setSelectedProductForModal(product);
      setDecimalModalVisible(true);
      return;
    }

    // 3. Variant product
    if (product.has_variants && product.variants_json && featureVariants) {
      setSelectedProductForModal(product);
      setVariantModalVisible(true);
      return;
    }

    // 4. Standard product - add to cart
    const result = addItem(product, 1);
    if (!result.success && result.message) {
      Alert.alert(
        "Stok Habis / Tidak Cukup!",
        result.message,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "+ Tambah Stok",
            onPress: () => handleOpenRestock(product),
          },
        ]
      );
    }
  };

  const handleDecimalConfirm = (product: Product, volume: number) => {
    const result = addItem(product, volume);
    if (!result.success && result.message) {
      Alert.alert("Stok Tidak Cukup!", result.message, [
        { text: "Batal", style: "cancel" },
        { text: "+ Tambah Stok", onPress: () => handleOpenRestock(product) },
      ]);
    }
    setDecimalModalVisible(false);
    setSelectedProductForModal(null);
  };

  const handleVariantSelect = (product: Product, variant: ProductVariant) => {
    const result = addItem(product, 1, variant);
    if (!result.success && result.message) {
      Alert.alert("Stok Varian Habis!", result.message, [
        { text: "Batal", style: "cancel" },
        { text: "+ Tambah Stok", onPress: () => handleOpenRestock(product) },
      ]);
    }
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
      const labaKotor = Math.max(0, subtotalAfterDiscount - totalHpp);

      const result = await processCheckout({
        items: items,
        subtotal: subtotal,
        discount_amount: discountAmount,
        promo_name: promoName || undefined,
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
        customer_phone: customerPhone || undefined,
        cashier_name: cashierName || "Kasir 1",
        is_open_bill: isOpenBill ? 1 : 0,
        previous_open_bill_id: activeOpenBillId || undefined,
      });

      const txDate = new Date(result.transaction.created_at || Date.now());
      const pad = (n: number) => n.toString().padStart(2, "0");
      const formattedDate = `${txDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}, ${pad(txDate.getHours())}:${pad(txDate.getMinutes())}:${pad(txDate.getSeconds())}`;

      const receiptData: ReceiptData = {
        invoiceNumber: result.transaction.invoice_no || result.transaction.id,
        date: formattedDate,
        storeName: storeName,
        businessType: storeBusinessType,
        storeAddress: storeAddress,
        storePhone: storePhone,
        storeLogoUri: storeLogo || undefined,
        items: result.details.map((d) => ({
          name: d.product_name,
          qty: d.qty,
          price: d.harga_jual,
          subtotal: d.subtotal,
          unit: d.unit || "pcs",
        })),
        totalAmount: result.transaction.omset,
        subtotalBeforeTax: result.transaction.subtotal_before_tax,
        discountAmount: discountAmount,
        promoName: promoName || undefined,
        ppnPercent: result.transaction.ppn_percent,
        ppnAmount: result.transaction.ppn_amount,
        cashTendered: result.transaction.cash_tendered,
        changeAmount: result.transaction.change_amount,
        paymentMethod: result.transaction.payment_method,
        cashierName: result.transaction.cashier_name || cashierName || "Kasir 1",
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
    if (Platform.OS !== "web") {
      try {
        ScreenOrientation.unlockAsync().catch(() => {});
      } catch (e) {}
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF8F5" }}>
      {/* Top Floating Notification */}
      {notificationBanner ? (
        <View
          style={{
            position: "absolute",
            top: 10,
            left: 20,
            right: 20,
            zIndex: 9999,
            backgroundColor: "#0097A7",
            borderRadius: 16,
            paddingVertical: 8,
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
          <Sparkles size={14} color="#ffffff" />
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff", marginLeft: 8, textAlign: "center" }}>
            {notificationBanner}
          </Text>
        </View>
      ) : null}

      {/* Top Header Bar across full screen */}
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: "#FAF8F5",
          borderBottomWidth: 1,
          borderBottomColor: "#EAE5DC",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left Side: Filter & Tools (Matches Left Column) */}
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 }}>
          {/* Cari Button */}
          <TouchableOpacity
            onPress={() => setSearchModalVisible(true)}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
              marginRight: 6,
              borderWidth: 1,
              borderColor: "#E5DFD7",
            }}
          >
            <Search size={12} color="#0097A7" />
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#44403c", marginLeft: 4 }}>
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
                backgroundColor: "#ECFEFF",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 20,
                marginRight: 6,
                borderWidth: 1,
                borderColor: "#A5F3FC",
              }}
            >
              <Barcode size={12} color="#0097A7" />
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7", marginLeft: 4 }}>
                Scan
              </Text>
            </TouchableOpacity>
          )}

          {/* Open Bill / Piutang List Button (Always active if feature enabled or bills exist) */}
          {(featureOpenBill || openBillsCount > 0) && (
            <TouchableOpacity
              onPress={() => setOpenBillModalVisible(true)}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: openBillsCount > 0 ? "#FEF3C7" : "#F3F4F6",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 20,
                marginRight: 6,
                borderWidth: 1,
                borderColor: openBillsCount > 0 ? "#FDE68A" : "#E5E7EB",
              }}
            >
              <Receipt size={12} color={openBillsCount > 0 ? "#D97706" : "#6B7280"} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: openBillsCount > 0 ? "#B45309" : "#4B5563",
                  marginLeft: 4,
                }}
              >
                Open Bill {openBillsCount > 0 ? `(${openBillsCount})` : ""}
              </Text>
            </TouchableOpacity>
          )}

          {/* Category Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
            {categories.map((cat, idx) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                  style={{
                    marginRight: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 20,
                    backgroundColor: isActive ? "#0097A7" : "#EFEBE4",
                    borderWidth: 1,
                    borderColor: isActive ? "#0097A7" : "#E5DFD7",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: isActive ? "#FFFFFF" : "#57534E",
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Right Side: Cashier Switcher, Customer Selector & Selesai Menjual */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {/* Shift / Cashier Switcher */}
          <TouchableOpacity
            onPress={() => setCashierModalVisible(true)}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: "#F0FDFA",
              borderWidth: 1,
              borderColor: "#99F6E4",
            }}
          >
            <UserCheck size={12} color="#0D9488" />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: "#0F766E",
                marginLeft: 4,
                maxWidth: 110,
              }}
            >
              {cashierName || "Kasir 1"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setCustomerModalVisible(true)}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: customerName ? "#EFF6FF" : "#FFFFFF",
              borderWidth: 1,
              borderColor: customerName ? "#BFDBFE" : "#D6D1CA",
            }}
          >
            <User size={12} color={customerName ? "#2563EB" : "#6B7280"} />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: customerName ? "#1D4ED8" : "#4B5563",
                marginLeft: 4,
                maxWidth: 100,
              }}
            >
              {customerName || "Pelanggan"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExitPOS}
            activeOpacity={0.8}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#D6D1CA",
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7" }}>
              Selesai Menjual
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Dual-Column Landscape Workstation (Always Side-by-Side as in Reference Photo) */}
      <View style={{ flex: 1, flexDirection: "row" }}>
        {/* Left Column: Product Catalog Grid (~52% width) */}
        <View style={{ flex: 11, borderRightWidth: 1, borderRightColor: "#EAE5DC", backgroundColor: "#FAF8F5" }}>
          <ScrollView
            contentContainerStyle={{
              padding: 10,
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
                <Inbox size={36} color="#A8A29E" />
                <Text style={{ fontSize: 12, color: "#78716C", marginTop: 8 }}>
                  Tidak ada produk dalam kategori ini
                </Text>
              </View>
            ) : (
              products.map((p) => {
                const isOutOfStock = p.stock <= 0;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => handleProductPress(p)}
                    activeOpacity={0.75}
                    style={{
                      width: "48.5%",
                      backgroundColor: isOutOfStock ? "#FFFBFB" : "#FFFFFF",
                      borderRadius: 18,
                      padding: 10,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: isOutOfStock ? "#FECACA" : "#EAE6DF",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 2,
                      elevation: 1,
                      alignItems: "center",
                      position: "relative",
                    }}
                  >
                    {/* Out of Stock Pill Badge */}
                    {isOutOfStock && (
                      <View
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          zIndex: 10,
                          backgroundColor: "#EF4444",
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ fontSize: 8, fontWeight: "900", color: "#FFFFFF" }}>
                          HABIS
                        </Text>
                      </View>
                    )}

                    {/* Product Image */}
                    <View style={{ marginBottom: 8 }}>
                      <ProductImage
                        uri={p.image_uri}
                        name={p.name}
                        category={p.category}
                        size={68}
                        borderRadius={14}
                        isOutOfStock={isOutOfStock}
                      />
                    </View>

                    {/* Product Name */}
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: isOutOfStock ? "#7F1D1D" : "#292524",
                        textAlign: "center",
                      }}
                    >
                      {p.name}
                    </Text>

                    {/* Price */}
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "800",
                        color: isOutOfStock ? "#9CA3AF" : "#0097A7",
                        marginTop: 2,
                        textAlign: "center",
                      }}
                    >
                      {formatRupiah(p.harga_jual)} {p.unit && p.unit !== "pcs" ? `/ ${p.unit}` : ""}
                    </Text>

                    {/* Stock Row & Quick Restock Button */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 3,
                        gap: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: isOutOfStock ? "800" : "500",
                          color: isOutOfStock ? "#DC2626" : "#8E887F",
                          textAlign: "center",
                        }}
                      >
                        {isOutOfStock ? "Stok: 0" : `Stok: ${p.stock} ${p.unit || "pcs"}`}
                      </Text>

                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleOpenRestock(p);
                        }}
                        style={{
                          paddingHorizontal: 6,
                          paddingVertical: 1.5,
                          backgroundColor: isOutOfStock ? "#0097A7" : "#EFEBE4",
                          borderRadius: 6,
                          marginLeft: 2,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 8,
                            fontWeight: "800",
                            color: isOutOfStock ? "#FFFFFF" : "#57534E",
                          }}
                        >
                          +Stok
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>

        {/* Right Column: Keranjang Area (~48% width, exactly matching Reference Screenshot) */}
        <View
          style={{
            flex: 10,
            backgroundColor: "#FAF8F5",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Cart Items Area */}
          <ScrollView
            style={{ flex: 1, paddingHorizontal: 12, paddingTop: 8 }}
            contentContainerStyle={items.length === 0 ? { flex: 1, alignItems: "center", justifyContent: "center" } : {}}
            showsVerticalScrollIndicator={false}
          >
            {items.length === 0 ? (
              <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 20 }}>
                <Text style={{ fontSize: 13, color: "#8E887F", fontWeight: "500" }}>
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
                    borderBottomColor: "#EAE5DC",
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "700", color: "#292524" }}>
                      {item.product.name}
                    </Text>
                    {item.variant && (
                      <Text style={{ fontSize: 10, color: "#0097A7" }}>
                        Varian: {item.variant.name}
                      </Text>
                    )}
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#57534E" }}>
                      {formatRupiah(item.subtotal)}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                      onPress={() => updateQty(item.id, item.qty - (item.product.is_decimal ? 0.5 : 1))}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        backgroundColor: "#EFEBE4",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Minus size={11} color="#44403C" />
                    </TouchableOpacity>

                    <TextInput
                      defaultValue={String(item.qty)}
                      key={`${item.id}_${item.qty}`}
                      onChangeText={(val: string) => {
                        const clean = val.replace(/,/g, ".");
                        const num = parseFloat(clean);
                        if (!isNaN(num) && num > 0) {
                          updateQty(item.id, num);
                        }
                      }}
                      onBlur={() => {
                        if (!item.qty || item.qty <= 0) {
                          updateQty(item.id, 1);
                        }
                      }}
                      selectTextOnFocus
                      keyboardType={item.product.is_decimal ? "decimal-pad" : "number-pad"}
                      style={{
                        minWidth: 38,
                        maxWidth: 65,
                        height: 24,
                        paddingVertical: 0,
                        paddingHorizontal: 4,
                        textAlign: "center",
                        fontSize: 11,
                        fontWeight: "700",
                        color: "#292524",
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1,
                        borderColor: "#D6D1CA",
                        borderRadius: 6,
                        marginHorizontal: 3,
                      }}
                    />

                    <TouchableOpacity
                      onPress={() => updateQty(item.id, item.qty + (item.product.is_decimal ? 0.5 : 1))}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        backgroundColor: "#EFEBE4",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Plus size={11} color="#44403C" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            {/* Active Promo Badges in Cart */}
            {appliedPromos.length > 0 && (
              <View
                style={{
                  backgroundColor: "#ECFDF5",
                  borderRadius: 12,
                  padding: 8,
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: "#A7F3D0",
                }}
              >
                {appliedPromos.map((ap, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginVertical: 2,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 4 }}>
                      <Tag size={12} color="#059669" style={{ marginRight: 4 }} />
                      <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: "700", color: "#065F46" }}>
                        {ap.description}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: "800", color: "#059669" }}>
                      -{formatRupiah(ap.discountAmount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Cart Bottom: Total & Full-Width Cyan Payment Button */}
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: "#FAF8F5",
            }}
          >
            {/* Subtotal & Promo Discount */}
            {discountAmount > 0 && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                <Text style={{ fontSize: 10, color: "#78716C" }}>Subtotal</Text>
                <Text style={{ fontSize: 10, fontWeight: "600", color: "#292524" }}>{formatRupiah(subtotal)}</Text>
              </View>
            )}

            {discountAmount > 0 && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                <Text style={{ fontSize: 10, color: "#059669", fontWeight: "700" }}>Diskon Promo</Text>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#059669" }}>-{formatRupiah(discountAmount)}</Text>
              </View>
            )}

            {/* PPN if active */}
            {isPpnActive && ppnAmount > 0 && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                <Text style={{ fontSize: 10, color: "#78716C" }}>PPN {ppnRate}%</Text>
                <Text style={{ fontSize: 10, fontWeight: "600", color: "#292524" }}>{formatRupiah(ppnAmount)}</Text>
              </View>
            )}

            {/* Total Price Right Aligned (Matches Screenshot Rp 0) */}
            <View style={{ alignItems: "flex-end", marginBottom: 6 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "800",
                  color: items.length > 0 ? "#0097A7" : "#8E887F",
                }}
              >
                {formatRupiah(grandTotal)}
              </Text>
            </View>

            {/* Action Buttons: Simpan Bill (Open Bill) & Pembayaran */}
            <View style={{ flexDirection: "row", gap: 6 }}>
              {/* Simpan Bill (Bayar Nanti / Piutang) */}
              <TouchableOpacity
                onPress={async () => {
                  if (items.length === 0) {
                    Alert.alert("Keranjang Kosong", "Pilih produk terlebih dahulu.");
                    return;
                  }
                  await handleCheckoutSuccess("CASH", grandTotal, 0, true);
                  const activeBills = await getOpenBills();
                  setOpenBillsCount(activeBills.length);
                }}
                activeOpacity={items.length > 0 ? 0.8 : 1}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 20,
                  backgroundColor: items.length > 0 ? "#FEF3C7" : "#F3F4F6",
                  borderWidth: 1,
                  borderColor: items.length > 0 ? "#FDE68A" : "#E5E7EB",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: items.length > 0 ? "#B45309" : "#9CA3AF" }}>
                  Simpan Bill
                </Text>
              </TouchableOpacity>

              {/* Lanjutkan ke Pembayaran */}
              <TouchableOpacity
                onPress={() => {
                  if (items.length === 0) {
                    Alert.alert("Keranjang Kosong", "Pilih produk terlebih dahulu.");
                    return;
                  }
                  setCheckoutModalVisible(true);
                }}
                activeOpacity={items.length > 0 ? 0.85 : 1}
                style={{
                  flex: 1,
                  backgroundColor: items.length > 0 ? "#0097A7" : "#A2E2EA",
                  paddingVertical: 10,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>
                  Lanjutkan ke Pembayaran
                </Text>
              </TouchableOpacity>
            </View>
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
          onRestockVariant={(prod) => {
            setVariantModalVisible(false);
            setSelectedProductForModal(null);
            handleOpenRestock(prod);
          }}
        />
      )}

      <ProductSearchModal
        visible={searchModalVisible}
        products={allProducts}
        onClose={() => setSearchModalVisible(false)}
        onSelectProduct={(p) => {
          setSearchModalVisible(false);
          handleProductPress(p);
        }}
        onRestockProduct={(p) => {
          setSearchModalVisible(false);
          handleOpenRestock(p);
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
        discountAmount={discountAmount}
        promoName={promoName}
        ppnPercent={isPpnActive ? ppnRate : 0}
        ppnAmount={ppnAmount}
        grandTotal={grandTotal}
        storeQrisImage={storeQris}
        tableNumber={tableNumber}
        customerName={customerName}
        cashierName={cashierName}
        onTableNumberChange={setTableNumber}
        onCustomerNameChange={setCustomerName}
        onCashierNameChange={async (val) => {
          setCashierName(val);
          await setSetting("active_cashier_name", val);
        }}
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

      <QuickRestockModal
        visible={restockModalVisible}
        product={selectedProductForRestock}
        onClose={() => {
          setRestockModalVisible(false);
          setSelectedProductForRestock(null);
        }}
        onRestockSuccess={handleRestockSuccess}
      />

      <OpenBillManagerModal
        visible={openBillModalVisible}
        onClose={async () => {
          setOpenBillModalVisible(false);
          const activeBills = await getOpenBills();
          setOpenBillsCount(activeBills.length);
        }}
        onSelectSettleBill={async (bill: Transaction) => {
          setOpenBillModalVisible(false);
          setTableNumber(bill.table_number || "");
          setCustomerName(bill.customer_name || "");
          setCustomerPhone(bill.customer_phone || "");
          setCheckoutModalVisible(true);
        }}
        onSelectEditBill={async (bill: Transaction) => {
          try {
            const details = await getTransactionDetailsWithProducts(bill.id);
            const loadedItems: CartItem[] = details.map((d, idx) => {
              const matchedProduct = allProducts.find((p) => p.id === d.product_id) || {
                id: d.product_id,
                name: d.product_name,
                harga_jual: d.harga_jual,
                modal_hpp: d.modal_hpp,
                stock: 999,
                unit: d.unit || "pcs",
                is_decimal: 0,
                barcode: null,
                image_uri: null,
                category: "Umum",
                has_variants: 0,
              };

              return {
                id: `${d.product_id}_${idx}`,
                product: matchedProduct,
                variant: d.variant_name ? { id: `VAR-${idx}`, name: d.variant_name, harga_jual: d.harga_jual, modal_hpp: d.modal_hpp, stock: 999 } : null,
                unitPrice: d.harga_jual,
                modalHpp: d.modal_hpp,
                qty: d.qty,
                unit: d.unit || "pcs",
                subtotal: d.subtotal,
                subtotalHpp: d.qty * d.modal_hpp,
                discountType: d.discount_type || null,
                discountValue: d.discount_value || 0,
                discountAmount: d.discount_amount || 0,
              };
            });

            loadItemsFromOpenBill(loadedItems, {
              tableNumber: bill.table_number || "",
              customerName: bill.customer_name || "",
              customerPhone: bill.customer_phone || "",
              openBillId: bill.id,
            });

            setOpenBillModalVisible(false);
            setNotificationBanner(`Memuat bill tersimpan: ${bill.invoice_no || bill.id}`);
            setTimeout(() => setNotificationBanner(""), 4000);
          } catch (err) {
            console.log("Failed to load open bill items:", err);
          }
        }}
      />

      <ItemDiscountModal
        visible={itemDiscountModalVisible}
        item={selectedItemForDiscount}
        onClose={() => {
          setItemDiscountModalVisible(false);
          setSelectedItemForDiscount(null);
        }}
        onApplyDiscount={(itemId, type, val) => {
          setItemDiscount(itemId, type, val);
        }}
        onClearDiscount={(itemId) => {
          clearItemDiscount(itemId);
        }}
      />

      <CustomerSelectModal
        visible={customerModalVisible}
        selectedCustomerName={customerName}
        selectedCustomerPhone={customerPhone}
        onClose={() => setCustomerModalVisible(false)}
        onSelectCustomer={(c) => {
          setCustomerName(c.name);
          setCustomerPhone(c.phone || "");
        }}
      />

      <CashierShiftModal
        visible={cashierModalVisible}
        currentCashier={cashierName}
        onClose={() => setCashierModalVisible(false)}
        onSelectCashier={async (name) => {
          setCashierName(name);
          await setSetting("active_cashier_name", name);
          setNotificationBanner(`✓ Kasir shift diubah ke: ${name}`);
          setTimeout(() => setNotificationBanner(""), 3500);
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
