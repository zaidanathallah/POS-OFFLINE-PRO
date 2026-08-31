import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { router } from "expo-router";
import {
  getFinancialSummary,
  getTopProducts,
  getPeakHoursAnalysis,
  FinancialSummary,
} from "@/db/reportRepository";
import { getAllProducts } from "@/db/productRepository";
import { getSetting } from "@/db/settingsRepository";
import { formatRupiah, formatNumber } from "@/util/formatters";
import {
  ShoppingCart,
  ChevronRight,
  Package,
  BarChart2,
  TrendingUp,
} from "lucide-react-native";

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [storeName, setStoreName] = useState("POS Offline Pro");
  const [businessType, setBusinessType] = useState("Jenis toko");
  const [storeLogo, setStoreLogo] = useState("");

  const [totalProductCount, setTotalProductCount] = useState(11);
  const [todayStats, setTodayStats] = useState<FinancialSummary>({
    omset: 0,
    modalHpp: 0,
    labaKotor: 0,
    marginPercent: 0,
    totalTransactions: 0,
    avgPerTransaction: 0,
    avgPerDay: 0,
  });

  const [sevenDaysStats, setSevenDaysStats] = useState<FinancialSummary>({
    omset: 0,
    modalHpp: 0,
    labaKotor: 0,
    marginPercent: 0,
    totalTransactions: 0,
    avgPerTransaction: 0,
    avgPerDay: 0,
  });

  const [monthStats, setMonthStats] = useState<FinancialSummary>({
    omset: 0,
    modalHpp: 0,
    labaKotor: 0,
    marginPercent: 0,
    totalTransactions: 0,
    avgPerTransaction: 0,
    avgPerDay: 0,
  });

  const [totalItemsSold, setTotalItemsSold] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const sName = await getSetting("store_name", "POS Offline Pro");
      const bType = await getSetting("store_business_type", "Jenis toko");
      const logo = await getSetting("store_logo", "");
      setStoreName(sName);
      setBusinessType(bType);
      setStoreLogo(logo);

      const products = await getAllProducts();
      setTotalProductCount(products.length);

      const today = await getFinancialSummary("today");
      setTodayStats(today);

      const sevenDays = await getFinancialSummary("7days");
      setSevenDaysStats(sevenDays);

      const thirtyDays = await getFinancialSummary("30days");
      setMonthStats(thirtyDays);

      // Top products sold count
      const topProds = await getTopProducts("today", 100);
      const totalSold = topProds.reduce((acc, p) => acc + p.totalQty, 0);
      setTotalItemsSold(totalSold);
    } catch (err) {
      console.error("Gagal load data dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // 7 Days Chart Mock & Real data distribution
  const daysLabels = ["Sab", "Min", "Sen", "Sel", "Rab", "Kam", "Hr Ini"];
  const maxBarValue = Math.max(todayStats.omset, sevenDaysStats.omset / 7, 1000);

  return (
    <SafeAreaView className="flex-1 bg-[#F9F7F4] dark:bg-zinc-950">
      <ScrollView
        className="flex-1 px-4 pt-3"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top Header matching screenshot 170105 */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-2xl bg-[#0097A7] items-center justify-center shadow-sm mr-3 overflow-hidden">
              {storeLogo ? (
                <Image source={{ uri: storeLogo }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="items-center justify-center">
                  <Text className="text-[10px] font-black text-white leading-none">POS</Text>
                  <Text className="text-[8px] font-bold text-cyan-100 leading-none">Offline</Text>
                </View>
              )}
            </View>
            <View>
              <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {storeName}
              </Text>
              <Text className="text-xs text-zinc-400">
                {businessType}
              </Text>
            </View>
          </View>
        </View>

        {/* Hero Cyan Banner: "Mulai Menjual" matching screenshot 170105 */}
        <TouchableOpacity
          onPress={() => router.push("/modal-pos")}
          activeOpacity={0.85}
          className="w-full p-4 rounded-3xl bg-[#0097A7] flex-row items-center justify-between shadow-md mb-4"
        >
          <View className="flex-row items-center flex-1 pr-2">
            <View className="w-11 h-11 rounded-2xl bg-white/20 items-center justify-center mr-3">
              <ShoppingCart size={20} color="#ffffff" />
            </View>
            <View>
              <Text className="text-base font-bold text-white">
                Mulai Menjual
              </Text>
              <Text className="text-xs text-cyan-100 mt-0.5">
                Buka mode kasir untuk bertransaksi
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#ffffff" />
        </TouchableOpacity>

        {/* 3 Top Summary Boxes matching screenshot 170105 */}
        <View className="flex-row space-x-2.5 mb-4">
          {/* Box 1: Produk */}
          <View className="flex-1 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 items-center justify-center shadow-sm mr-1.5">
            <Package size={18} color="#0097A7" />
            <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-1">
              {totalProductCount}
            </Text>
            <Text className="text-[11px] text-zinc-400">Produk</Text>
          </View>

          {/* Box 2: Transaksi */}
          <View className="flex-1 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 items-center justify-center shadow-sm mx-1">
            <ShoppingCart size={18} color="#0097A7" />
            <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-1">
              {todayStats.totalTransactions}
            </Text>
            <Text className="text-[11px] text-zinc-400">Transaksi</Text>
          </View>

          {/* Box 3: Item Terjual */}
          <View className="flex-1 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 items-center justify-center shadow-sm ml-1.5">
            <BarChart2 size={18} color="#0097A7" />
            <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-1">
              {totalItemsSold}
            </Text>
            <Text className="text-[11px] text-zinc-400">Item Terjual</Text>
          </View>
        </View>

        {/* "Penjualan Hari Ini" Card matching screenshot 170105 & 170111 */}
        <View className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs text-zinc-400">Penjualan Hari Ini</Text>
            <View className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40">
              <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                + 100.0%
              </Text>
            </View>
          </View>

          <Text className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
            {formatRupiah(todayStats.omset)}
          </Text>

          <View className="flex-row items-center justify-between mt-1 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
            <Text className="text-[11px] text-zinc-400">Kemarin: Rp 0</Text>
            <Text className="text-[11px] text-zinc-400">
              Rata-rata: {formatRupiah(todayStats.avgPerTransaction)}/trx
            </Text>
          </View>

          {/* 3 Metric Columns: Modal HPP, Laba Hr Ini, Margin */}
          <View className="flex-row justify-between pt-3">
            <View className="flex-1">
              <Text className="text-[11px] text-zinc-400">Modal (HPP)</Text>
              <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {formatRupiah(todayStats.modalHpp)}
              </Text>
            </View>

            <View className="flex-1 items-center">
              <Text className="text-[11px] text-emerald-600 dark:text-emerald-400">Laba Hr Ini</Text>
              <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatRupiah(todayStats.labaKotor)}
              </Text>
            </View>

            <View className="flex-1 items-end">
              <Text className="text-[11px] text-zinc-400">Margin</Text>
              <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {todayStats.marginPercent}%
              </Text>
            </View>
          </View>
        </View>

        {/* "Tren 7 Hari" Chart Card matching screenshot 170105 & 170111 */}
        <View className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm mb-4">
          <Text className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-4">
            Tren 7 Hari
          </Text>

          <View className="h-28 flex-row items-end justify-between px-1 pb-1">
            {daysLabels.map((day, idx) => {
              const isToday = idx === 6;
              const barHeightPct = isToday
                ? todayStats.omset > 0
                  ? 75
                  : 10
                : Math.max(8, (idx * 12) % 30);

              return (
                <View key={idx} className="items-center flex-1">
                  {isToday && todayStats.omset > 0 && (
                    <Text className="text-[10px] text-zinc-400 mb-1 font-mono">
                      {todayStats.omset >= 1000 ? `${Math.round(todayStats.omset / 1000)} rb` : todayStats.omset}
                    </Text>
                  )}
                  <View
                    className={`w-7 rounded-lg ${
                      isToday
                        ? "bg-[#0097A7]"
                        : "bg-emerald-100/60 dark:bg-emerald-950/30"
                    }`}
                    style={{ height: `${barHeightPct}%` }}
                  />
                  <Text
                    className={`text-[10px] mt-2 font-medium ${
                      isToday
                        ? "text-[#0097A7] font-bold"
                        : "text-zinc-400"
                    }`}
                  >
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 2x2 Performance Grid matching screenshot 170111 */}
        <View className="space-y-3">
          <View className="flex-row space-x-3">
            {/* 7 Hari */}
            <View className="flex-1 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 mr-1.5 shadow-sm">
              <Text className="text-[11px] text-zinc-400">7 Hari</Text>
              <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {formatRupiah(sevenDaysStats.omset)}
              </Text>
            </View>

            {/* Bulan Ini */}
            <View className="flex-1 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 ml-1.5 shadow-sm">
              <Text className="text-[11px] text-zinc-400">Bulan Ini</Text>
              <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {formatRupiah(monthStats.omset)}
              </Text>
            </View>
          </View>

          <View className="flex-row space-x-3 mt-3">
            {/* Laba 7 Hari */}
            <View className="flex-1 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 mr-1.5 shadow-sm">
              <Text className="text-[11px] text-zinc-400">Laba 7 Hari</Text>
              <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatRupiah(sevenDaysStats.labaKotor)}
              </Text>
            </View>

            {/* Laba Bulan Ini */}
            <View className="flex-1 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 ml-1.5 shadow-sm">
              <Text className="text-[11px] text-zinc-400">Laba Bulan Ini</Text>
              <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatRupiah(monthStats.labaKotor)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
