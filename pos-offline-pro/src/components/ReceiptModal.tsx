import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Image,
  useWindowDimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { ReceiptData, printBluetoothReceipt58mm } from "@/util/printerService";
import { formatRupiah, formatNumber } from "@/util/formatters";
import {
  Printer,
  Share2,
  CheckCircle2,
  X,
} from "lucide-react-native";

interface ReceiptModalProps {
  visible: boolean;
  receiptData: ReceiptData | null;
  onClose: () => void;
  onNewTransaction: () => void;
}

export function ReceiptModal({
  visible,
  receiptData,
  onClose,
  onNewTransaction,
}: ReceiptModalProps) {
  const { height, width } = useWindowDimensions();
  const isShortScreen = height < 500;
  const isSmallScreen = height < 750 || width < 400;

  const receiptCaptureRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);

  if (!receiptData) return null;

  const handlePrint = async () => {
    try {
      const success = await printBluetoothReceipt58mm(receiptData);
      if (success) {
        Alert.alert("Sukses", "Struk berhasil dikirim ke printer 58mm.");
      }
    } catch (err: any) {
      Alert.alert("Gagal Cetak", err.message || "Pastikan Bluetooth aktif.");
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    try {
      setIsSharing(true);
      if (receiptCaptureRef.current) {
        const uri = await captureRef(receiptCaptureRef, {
          format: "png",
          quality: 1.0,
          result: "tmpfile",
        });

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: `Struk Transaksi ${receiptData.invoiceNumber}`,
            UTI: "public.png",
          });
          return;
        }
      }

      // Fallback jika capture/expo-sharing tidak tersedia pada platform
      let content = `--------------------------------\n`;
      content += `        ${(receiptData.storeName || "POS OFFLINE PRO").toUpperCase()}\n`;
      if (receiptData.businessType) {
        content += `      ${receiptData.businessType.toUpperCase()}\n`;
      }
      content += `   ${receiptData.storeAddress || ""}\n`;
      content += `        TELP: ${receiptData.storePhone || ""}\n`;
      content += `--------------------------------\n`;
      content += `Bon ${receiptData.invoiceNumber}    Kasir: ${(receiptData.cashierName || "KASIR 1").toUpperCase()}\n`;
      if (receiptData.tableNumber || receiptData.customerName) {
        content += `${receiptData.tableNumber ? `Meja: ${receiptData.tableNumber}` : ""}  ${receiptData.customerName ? `Plg: ${receiptData.customerName}` : ""}\n`;
      }
      content += `--------------------------------\n`;

      let totalQty = 0;
      receiptData.items.forEach((item) => {
        totalQty += item.qty;
        content += `${item.name.toUpperCase()}\n`;
        content += `  ${item.qty}   ${formatNumber(item.price)}   ${formatNumber(item.subtotal)}\n`;
      });

      content += `--------------------------------\n`;
      const rawSubtotal = receiptData.subtotalBeforeTax || receiptData.totalAmount;
      content += `Total Item      ${totalQty}   ${formatNumber(rawSubtotal)}\n`;

      if (receiptData.discountAmount && receiptData.discountAmount > 0) {
        content += `Total Disc.              -${formatNumber(receiptData.discountAmount)}\n`;
      }

      content += `Total Belanja             ${formatNumber(receiptData.totalAmount)}\n`;
      const payLabel = receiptData.paymentMethod === "CASH" ? "TUNAI" : "CPM QRIS";
      content += `${payLabel.padEnd(12, " ")}              ${formatNumber(receiptData.cashTendered || receiptData.totalAmount)}\n`;

      if (receiptData.paymentMethod === "CASH") {
        content += `Kembalian                 ${formatNumber(receiptData.changeAmount || 0)}\n`;
      }

      if (receiptData.ppnAmount && receiptData.ppnAmount > 0) {
        const dpp = (receiptData.subtotalBeforeTax || receiptData.totalAmount) - (receiptData.discountAmount || 0);
        content += `PPN         DPP: ${formatNumber(dpp)}  PPN: ${formatNumber(receiptData.ppnAmount)}\n`;
      }

      content += `--------------------------------\n`;
      content += `Tgl. ${receiptData.date} V.2026.1\n`;
      if (receiptData.customerName) {
        content += `MEMBER : ${receiptData.customerName.toUpperCase()} *****\n`;
        content += `--------------------------------\n`;
      }
      content += `  ${receiptData.footerNote || "Terima Kasih Atas Kunjungan Anda!"}\n`;
      if (receiptData.storePhone) {
        content += `  KRITIK&SARAN: ${receiptData.storePhone}\n`;
        content += `  SMS/WA: ${receiptData.storePhone}\n`;
      }
      content += `--------------------------------\n`;

      await Share.share({
        message: content,
        title: `Struk Transaksi ${receiptData.invoiceNumber}`,
      });
    } catch (error: any) {
      Alert.alert("Gagal Berbagi Struk", error.message || "Terjadi kendala saat membagikan gambar struk.");
    } finally {
      setIsSharing(false);
    }
  };

  const totalQtyCount = receiptData.items.reduce((acc, item) => acc + item.qty, 0);
  const rawSubtotal = receiptData.subtotalBeforeTax || receiptData.totalAmount;
  const dppAmount = rawSubtotal - (receiptData.discountAmount || 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.65)",
          padding: isShortScreen ? 6 : (isSmallScreen ? 10 : 20),
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 440,
            backgroundColor: "#ffffff",
            borderRadius: isShortScreen ? 16 : 24,
            padding: isShortScreen ? 10 : (isSmallScreen ? 14 : 20),
            maxHeight: isShortScreen ? "96%" : "94%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          {/* Scrollable Container */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            {/* Success Check Icon */}
            <View style={{ alignItems: "center", marginBottom: 10 }}>
              <View
                style={{
                  width: isSmallScreen ? 38 : 44,
                  height: isSmallScreen ? 38 : 44,
                  borderRadius: 22,
                  backgroundColor: "#ecfeff",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 4,
                }}
              >
                <CheckCircle2 size={isSmallScreen ? 22 : 26} color="#0097A7" />
              </View>
              <Text style={{ fontSize: isSmallScreen ? 15 : 16, fontWeight: "800", color: "#18181b" }}>
                Transaksi Berhasil!
              </Text>
              <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>
                Struk 58mm siap dicetak via Bluetooth / Dibagikan sebagai Gambar
              </Text>
            </View>

            {/* Thermal Paper Preview Area (Alfamart Standard) */}
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 12,
                padding: 10,
                borderWidth: 1,
                borderColor: "#e4e4e7",
                maxHeight: isShortScreen ? 160 : (isSmallScreen ? 280 : 360),
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Captured View Container for High Quality Struk Image */}
                <View
                  ref={receiptCaptureRef}
                  collapsable={false}
                  style={{
                    backgroundColor: "#ffffff",
                    paddingHorizontal: 8,
                    paddingVertical: 10,
                  }}
                >
                  {/* 1. Header with Logo */}
                  {receiptData.storeLogoUri ? (
                    <View style={{ alignItems: "center", marginBottom: 6 }}>
                      <Image
                        source={{ uri: receiptData.storeLogoUri }}
                        style={{ width: 50, height: 50, borderRadius: 8 }}
                        resizeMode="contain"
                      />
                    </View>
                  ) : null}

                  <Text style={{ textAlign: "center", fontSize: 13, fontWeight: "900", fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#18181b" }}>
                    {(receiptData.storeName || "POS OFFLINE PRO").toUpperCase()}
                  </Text>

                  {receiptData.businessType ? (
                    <Text style={{ textAlign: "center", fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#52525b", marginTop: 1 }}>
                      {receiptData.businessType.toUpperCase()}
                    </Text>
                  ) : null}

                  {receiptData.storeAddress ? (
                    <Text style={{ textAlign: "center", fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#52525b", marginTop: 1 }}>
                      {receiptData.storeAddress.toUpperCase()}
                    </Text>
                  ) : null}

                  {receiptData.storePhone ? (
                    <Text style={{ textAlign: "center", fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#52525b", marginTop: 1 }}>
                      TELP : {receiptData.storePhone}
                    </Text>
                  ) : null}

                  <View style={{ borderBottomWidth: 1, borderBottomColor: "#a1a1aa", borderStyle: "dashed", marginVertical: 6 }} />

                  {/* 2. Metadata (Bon & Kasir) */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#27272a" }}>
                      Bon {receiptData.invoiceNumber}
                    </Text>
                    <Text style={{ fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#27272a" }}>
                      Kasir : {(receiptData.cashierName || "KASIR 1").toUpperCase()}
                    </Text>
                  </View>

                  {receiptData.tableNumber || receiptData.customerName ? (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
                      <Text style={{ fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#27272a" }}>
                        {receiptData.tableNumber ? `Meja : ${receiptData.tableNumber}` : ""}
                      </Text>
                      <Text style={{ fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#27272a" }}>
                        {receiptData.customerName ? `Plg : ${receiptData.customerName}` : ""}
                      </Text>
                    </View>
                  ) : null}

                  <View style={{ borderBottomWidth: 1, borderBottomColor: "#a1a1aa", borderStyle: "dashed", marginVertical: 6 }} />

                  {/* 3. Itemized List (Alfamart Standard) */}
                  {receiptData.items.map((item, idx) => (
                    <View key={idx} style={{ marginBottom: 5 }}>
                      <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: "800", fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#18181b", textTransform: "uppercase" }}>
                        {item.name}
                      </Text>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingLeft: 8 }}>
                        <Text style={{ fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#27272a", width: 30 }}>
                          {item.qty}
                        </Text>
                        <Text style={{ fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#27272a", flex: 1, textAlign: "right", paddingRight: 12 }}>
                          {formatNumber(item.price)}
                        </Text>
                        <Text style={{ fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", fontWeight: "700", color: "#18181b", width: 75, textAlign: "right" }}>
                          {formatNumber(item.subtotal)}
                        </Text>
                      </View>
                    </View>
                  ))}

                  <View style={{ borderBottomWidth: 1, borderBottomColor: "#a1a1aa", borderStyle: "dashed", marginVertical: 6 }} />

                  {/* 4. Totals Breakdown (Alfamart Standard) */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                    <View style={{ flexDirection: "row", gap: 16 }}>
                      <Text style={{ fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#27272a" }}>Total Item</Text>
                      <Text style={{ fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#27272a" }}>{totalQtyCount}</Text>
                    </View>
                    <Text style={{ fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#18181b" }}>
                      {formatNumber(rawSubtotal)}
                    </Text>
                  </View>

                  {receiptData.discountAmount && receiptData.discountAmount > 0 ? (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                      <Text style={{ fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#16a34a", fontWeight: "700" }}>
                        Total Disc.
                      </Text>
                      <Text style={{ fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#16a34a", fontWeight: "700" }}>
                        -{formatNumber(receiptData.discountAmount)}
                      </Text>
                    </View>
                  ) : null}

                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                    <Text style={{ fontSize: 11, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", fontWeight: "800", color: "#18181b" }}>Total Belanja</Text>
                    <Text style={{ fontSize: 11, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", fontWeight: "900", color: "#18181b" }}>
                      {formatNumber(receiptData.totalAmount)}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                    <Text style={{ fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#27272a" }}>
                      {receiptData.paymentMethod === "CASH" ? "TUNAI" : "CPM QRIS"}
                    </Text>
                    <Text style={{ fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#18181b" }}>
                      {formatNumber(receiptData.cashTendered || receiptData.totalAmount)}
                    </Text>
                  </View>

                  {receiptData.paymentMethod === "CASH" && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                      <Text style={{ fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#27272a" }}>Kembalian</Text>
                      <Text style={{ fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", fontWeight: "700", color: "#18181b" }}>
                        {formatNumber(receiptData.changeAmount || 0)}
                      </Text>
                    </View>
                  )}

                  {receiptData.ppnAmount && receiptData.ppnAmount > 0 ? (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
                      <Text style={{ fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#52525b" }}>PPN</Text>
                      <Text style={{ fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#52525b" }}>
                        DPP: {formatNumber(dppAmount)}   PPN: {formatNumber(receiptData.ppnAmount)}
                      </Text>
                    </View>
                  ) : null}

                  <View style={{ borderBottomWidth: 1, borderBottomColor: "#a1a1aa", borderStyle: "dashed", marginVertical: 6 }} />

                  {/* 5. Footer (Alfamart Standard) */}
                  <Text style={{ textAlign: "center", fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#52525b" }}>
                    Tgl. {receiptData.date} V.2026.1
                  </Text>

                  {receiptData.customerName ? (
                    <>
                      <Text style={{ textAlign: "center", fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", fontWeight: "700", color: "#18181b", marginTop: 2 }}>
                        MEMBER : {receiptData.customerName.toUpperCase()} *****
                      </Text>
                      <View style={{ borderBottomWidth: 1, borderBottomColor: "#a1a1aa", borderStyle: "dashed", marginVertical: 4 }} />
                    </>
                  ) : null}

                  <Text style={{ textAlign: "center", fontSize: 9, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#52525b", marginTop: 4 }}>
                    {receiptData.footerNote || "Terima Kasih Atas Kunjungan Anda!"}
                  </Text>

                  {receiptData.storePhone ? (
                    <View style={{ marginTop: 4 }}>
                      <Text style={{ textAlign: "center", fontSize: 9, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#71717a" }}>
                        KRITIK&SARAN: {receiptData.storePhone}
                      </Text>
                      <Text style={{ textAlign: "center", fontSize: 9, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: "#71717a" }}>
                        SMS/WA: {receiptData.storePhone}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </ScrollView>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", marginTop: 12, gap: 8 }}>
              <TouchableOpacity
                onPress={handlePrint}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: isSmallScreen ? 10 : 12,
                  borderRadius: 14,
                  backgroundColor: "#0097A7",
                  shadowColor: "#0097A7",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Printer size={16} color="#ffffff" />
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff", marginLeft: 6 }}>
                  Cetak Struk
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShare}
                disabled={isSharing}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: isSmallScreen ? 10 : 12,
                  borderRadius: 14,
                  backgroundColor: "#f4f4f5",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#e4e4e7",
                  opacity: isSharing ? 0.6 : 1,
                }}
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color="#0097A7" />
                ) : (
                  <Share2 size={16} color="#52525b" />
                )}
              </TouchableOpacity>
            </View>

            {/* New Transaction Button */}
            <TouchableOpacity
              onPress={onNewTransaction}
              activeOpacity={0.8}
              style={{
                paddingVertical: isSmallScreen ? 10 : 12,
                borderRadius: 14,
                backgroundColor: "#f4f4f5",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 8,
                borderWidth: 1,
                borderColor: "#e4e4e7",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#3f3f46" }}>
                Transaksi Baru
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
