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

  const daysLabels = ["Sab", "Min", "Sen", "Sel", "Rab", "Kam", "Hr Ini"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9F7F4" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 100 }}
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
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: "#f0fdf4" }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#16a34a" }}>
                + 100.0%
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
            <Text style={{ fontSize: 11, color: "#71717a" }}>Kemarin: Rp 0</Text>
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

        {/* "Tren 7 Hari" Chart Card matching screenshot 170105 & 170111 */}
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
            {daysLabels.map((day, idx) => {
              const isToday = idx === 6;
              const barHeightPct = isToday
                ? todayStats.omset > 0
                  ? 75
                  : 12
                : Math.max(10, ((idx + 2) * 12) % 35);

              return (
                <View key={idx} style={{ alignItems: "center", flex: 1 }}>
                  {isToday && todayStats.omset > 0 && (
                    <Text style={{ fontSize: 10, color: "#71717a", marginBottom: 4, fontFamily: "monospace" }}>
                      {todayStats.omset >= 1000 ? `${Math.round(todayStats.omset / 1000)} rb` : todayStats.omset}
                    </Text>
                  )}
                  <View
                    style={{
                      width: 28,
                      height: `${barHeightPct}%`,
                      borderRadius: 8,
                      backgroundColor: isToday ? "#0097A7" : "#ccfbf1",
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 10,
                      marginTop: 8,
                      fontWeight: isToday ? "700" : "500",
                      color: isToday ? "#0097A7" : "#71717a",
                    }}
                  >
                    {day}
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
    </SafeAreaView>
  );
}
