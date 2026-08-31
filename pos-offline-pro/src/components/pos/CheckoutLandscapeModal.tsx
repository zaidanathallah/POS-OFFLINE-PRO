import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { CartItem } from "@/stores/useCartStore";
import { formatRupiah } from "@/util/formatters";
import { ArrowLeft, CreditCard, CheckCircle2 } from "lucide-react-native";

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
  ) => void;
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
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  const [typedAmount, setTypedAmount] = useState<string>("0");

  useEffect(() => {
    if (visible) {
      setPaymentMethod("CASH");
      setTypedAmount("0");
    }
  }, [visible]);

  const cashTendered = paymentMethod === "CASH" ? Number(typedAmount) || 0 : grandTotal;
  const changeAmount = Math.max(0, cashTendered - grandTotal);
  const isSufficient = cashTendered >= grandTotal;

  // Keypad Handlers
  const handleDigit = (digit: string) => {
    if (typedAmount === "0") {
      setTypedAmount(digit);
    } else if (typedAmount.length < 10) {
      setTypedAmount(typedAmount + digit);
    }
  };

  const handleClear = () => {
    setTypedAmount("0");
  };

  const handleExactAmount = () => {
    setTypedAmount(String(grandTotal));
  };

  const handleQuickNominal = (amount: number) => {
    setTypedAmount(String(amount));
  };

  const handleConfirm = () => {
    if (paymentMethod === "CASH" && cashTendered < grandTotal) {
      Alert.alert(
        "Pembayaran Kurang",
        `Jumlah uang tunai yang dimasukkan (${formatRupiah(cashTendered)}) kurang dari total belanja (${formatRupiah(grandTotal)}).`
      );
      return;
    }
    onConfirmPayment(paymentMethod, cashTendered, changeAmount);
  };

  const quickNominals = [100000, 50000, 20000, 10000, 5000];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-white dark:bg-zinc-950 flex-row">
        {/* Left Side: Order Summary matching screenshot 170515 */}
        <View className="w-1/2 p-6 border-r border-zinc-200 dark:border-zinc-800 flex-col justify-between bg-zinc-50/70 dark:bg-zinc-900/50">
          <View className="flex-1">
            {/* Back Button */}
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="flex-row items-center mb-4"
            >
              <ArrowLeft size={17} color="#0097A7" />
              <Text className="text-sm font-bold text-[#0097A7] ml-1.5">
                Kembali
              </Text>
            </TouchableOpacity>

            <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-3">
              Ringkasan Pesanan
            </Text>

            {/* Table Header */}
            <View className="flex-row items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <Text className="text-[11px] font-semibold text-zinc-400 w-1/2">
                Produk
              </Text>
              <Text className="text-[11px] font-semibold text-zinc-400 text-center w-1/4">
                Qty
              </Text>
              <Text className="text-[11px] font-semibold text-zinc-400 text-right w-1/4">
                Subtotal
              </Text>
            </View>

            {/* Items List */}
            <ScrollView className="flex-1 mt-1" showsVerticalScrollIndicator={false}>
              {items.map((item) => (
                <View
                  key={item.id}
                  className="flex-row items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/50"
                >
                  <View className="w-1/2 pr-1">
                    <Text
                      className="text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                      numberOfLines={1}
                    >
                      {item.product.name}
                      {item.variant ? ` (${item.variant.name})` : ""}
                    </Text>
                    <Text className="text-[10px] text-zinc-400">
                      {formatRupiah(item.unitPrice)}
                      {item.unit === "kg" ? "/kg" : ""}
                    </Text>
                  </View>

                  <Text className="text-xs text-zinc-600 dark:text-zinc-400 text-center w-1/4">
                    {item.qty} {item.unit}
                  </Text>

                  <Text className="text-xs font-bold text-zinc-900 dark:text-zinc-100 text-right w-1/4">
                    {formatRupiah(item.subtotal)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Totals Section matching screenshot 170515 */}
          <View className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs text-zinc-500 dark:text-zinc-400">Subtotal</Text>
              <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {formatRupiah(subtotal)}
              </Text>
            </View>

            {ppnAmount > 0 && (
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                  PPN {ppnPercent}%
                </Text>
                <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatRupiah(ppnAmount)}
                </Text>
              </View>
            )}

            <View className="flex-row items-center justify-between pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-700">
              <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Grand Total
              </Text>
              <Text className="text-xl font-extrabold text-[#16a34a]">
                {formatRupiah(grandTotal)}
              </Text>
            </View>
          </View>
        </View>

        {/* Right Side: Payment Methods & Keypad matching screenshot 170515 & 170857 */}
        <View className="w-1/2 p-6 flex-col justify-between bg-white dark:bg-zinc-950">
          <View>
            <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-3">
              Pembayaran
            </Text>

            {/* Method Tabs */}
            <View className="flex-row p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl mb-4">
              <TouchableOpacity
                onPress={() => setPaymentMethod("CASH")}
                activeOpacity={0.8}
                className={`flex-1 py-2.5 rounded-lg items-center justify-center ${
                  paymentMethod === "CASH" ? "bg-[#0097A7] shadow-sm" : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    paymentMethod === "CASH" ? "text-white" : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  Tunai
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPaymentMethod("QRIS")}
                activeOpacity={0.8}
                className={`flex-1 py-2.5 rounded-lg items-center justify-center ${
                  paymentMethod === "QRIS" ? "bg-[#0097A7] shadow-sm" : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    paymentMethod === "QRIS" ? "text-white" : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  QRIS
                </Text>
              </TouchableOpacity>
            </View>

            {paymentMethod === "CASH" ? (
              <>
                {/* Tendered Amount Input Box */}
                <View className="p-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                  <Text className="text-[11px] text-zinc-400">Jumlah Bayar</Text>
                  <Text className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-0.5">
                    {formatRupiah(Number(typedAmount) || 0)}
                  </Text>
                  {cashTendered >= grandTotal && (
                    <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      Kembalian: {formatRupiah(changeAmount)}
                    </Text>
                  )}
                </View>

                {/* Quick Amount Pills */}
                <View className="flex-row space-x-1.5 my-3">
                  {quickNominals.map((nom) => (
                    <TouchableOpacity
                      key={nom}
                      onPress={() => handleQuickNominal(nom)}
                      activeOpacity={0.7}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mr-1.5"
                    >
                      <Text className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                        {nom >= 1000 ? `${nom / 1000}rb` : nom}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Numeric Keypad Grid */}
                <View className="space-y-1.5">
                  <View className="flex-row space-x-1.5">
                    {["1", "2", "3"].map((d) => (
                      <TouchableOpacity
                        key={d}
                        onPress={() => handleDigit(d)}
                        className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 items-center justify-center mr-1.5"
                      >
                        <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100">{d}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View className="flex-row space-x-1.5 mt-1.5">
                    {["4", "5", "6"].map((d) => (
                      <TouchableOpacity
                        key={d}
                        onPress={() => handleDigit(d)}
                        className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 items-center justify-center mr-1.5"
                      >
                        <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100">{d}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View className="flex-row space-x-1.5 mt-1.5">
                    {["7", "8", "9"].map((d) => (
                      <TouchableOpacity
                        key={d}
                        onPress={() => handleDigit(d)}
                        className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 items-center justify-center mr-1.5"
                      >
                        <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100">{d}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View className="flex-row space-x-1.5 mt-1.5">
                    <TouchableOpacity
                      onPress={handleClear}
                      className="flex-1 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 items-center justify-center mr-1.5"
                    >
                      <Text className="text-base font-bold text-red-600">C</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDigit("0")}
                      className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 items-center justify-center mr-1.5"
                    >
                      <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100">0</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleExactAmount}
                      className="flex-1 py-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 items-center justify-center"
                    >
                      <Text className="text-xs font-bold text-[#0097A7]">Uang Pas</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              /* QRIS View matching screenshot 170857 */
              <View className="items-center justify-center py-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                {storeQrisImage ? (
                  <Image
                    source={{ uri: storeQrisImage }}
                    className="w-40 h-40 rounded-xl"
                    resizeMode="contain"
                  />
                ) : (
                  <View className="w-40 h-40 bg-white p-2 rounded-xl items-center justify-center border border-zinc-300">
                    <Image
                      source={{
                        uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020101021226600016ID.CO.QRIS.WWW011893600999000000000002150000000000000000520458125303360540${grandTotal}5802ID5915POS_OFFLINE_PRO6008JAKARTA6304`,
                      }}
                      className="w-36 h-36"
                    />
                  </View>
                )}
                <Text className="text-xs text-zinc-500 text-center mt-3 px-4">
                  Arahkan kamera aplikasi pembayaran pelanggan ke QRIS
                </Text>
              </View>
            )}
          </View>

          {/* Confirm Button matching screenshot 170515 & 170857 */}
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={paymentMethod === "CASH" && !isSufficient}
            activeOpacity={0.8}
            className={`py-3.5 rounded-2xl items-center justify-center mt-4 ${
              isSufficient || paymentMethod === "QRIS"
                ? "bg-[#0097A7] shadow-md"
                : "bg-zinc-200 dark:bg-zinc-800 opacity-60"
            }`}
          >
            <Text className="text-sm font-bold text-white">
              Konfirmasi & Bayar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
