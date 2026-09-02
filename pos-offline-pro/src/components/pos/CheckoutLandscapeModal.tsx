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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { CartItem } from "@/stores/useCartStore";
import { formatRupiah } from "@/util/formatters";
import { DynamicQrisView } from "./DynamicQrisView";
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
  onTableNumberChange?: (val: string) => void;
  onCustomerNameChange?: (val: string) => void;
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
  onTableNumberChange,
  onCustomerNameChange,
  featureTable = false,
  featureCustomer = false,
  featureOpenBill = false,
  onClose,
  onConfirmPayment,
  onSaveOpenBill,
}: CheckoutLandscapeModalProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width >= 768;
  const isSmallScreen = height < 750 || width < 420;

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  const [cashTenderedStr, setCashTenderedStr] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOrderSummaryMobile, setShowOrderSummaryMobile] = useState(!isSmallScreen);

  useEffect(() => {
    if (visible) {
      setPaymentMethod("CASH");
      setCashTenderedStr(grandTotal.toString());
      setIsProcessing(false);
      setShowOrderSummaryMobile(!isSmallScreen);
    }
  }, [visible, grandTotal, isSmallScreen]);

  const cashTendered = parseInt(cashTenderedStr, 10) || 0;
  const changeAmount = Math.max(0, cashTendered - grandTotal);
  const isPaymentValid = paymentMethod === "QRIS" || cashTendered >= grandTotal;

  const quickNominals = [
    { label: "Uang Pas", value: grandTotal },
    { label: "10.000", value: 10000 },
    { label: "20.000", value: 20000 },
    { label: "50.000", value: 50000 },
    { label: "100.000", value: 100000 },
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          padding: isSmallScreen ? 8 : 16,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: isLandscape ? 740 : 460,
            backgroundColor: "#ffffff",
            borderRadius: isSmallScreen ? 20 : 24,
            overflow: "hidden",
            maxHeight: isLandscape ? "92%" : "96%",
            display: "flex",
            flexDirection: "column",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          {/* Header */}
          <View
            style={{
              paddingHorizontal: isSmallScreen ? 14 : 20,
              paddingVertical: isSmallScreen ? 10 : 14,
              backgroundColor: "#ffffff",
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <CreditCard size={18} color="#0097A7" />
              <Text style={{ fontSize: isSmallScreen ? 14 : 16, fontWeight: "800", color: "#18181b", marginLeft: 8 }}>
                Pembayaran Transaksi
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "#f4f4f5",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={15} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flexDirection: isLandscape ? "row" : "column", flex: 1 }}>
              {/* Left Column: Order Summary & Info Inputs */}
              <View
                style={{
                  width: isLandscape ? "42%" : "100%",
                  backgroundColor: "#f9fafb",
                  borderRightWidth: isLandscape ? 1 : 0,
                  borderBottomWidth: isLandscape ? 0 : 1,
                  borderColor: "#e5e7eb",
                  padding: isSmallScreen ? 12 : 16,
                }}
              >
                {/* Table Number & Customer Name Inputs (if features are active) */}
                {(featureTable || featureCustomer) && (
                  <View style={{ marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}>
                    {featureTable && (
                      <View style={{ marginBottom: 6 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                          <Hash size={12} color="#0097A7" />
                          <Text style={{ fontSize: 10, fontWeight: "700", color: "#3f3f46", marginLeft: 4 }}>
                            Nomor Meja
                          </Text>
                        </View>
                        <TextInput
                          value={tableNumber}
                          onChangeText={onTableNumberChange}
                          placeholder="Misal: Meja 05"
                          style={{
                            backgroundColor: "#ffffff",
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            borderRadius: 10,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            fontSize: 12,
                            fontWeight: "600",
                            color: "#18181b",
                          }}
                        />
                      </View>
                    )}

                    {featureCustomer && (
                      <View>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                          <Users size={12} color="#0097A7" />
                          <Text style={{ fontSize: 10, fontWeight: "700", color: "#3f3f46", marginLeft: 4 }}>
                            Nama Pelanggan
                          </Text>
                        </View>
                        <TextInput
                          value={customerName}
                          onChangeText={onCustomerNameChange}
                          placeholder="Misal: Budi / 08123xxx"
                          style={{
                            backgroundColor: "#ffffff",
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            borderRadius: 10,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            fontSize: 12,
                            fontWeight: "600",
                            color: "#18181b",
                          }}
                        />
                      </View>
                    )}
                  </View>
                )}

                {/* Mobile Collapsible Header */}
                {!isLandscape && (
                  <TouchableOpacity
                    onPress={() => setShowOrderSummaryMobile(!showOrderSummaryMobile)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 4,
                      marginBottom: showOrderSummaryMobile ? 8 : 0,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#3f3f46" }}>
                      Ringkasan Pesanan ({items.length} item)
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 12, fontWeight: "800", color: "#0097A7", marginRight: 4 }}>
                        {formatRupiah(grandTotal)}
                      </Text>
                      {showOrderSummaryMobile ? <ChevronUp size={16} color="#71717a" /> : <ChevronDown size={16} color="#71717a" />}
                    </View>
                  </TouchableOpacity>
                )}

                {(isLandscape || showOrderSummaryMobile) && (
                  <>
                    <ScrollView
                      style={{ maxHeight: isLandscape ? 220 : 120 }}
                      showsVerticalScrollIndicator={false}
                    >
                      {items.map((it, idx) => (
                        <View
                          key={idx}
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingVertical: 4,
                            borderBottomWidth: 1,
                            borderBottomColor: "#f4f4f5",
                          }}
                        >
                          <View style={{ flex: 1, paddingRight: 6 }}>
                            <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: "700", color: "#18181b" }}>
                              {it.product.name}
                            </Text>
                            <Text style={{ fontSize: 9, color: "#71717a" }}>
                              {it.qty} {it.unit || "pcs"} x {formatRupiah(it.unitPrice)}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 11, fontWeight: "700", color: "#18181b" }}>
                            {formatRupiah(it.subtotal)}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>

                    {/* Breakdown */}
                    <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#e5e7eb" }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                        <Text style={{ fontSize: 10, color: "#71717a" }}>Subtotal</Text>
                        <Text style={{ fontSize: 10, fontWeight: "600", color: "#18181b" }}>{formatRupiah(subtotal)}</Text>
                      </View>

                      {discountAmount > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                          <Text style={{ fontSize: 10, color: "#16a34a", fontWeight: "700" }}>
                            {promoName ? `Diskon (${promoName})` : "Diskon Promo"}
                          </Text>
                          <Text style={{ fontSize: 10, fontWeight: "700", color: "#16a34a" }}>
                            -{formatRupiah(discountAmount)}
                          </Text>
                        </View>
                      )}

                      {ppnAmount > 0 && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                          <Text style={{ fontSize: 10, color: "#71717a" }}>PPN {ppnPercent}%</Text>
                          <Text style={{ fontSize: 10, fontWeight: "600", color: "#18181b" }}>{formatRupiah(ppnAmount)}</Text>
                        </View>
                      )}

                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: "#18181b" }}>Total Bayar</Text>
                        <Text style={{ fontSize: 15, fontWeight: "900", color: "#0097A7" }}>{formatRupiah(grandTotal)}</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>

              {/* Right Column: Payment Input & Keypad / Dynamic QRIS */}
              <View style={{ flex: 1, padding: isSmallScreen ? 12 : 16 }}>
                {/* Method Switcher */}
                <View style={{ flexDirection: "row", marginBottom: 10 }}>
                  <TouchableOpacity
                    onPress={() => setPaymentMethod("CASH")}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: isSmallScreen ? 8 : 10,
                      borderRadius: 12,
                      backgroundColor: paymentMethod === "CASH" ? "#0097A7" : "#f4f4f5",
                      marginRight: 6,
                    }}
                  >
                    <Banknote size={15} color={paymentMethod === "CASH" ? "#ffffff" : "#71717a"} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: paymentMethod === "CASH" ? "#ffffff" : "#52525b",
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
                      paddingVertical: isSmallScreen ? 8 : 10,
                      borderRadius: 12,
                      backgroundColor: paymentMethod === "QRIS" ? "#0097A7" : "#f4f4f5",
                      marginLeft: 6,
                    }}
                  >
                    <QrCode size={15} color={paymentMethod === "QRIS" ? "#ffffff" : "#71717a"} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: paymentMethod === "QRIS" ? "#ffffff" : "#52525b",
                        marginLeft: 6,
                      }}
                    >
                      QRIS Dinamis
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Mode Cash Keypad */}
                {paymentMethod === "CASH" ? (
                  <View>
                    {/* Display Nominal */}
                    <View
                      style={{
                        padding: isSmallScreen ? 8 : 10,
                        borderRadius: 14,
                        backgroundColor: "#f9fafb",
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 9, color: "#71717a" }}>Uang Diterima</Text>
                      <Text style={{ fontSize: isSmallScreen ? 17 : 20, fontWeight: "900", color: "#18181b", marginVertical: 1 }}>
                        {formatRupiah(cashTendered)}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color: cashTendered >= grandTotal ? "#16a34a" : "#ef4444",
                        }}
                      >
                        {cashTendered >= grandTotal
                          ? `Kembalian: ${formatRupiah(changeAmount)}`
                          : `Kurang: ${formatRupiah(grandTotal - cashTendered)}`}
                      </Text>
                    </View>

                    {/* Quick Nominals */}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6, gap: 5 }}>
                      {quickNominals.map((q, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => setCashTenderedStr(q.value.toString())}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 5,
                            borderRadius: 8,
                            backgroundColor: "#ecfeff",
                            borderWidth: 1,
                            borderColor: "#a5f3fc",
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: "700", color: "#0097A7" }}>
                            {q.label === "Uang Pas" ? "Uang Pas" : formatRupiah(q.value)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Keypad Grid */}
                    <View
                      style={{
                        marginTop: 8,
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
                            width: "31%",
                            paddingVertical: isSmallScreen ? 8 : 10,
                            borderRadius: 10,
                            backgroundColor: "#f4f4f5",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 5,
                          }}
                        >
                          {k === "DEL" ? (
                            <Delete size={15} color="#ef4444" />
                          ) : (
                            <Text style={{ fontSize: isSmallScreen ? 14 : 15, fontWeight: "700", color: "#18181b" }}>{k}</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  /* Dynamic QRIS View */
                  <View style={{ alignItems: "center", paddingVertical: 6 }}>
                    <DynamicQrisView
                      amount={grandTotal}
                      baseQrisPayload={storeQrisImage}
                      size={isSmallScreen ? 135 : 155}
                    />
                  </View>
                )}

                {/* Actions: Selesaikan Transaksi & Open Bill */}
                <View style={{ marginTop: 10, gap: 6 }}>
                  <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={!isPaymentValid || isProcessing}
                    activeOpacity={0.8}
                    style={{
                      paddingVertical: isSmallScreen ? 10 : 12,
                      borderRadius: 14,
                      backgroundColor: isPaymentValid ? "#0097A7" : "#d4d4d8",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                    }}
                  >
                    <CheckCircle2 size={16} color="#ffffff" />
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff", marginLeft: 6 }}>
                      {isProcessing
                        ? "Memproses..."
                        : paymentMethod === "CASH"
                        ? `Bayar ${formatRupiah(cashTendered)}`
                        : `Konfirmasi Bayar QRIS`}
                    </Text>
                  </TouchableOpacity>

                  {featureOpenBill && onSaveOpenBill && (
                    <TouchableOpacity
                      onPress={handleOpenBillClick}
                      disabled={isProcessing}
                      activeOpacity={0.8}
                      style={{
                        paddingVertical: 9,
                        borderRadius: 14,
                        backgroundColor: "#f4f4f5",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        borderWidth: 1,
                        borderColor: "#e4e4e7",
                      }}
                    >
                      <BookmarkPlus size={15} color="#0097A7" />
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#0097A7", marginLeft: 6 }}>
                        Simpan Sebagai Open Bill (Bayar Nanti)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
