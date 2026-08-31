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
        transactionId: trx.id,
        date: formatDateTime(trx.created_at),
        items: details.map((d) => ({
          name: d.product_name || "Produk",
          qty: d.qty,
          price: d.harga_jual || d.subtotal / d.qty,
          subtotal: d.subtotal,
        })),
        totalOmset: trx.omset,
        cashTendered: trx.omset,
        changeAmount: 0,
        paymentMethod: "CASH",
        cashierName: "Kasir 1",
      };
      setSelectedReceipt(receiptData);
      setReceiptModalVisible(true);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Gagal memuat struk.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <Header
        title="Riwayat Transaksi"
        subtitle="Daftar Struk Penjualan & Cetak Ulang"
      />

      {/* Date Filter Tabs */}
      <View className="px-4 py-2.5 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/60">
        <View className="flex-row items-center justify-between bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
          <TouchableOpacity
            onPress={() => setFilterPeriod("today")}
            className={`flex-1 py-1.5 items-center rounded-lg ${
              filterPeriod === "today"
                ? "bg-white dark:bg-zinc-800 shadow-sm"
                : ""
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                filterPeriod === "today"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-500"
              }`}
            >
              Hari Ini
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterPeriod("week")}
            className={`flex-1 py-1.5 items-center rounded-lg ${
              filterPeriod === "week"
                ? "bg-white dark:bg-zinc-800 shadow-sm"
                : ""
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                filterPeriod === "week"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-500"
              }`}
            >
              7 Hari Terakhir
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterPeriod("month")}
            className={`flex-1 py-1.5 items-center rounded-lg ${
              filterPeriod === "month"
                ? "bg-white dark:bg-zinc-800 shadow-sm"
                : ""
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                filterPeriod === "month"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-500"
              }`}
            >
              Bulan Ini
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Summary Banner */}
        <View className="flex-row items-center justify-between mt-3 px-1">
          <View>
            <Text className="text-[11px] text-zinc-400">Total Penjualan</Text>
            <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {formatRupiah(summary.totalOmset)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Total Laba Bersih
            </Text>
            <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              +{formatRupiah(summary.totalLaba)}
            </Text>
          </View>
        </View>
      </View>

      {/* Transaction List */}
      <ScrollView
        className="flex-1 px-4 pt-3"
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Daftar Struk ({transactions.length})
          </Text>
        </View>

        {loading ? (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : transactions.length === 0 ? (
          <View className="py-16 items-center justify-center px-4">
            <View className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 items-center justify-center mb-3">
              <Inbox size={26} color="#71717a" />
            </View>
            <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Belum Ada Transaksi
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
              Transaksi kasir yang telah selesai akan otomatis tercatat di sini dan tersimpan di database SQLite lokal.
            </Text>
          </View>
        ) : (
          transactions.map((trx) => (
            <Card key={trx.id} className="mb-3 p-3.5">
              {/* Header Struk: ID & Status */}
              <View className="flex-row items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800/60">
                <View className="flex-row items-center space-x-2">
                  <Receipt size={15} color="#3b82f6" />
                  <Text className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 ml-1.5">
                    {trx.id}
                  </Text>
                </View>
                <Badge variant="secondary">
                  <View className="flex-row items-center">
                    <Banknote size={11} color="#71717a" />
                    <Text className="text-[10px] font-bold ml-1">
                      CASH / QRIS
                    </Text>
                  </View>
                </Badge>
              </View>

              {/* Body Struk */}
              <View className="py-2.5">
                <Text className="text-[11px] text-zinc-400">
                  {formatDateTime(trx.created_at)} WIB
                </Text>
              </View>

              {/* Financial Breakdown & Print Button */}
              <View className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex-row items-center justify-between">
                <View>
                  <Text className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {formatRupiah(trx.omset)}
                  </Text>
                  <Text className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    Laba: +{formatRupiah(trx.laba_kotor)}
                  </Text>
                </View>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Printer size={13} color="#a1a1aa" />}
                  onPress={() => handlePrintReceipt(trx)}
                >
                  Cetak 58mm
                </Button>
              </View>
            </Card>
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
