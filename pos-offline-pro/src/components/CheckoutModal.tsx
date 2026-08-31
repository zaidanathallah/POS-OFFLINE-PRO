import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useCartStore } from "@/stores/useCartStore";
import { processCheckout, CheckoutResult } from "@/db/transactionRepository";
import { ReceiptData } from "@/util/printerService";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatRupiah, formatDateTime } from "@/util/formatters";
import {
  X,
  CreditCard,
  Banknote,
  TrendingUp,
  CheckCircle2,
  Receipt,
  Sparkles,
  DollarSign,
  Calculator,
} from "lucide-react-native";

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (receipt: ReceiptData) => void;
}

export function CheckoutModal({
  visible,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const {
    items,
    getTotalOmset,
    getTotalHpp,
    getTotalLabaKotor,
    clearCart,
  } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  const [cashTenderedStr, setCashTenderedStr] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const totalOmset = getTotalOmset();
  const totalHpp = getTotalHpp();
  const totalLaba = getTotalLabaKotor();
  const marginPercent = totalOmset > 0 ? ((totalLaba / totalOmset) * 100).toFixed(1) : "0.0";

  useEffect(() => {
    if (visible) {
      if (paymentMethod === "QRIS") {
        setCashTenderedStr(totalOmset.toString());
      } else {
        setCashTenderedStr("");
      }
    }
  }, [visible, paymentMethod, totalOmset]);

  const cashTendered = parseFloat(cashTenderedStr) || 0;
  const changeAmount = Math.max(0, cashTendered - totalOmset);
  const isShortOfCash = paymentMethod === "CASH" && cashTendered < totalOmset;

  // Quick Amount Handlers
  const handleQuickAmount = (amount: number) => {
    setCashTenderedStr(amount.toString());
  };

  const handleAddAmount = (extra: number) => {
    const current = parseFloat(cashTenderedStr) || 0;
    setCashTenderedStr((current + extra).toString());
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert("Perhatian", "Keranjang belanja kosong.");
      return;
    }

    if (paymentMethod === "CASH" && cashTendered < totalOmset) {
      Alert.alert("Nominal Kurang", "Uang yang diterima kurang dari total tagihan.");
      return;
    }

    setIsProcessing(true);
    try {
      const finalTendered = paymentMethod === "QRIS" ? totalOmset : cashTendered;
      const finalChange = paymentMethod === "QRIS" ? 0 : changeAmount;

      const result: CheckoutResult = await processCheckout({
        items,
        omset: totalOmset,
        total_hpp: totalHpp,
        laba_kotor: totalLaba,
        payment_method: paymentMethod,
        cash_tendered: finalTendered,
        change_amount: finalChange,
      });

      // Prepare Receipt Data
      const receipt: ReceiptData = {
        transactionId: result.transaction.id,
        date: formatDateTime(result.transaction.created_at),
        items: result.details.map((d) => ({
          name: d.product_name,
          qty: d.qty,
          price: d.harga_jual,
          subtotal: d.subtotal,
        })),
        totalOmset: result.transaction.omset,
        cashTendered: finalTendered,
        changeAmount: finalChange,
        paymentMethod,
        cashierName: "Kasir 1",
      };

      clearCart();
      onClose();
      onSuccess(receipt);
    } catch (error: any) {
      Alert.alert("Gagal Transaksi", error.message || "Terjadi kesalahan sistem.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="bg-white dark:bg-zinc-900 rounded-t-2xl max-h-[90%] overflow-hidden border-t border-zinc-200 dark:border-zinc-800"
        >
          {/* Header */}
          <View className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-row items-center justify-between">
            <View className="flex-row items-center space-x-2">
              <View className="w-8 h-8 rounded-lg bg-blue-500/10 items-center justify-center">
                <Calculator size={18} color="#3b82f6" />
              </View>
              <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50 ml-2">
                Pembayaran Transaksi
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full items-center justify-center bg-zinc-100 dark:bg-zinc-800"
            >
              <X size={16} color="#71717a" />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="px-5 py-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 25 }}
          >
            {/* Total Bill Card */}
            <Card className="mb-4 bg-zinc-900 dark:bg-zinc-950 border-blue-500/30 p-4">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs text-zinc-400">Total Tagihan (Omset)</Text>
                <Badge variant="success">Laba: {formatRupiah(totalLaba)} ({marginPercent}%)</Badge>
              </View>
              <Text className="text-3xl font-extrabold text-white tracking-tight">
                {formatRupiah(totalOmset)}
              </Text>
              <Text className="text-[11px] text-zinc-400 mt-1">
                {items.length} jenis item ({items.reduce((a, b) => a + b.qty, 0)} total pcs)
              </Text>
            </Card>

            {/* Payment Method Selector */}
            <View className="mb-4">
              <Text className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Pilih Metode Pembayaran
              </Text>
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  onPress={() => setPaymentMethod("CASH")}
                  className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-xl border transition-all mr-2 ${
                    paymentMethod === "CASH"
                      ? "bg-blue-600 border-blue-600"
                      : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                  }`}
                  activeOpacity={0.7}
                >
                  <Banknote
                    size={18}
                    color={paymentMethod === "CASH" ? "#ffffff" : "#71717a"}
                  />
                  <Text
                    className={`text-xs font-bold ml-2 ${
                      paymentMethod === "CASH" ? "text-white" : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    TUNAI (CASH)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setPaymentMethod("QRIS")}
                  className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-xl border transition-all ml-2 ${
                    paymentMethod === "QRIS"
                      ? "bg-blue-600 border-blue-600"
                      : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                  }`}
                  activeOpacity={0.7}
                >
                  <CreditCard
                    size={18}
                    color={paymentMethod === "QRIS" ? "#ffffff" : "#71717a"}
                  />
                  <Text
                    className={`text-xs font-bold ml-2 ${
                      paymentMethod === "QRIS" ? "text-white" : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    QRIS OFFLINE
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cash Input & Quick Buttons (When CASH selected) */}
            {paymentMethod === "CASH" && (
              <View className="mb-4">
                <Input
                  label="Uang Diterima (Rp) *"
                  placeholder="Masukkan nominal uang tunai..."
                  keyboardType="numeric"
                  value={cashTenderedStr}
                  onChangeText={setCashTenderedStr}
                />

                {/* Quick Nominal Buttons */}
                <View className="mt-2.5">
                  <Text className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Nominal Cepat:
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    <TouchableOpacity
                      onPress={() => handleQuickAmount(totalOmset)}
                      className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700"
                    >
                      <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        Uang Pas
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleQuickAmount(20000)}
                      className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700"
                    >
                      <Text className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        20.000
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleQuickAmount(50000)}
                      className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700"
                    >
                      <Text className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        50.000
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleQuickAmount(100000)}
                      className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700"
                    >
                      <Text className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        100.000
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleAddAmount(10000)}
                      className="bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        +10.000
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleAddAmount(50000)}
                      className="bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        +50.000
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Change Amount Box */}
                <Card className="mt-3.5 p-3.5 bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Kembalian Pelanggan:
                    </Text>
                    <Text
                      className={`text-lg font-bold ${
                        isShortOfCash
                          ? "text-red-500"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {isShortOfCash
                        ? `Kurang ${formatRupiah(totalOmset - cashTendered)}`
                        : formatRupiah(changeAmount)}
                    </Text>
                  </View>
                </Card>
              </View>
            )}

            {/* Submit Action */}
            <View className="mt-2">
              <Button
                variant="default"
                size="lg"
                loading={isProcessing}
                disabled={isShortOfCash}
                leftIcon={<CheckCircle2 size={18} color="#ffffff" />}
                onPress={handleCheckout}
              >
                {isShortOfCash ? "Nominal Uang Belum Cukup" : "Proses & Cetak Struk"}
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
