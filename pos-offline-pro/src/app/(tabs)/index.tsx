import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Header } from "@/components/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getFinancialSummary,
  getTopProducts,
  getPeakHoursAnalysis,
  ReportPeriod,
  FinancialSummary,
  TopProductItem,
  PeakHourItem,
} from "@/db/reportRepository";
import { formatRupiah, formatNumber } from "@/util/formatters";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Clock,
  ArrowUpRight,
  Plus,
  Receipt,
  Layers,
  Sparkles,
  Award,
  Calendar,
} from "lucide-react-native";
import { router } from "expo-router";

export default function DashboardScreen() {
  const [filterPeriod, setFilterPeriod] = useState<ReportPeriod>("today");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState<FinancialSummary>({
    omset: 0,
    modalHpp: 0,
    labaKotor: 0,
    marginPercent: 0,
    totalTransactions: 0,
    avgPerTransaction: 0,
    avgPerDay: 0,
  });

  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHourItem[]>([]);

  const loadDashboardData = useCallback(async () => {
    try {
      const [financialData, topData, peakData] = await Promise.all([
        getFinancialSummary(filterPeriod),
        getTopProducts(filterPeriod, 5),
        getPeakHoursAnalysis(filterPeriod),
      ]);

      setStats(financialData);
      setTopProducts(topData);
      setPeakHours(peakData);
    } catch (err) {
      console.error("Gagal load data dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterPeriod]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const peakHourRecord = peakHours.find((p) => p.isPeak);

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <Header
        title="POS Offline Pro"
        subtitle="Laporan Finansial & Analisis Penjualan"
      />

      <ScrollView
        className="flex-1 px-4 pt-3"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Filter Period Tabs */}
        <View className="flex-row items-center justify-between bg-zinc-200/70 dark:bg-zinc-900 p-1 rounded-xl mb-4">
          <TouchableOpacity
            onPress={() => setFilterPeriod("today")}
            className={`flex-1 py-2 items-center rounded-lg transition-all ${
              filterPeriod === "today"
                ? "bg-white dark:bg-zinc-800 shadow-sm"
                : ""
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                filterPeriod === "today"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              Hari Ini
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterPeriod("7days")}
            className={`flex-1 py-2 items-center rounded-lg transition-all ${
              filterPeriod === "7days"
                ? "bg-white dark:bg-zinc-800 shadow-sm"
                : ""
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                filterPeriod === "7days"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              7 Hari
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterPeriod("30days")}
            className={`flex-1 py-2 items-center rounded-lg transition-all ${
              filterPeriod === "30days"
                ? "bg-white dark:bg-zinc-800 shadow-sm"
                : ""
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                filterPeriod === "30days"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              30 Hari
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <>
            {/* Primary Stat Card: Total Omset, Modal (HPP), Laba Kotor */}
            <View className="mb-4">
              <Card className="border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-zinc-900/90 overflow-hidden">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center space-x-2">
                    <View className="w-8 h-8 rounded-lg bg-blue-500/20 items-center justify-center">
                      <DollarSign size={18} color="#3b82f6" />
                    </View>
                    <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-2">
                      Total Omset Penjualan
                    </Text>
                  </View>
                  <Badge variant="success">
                    <View className="flex-row items-center">
                      <TrendingUp size={11} color="#10b981" />
                      <Text className="text-[11px] font-bold text-emerald-500 ml-1">
                        Margin {stats.marginPercent}%
                      </Text>
                    </View>
                  </Badge>
                </View>

                <Text className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mb-4">
                  {formatRupiah(stats.omset)}
                </Text>

                {/* Split Breakdown: Modal HPP vs Laba Kotor */}
                <View className="pt-3 border-t border-zinc-200 dark:border-zinc-800/80 flex-row justify-between">
                  <View className="flex-1">
                    <Text className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">
                      Modal (HPP)
                    </Text>
                    <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {formatRupiah(stats.modalHpp)}
                    </Text>
                  </View>
                  <View className="h-full w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-3" />
                  <View className="flex-1">
                    <Text className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-0.5">
                      Laba Kotor
                    </Text>
                    <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(stats.labaKotor)}
                    </Text>
                  </View>
                </View>
              </Card>
            </View>

            {/* Secondary Stats Grid */}
            <View className="flex-row space-x-3 mb-4">
              <View className="flex-1 mr-2">
                <Card className="p-3.5">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                      Transaksi
                    </Text>
                    <ShoppingCart size={15} color="#3b82f6" />
                  </View>
                  <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {formatNumber(stats.totalTransactions)}
                  </Text>
                  <Text className="text-[11px] text-zinc-400 mt-0.5">
                    Struk tercatat
                  </Text>
                </Card>
              </View>

              <View className="flex-1 ml-2">
                <Card className="p-3.5">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                      Rata-rata/Struk
                    </Text>
                    <ArrowUpRight size={15} color="#10b981" />
                  </View>
                  <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {formatRupiah(stats.avgPerTransaction)}
                  </Text>
                  <Text className="text-[11px] text-zinc-400 mt-0.5">
                    Basket size
                  </Text>
                </Card>
              </View>
            </View>

            {/* Top 5 Produk Terlaris Card */}
            <Card className="mb-4">
              <CardHeader className="flex-row items-center justify-between pb-2">
                <View className="flex-row items-center space-x-2">
                  <Award size={16} color="#f59e0b" />
                  <CardTitle className="ml-2 text-sm">Produk Terlaris</CardTitle>
                </View>
                <Badge variant="outline">Top 5 Item</Badge>
              </CardHeader>

              <CardContent>
                {topProducts.length === 0 ? (
                  <Text className="text-xs text-zinc-400 py-2 text-center">
                    Belum ada transaksi pada periode ini.
                  </Text>
                ) : (
                  <View className="space-y-3">
                    {topProducts.map((prod, idx) => (
                      <View key={prod.id} className="my-1">
                        <View className="flex-row items-center justify-between mb-1">
                          <View className="flex-row items-center flex-1 mr-2">
                            <View className="w-5 h-5 rounded-full bg-amber-500/15 items-center justify-center mr-2">
                              <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                #{idx + 1}
                              </Text>
                            </View>
                            <Text
                              numberOfLines={1}
                              className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex-1"
                            >
                              {prod.name}
                            </Text>
                          </View>
                          <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {prod.totalQty} terjual
                          </Text>
                        </View>

                        {/* Progress Bar */}
                        <View className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <View
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${prod.percentage}%` }}
                          />
                        </View>

                        <View className="flex-row justify-between mt-1">
                          <Text className="text-[10px] text-zinc-400">
                            Omset: {formatRupiah(prod.totalOmset)}
                          </Text>
                          <Text className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            Laba: +{formatRupiah(prod.totalLaba)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </CardContent>
            </Card>

            {/* Card: Jam Sibuk (Peak Hours) */}
            <Card className="mb-4">
              <CardHeader className="flex-row items-center justify-between pb-2">
                <View className="flex-row items-center space-x-2">
                  <Clock size={16} color="#3b82f6" />
                  <CardTitle className="ml-2 text-sm">Analisis Jam Sibuk</CardTitle>
                </View>
                {peakHourRecord && peakHourRecord.transactionCount > 0 ? (
                  <Badge variant="indigo">Puncak: {peakHourRecord.hour} WIB</Badge>
                ) : (
                  <Badge variant="secondary">Siap Menganalisis</Badge>
                )}
              </CardHeader>

              <CardContent>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                  Distribusi kepadatan transaksi kasir per jam operasional
                </Text>

                {/* Horizontal Visual Bar Chart */}
                <View className="space-y-2">
                  {peakHours.map((item, idx) => (
                    <View key={idx} className="flex-row items-center my-1">
                      <Text className="w-12 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                        {item.hour}
                      </Text>
                      <View className="flex-1 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-2 overflow-hidden">
                        <View
                          className={`h-full rounded-full ${
                            item.isPeak
                              ? "bg-blue-600 dark:bg-blue-500"
                              : "bg-blue-400/50 dark:bg-blue-600/40"
                          }`}
                          style={{ width: `${Math.max(item.percentage, 4)}%` }}
                        />
                      </View>
                      <Text className="w-12 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        {item.transactionCount} trf
                      </Text>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>

            {/* Quick POS Actions */}
            <View className="space-y-2.5">
              <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Aksi Cepat
              </Text>

              <View className="flex-row space-x-3 mb-2">
                <View className="flex-1 mr-2">
                  <Button
                    variant="default"
                    size="lg"
                    leftIcon={<ShoppingCart size={18} color="#ffffff" />}
                    onPress={() => router.push("/modal-pos")}
                  >
                    Buka Kasir POS
                  </Button>
                </View>

                <View className="flex-1 ml-2">
                  <Button
                    variant="secondary"
                    size="lg"
                    leftIcon={<Plus size={18} color="#3b82f6" />}
                    onPress={() => router.push("/(tabs)/products")}
                  >
                    + Produk
                  </Button>
                </View>
              </View>

              <Button
                variant="outline"
                leftIcon={<Receipt size={16} color="#a1a1aa" />}
                onPress={() => router.push("/(tabs)/history")}
              >
                Lihat Rekap Seluruh Transaksi
              </Button>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
