import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import {
  getFinancialSummary,
  getTopProducts,
  getYesterdaySummary,
  getCurrentMonthSummary,
  getDailyTrend7Days,
  FinancialSummary,
  DailyTrendItem,
} from "@/db/reportRepository";
import { getAllProducts } from "@/db/productRepository";
import { getSetting } from "@/db/settingsRepository";
import { formatRupiah } from "@/util/formatters";
import {
  ShoppingCart,
  ChevronRight,
  Package,
  BarChart2,
} from "lucide-react-native";

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [storeName, setStoreName] = useState("POS Offline Pro");
  const [businessType, setBusinessType] = useState("Jenis toko");
  const [storeLogo, setStoreLogo] = useState("");

  const [totalProductCount, setTotalProductCount] = useState(0);
  const [todayStats, setTodayStats] = useState<FinancialSummary>({
    omset: 0,
    modalHpp: 0,
    labaKotor: 0,
    marginPercent: 0,
    totalTransactions: 0,
    avgPerTransaction: 0,
    avgPerDay: 0,
  });

  const [yesterdayStats, setYesterdayStats] = useState<{ omset: number; labaKotor: number }>({
    omset: 0,
    labaKotor: 0,
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

  const [trend7Days, setTrend7Days] = useState<DailyTrendItem[]>([]);
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

      const yesterday = await getYesterdaySummary();
      setYesterdayStats(yesterday);

      const sevenDays = await getFinancialSummary("7days");
      setSevenDaysStats(sevenDays);

      const currentMonth = await getCurrentMonthSummary();
      setMonthStats(currentMonth);

      const trend = await getDailyTrend7Days();
      setTrend7Days(trend);

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

  // Real-time automatic reload whenever user focuses Dashboard tab
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Periodic heartbeat sync for real-time live numbers
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Calculate dynamic growth vs yesterday
  let growthPercentText = "+ 100.0%";
  let isPositiveGrowth = true;
  if (yesterdayStats.omset > 0) {
    const diff = todayStats.omset - yesterdayStats.omset;
    const pct = (diff / yesterdayStats.omset) * 100;
    isPositiveGrowth = pct >= 0;
    growthPercentText = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  } else if (todayStats.omset === 0) {
    growthPercentText = "0.0%";
    isPositiveGrowth = true;
  }

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === "android" ? 28 : 12);

  return (
    <View style={{ flex: 1, backgroundColor: "#F9F7F4" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: topPadding, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top Header matching screenshot 170105 */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: "#0097A7",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
                overflow: "hidden",
              }}
            >
              {storeLogo ? (
                <Image source={{ uri: storeLogo }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              ) : (
                <View style={{ alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 10, fontWeight: "900", color: "#ffffff", lineHeight: 12 }}>POS</Text>
                  <Text style={{ fontSize: 8, fontWeight: "700", color: "#e0f2fe", lineHeight: 10 }}>Offline</Text>
                </View>
              )}
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#18181b" }}>
                {storeName}
              </Text>
              <Text style={{ fontSize: 12, color: "#71717a", marginTop: 1 }}>
                {businessType}
              </Text>
            </View>
          </View>
        </View>

        {/* Hero Cyan Banner: "Mulai Menjual" matching screenshot 170105 */}
        <TouchableOpacity
          onPress={() => router.push("/modal-pos")}
          activeOpacity={0.85}
          style={{
            width: "100%",
            padding: 16,
            borderRadius: 24,
            backgroundColor: "#0097A7",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            shadowColor: "#0097A7",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 8 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <ShoppingCart size={22} color="#ffffff" />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
                Mulai Menjual
              </Text>
              <Text style={{ fontSize: 12, color: "#e0f7fa", marginTop: 2 }}>
                Buka mode kasir untuk bertransaksi
              </Text>
            </View>
          </View>
          <ChevronRight size={22} color="#ffffff" />
        </TouchableOpacity>

        {/* 3 Top Summary Boxes matching screenshot 170105 */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
          {/* Box 1: Produk */}
          <View
            style={{
              flex: 1,
              paddingVertical: 14,
              paddingHorizontal: 8,
              borderRadius: 18,
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 6,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Package size={20} color="#0097A7" />
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#18181b", marginTop: 4 }}>
              {totalProductCount}
            </Text>
            <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>Produk</Text>
          </View>

          {/* Box 2: Transaksi */}
          <View
            style={{
              flex: 1,
              paddingVertical: 14,
              paddingHorizontal: 8,
              borderRadius: 18,
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              alignItems: "center",
              justifyContent: "center",
              marginHorizontal: 4,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <ShoppingCart size={20} color="#0097A7" />
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#18181b", marginTop: 4 }}>
              {todayStats.totalTransactions}
            </Text>
            <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>Transaksi</Text>
          </View>

          {/* Box 3: Item Terjual */}
          <View
            style={{
              flex: 1,
              paddingVertical: 14,
              paddingHorizontal: 8,
              borderRadius: 18,
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 6,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <BarChart2 size={20} color="#0097A7" />
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#18181b", marginTop: 4 }}>
              {totalItemsSold}
            </Text>
            <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>Item Terjual</Text>
          </View>
        </View>

        {/* "Penjualan Hari Ini" Card matching screenshot 170105 & 170111 */}
        <View
          style={{
            padding: 16,
            borderRadius: 24,
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            marginBottom: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: "#71717a", fontWeight: "500" }}>Penjualan Hari Ini</Text>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 6,
                backgroundColor: isPositiveGrowth ? "#f0fdf4" : "#fef2f2",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: isPositiveGrowth ? "#16a34a" : "#ef4444",
                }}
              >
                {growthPercentText}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 24, fontWeight: "900", color: "#18181b", marginVertical: 4 }}>
            {formatRupiah(todayStats.omset)}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#f4f4f5",
            }}
          >
            <Text style={{ fontSize: 11, color: "#71717a" }}>
              Kemarin: {formatRupiah(yesterdayStats.omset)}
            </Text>
            <Text style={{ fontSize: 11, color: "#71717a" }}>
              Rata-rata: {formatRupiah(todayStats.avgPerTransaction)}/trx
            </Text>
          </View>

          {/* 3 Metric Columns: Modal HPP, Laba Hr Ini, Margin */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: "#71717a" }}>Modal (HPP)</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#27272a", marginTop: 2 }}>
                {formatRupiah(todayStats.modalHpp)}
              </Text>
            </View>

            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 11, color: "#16a34a", fontWeight: "600" }}>Laba Hr Ini</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#16a34a", marginTop: 2 }}>
                {formatRupiah(todayStats.labaKotor)}
              </Text>
            </View>

            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={{ fontSize: 11, color: "#71717a" }}>Margin</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#27272a", marginTop: 2 }}>
                {todayStats.marginPercent}%
              </Text>
            </View>
          </View>
        </View>

        {/* "Tren 7 Hari" Chart Card (Dynamic from SQLite) */}
        <View
          style={{
            padding: 16,
            borderRadius: 24,
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            marginBottom: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181b", marginBottom: 16 }}>
            Tren 7 Hari
          </Text>

          <View style={{ height: 110, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 4 }}>
            {trend7Days.map((item, idx) => {
              const formattedLabel =
                item.omset >= 1000000
                  ? `${(item.omset / 1000000).toFixed(1)} jt`
                  : item.omset >= 1000
                  ? `${Math.round(item.omset / 1000)} rb`
                  : item.omset > 0
                  ? `${item.omset}`
                  : "";

              return (
                <View key={idx} style={{ alignItems: "center", flex: 1 }}>
                  {item.omset > 0 ? (
                    <Text style={{ fontSize: 9, color: item.isToday ? "#0097A7" : "#71717a", marginBottom: 4, fontWeight: "700" }}>
                      {formattedLabel}
                    </Text>
                  ) : null}
                  <View
                    style={{
                      width: 28,
                      height: `${item.percentage}%`,
                      borderRadius: 8,
                      backgroundColor: item.isToday ? "#0097A7" : item.omset > 0 ? "#5eead4" : "#f4f4f5",
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 10,
                      marginTop: 8,
                      fontWeight: item.isToday ? "700" : "500",
                      color: item.isToday ? "#0097A7" : "#71717a",
                    }}
                  >
                    {item.displayLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 2x2 Performance Grid matching screenshot 170111 */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", marginBottom: 12 }}>
            {/* 7 Hari */}
            <View
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 18,
                backgroundColor: "#ffffff",
                borderWidth: 1,
                borderColor: "#e5e7eb",
                marginRight: 6,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Text style={{ fontSize: 11, color: "#71717a" }}>7 Hari</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b", marginTop: 4 }}>
                {formatRupiah(sevenDaysStats.omset)}
              </Text>
            </View>

            {/* Bulan Ini */}
            <View
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 18,
                backgroundColor: "#ffffff",
                borderWidth: 1,
                borderColor: "#e5e7eb",
                marginLeft: 6,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Text style={{ fontSize: 11, color: "#71717a" }}>Bulan Ini</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b", marginTop: 4 }}>
                {formatRupiah(monthStats.omset)}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row" }}>
            {/* Laba 7 Hari */}
            <View
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 18,
                backgroundColor: "#ffffff",
                borderWidth: 1,
                borderColor: "#e5e7eb",
                marginRight: 6,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Text style={{ fontSize: 11, color: "#71717a" }}>Laba 7 Hari</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#16a34a", marginTop: 4 }}>
                {formatRupiah(sevenDaysStats.labaKotor)}
              </Text>
            </View>

            {/* Laba Bulan Ini */}
            <View
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 18,
                backgroundColor: "#ffffff",
                borderWidth: 1,
                borderColor: "#e5e7eb",
                marginLeft: 6,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Text style={{ fontSize: 11, color: "#71717a" }}>Laba Bulan Ini</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#16a34a", marginTop: 4 }}>
                {formatRupiah(monthStats.labaKotor)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
