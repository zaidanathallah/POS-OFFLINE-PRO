import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  useWindowDimensions,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { CartItem } from "@/stores/useCartStore";
import { formatRupiah } from "@/util/formatters";
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Delete,
  ChevronDown,
  ChevronUp,
  Hash,
  Users,
  BookmarkPlus,
  ShoppingBag,
} from "lucide-react-native";

interface CheckoutLandscapeModalProps {
  visible: boolean;
  items: CartItem[];
  subtotal: number;
  discountAmount?: number;
  promoName?: string;
  ppnPercent: number;
  ppnAmount: number;
  grandTotal: number;
  storeQrisImage?: string;
  tableNumber?: string;
  customerName?: string;
  cashierName?: string;
  onTableNumberChange?: (val: string) => void;
  onCustomerNameChange?: (val: string) => void;
  onCashierNameChange?: (val: string) => void;
  featureTable?: boolean;
  featureCustomer?: boolean;
  featureOpenBill?: boolean;
  onClose: () => void;
  onConfirmPayment: (
    method: "CASH" | "QRIS",
    cashTendered: number,
    changeAmount: number
  ) => Promise<void> | void;
  onSaveOpenBill?: () => Promise<void> | void;
}

export function CheckoutLandscapeModal({
  visible,
  items,
  subtotal,
  discountAmount = 0,
  promoName = "",
  ppnPercent,
  ppnAmount,
  grandTotal,
  storeQrisImage,
  tableNumber = "",
  customerName = "",
  cashierName = "Kasir 1",
  onTableNumberChange,
  onCustomerNameChange,
  onCashierNameChange,
  featureTable = false,
  featureCustomer = false,
  featureOpenBill = false,
  onClose,
  onConfirmPayment,
  onSaveOpenBill,
}: CheckoutLandscapeModalProps) {
  const { width, height } = useWindowDimensions();

  // Screen characteristics
  const isLandscape = width > height;
  const isWideScreen = width >= 640;
  const isDualColumn = isLandscape || isWideScreen;
  const isShortScreen = height < 460;
  const isSmallPhone = width < 380 || height < 600;

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  const [cashTenderedStr, setCashTenderedStr] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOrderSummaryMobile, setShowOrderSummaryMobile] = useState(!isSmallPhone);

  useEffect(() => {
    if (visible) {
      setPaymentMethod("CASH");
      setCashTenderedStr(grandTotal.toString());
      setIsProcessing(false);
      setShowOrderSummaryMobile(!isSmallPhone);
    }
  }, [visible, grandTotal, isSmallPhone]);

  const cashTendered = parseInt(cashTenderedStr, 10) || 0;
  const changeAmount = Math.max(0, cashTendered - grandTotal);
  const isPaymentValid = paymentMethod === "QRIS" || cashTendered >= grandTotal;

  const quickNominals = [
    { label: "Uang Pas", value: grandTotal },
    { label: "10.000", value: 10000 },
    { label: "20.000", value: 20000 },
    { label: "50.000", value: 50000 },
    { label: "100.000", value: 100000 },
    { label: "200.000", value: 200000 },
  ].filter((q) => q.value >= grandTotal || q.label === "Uang Pas");

  const handleKeypadPress = (val: string) => {
    if (val === "DEL") {
      setCashTenderedStr((prev) => prev.slice(0, -1));
    } else if (val === "000") {
      setCashTenderedStr((prev) => (prev ? prev + "000" : ""));
    } else {
      setCashTenderedStr((prev) => prev + val);
    }
  };

  const handleConfirm = async () => {
    if (isProcessing) return;
    if (!isPaymentValid) return;

    setIsProcessing(true);
    try {
      await onConfirmPayment(paymentMethod, cashTendered, changeAmount);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenBillClick = async () => {
    if (isProcessing || !onSaveOpenBill) return;
    setIsProcessing(true);
    try {
      await onSaveOpenBill();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: isShortScreen ? 6 : (isSmallPhone ? 8 : 16),
        }}
      >
        {/* Backdrop click to close */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        {/* Modal Card */}
        <View
          style={{
            width: "100%",
            maxWidth: isDualColumn ? (isShortScreen ? 720 : 800) : 480,
            height: isDualColumn ? (isShortScreen ? "96%" : Math.min(height * 0.9, 640)) : undefined,
            maxHeight: isDualColumn ? "96%" : Math.min(height * 0.92, 740),
            backgroundColor: "#FFFFFF",
            borderRadius: isShortScreen ? 16 : 24,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 12,
            zIndex: 10,
          }}
        >
          {/* Header Bar */}
          <View
            style={{
              paddingHorizontal: isShortScreen ? 12 : 18,
              paddingVertical: isShortScreen ? 8 : 12,
              backgroundColor: "#FFFFFF",
              borderBottomWidth: 1,
              borderBottomColor: "#EAE5DC",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: "#E0F7FA",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <CreditCard size={18} color="#0097A7" />
              </View>
              <View>
                <Text style={{ fontSize: isShortScreen ? 14 : 16, fontWeight: "800", color: "#1C1917" }}>
                  Pembayaran Transaksi
                </Text>
                <Text style={{ fontSize: 10, color: "#78716C", marginTop: 1 }}>
                  Total: {formatRupiah(grandTotal)} ({items.reduce((a, b) => a + b.qty, 0)} item)
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: "#F5F3EF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color="#78716C" />
            </TouchableOpacity>
          </View>

          {/* DUAL-COLUMN LAYOUT (FOR LANDSCAPE / TABLET / DESKTOP) */}
          {isDualColumn ? (
            <View style={{ flex: 1, flexDirection: "row", overflow: "hidden" }}>
              {/* Left Column: Order Summary, Items, and Shift/Customer Inputs */}
              <ScrollView
                style={{
                  flex: 1,
                  backgroundColor: "#FAF8F5",
                  borderRightWidth: 1,
                  borderRightColor: "#EAE5DC",
                }}
                contentContainerStyle={{ padding: isShortScreen ? 10 : 14, paddingBottom: 20 }}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {/* Inputs: Kasir, Meja, Pelanggan */}
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 14,
                    padding: 10,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: "#EAE5DC",
                  }}
                >
                  {/* Nama Kasir (Shift) */}
                  <View style={{ marginBottom: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                      <Users size={12} color="#0097A7" />
                      <Text style={{ fontSize: 10, fontWeight: "700", color: "#44403C", marginLeft: 4 }}>
                        Nama Kasir (Shift)
                      </Text>
                    </View>
                    <TextInput
                      value={cashierName}
                      onChangeText={onCashierNameChange}
                      placeholder="Misal: Kasir 1 / Zaidan"
                      placeholderTextColor="#A8A29E"
                      style={{
                        backgroundColor: "#FAF8F5",
                        borderWidth: 1,
                        borderColor: "#E7E5E4",
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        fontSize: 12,
                        fontWeight: "600",
                        color: "#1C1917",
                      }}
                    />
                  </View>

                  {/* Nomor Meja & Pelanggan */}
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {featureTable && (
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                          <Hash size={12} color="#0097A7" />
                          <Text style={{ fontSize: 10, fontWeight: "700", color: "#44403C", marginLeft: 4 }}>
                            No Meja
                          </Text>
                        </View>
                        <TextInput
                          value={tableNumber}
                          onChangeText={onTableNumberChange}
                          placeholder="Meja 01"
                          placeholderTextColor="#A8A29E"
                          style={{
                            backgroundColor: "#FAF8F5",
                            borderWidth: 1,
                            borderColor: "#E7E5E4",
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 5,
                            fontSize: 11,
                            fontWeight: "600",
                            color: "#1C1917",
                          }}
                        />
                      </View>
                    )}

                    {featureCustomer && (
                      <View style={{ flex: 1.5 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                          <Users size={12} color="#0097A7" />
                          <Text style={{ fontSize: 10, fontWeight: "700", color: "#44403C", marginLeft: 4 }}>
                            Pelanggan
                          </Text>
                        </View>
                        <TextInput
                          value={customerName}
                          onChangeText={onCustomerNameChange}
                          placeholder="Nama Pelanggan"
                          placeholderTextColor="#A8A29E"
                          style={{
                            backgroundColor: "#FAF8F5",
                            borderWidth: 1,
                            borderColor: "#E7E5E4",
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 5,
                            fontSize: 11,
                            fontWeight: "600",
                            color: "#1C1917",
                          }}
                        />
                      </View>
                    )}
                  </View>
                </View>

                {/* Items List */}
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 14,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: "#EAE5DC",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "#F5F3EF" }}>
                    <ShoppingBag size={13} color="#0097A7" />
                    <Text style={{ fontSize: 11, fontWeight: "800", color: "#292524", marginLeft: 4 }}>
                      Daftar Pesanan ({items.length} item)
                    </Text>
                  </View>

                  {items.map((it, idx) => (
                    <View
                      key={idx}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: 4,
                        borderBottomWidth: idx === items.length - 1 ? 0 : 1,
                        borderBottomColor: "#F5F3EF",
                      }}
                    >
                      <View style={{ flex: 1, paddingRight: 6 }}>
                        <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: "700", color: "#1C1917" }}>
                          {it.product.name}
                        </Text>
                        <Text style={{ fontSize: 9, color: "#78716C" }}>
                          {it.qty} {it.unit || "pcs"} x {formatRupiah(it.unitPrice)}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: "800", color: "#1C1917" }}>
                        {formatRupiah(it.subtotal)}
                      </Text>
                    </View>
                  ))}

                  {/* Summary Breakdown */}
                  <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#EAE5DC" }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                      <Text style={{ fontSize: 10, color: "#78716C" }}>Subtotal</Text>
                      <Text style={{ fontSize: 10, fontWeight: "600", color: "#1C1917" }}>{formatRupiah(subtotal)}</Text>
                    </View>

                    {discountAmount > 0 && (
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                        <Text style={{ fontSize: 10, color: "#059669", fontWeight: "700" }}>
                          {promoName ? `Diskon (${promoName})` : "Diskon Promo"}
                        </Text>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: "#059669" }}>
                          -{formatRupiah(discountAmount)}
                        </Text>
                      </View>
                    )}

                    {ppnAmount > 0 && (
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                        <Text style={{ fontSize: 10, color: "#78716C" }}>PPN {ppnPercent}%</Text>
                        <Text style={{ fontSize: 10, fontWeight: "600", color: "#1C1917" }}>{formatRupiah(ppnAmount)}</Text>
                      </View>
                    )}

                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: "#F5F3EF" }}>
                      <Text style={{ fontSize: 12, fontWeight: "800", color: "#1C1917" }}>Total Tagihan</Text>
                      <Text style={{ fontSize: 16, fontWeight: "900", color: "#0097A7" }}>{formatRupiah(grandTotal)}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Right Column: Payment Methods, Cash Keypad / QRIS & Actions */}
              <ScrollView
                style={{ flex: 1.15, backgroundColor: "#FFFFFF" }}
                contentContainerStyle={{ padding: isShortScreen ? 10 : 14, paddingBottom: 20 }}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {/* Method Switcher */}
                <View style={{ flexDirection: "row", marginBottom: 8, gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => setPaymentMethod("CASH")}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: isShortScreen ? 6 : 8,
                      borderRadius: 12,
                      backgroundColor: paymentMethod === "CASH" ? "#0097A7" : "#F5F3EF",
                      borderWidth: 1,
                      borderColor: paymentMethod === "CASH" ? "#0097A7" : "#EAE6DF",
                    }}
                  >
                    <Banknote size={15} color={paymentMethod === "CASH" ? "#FFFFFF" : "#57534E"} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: paymentMethod === "CASH" ? "#FFFFFF" : "#57534E",
                        marginLeft: 6,
                      }}
                    >
                      Tunai (CASH)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setPaymentMethod("QRIS")}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: isShortScreen ? 6 : 8,
                      borderRadius: 12,
                      backgroundColor: paymentMethod === "QRIS" ? "#0097A7" : "#F5F3EF",
                      borderWidth: 1,
                      borderColor: paymentMethod === "QRIS" ? "#0097A7" : "#EAE6DF",
                    }}
                  >
                    <QrCode size={15} color={paymentMethod === "QRIS" ? "#FFFFFF" : "#57534E"} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: paymentMethod === "QRIS" ? "#FFFFFF" : "#57534E",
                        marginLeft: 6,
                      }}
                    >
                      QRIS
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* CASH MODE */}
                {paymentMethod === "CASH" ? (
                  <View>
                    {/* Display Nominal */}
                    <View
                      style={{
                        padding: isShortScreen ? 6 : 8,
                        borderRadius: 12,
                        backgroundColor: "#FAF8F5",
                        borderWidth: 1,
                        borderColor: "#EAE5DC",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 9, color: "#78716C" }}>Uang Diterima (Tunai)</Text>
                      <Text style={{ fontSize: isShortScreen ? 16 : 18, fontWeight: "900", color: "#1C1917", marginVertical: 1 }}>
                        {formatRupiah(cashTendered)}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color: cashTendered >= grandTotal ? "#137333" : "#DC2626",
                        }}
                      >
                        {cashTendered >= grandTotal
                          ? `Kembalian: ${formatRupiah(changeAmount)}`
                          : `Kurang: ${formatRupiah(grandTotal - cashTendered)}`}
                      </Text>
                    </View>

                    {/* Quick Nominals */}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6, gap: 4 }}>
                      {quickNominals.map((q, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => setCashTenderedStr(q.value.toString())}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            backgroundColor: "#E0F7FA",
                            borderWidth: 1,
                            borderColor: "#B2EBF2",
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: "700", color: "#00838F" }}>
                            {q.label === "Uang Pas" ? "Uang Pas" : formatRupiah(q.value)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Keypad Grid */}
                    <View
                      style={{
                        marginTop: 6,
                        flexDirection: "row",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                      }}
                    >
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "DEL"].map((k) => (
                        <TouchableOpacity
                          key={k}
                          onPress={() => handleKeypadPress(k)}
                          style={{
                            width: "31.5%",
                            paddingVertical: isShortScreen ? 6 : 8,
                            borderRadius: 10,
                            backgroundColor: "#F5F3EF",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 4,
                            borderWidth: 1,
                            borderColor: "#EAE6DF",
                          }}
                        >
                          {k === "DEL" ? (
                            <Delete size={15} color="#DC2626" />
                          ) : (
                            <Text style={{ fontSize: isShortScreen ? 13 : 15, fontWeight: "800", color: "#1C1917" }}>{k}</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  /* QRIS MODE */
                  <View style={{ alignItems: "center", paddingVertical: 6 }}>
                    <View
                      style={{
                        backgroundColor: "#E0F7FA",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: "#B2EBF2",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <Text style={{ fontSize: 9, color: "#00838F", fontWeight: "700", textTransform: "uppercase" }}>
                        Total Bayar QRIS
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: "900", color: "#0097A7", marginTop: 1 }}>
                        {formatRupiah(grandTotal)}
                      </Text>
                    </View>

                    <View
                      style={{
                        padding: 8,
                        borderRadius: 14,
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1,
                        borderColor: "#EAE5DC",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {storeQrisImage ? (
                        <Image
                          source={{
                            uri:
                              storeQrisImage.startsWith("data:") ||
                              storeQrisImage.startsWith("http") ||
                              storeQrisImage.startsWith("file:")
                                ? storeQrisImage
                                : `data:image/jpeg;base64,${storeQrisImage}`,
                          }}
                          style={{
                            width: isShortScreen ? 120 : 150,
                            height: isShortScreen ? 120 : 150,
                          }}
                          resizeMode="contain"
                        />
                      ) : (
                        <View
                          style={{
                            width: isShortScreen ? 120 : 150,
                            height: isShortScreen ? 120 : 150,
                            backgroundColor: "#F5F3EF",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 10,
                          }}
                        >
                          <QrCode size={40} color="#A8A29E" />
                          <Text style={{ fontSize: 9, color: "#78716C", marginTop: 4, textAlign: "center" }}>
                            Belum Ada QRIS{"\n"}(Atur di Pengaturan)
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Actions */}
                <View style={{ marginTop: 8, gap: 6 }}>
                  <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={!isPaymentValid || isProcessing}
                    activeOpacity={0.8}
                    style={{
                      paddingVertical: isShortScreen ? 9 : 11,
                      borderRadius: 12,
                      backgroundColor: isPaymentValid ? "#0097A7" : "#D6D3D1",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      shadowColor: "#0097A7",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isPaymentValid ? 0.2 : 0,
                      shadowRadius: 4,
                      elevation: isPaymentValid ? 3 : 0,
                    }}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <CheckCircle2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 12, fontWeight: "800", color: "#FFFFFF" }}>
                          {paymentMethod === "CASH"
                            ? `Bayar ${formatRupiah(cashTendered)}`
                            : `Konfirmasi Bayar QRIS`}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {featureOpenBill && onSaveOpenBill && (
                    <TouchableOpacity
                      onPress={handleOpenBillClick}
                      disabled={isProcessing}
                      activeOpacity={0.8}
                      style={{
                        paddingVertical: isShortScreen ? 7 : 9,
                        borderRadius: 12,
                        backgroundColor: "#FAF8F5",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        borderWidth: 1,
                        borderColor: "#EAE5DC",
                      }}
                    >
                      <BookmarkPlus size={14} color="#0097A7" style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7" }}>
                        Simpan Sebagai Open Bill (Bayar Nanti)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          ) : (
            /* SINGLE-COLUMN VERTICAL SCROLL LAYOUT (FOR PORTRAIT MOBILE PHONES) */
            <ScrollView
              style={{ maxHeight: height * 0.82 }}
              contentContainerStyle={{ padding: 14, paddingBottom: 24 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {/* Cashier, Table & Customer Card */}
              <View
                style={{
                  backgroundColor: "#FAF8F5",
                  borderRadius: 14,
                  padding: 10,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: "#EAE5DC",
                }}
              >
                <View style={{ marginBottom: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: "#44403C", marginBottom: 2 }}>
                    Nama Kasir (Shift)
                  </Text>
                  <TextInput
                    value={cashierName}
                    onChangeText={onCashierNameChange}
                    placeholder="Misal: Kasir 1"
                    placeholderTextColor="#A8A29E"
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderWidth: 1,
                      borderColor: "#E7E5E4",
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      fontSize: 12,
                      fontWeight: "600",
                      color: "#1C1917",
                    }}
                  />
                </View>

                <View style={{ flexDirection: "row", gap: 6 }}>
                  {featureTable && (
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: "#44403C", marginBottom: 2 }}>
                        No Meja
                      </Text>
                      <TextInput
                        value={tableNumber}
                        onChangeText={onTableNumberChange}
                        placeholder="Meja 01"
                        placeholderTextColor="#A8A29E"
                        style={{
                          backgroundColor: "#FFFFFF",
                          borderWidth: 1,
                          borderColor: "#E7E5E4",
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 5,
                          fontSize: 11,
                          fontWeight: "600",
                          color: "#1C1917",
                        }}
                      />
                    </View>
                  )}

                  {featureCustomer && (
                    <View style={{ flex: 1.5 }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: "#44403C", marginBottom: 2 }}>
                        Pelanggan
                      </Text>
                      <TextInput
                        value={customerName}
                        onChangeText={onCustomerNameChange}
                        placeholder="Nama Pelanggan"
                        placeholderTextColor="#A8A29E"
                        style={{
                          backgroundColor: "#FFFFFF",
                          borderWidth: 1,
                          borderColor: "#E7E5E4",
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 5,
                          fontSize: 11,
                          fontWeight: "600",
                          color: "#1C1917",
                        }}
                      />
                    </View>
                  )}
                </View>
              </View>

              {/* Collapsible Order Summary Header */}
              <TouchableOpacity
                onPress={() => setShowOrderSummaryMobile(!showOrderSummaryMobile)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 10,
                  backgroundColor: "#FAF8F5",
                  borderRadius: 12,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: "#EAE5DC",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <ShoppingBag size={14} color="#0097A7" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#292524" }}>
                    Pesanan ({items.length} item)
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#0097A7", marginRight: 4 }}>
                    {formatRupiah(grandTotal)}
                  </Text>
                  {showOrderSummaryMobile ? <ChevronUp size={16} color="#78716C" /> : <ChevronDown size={16} color="#78716C" />}
                </View>
              </TouchableOpacity>

              {showOrderSummaryMobile && (
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 12,
                    padding: 10,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: "#EAE5DC",
                  }}
                >
                  {items.map((it, idx) => (
                    <View
                      key={idx}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        paddingVertical: 3,
                        borderBottomWidth: idx === items.length - 1 ? 0 : 1,
                        borderBottomColor: "#F5F3EF",
                      }}
                    >
                      <Text numberOfLines={1} style={{ flex: 1, fontSize: 11, color: "#292524" }}>
                        {it.product.name} x{it.qty}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#292524" }}>
                        {formatRupiah(it.subtotal)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Payment Method Switcher */}
              <View style={{ flexDirection: "row", marginBottom: 10, gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setPaymentMethod("CASH")}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: paymentMethod === "CASH" ? "#0097A7" : "#F5F3EF",
                    borderWidth: 1,
                    borderColor: paymentMethod === "CASH" ? "#0097A7" : "#EAE6DF",
                  }}
                >
                  <Banknote size={16} color={paymentMethod === "CASH" ? "#FFFFFF" : "#57534E"} />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: paymentMethod === "CASH" ? "#FFFFFF" : "#57534E", marginLeft: 6 }}>
                    Tunai (CASH)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setPaymentMethod("QRIS")}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: paymentMethod === "QRIS" ? "#0097A7" : "#F5F3EF",
                    borderWidth: 1,
                    borderColor: paymentMethod === "QRIS" ? "#0097A7" : "#EAE6DF",
                  }}
                >
                  <QrCode size={16} color={paymentMethod === "QRIS" ? "#FFFFFF" : "#57534E"} />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: paymentMethod === "QRIS" ? "#FFFFFF" : "#57534E", marginLeft: 6 }}>
                    QRIS
                  </Text>
                </TouchableOpacity>
              </View>

              {/* CASH INPUT & KEYPAD */}
              {paymentMethod === "CASH" ? (
                <View>
                  <View
                    style={{
                      padding: 10,
                      borderRadius: 14,
                      backgroundColor: "#FAF8F5",
                      borderWidth: 1,
                      borderColor: "#EAE5DC",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontSize: 10, color: "#78716C" }}>Uang Diterima</Text>
                    <Text style={{ fontSize: 22, fontWeight: "900", color: "#1C1917", marginVertical: 2 }}>
                      {formatRupiah(cashTendered)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: cashTendered >= grandTotal ? "#137333" : "#DC2626",
                      }}
                    >
                      {cashTendered >= grandTotal
                        ? `Kembalian: ${formatRupiah(changeAmount)}`
                        : `Kurang: ${formatRupiah(grandTotal - cashTendered)}`}
                    </Text>
                  </View>

                  {/* Quick Nominals */}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {quickNominals.map((q, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setCashTenderedStr(q.value.toString())}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: "#E0F7FA",
                          borderWidth: 1,
                          borderColor: "#B2EBF2",
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#00838F" }}>
                          {q.label === "Uang Pas" ? "Uang Pas" : formatRupiah(q.value)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Keypad */}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 12 }}>
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "DEL"].map((k) => (
                      <TouchableOpacity
                        key={k}
                        onPress={() => handleKeypadPress(k)}
                        style={{
                          width: "31.5%",
                          paddingVertical: 10,
                          borderRadius: 10,
                          backgroundColor: "#F5F3EF",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 6,
                          borderWidth: 1,
                          borderColor: "#EAE6DF",
                        }}
                      >
                        {k === "DEL" ? (
                          <Delete size={18} color="#DC2626" />
                        ) : (
                          <Text style={{ fontSize: 16, fontWeight: "800", color: "#1C1917" }}>{k}</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                /* QRIS DISPLAY */
                <View style={{ alignItems: "center", paddingVertical: 10 }}>
                  <View
                    style={{
                      padding: 10,
                      borderRadius: 16,
                      backgroundColor: "#FFFFFF",
                      borderWidth: 1,
                      borderColor: "#EAE5DC",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    {storeQrisImage ? (
                      <Image
                        source={{
                          uri:
                            storeQrisImage.startsWith("data:") ||
                            storeQrisImage.startsWith("http") ||
                            storeQrisImage.startsWith("file:")
                              ? storeQrisImage
                              : `data:image/jpeg;base64,${storeQrisImage}`,
                        }}
                        style={{ width: 180, height: 180 }}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={{ width: 180, height: 180, backgroundColor: "#F5F3EF", alignItems: "center", justifyContent: "center", borderRadius: 12 }}>
                        <QrCode size={52} color="#A8A29E" />
                        <Text style={{ fontSize: 11, color: "#78716C", marginTop: 6, textAlign: "center" }}>
                          Belum Ada QRIS
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={handleConfirm}
                  disabled={!isPaymentValid || isProcessing}
                  style={{
                    paddingVertical: 13,
                    borderRadius: 14,
                    backgroundColor: isPaymentValid ? "#0097A7" : "#D6D3D1",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                  }}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                        {paymentMethod === "CASH"
                          ? `Bayar ${formatRupiah(cashTendered)}`
                          : `Konfirmasi Bayar QRIS`}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {featureOpenBill && onSaveOpenBill && (
                  <TouchableOpacity
                    onPress={handleOpenBillClick}
                    disabled={isProcessing}
                    style={{
                      paddingVertical: 11,
                      borderRadius: 14,
                      backgroundColor: "#FAF8F5",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      borderWidth: 1,
                      borderColor: "#EAE5DC",
                    }}
                  >
                    <BookmarkPlus size={16} color="#0097A7" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#0097A7" }}>
                      Simpan Sebagai Open Bill (Bayar Nanti)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
