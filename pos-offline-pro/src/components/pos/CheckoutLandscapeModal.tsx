import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  useWindowDimensions,
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
} from "lucide-react-native";

interface CheckoutLandscapeModalProps {
  visible: boolean;
  items: CartItem[];
  subtotal: number;
  ppnPercent: number;
  ppnAmount: number;
  grandTotal: number;
  storeQrisImage?: string;
  onClose: () => void;
  onConfirmPayment: (
    method: "CASH" | "QRIS",
    cashTendered: number,
    changeAmount: number
  ) => Promise<void> | void;
}

export function CheckoutLandscapeModal({
  visible,
  items,
  subtotal,
  ppnPercent,
  ppnAmount,
  grandTotal,
  storeQrisImage,
  onClose,
  onConfirmPayment,
}: CheckoutLandscapeModalProps) {
  const { width } = useWindowDimensions();
  const isLandscape = width >= 768;

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  const [cashTenderedStr, setCashTenderedStr] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (visible) {
      setPaymentMethod("CASH");
      setCashTenderedStr(grandTotal.toString());
      setIsProcessing(false);
    }
  }, [visible, grandTotal]);

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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          padding: 16,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 720,
            backgroundColor: "#ffffff",
            borderRadius: 24,
            overflow: "hidden",
            maxHeight: "92%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 14,
              backgroundColor: "#ffffff",
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#18181b" }}>
                Pembayaran Transaksi
              </Text>
              <Text style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                Pilih metode bayar & masukkan nominal tunai
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Main Dual Grid View */}
          <View style={{ flexDirection: isLandscape ? "row" : "column" }}>
            {/* Left Column: Order Summary */}
            <View
              style={{
                width: isLandscape ? 300 : "100%",
                backgroundColor: "#f9fafb",
                borderRightWidth: isLandscape ? 1 : 0,
                borderRightColor: "#e5e7eb",
                padding: 16,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#18181b", marginBottom: 8 }}>
                Ringkasan Pesanan ({items.length} Item)
              </Text>

              <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                {items.map((item) => {
                  const unitPrice =
                    item.variant?.harga_jual ??
                    item.product?.harga_jual ??
                    (item.qty > 0 ? item.subtotal / item.qty : 0);

                  return (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingVertical: 6,
                        borderBottomWidth: 1,
                        borderBottomColor: "#f4f4f5",
                      }}
                    >
                      <View style={{ flex: 1, paddingRight: 6 }}>
                        <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "600", color: "#18181b" }}>
                          {item.product?.name || "Produk"}
                          {item.variant ? ` (${item.variant.name})` : ""}
                        </Text>
                        <Text style={{ fontSize: 10, color: "#71717a" }}>
                          {item.qty} {item.unit} x {formatRupiah(unitPrice)}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#0097A7" }}>
                        {formatRupiah(item.subtotal)}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Totals */}
              <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#e5e7eb" }}>
                {ppnPercent > 0 && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, color: "#71717a" }}>PPN {ppnPercent}%</Text>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#18181b" }}>{formatRupiah(ppnAmount)}</Text>
                  </View>
                )}

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181b" }}>Total Bayar</Text>
                  <Text style={{ fontSize: 16, fontWeight: "900", color: "#0097A7" }}>{formatRupiah(grandTotal)}</Text>
                </View>
              </View>
            </View>

            {/* Right Column: Payment Input & Keypad */}
            <View style={{ flex: 1, padding: 16 }}>
              {/* Method Switcher */}
              <View style={{ flexDirection: "row", marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => setPaymentMethod("CASH")}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 10,
                    borderRadius: 14,
                    backgroundColor: paymentMethod === "CASH" ? "#0097A7" : "#f4f4f5",
                    marginRight: 6,
                  }}
                >
                  <Banknote size={16} color={paymentMethod === "CASH" ? "#ffffff" : "#71717a"} />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: paymentMethod === "CASH" ? "#ffffff" : "#52525b", marginLeft: 6 }}>
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
                    paddingVertical: 10,
                    borderRadius: 14,
                    backgroundColor: paymentMethod === "QRIS" ? "#0097A7" : "#f4f4f5",
                    marginLeft: 6,
                  }}
                >
                  <QrCode size={16} color={paymentMethod === "QRIS" ? "#ffffff" : "#71717a"} />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: paymentMethod === "QRIS" ? "#ffffff" : "#52525b", marginLeft: 6 }}>
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
                      padding: 10,
                      borderRadius: 16,
                      backgroundColor: "#f9fafb",
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 10, color: "#71717a" }}>Uang Diterima</Text>
                    <Text style={{ fontSize: 20, fontWeight: "900", color: "#18181b", marginVertical: 2 }}>
                      {formatRupiah(cashTendered)}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: cashTendered >= grandTotal ? "#16a34a" : "#ef4444" }}>
                      {cashTendered >= grandTotal ? `Kembalian: ${formatRupiah(changeAmount)}` : `Kurang: ${formatRupiah(grandTotal - cashTendered)}`}
                    </Text>
                  </View>

                  {/* Quick Nominals */}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8, gap: 6 }}>
                    {quickNominals.map((q, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setCashTenderedStr(q.value.toString())}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 10,
                          backgroundColor: "#ecfeff",
                          borderWidth: 1,
                          borderColor: "#a5f3fc",
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7" }}>
                          {q.label === "Uang Pas" ? "Uang Pas" : formatRupiah(q.value)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Keypad Grid */}
                  <View style={{ marginTop: 10, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "DEL"].map((k) => (
                      <TouchableOpacity
                        key={k}
                        onPress={() => handleKeypadPress(k)}
                        style={{
                          width: "31%",
                          paddingVertical: 10,
                          borderRadius: 12,
                          backgroundColor: "#f4f4f5",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 6,
                        }}
                      >
                        {k === "DEL" ? (
                          <Delete size={16} color="#ef4444" />
                        ) : (
                          <Text style={{ fontSize: 15, fontWeight: "700", color: "#18181b" }}>{k}</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                /* QRIS Mode View */
                <View style={{ alignItems: "center", paddingVertical: 16 }}>
                  <View
                    style={{
                      padding: 12,
                      borderRadius: 18,
                      backgroundColor: "#ffffff",
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      alignItems: "center",
                    }}
                  >
                    <Image
                      source={{
                        uri: storeQrisImage || "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=STORE_QRIS_OFFLINE_PRO",
                      }}
                      style={{ width: 160, height: 160 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#71717a", marginTop: 8 }}>
                    Scan QRIS untuk menyelesaikan pembayaran
                  </Text>
                </View>
              )}

              {/* Submit Payment Button with isProcessing spinner */}
              <TouchableOpacity
                onPress={handleConfirm}
                disabled={!isPaymentValid || isProcessing}
                activeOpacity={0.8}
                style={{
                  paddingVertical: 14,
                  borderRadius: 16,
                  backgroundColor: isPaymentValid && !isProcessing ? "#0097A7" : "#a1a1aa",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 10,
                }}
              >
                {isProcessing ? (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff", marginLeft: 8 }}>
                      Memproses Transaksi...
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff" }}>
                    Selesaikan Transaksi ({formatRupiah(grandTotal)})
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
