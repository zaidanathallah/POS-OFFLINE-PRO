import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  useWindowDimensions,
} from "react-native";
import { ReceiptData, printBluetoothReceipt58mm } from "@/util/printerService";
import { formatRupiah } from "@/util/formatters";
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
  const { height } = useWindowDimensions();
  const isSmallScreen = height < 750;

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
    try {
      let content = `================================\n`;
      content += `        ${(receiptData.storeName || "POS OFFLINE PRO").toUpperCase()}\n`;
      content += `   ${receiptData.storeAddress || ""}\n`;
      content += `        Telp: ${receiptData.storePhone || ""}\n`;
      content += `================================\n`;
      content += `No. Struk : ${receiptData.invoiceNumber}\n`;
      content += `Tanggal   : ${receiptData.date}\n`;
      content += `Kasir     : ${receiptData.cashierName || "Kasir 1"}\n`;
      content += `--------------------------------\n`;

      receiptData.items.forEach((item) => {
        content += `${item.name}\n`;
        content += `  ${item.qty} ${item.unit || "pcs"} x ${formatRupiah(item.price)} = ${formatRupiah(item.subtotal)}\n`;
      });

      content += `--------------------------------\n`;
      content += `Subtotal  : ${formatRupiah(receiptData.subtotalBeforeTax || receiptData.totalAmount)}\n`;

      if (receiptData.ppnAmount && receiptData.ppnAmount > 0) {
        content += `PPN (${receiptData.ppnPercent}%): ${formatRupiah(receiptData.ppnAmount)}\n`;
      }

      content += `TOTAL     : ${formatRupiah(receiptData.totalAmount)}\n`;
      content += `Metode    : ${receiptData.paymentMethod || "CASH"}\n`;

      if (receiptData.paymentMethod === "CASH") {
        content += `Tunai     : ${formatRupiah(receiptData.cashTendered || receiptData.totalAmount)}\n`;
        content += `Kembali   : ${formatRupiah(receiptData.changeAmount || 0)}\n`;
      }

      content += `================================\n`;
      content += `  Terima Kasih Atas Kunjungan Anda!\n`;
      content += `================================\n`;

      await Share.share({
        message: content,
        title: `Struk Transaksi ${receiptData.invoiceNumber}`,
      });
    } catch (error: any) {
      Alert.alert("Gagal Berbagi", error.message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.65)",
          padding: isSmallScreen ? 10 : 20,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 400,
            backgroundColor: "#ffffff",
            borderRadius: 24,
            padding: isSmallScreen ? 14 : 20,
            maxHeight: "95%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          {/* Scrollable Container */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            {/* Success Check Icon matching screenshot 170920 */}
            <View style={{ alignItems: "center", marginBottom: 10 }}>
              <View
                style={{
                  width: isSmallScreen ? 40 : 48,
                  height: isSmallScreen ? 40 : 48,
                  borderRadius: 24,
                  backgroundColor: "#ecfeff",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 4,
                }}
              >
                <CheckCircle2 size={isSmallScreen ? 24 : 28} color="#0097A7" />
              </View>
              <Text style={{ fontSize: isSmallScreen ? 15 : 16, fontWeight: "800", color: "#18181b" }}>
                Transaksi Berhasil!
              </Text>
              <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>
                Struk 58mm siap dicetak via Bluetooth
              </Text>
            </View>

            {/* Thermal Paper Preview Area (32 Char Simulation) */}
            <View
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: 16,
                padding: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                maxHeight: isSmallScreen ? 220 : 280,
              }}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Store Info */}
                <Text style={{ textAlign: "center", fontSize: 12, fontWeight: "800", color: "#18181b" }}>
                  {(receiptData.storeName || "POS OFFLINE PRO").toUpperCase()}
                </Text>
                <Text style={{ textAlign: "center", fontSize: 10, color: "#71717a" }}>
                  {receiptData.storeAddress}
                </Text>
                <Text style={{ textAlign: "center", fontSize: 10, color: "#71717a" }}>
                  Telp: {receiptData.storePhone}
                </Text>

                <View style={{ borderBottomWidth: 1, borderBottomColor: "#d4d4d8", marginVertical: 6, borderStyle: "dashed" }} />

                {/* Meta */}
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 10, fontFamily: "monospace", color: "#71717a" }}>No. Struk:</Text>
                  <Text style={{ fontSize: 10, fontFamily: "monospace", fontWeight: "700", color: "#18181b" }}>
                    {receiptData.invoiceNumber}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 10, fontFamily: "monospace", color: "#71717a" }}>Waktu:</Text>
                  <Text style={{ fontSize: 10, fontFamily: "monospace", color: "#71717a" }}>
                    {receiptData.date}
                  </Text>
                </View>

                <View style={{ borderBottomWidth: 1, borderBottomColor: "#d4d4d8", marginVertical: 6, borderStyle: "dashed" }} />

                {/* Item List */}
                {receiptData.items.map((item, idx) => (
                  <View key={idx} style={{ marginBottom: 3 }}>
                    <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: "700", color: "#18181b" }}>
                      {item.name}
                    </Text>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 10, fontFamily: "monospace", color: "#71717a" }}>
                        {item.qty} {item.unit || "pcs"} x {formatRupiah(item.price)}
                      </Text>
                      <Text style={{ fontSize: 10, fontFamily: "monospace", fontWeight: "700", color: "#18181b" }}>
                        {formatRupiah(item.subtotal)}
                      </Text>
                    </View>
                  </View>
                ))}

                <View style={{ borderBottomWidth: 1, borderBottomColor: "#d4d4d8", marginVertical: 6, borderStyle: "dashed" }} />

                {/* Totals */}
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 10, fontFamily: "monospace", color: "#71717a" }}>Subtotal:</Text>
                  <Text style={{ fontSize: 10, fontFamily: "monospace", color: "#18181b" }}>
                    {formatRupiah(receiptData.subtotalBeforeTax || receiptData.totalAmount)}
                  </Text>
                </View>

                {receiptData.ppnAmount && receiptData.ppnAmount > 0 ? (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 10, fontFamily: "monospace", color: "#71717a" }}>
                      PPN {receiptData.ppnPercent}%:
                    </Text>
                    <Text style={{ fontSize: 10, fontFamily: "monospace", color: "#18181b" }}>
                      {formatRupiah(receiptData.ppnAmount)}
                    </Text>
                  </View>
                ) : null}

                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
                  <Text style={{ fontSize: 12, fontFamily: "monospace", fontWeight: "800", color: "#18181b" }}>TOTAL:</Text>
                  <Text style={{ fontSize: 12, fontFamily: "monospace", fontWeight: "900", color: "#0097A7" }}>
                    {formatRupiah(receiptData.totalAmount)}
                  </Text>
                </View>

                {receiptData.paymentMethod === "CASH" && (
                  <>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
                      <Text style={{ fontSize: 10, fontFamily: "monospace", color: "#71717a" }}>Bayar Tunai:</Text>
                      <Text style={{ fontSize: 10, fontFamily: "monospace", color: "#18181b" }}>
                        {formatRupiah(receiptData.cashTendered || receiptData.totalAmount)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 10, fontFamily: "monospace", color: "#71717a" }}>Kembali:</Text>
                      <Text style={{ fontSize: 10, fontFamily: "monospace", fontWeight: "700", color: "#16a34a" }}>
                        {formatRupiah(receiptData.changeAmount || 0)}
                      </Text>
                    </View>
                  </>
                )}

                <View style={{ borderBottomWidth: 1, borderBottomColor: "#d4d4d8", marginVertical: 6, borderStyle: "dashed" }} />
                <Text style={{ textAlign: "center", fontSize: 9, color: "#71717a" }}>
                  Terima Kasih Atas Kunjungan Anda
                </Text>
              </ScrollView>
            </View>

            {/* Action Buttons matching screenshot 170920 */}
            <View style={{ flexDirection: "row", marginTop: 10, gap: 6 }}>
              <TouchableOpacity
                onPress={handlePrint}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: isSmallScreen ? 10 : 12,
                  borderRadius: 12,
                  backgroundColor: "#0097A7",
                }}
              >
                <Printer size={15} color="#ffffff" />
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff", marginLeft: 6 }}>
                  Cetak Struk
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShare}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: isSmallScreen ? 10 : 12,
                  borderRadius: 12,
                  backgroundColor: "#f4f4f5",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#e4e4e7",
                }}
              >
                <Share2 size={15} color="#52525b" />
              </TouchableOpacity>
            </View>

            {/* New Transaction Button */}
            <TouchableOpacity
              onPress={onNewTransaction}
              activeOpacity={0.8}
              style={{
                paddingVertical: isSmallScreen ? 10 : 12,
                borderRadius: 12,
                backgroundColor: "#f4f4f5",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 6,
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
