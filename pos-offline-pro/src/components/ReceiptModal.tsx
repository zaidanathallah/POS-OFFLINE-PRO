import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { ReceiptData, PrinterService } from "@/util/printerService";
import { formatRupiah } from "@/util/formatters";
import { CheckCircle2, Printer, Check } from "lucide-react-native";

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
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPreviewPaper, setShowPreviewPaper] = useState(false);

  if (!receiptData) return null;

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const res = await PrinterService.printReceipt(receiptData);
      if (res.success) {
        Alert.alert("Sukses", "Struk berhasil dicetak ke Printer Thermal Bluetooth.");
      } else {
        Alert.alert("Info", res.message || "Gagal mencetak struk.");
      }
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/60 px-5">
        {/* Success Modal Card matching screenshot 170920 */}
        <View className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-100 dark:border-zinc-800 items-center">
          {/* Green Checkmark Circle */}
          <View className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 items-center justify-center mb-3">
            <CheckCircle2 size={36} color="#16a34a" />
          </View>

          <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Sukses
          </Text>
          <Text className="text-xs text-zinc-400 mt-0.5 mb-5 text-center">
            Struk berhasil dicetak & transaksi tersimpan
          </Text>

          {/* Toggle Receipt Preview */}
          <TouchableOpacity
            onPress={() => setShowPreviewPaper(!showPreviewPaper)}
            className="mb-4"
          >
            <Text className="text-xs font-semibold text-[#0097A7]">
              {showPreviewPaper ? "Tutup Preview Struk" : "Lihat Format Struk (58mm)"}
            </Text>
          </TouchableOpacity>

          {/* Struk Paper Preview */}
          {showPreviewPaper && (
            <ScrollView className="max-h-60 w-full mb-4 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 font-mono">
              <Text className="text-center font-bold text-xs text-zinc-800 dark:text-zinc-200">
                {receiptData.storeName || "POS Offline Pro"}
              </Text>
              <Text className="text-center text-[10px] text-zinc-400">
                {receiptData.businessType || "Jenis toko"}
              </Text>
              <Text className="text-center text-[10px] text-zinc-400">
                {receiptData.storeAddress}
              </Text>
              <Text className="text-center text-[10px] text-zinc-400">
                {receiptData.storePhone}
              </Text>

              <Text className="text-center text-zinc-400 text-xs my-1">
                --------------------------------
              </Text>
              <Text className="text-center text-[10px] text-zinc-600 dark:text-zinc-400 font-mono">
                {receiptData.invoiceNumber}
              </Text>
              <Text className="text-center text-[10px] text-zinc-600 dark:text-zinc-400 font-mono">
                {receiptData.date}
              </Text>
              <Text className="text-center text-zinc-400 text-xs my-1">
                --------------------------------
              </Text>

              {receiptData.items.map((item, idx) => (
                <View key={idx} className="my-1">
                  <View className="flex-row justify-between">
                    <Text className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      {item.name}
                    </Text>
                    <Text className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                      {item.unit === "kg" ? `${item.qty} kg` : `${item.qty}x`}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-[10px] text-zinc-400 font-mono">
                      Rp {item.price.toLocaleString("id-ID")}{item.unit === "kg" ? "/kg" : ""}
                    </Text>
                    <Text className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                      Rp {item.subtotal.toLocaleString("id-ID")}
                    </Text>
                  </View>
                </View>
              ))}

              <Text className="text-center text-zinc-400 text-xs my-1">
                --------------------------------
              </Text>

              {receiptData.subtotalBeforeTax !== undefined && (
                <View className="flex-row justify-between">
                  <Text className="text-[10px] text-zinc-500 font-mono">Subtotal</Text>
                  <Text className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300">
                    Rp {receiptData.subtotalBeforeTax.toLocaleString("id-ID")}
                  </Text>
                </View>
              )}

              {receiptData.ppnAmount !== undefined && receiptData.ppnAmount > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-[10px] text-zinc-500 font-mono">
                    PPN {receiptData.ppnPercent || 11}%
                  </Text>
                  <Text className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300">
                    Rp {receiptData.ppnAmount.toLocaleString("id-ID")}
                  </Text>
                </View>
              )}

              <View className="flex-row justify-between mt-0.5">
                <Text className="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono">Total</Text>
                <Text className="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                  Rp {receiptData.totalAmount.toLocaleString("id-ID")}
                </Text>
              </View>

              <View className="flex-row justify-between mt-0.5">
                <Text className="text-[10px] text-zinc-500 font-mono">Tunai</Text>
                <Text className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300">
                  Rp {receiptData.cashTendered.toLocaleString("id-ID")}
                </Text>
              </View>

              {receiptData.changeAmount > 0 && (
                <View className="flex-row justify-between mt-0.5">
                  <Text className="text-[10px] text-zinc-500 font-mono">Kembalian</Text>
                  <Text className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300">
                    Rp {receiptData.changeAmount.toLocaleString("id-ID")}
                  </Text>
                </View>
              )}

              <Text className="text-center text-zinc-400 text-xs my-1">
                ================================
              </Text>
              <Text className="text-center text-[10px] text-zinc-500">Terima Kasih!</Text>
              <Text className="text-center text-[10px] text-zinc-500 mb-2">Silahkan Datang Kembali</Text>
            </ScrollView>
          )}

          {/* Action Buttons matching screenshot 170920 */}
          <View className="flex-row space-x-3 w-full">
            <TouchableOpacity
              onPress={handlePrint}
              activeOpacity={0.7}
              className="flex-1 py-3 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 items-center justify-center mr-2 shadow-sm"
            >
              <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                Cetak Struk
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNewTransaction}
              activeOpacity={0.8}
              className="flex-1 py-3 rounded-2xl bg-[#0097A7] items-center justify-center ml-2 shadow-sm"
            >
              <Text className="text-xs font-bold text-white">
                Selesai
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
