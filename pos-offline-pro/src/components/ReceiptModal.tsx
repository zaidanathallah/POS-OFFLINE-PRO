import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
} from "react-native";
import { ReceiptData, printBluetoothReceipt58mm } from "@/util/printerService";
import { formatRupiah } from "@/util/formatters";
import {
  Printer,
  Share2,
  CheckCircle2,
  X,
  PlusCircle,
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.65)", padding: 20 }}>
        <View
          style={{
            width: "100%",
            maxWidth: 380,
            backgroundColor: "#ffffff",
            borderRadius: 24,
            padding: 20,
            maxHeight: "92%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          {/* Success Check Icon matching screenshot 170920 */}
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#ecfeff",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 6,
              }}
            >
              <CheckCircle2 size={28} color="#0097A7" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#18181b" }}>
              Transaksi Berhasil!
            </Text>
            <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>
              Struk 58mm siap dicetak via Bluetooth
            </Text>
          </View>

          {/* Thermal Paper Preview Area (32 Char Simulation) */}
          <ScrollView
            style={{
              backgroundColor: "#f9fafb",
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              maxHeight: 280,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Store Info */}
            <Text style={{ textAlign: "center", fontSize: 13, fontWeight: "800", color: "#18181b" }}>
              {(receiptData.storeName || "POS OFFLINE PRO").toUpperCase()}
            </Text>
            <Text style={{ textAlign: "center", fontSize: 10, color: "#71717a" }}>
              {receiptData.storeAddress}
            </Text>
            <Text style={{ textAlign: "center", fontSize: 10, color: "#71717a" }}>
              Telp: {receiptData.storePhone}
            </Text>

            <View style={{ borderBottomWidth: 1, borderBottomColor: "#d4d4d8", marginVertical: 8, borderStyle: "dashed" }} />

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

            <View style={{ borderBottomWidth: 1, borderBottomColor: "#d4d4d8", marginVertical: 8, borderStyle: "dashed" }} />

            {/* Item List */}
            {receiptData.items.map((item, idx) => (
              <View key={idx} style={{ marginBottom: 4 }}>
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

            <View style={{ borderBottomWidth: 1, borderBottomColor: "#d4d4d8", marginVertical: 8, borderStyle: "dashed" }} />

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

            <View style={{ borderBottomWidth: 1, borderBottomColor: "#d4d4d8", marginVertical: 8, borderStyle: "dashed" }} />
            <Text style={{ textAlign: "center", fontSize: 9, color: "#71717a" }}>
              Terima Kasih Atas Kunjungan Anda
            </Text>
          </ScrollView>

          {/* Action Buttons matching screenshot 170920 */}
          <View style={{ flexDirection: "row", marginTop: 14, gap: 8 }}>
            <TouchableOpacity
              onPress={handlePrint}
              activeOpacity={0.8}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: "#0097A7",
              }}
            >
              <Printer size={16} color="#ffffff" />
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff", marginLeft: 6 }}>
                Cetak Struk
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: "#f4f4f5",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#e4e4e7",
              }}
            >
              <Share2 size={16} color="#52525b" />
            </TouchableOpacity>
          </View>

          {/* New Transaction Button */}
          <TouchableOpacity
            onPress={onNewTransaction}
            activeOpacity={0.8}
            style={{
              paddingVertical: 12,
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
        </View>
      </View>
    </Modal>
  );
}
