import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ReceiptModal } from "@/components/ReceiptModal";
import { Transaction } from "@/db";
import {
  getAllTransactions,
  getTransactionDetailsWithProducts,
  getTransactionsSummary,
} from "@/db/transactionRepository";
import { getSetting } from "@/db/settingsRepository";
import { ReceiptData } from "@/util/printerService";
import { formatRupiah, formatDateTime } from "@/util/formatters";
import {
  Receipt,
  Printer,
  Calendar,
  CreditCard,
  Banknote,
  TrendingUp,
  Inbox,
} from "lucide-react-native";

export default function HistoryScreen() {
  const [filterPeriod, setFilterPeriod] = useState<"today" | "week" | "month">("today");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({ totalOmset: 0, totalLaba: 0 });

  // Store profile
  const [storeName, setStoreName] = useState("POS Offline Pro");
  const [storeAddress, setStoreAddress] = useState("Jl. Alamat No 99 Makassar");
  const [storePhone, setStorePhone] = useState("08111111111");

  // Receipt Modal for Re-printing
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await getAllTransactions();
      setTransactions(data);

      const sum = await getTransactionsSummary();
      setSummary({
        totalOmset: sum.totalOmset,
        totalLaba: sum.totalLaba,
      });

      const sName = await getSetting("store_name", "POS Offline Pro");
      const sAddr = await getSetting("store_address", "Jl. Alamat No 99 Makassar");
      const sPhone = await getSetting("store_phone", "08111111111");
      setStoreName(sName);
      setStoreAddress(sAddr);
      setStorePhone(sPhone);
    } catch (err) {
      console.error("Gagal load riwayat:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const handlePrintReceipt = async (trx: Transaction) => {
    try {
      const details = await getTransactionDetailsWithProducts(trx.id);
      const receiptData: ReceiptData = {
        invoiceNumber: trx.invoice_no || trx.id,
        date: new Date(trx.created_at).toLocaleString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        storeName: storeName,
        storeAddress: storeAddress,
        storePhone: storePhone,
        items: details.map((d) => ({
          name: d.product_name || "Produk",
          qty: d.qty,
          price: d.harga_jual || (d.qty > 0 ? d.subtotal / d.qty : 0),
          subtotal: d.subtotal,
          unit: d.unit || "pcs",
        })),
        totalAmount: trx.omset,
        subtotalBeforeTax: trx.subtotal_before_tax,
        ppnPercent: trx.ppn_percent,
        ppnAmount: trx.ppn_amount,
        cashTendered: trx.cash_tendered || trx.omset,
        changeAmount: trx.change_amount || 0,
        paymentMethod: trx.payment_method || "CASH",
        cashierName: "Kasir 1",
      };
      setSelectedReceipt(receiptData);
      setReceiptModalVisible(true);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Gagal memuat struk.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9F7F4] dark:bg-zinc-950">
      <View className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800">
        <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Riwayat Transaksi
        </Text>
        <Text className="text-xs text-zinc-400">
          Daftar Struk Penjualan & Cetak Ulang (58mm)
        </Text>
      </View>

      {/* Transaction List */}
      <ScrollView
        className="flex-1 px-4 pt-3"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Daftar Struk ({transactions.length})
          </Text>
          <Text className="text-xs text-zinc-400">
            Total Omset: {formatRupiah(summary.totalOmset)}
          </Text>
        </View>

        {loading ? (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color="#0097A7" />
          </View>
        ) : transactions.length === 0 ? (
          <View className="py-16 items-center justify-center px-4">
            <Inbox size={36} color="#9ca3af" />
            <Text className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-2 mb-1">
              Belum Ada Transaksi
            </Text>
            <Text className="text-xs text-zinc-400 text-center">
              Transaksi kasir yang telah selesai akan otomatis tercatat di sini dan tersimpan di database SQLite lokal.
            </Text>
          </View>
        ) : (
          transactions.map((trx) => (
            <View
              key={trx.id}
              className="mb-3 p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm"
            >
              {/* Header Struk: Invoice & Method */}
              <View className="flex-row items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
                <View className="flex-row items-center">
                  <Receipt size={15} color="#0097A7" />
                  <Text className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 ml-1.5">
                    {trx.invoice_no || trx.id}
                  </Text>
                </View>
                <View className="px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/40">
                  <Text className="text-[10px] font-bold text-[#0097A7]">
                    {trx.payment_method || "CASH"}
                  </Text>
                </View>
              </View>

              {/* Body Struk */}
              <View className="py-2 flex-row items-center justify-between">
                <Text className="text-[11px] text-zinc-400">
                  {new Date(trx.created_at).toLocaleString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                {trx.ppn_amount && trx.ppn_amount > 0 ? (
                  <Text className="text-[10px] text-zinc-400 font-mono">
                    PPN {trx.ppn_percent}%: {formatRupiah(trx.ppn_amount)}
                  </Text>
                ) : null}
              </View>

              {/* Financial Breakdown & Print Button */}
              <View className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex-row items-center justify-between">
                <View>
                  <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    {formatRupiah(trx.omset)}
                  </Text>
                  <Text className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    Laba: +{formatRupiah(trx.laba_kotor)}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handlePrintReceipt(trx)}
                  activeOpacity={0.7}
                  className="flex-row items-center px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm"
                >
                  <Printer size={13} color="#0097A7" />
                  <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-200 ml-1.5">
                    Cetak 58mm
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Re-print Receipt Modal */}
      <ReceiptModal
        visible={receiptModalVisible}
        receiptData={selectedReceipt}
        onClose={() => setReceiptModalVisible(false)}
        onNewTransaction={() => setReceiptModalVisible(false)}
      />
    </SafeAreaView>
  );
}
