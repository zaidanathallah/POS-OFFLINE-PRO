import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ReceiptData, PrinterService } from "@/util/printerService";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatRupiah } from "@/util/formatters";
import {
  Printer,
  CheckCircle2,
  Share2,
  X,
  Sparkles,
  ShoppingBag,
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
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  useEffect(() => {
    if (visible) {
      setPrintSuccess(false);
    }
  }, [visible]);

  if (!receiptData) return null;

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const res = await PrinterService.printReceipt(receiptData);
      if (res.success) {
        setPrintSuccess(true);
        Alert.alert("Berhasil", "Struk 58mm berhasil dicetak ke Printer Thermal Bluetooth!");
      } else {
        Alert.alert("Gagal Mencetak", res.message || "Pastikan printer Bluetooth telah terhubung.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Gagal mencetak struk.");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/75 px-4">
        <View className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90%]">
          {/* Header */}
          <View className="px-5 py-3.5 bg-zinc-100 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700/60 flex-row items-center justify-between">
            <View className="flex-row items-center space-x-2">
              <CheckCircle2 size={18} color="#10b981" />
              <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50 ml-2">
                Transaksi Berhasil
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-7 h-7 rounded-full items-center justify-center bg-zinc-200 dark:bg-zinc-700"
            >
              <X size={14} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Thermal Receipt Paper UI (58mm Style) */}
          <ScrollView
            className="p-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 15 }}
          >
            <View className="bg-amber-50/60 dark:bg-zinc-950 p-4 rounded-xl border border-dashed border-amber-200 dark:border-zinc-800 font-mono">
              {/* Logo / Brand Header */}
              <View className="items-center mb-3">
                <Text className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  [ POS OFFLINE PRO 58MM ]
                </Text>
                <Text className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 text-center uppercase tracking-tight mt-1">
                  {receiptData.storeName || "Kopi & Eatery Nusantara"}
                </Text>
                {receiptData.storeAddress ? (
                  <Text className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center mt-0.5">
                    {receiptData.storeAddress}
                  </Text>
                ) : null}
                {receiptData.storePhone ? (
                  <Text className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center">
                    Telp: {receiptData.storePhone}
                  </Text>
                ) : null}
              </View>

              {/* Receipt Divider */}
              <Text className="text-zinc-400 text-center font-mono text-xs my-1">
                ================================
              </Text>

              {/* Metadata */}
              <View className="flex-row justify-between text-xs my-0.5">
                <Text className="text-[11px] font-mono text-zinc-500">
                  No: {receiptData.transactionId.slice(0, 16)}
                </Text>
                <Text className="text-[11px] font-mono text-zinc-500">
                  {receiptData.paymentMethod}
                </Text>
              </View>
              <View className="flex-row justify-between text-xs my-0.5 mb-2">
                <Text className="text-[11px] font-mono text-zinc-500">
                  {receiptData.date}
                </Text>
                <Text className="text-[11px] font-mono text-zinc-500">
                  Kasir: {receiptData.cashierName || "Kasir 1"}
                </Text>
              </View>

              <Text className="text-zinc-400 text-center font-mono text-xs my-1">
                --------------------------------
              </Text>

              {/* Items List */}
              <View className="my-1">
                {receiptData.items.map((item, idx) => (
                  <View key={idx} className="my-1">
                    <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {item.name}
                    </Text>
                    <View className="flex-row justify-between mt-0.5">
                      <Text className="text-[11px] font-mono text-zinc-500">
                        {item.qty} x {formatRupiah(item.price)}
                      </Text>
                      <Text className="text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        {formatRupiah(item.subtotal)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <Text className="text-zinc-400 text-center font-mono text-xs my-1">
                --------------------------------
              </Text>

              {/* Totals */}
              <View className="flex-row justify-between py-0.5">
                <Text className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  TOTAL OMSET:
                </Text>
                <Text className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                  {formatRupiah(receiptData.totalOmset)}
                </Text>
              </View>

              <View className="flex-row justify-between py-0.5">
                <Text className="text-xs text-zinc-600 dark:text-zinc-400">
                  BAYAR ({receiptData.paymentMethod}):
                </Text>
                <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatRupiah(receiptData.cashTendered)}
                </Text>
              </View>

              <View className="flex-row justify-between py-0.5">
                <Text className="text-xs text-zinc-600 dark:text-zinc-400">
                  KEMBALIAN:
                </Text>
                <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(receiptData.changeAmount)}
                </Text>
              </View>

              <Text className="text-zinc-400 text-center font-mono text-xs my-1.5">
                ================================
              </Text>

              {/* Footer */}
              <Text className="text-[10px] text-zinc-500 text-center mt-1">
                {receiptData.footerNote || "Terima Kasih Atas Kunjungan Anda"}
              </Text>
              <Text className="text-[9px] text-zinc-400 text-center mt-0.5">
                100% Pure Local Database Offline
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="mt-4 space-y-2">
              <Button
                variant="default"
                size="lg"
                loading={isPrinting}
                leftIcon={<Printer size={18} color="#ffffff" />}
                onPress={handlePrint}
              >
                {printSuccess ? "Cetak Ulang Struk (58mm)" : "Cetak Struk Bluetooth (58mm)"}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                leftIcon={<ShoppingBag size={18} color="#3b82f6" />}
                onPress={onNewTransaction}
              >
                Mulai Transaksi Baru
              </Button>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
