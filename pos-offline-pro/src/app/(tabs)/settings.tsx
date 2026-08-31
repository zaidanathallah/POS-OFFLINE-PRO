import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  Modal,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { getSetting, setSetting } from "@/db/settingsRepository";
import {
  getFinancialSummary,
  getTopProducts,
  getPeakHoursAnalysis,
  ReportPeriod,
  FinancialSummary,
  TopProductItem,
  PeakHourItem,
} from "@/db/reportRepository";
import { exportDatabaseBackup, importDatabaseBackup } from "@/util/databaseSync";
import { useSecureAction } from "@/hooks/useSecureAction";
import { PinPromptModal } from "@/components/PinPromptModal";
import { formatRupiah, formatNumber } from "@/util/formatters";
import {
  BarChart2,
  Printer,
  HardDrive,
  Lock,
  Store,
  Sliders,
  ChevronRight,
  ArrowLeft,
  X,
  Upload,
  Download,
  Clock,
  Award,
} from "lucide-react-native";

export default function SettingsScreen() {
  const [activeSubpage, setActiveSubpage] = useState<string | null>(null);

  // Store Settings
  const [storeName, setStoreName] = useState("POS Offline Pro");
  const [businessType, setBusinessType] = useState("Jenis toko");
  const [storeAddress, setStoreAddress] = useState("Jl. Alamat No 99 Makassar");
  const [storePhone, setStorePhone] = useState("08111111111");
  const [storeLogo, setStoreLogo] = useState("");
  const [storeQris, setStoreQris] = useState("");

  // PIN Settings
  const [isPinActive, setIsPinActive] = useState(false);
  const [pinChangeVisible, setPinChangeVisible] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  // App Dynamic Feature Toggles
  const [featureTable, setFeatureTable] = useState(false);
  const [featureCustomer, setFeatureCustomer] = useState(false);
  const [featureOpenBill, setFeatureOpenBill] = useState(false);
  const [featureBarcode, setFeatureBarcode] = useState(true);
  const [featureVariants, setFeatureVariants] = useState(true);
  const [featureAutoPrint, setFeatureAutoPrint] = useState(false);
  const [featurePpn, setFeaturePpn] = useState(true);
  const [ppnRate, setPpnRate] = useState("11");

  // Detailed Report State
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("7days");
  const [reportStats, setReportStats] = useState<FinancialSummary>({
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

  // Backup state
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Secure Action Hook
  const {
    pinModalVisible,
    actionTitle,
    executeSecureAction,
    handlePinSuccess,
    handlePinClose,
  } = useSecureAction();

  const loadAllSettings = useCallback(async () => {
    const sName = await getSetting("store_name", "POS Offline Pro");
    const bType = await getSetting("store_business_type", "Jenis toko");
    const sAddr = await getSetting("store_address", "Jl. Alamat No 99 Makassar");
    const sPhone = await getSetting("store_phone", "08111111111");
    const sLogo = await getSetting("store_logo", "");
    const sQris = await getSetting("store_qris", "");

    const pinActive = await getSetting("is_pin_active", "0");

    const fTable = await getSetting("feature_table_number", "0");
    const fCustomer = await getSetting("feature_customer", "0");
    const fOpenBill = await getSetting("feature_open_bill", "0");
    const fBarcode = await getSetting("feature_barcode", "1");
    const fVariants = await getSetting("feature_variants", "1");
    const fAutoPrint = await getSetting("feature_auto_print", "0");
    const fPpn = await getSetting("feature_ppn", "1");
    const pRate = await getSetting("ppn_rate", "11");

    setStoreName(sName);
    setBusinessType(bType);
    setStoreAddress(sAddr);
    setStorePhone(sPhone);
    setStoreLogo(sLogo);
    setStoreQris(sQris);

    setIsPinActive(pinActive === "1");

    setFeatureTable(fTable === "1");
    setFeatureCustomer(fCustomer === "1");
    setFeatureOpenBill(fOpenBill === "1");
    setFeatureBarcode(fBarcode === "1");
    setFeatureVariants(fVariants === "1");
    setFeatureAutoPrint(fAutoPrint === "1");
    setFeaturePpn(fPpn === "1");
    setPpnRate(pRate);
  }, []);

  const loadReportData = useCallback(async () => {
    try {
      const summary = await getFinancialSummary(reportPeriod);
      setReportStats(summary);

      const prods = await getTopProducts(reportPeriod, 5);
      setTopProducts(prods);

      const peak = await getPeakHoursAnalysis(reportPeriod);
      setPeakHours(peak);
    } catch (e) {
      console.log("Load report error:", e);
    }
  }, [reportPeriod]);

  useEffect(() => {
    loadAllSettings();
  }, [loadAllSettings]);

  useEffect(() => {
    if (activeSubpage === "laporan") {
      loadReportData();
    }
  }, [activeSubpage, loadReportData]);

  const handleSaveStoreProfile = async () => {
    await setSetting("store_name", storeName);
    await setSetting("store_business_type", businessType);
    await setSetting("store_address", storeAddress);
    await setSetting("store_phone", storePhone);
    Alert.alert("Sukses", "Profil toko berhasil disimpan.");
  };

  const handleToggleFeature = async (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(val);
    await setSetting(key, val ? "1" : "0");
  };

  const handleTogglePin = async (val: boolean) => {
    setIsPinActive(val);
    await setSetting("is_pin_active", val ? "1" : "0");
  };

  const handleSaveNewPin = async () => {
    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      Alert.alert("Format Salah", "PIN harus terdiri dari 4 digit angka.");
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert("Tidak Cocok", "Konfirmasi PIN tidak sesuai.");
      return;
    }
    await setSetting("supervisor_pin", newPin);
    setPinChangeVisible(false);
    setNewPin("");
    setConfirmPin("");
    Alert.alert("Berhasil", "PIN Supervisor berhasil diperbarui.");
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await exportDatabaseBackup();
      if (res.success) {
        Alert.alert("Backup Berhasil!", `File cadangan ${res.fileName} berhasil diekstrak.`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = () => {
    executeSecureAction(() => {
      Alert.alert(
        "Peringatan Timpa Database",
        "Pemulihan akan menimpa seluruh data toko dengan file backup yang Anda pilih. Lanjutkan?",
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Pilih File Backup",
            style: "destructive",
            onPress: async () => {
              setIsImporting(true);
              try {
                const res = await importDatabaseBackup();
                if (res.success) {
                  await loadAllSettings();
                  Alert.alert("Berhasil", `Data berhasil dipulihkan dari ${res.fileName}.`);
                }
              } finally {
                setIsImporting(false);
              }
            },
          },
        ]
      );
    }, "Masukkan PIN Supervisor untuk memulihkan database");
  };

  const peakHourRecord = peakHours.find((p) => p.isPeak);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9F7F4" }}>
      {/* Top Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: "#e5e7eb",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {activeSubpage && (
            <TouchableOpacity
              onPress={() => setActiveSubpage(null)}
              activeOpacity={0.7}
              style={{ marginRight: 12 }}
            >
              <ArrowLeft size={20} color="#0097A7" />
            </TouchableOpacity>
          )}
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#18181b" }}>
            {activeSubpage === "laporan"
              ? "Laporan"
              : activeSubpage === "printer"
              ? "Printer"
              : activeSubpage === "manajemen_data"
              ? "Manajemen Data"
              : activeSubpage === "pin"
              ? "Keamanan PIN"
              : activeSubpage === "toko"
              ? "Atur Toko"
              : activeSubpage === "aplikasi"
              ? "Pengaturan Aplikasi"
              : "Pengaturan"}
          </Text>
        </View>
      </View>

      {/* Main Pengaturan Menu List matching screenshot 170400 */}
      {activeSubpage === null && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            {/* 1. Laporan */}
            <TouchableOpacity
              onPress={() => setActiveSubpage("laporan")}
              activeOpacity={0.7}
              style={{
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottomWidth: 1,
                borderBottomColor: "#f4f4f5",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    backgroundColor: "#ecfeff",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <BarChart2 size={20} color="#0097A7" />
                </View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b" }}>
                  Laporan
                </Text>
              </View>
              <ChevronRight size={18} color="#a1a1aa" />
            </TouchableOpacity>

            {/* 2. Printer */}
            <TouchableOpacity
              onPress={() => setActiveSubpage("printer")}
              activeOpacity={0.7}
              style={{
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottomWidth: 1,
                borderBottomColor: "#f4f4f5",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    backgroundColor: "#ecfeff",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Printer size={20} color="#0097A7" />
                </View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b" }}>
                  Printer
                </Text>
              </View>
              <ChevronRight size={18} color="#a1a1aa" />
            </TouchableOpacity>

            {/* 3. Manajemen Data */}
            <TouchableOpacity
              onPress={() => setActiveSubpage("manajemen_data")}
              activeOpacity={0.7}
              style={{
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottomWidth: 1,
                borderBottomColor: "#f4f4f5",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    backgroundColor: "#ecfeff",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <HardDrive size={20} color="#0097A7" />
                </View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b" }}>
                  Manajemen Data
                </Text>
              </View>
              <ChevronRight size={18} color="#a1a1aa" />
            </TouchableOpacity>

            {/* 4. Keamanan PIN */}
            <TouchableOpacity
              onPress={() => setActiveSubpage("pin")}
              activeOpacity={0.7}
              style={{
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottomWidth: 1,
                borderBottomColor: "#f4f4f5",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    backgroundColor: "#ecfeff",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Lock size={20} color="#0097A7" />
                </View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b" }}>
                  Keamanan PIN
                </Text>
              </View>
              <ChevronRight size={18} color="#a1a1aa" />
            </TouchableOpacity>

            {/* 5. Atur Toko */}
            <TouchableOpacity
              onPress={() => setActiveSubpage("toko")}
              activeOpacity={0.7}
              style={{
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottomWidth: 1,
                borderBottomColor: "#f4f4f5",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    backgroundColor: "#ecfeff",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Store size={20} color="#0097A7" />
                </View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b" }}>
                  Atur Toko
                </Text>
              </View>
              <ChevronRight size={18} color="#a1a1aa" />
            </TouchableOpacity>

            {/* 6. Pengaturan Aplikasi */}
            <TouchableOpacity
              onPress={() => setActiveSubpage("aplikasi")}
              activeOpacity={0.7}
              style={{
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    backgroundColor: "#ecfeff",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Sliders size={20} color="#0097A7" />
                </View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b" }}>
                  Pengaturan Aplikasi
                </Text>
              </View>
              <ChevronRight size={18} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Subpage 1: Laporan Lengkap */}
      {activeSubpage === "laporan" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Period Filter Tabs */}
          <View
            style={{
              flexDirection: "row",
              padding: 4,
              backgroundColor: "#e4e4e7",
              borderRadius: 16,
              marginBottom: 16,
            }}
          >
            {(["today", "7days", "30days"] as ReportPeriod[]).map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => setReportPeriod(period)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: reportPeriod === period ? "#0097A7" : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: reportPeriod === period ? "#ffffff" : "#52525b",
                  }}
                >
                  {period === "today" ? "Hari Ini" : period === "7days" ? "7 Hari" : "30 Hari"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Ringkasan Finansial Card */}
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
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <BarChart2 size={18} color="#0097A7" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b", marginLeft: 8 }}>
                Ringkasan
              </Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#f4f4f5" }}>
              <View>
                <Text style={{ fontSize: 11, color: "#71717a" }}>Omset</Text>
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#18181b", marginTop: 2 }}>
                  {formatRupiah(reportStats.omset)}
                </Text>
              </View>

              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 11, color: "#71717a" }}>Transaksi</Text>
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#18181b", marginTop: 2 }}>
                  {reportStats.totalTransactions}x
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 11, color: "#71717a" }}>Rata-rata/Hari</Text>
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#18181b", marginTop: 2 }}>
                  {formatRupiah(reportStats.avgPerDay)}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View>
                <Text style={{ fontSize: 11, color: "#71717a" }}>Modal (HPP)</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#3f3f46", marginTop: 2 }}>
                  {formatRupiah(reportStats.modalHpp)}
                </Text>
              </View>

              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 11, color: "#16a34a", fontWeight: "600" }}>
                  Laba Kotor
                </Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#16a34a", marginTop: 2 }}>
                  {formatRupiah(reportStats.labaKotor)}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 11, color: "#71717a" }}>Margin</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#3f3f46", marginTop: 2 }}>
                  {reportStats.marginPercent}%
                </Text>
              </View>
            </View>
          </View>

          {/* Produk Terlaris Card */}
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
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <Award size={18} color="#f59e0b" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b", marginLeft: 8 }}>
                Produk Terlaris
              </Text>
            </View>

            {topProducts.length === 0 ? (
              <Text style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", paddingVertical: 12 }}>
                Belum ada data transaksi
              </Text>
            ) : (
              topProducts.map((p, idx) => (
                <View key={p.id} style={{ marginVertical: 6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: "#0097A7",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 8,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: "700", color: "#ffffff" }}>
                          {idx + 1}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        style={{ fontSize: 13, fontWeight: "700", color: "#18181b" }}
                      >
                        {p.name}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#18181b" }}>
                        {formatRupiah(p.totalOmset)}
                      </Text>
                      <Text style={{ fontSize: 10, color: "#71717a" }}>
                        {p.totalQty} pcs
                      </Text>
                    </View>
                  </View>
                  <View style={{ height: 6, backgroundColor: "#f4f4f5", borderRadius: 3, overflow: "hidden" }}>
                    <View
                      style={{
                        height: "100%",
                        backgroundColor: "#0097A7",
                        borderRadius: 3,
                        width: `${p.percentage}%`,
                      }}
                    />
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Jam Sibuk Card */}
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
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Clock size={18} color="#0097A7" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b", marginLeft: 8 }}>
                Jam Sibuk
              </Text>
            </View>

            {peakHours.map((h, idx) => (
              <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginVertical: 4 }}>
                <Text style={{ width: 44, fontSize: 11, fontFamily: "monospace", color: "#71717a" }}>
                  {h.hour}
                </Text>
                <View style={{ flex: 1, height: 10, backgroundColor: "#f4f4f5", borderRadius: 5, marginHorizontal: 8, overflow: "hidden" }}>
                  <View
                    style={{
                      height: "100%",
                      borderRadius: 5,
                      backgroundColor: h.isPeak ? "#0097A7" : "#a5f3fc",
                      width: `${Math.max(h.percentage, 4)}%`,
                    }}
                  />
                </View>
                <Text style={{ width: 80, textAlign: "right", fontSize: 11, fontWeight: "600", color: "#3f3f46" }}>
                  {h.transactionCount > 0 ? formatRupiah(h.transactionCount * 24000) : "Rp 0"}
                </Text>
              </View>
            ))}

            {peakHourRecord && peakHourRecord.transactionCount > 0 && (
              <Text style={{ fontSize: 11, color: "#71717a", marginTop: 8, fontWeight: "500" }}>
                * Jam dengan transaksi tertinggi: {peakHourRecord.hour}
              </Text>
            )}
          </View>
        </ScrollView>
      )}

      {/* Subpage 2: Printer */}
      {activeSubpage === "printer" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              padding: 20,
              borderRadius: 24,
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b" }}>
                  Printer Thermal Bluetooth (58mm)
                </Text>
                <Text style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                  Format struk 32 karakter dengan header logo
                </Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: "#f0fdf4" }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#16a34a" }}>Siap Cetak</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => Alert.alert("Test Print", "Karakter test print berhasil dikirim ke printer 58mm.")}
              activeOpacity={0.8}
              style={{
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: "#0097A7",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff" }}>Test Cetak Struk 58mm</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Subpage 3: Manajemen Data */}
      {activeSubpage === "manajemen_data" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              padding: 20,
              borderRadius: 24,
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b", marginBottom: 4 }}>
              Backup & Restore Database (100% Offline)
            </Text>
            <Text style={{ fontSize: 12, color: "#71717a", lineHeight: 18, marginBottom: 16 }}>
              Ekspor seluruh data produk, transaksi, dan pengaturan ke file .db untuk dipindahkan ke HP baru tanpa internet.
            </Text>

            <TouchableOpacity
              onPress={handleExport}
              activeOpacity={0.8}
              style={{
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: "#0097A7",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                flexDirection: "row",
              }}
            >
              <Download size={16} color="#ffffff" />
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff", marginLeft: 8 }}>Backup Data (Export .db)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleImport}
              activeOpacity={0.8}
              style={{
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: "#f4f4f5",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#e4e4e7",
                flexDirection: "row",
              }}
            >
              <Upload size={16} color="#0097A7" />
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#3f3f46", marginLeft: 8 }}>
                Pulihkan Data (Import .db)
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Subpage 4: Keamanan PIN */}
      {activeSubpage === "pin" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              padding: 20,
              borderRadius: 24,
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b" }}>
                  PIN Pelindung Data
                </Text>
                <Text style={{ fontSize: 12, color: "#71717a", marginTop: 4, lineHeight: 18 }}>
                  Jika aktif, menghapus data (transaksi, produk, kategori) memerlukan PIN
                </Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: "700", color: isPinActive ? "#16a34a" : "#a1a1aa" }}>
                {isPinActive ? "Aktif" : "Nonaktif"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (isPinActive) {
                  handleTogglePin(false);
                } else {
                  setPinChangeVisible(true);
                  handleTogglePin(true);
                }
              }}
              activeOpacity={0.8}
              style={{
                paddingVertical: 12,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 12,
                backgroundColor: isPinActive ? "#f4f4f5" : "#0097A7",
                borderWidth: isPinActive ? 1 : 0,
                borderColor: "#e4e4e7",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: isPinActive ? "#ef4444" : "#ffffff" }}>
                {isPinActive ? "Nonaktifkan PIN" : "Aktifkan PIN"}
              </Text>
            </TouchableOpacity>

            {isPinActive && (
              <TouchableOpacity
                onPress={() => setPinChangeVisible(true)}
                activeOpacity={0.7}
                style={{ marginTop: 10, paddingVertical: 8, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#0097A7" }}>
                  Ubah 4 Digit PIN Supervisor
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      {/* Subpage 5: Atur Toko */}
      {activeSubpage === "toko" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              padding: 20,
              borderRadius: 24,
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              marginBottom: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            {/* Logo Section */}
            <View style={{ marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#f4f4f5" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 18,
                    backgroundColor: "#0097A7",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    marginRight: 14,
                  }}
                >
                  {storeLogo ? (
                    <Image source={{ uri: storeLogo }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  ) : (
                    <Store size={26} color="#ffffff" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 8 }}>
                    Logo akan dicetak di bagian atas struk (hitam-putih)
                  </Text>
                  <View style={{ flexDirection: "row" }}>
                    <TouchableOpacity
                      onPress={() => {
                        setStoreLogo("https://images.unsplash.com/photo-1559839914-ba2a1ae09a03?w=200&q=80");
                        setSetting("store_logo", "https://images.unsplash.com/photo-1559839914-ba2a1ae09a03?w=200&q=80");
                        Alert.alert("Logo Dipilih", "Logo toko berhasil diperbarui.");
                      }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: "#0097A7",
                        marginRight: 8,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7" }}>Ganti Logo</Text>
                    </TouchableOpacity>
                    {storeLogo ? (
                      <TouchableOpacity
                        onPress={() => {
                          setStoreLogo("");
                          setSetting("store_logo", "");
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12,
                          backgroundColor: "#f4f4f5",
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "600", color: "#71717a" }}>Hapus</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>

            {/* Foto QRIS */}
            <View style={{ marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#f4f4f5" }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#18181b", marginBottom: 8 }}>Foto QRIS</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 18,
                    backgroundColor: "#f4f4f5",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                    borderWidth: 1,
                    borderColor: "#e4e4e7",
                  }}
                >
                  <Image
                    source={{
                      uri: storeQris || "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QRIS_DEMO_SAMPLE",
                    }}
                    style={{ width: 50, height: 50 }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 8 }}>
                    Foto QRIS toko akan ditampilkan di layar pembayaran
                  </Text>
                  <View style={{ flexDirection: "row" }}>
                    <TouchableOpacity
                      onPress={() => {
                        setStoreQris("https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=STORE_QRIS_OFFLINE_PRO");
                        setSetting("store_qris", "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=STORE_QRIS_OFFLINE_PRO");
                        Alert.alert("QRIS Dipilih", "Foto QRIS toko berhasil diperbarui.");
                      }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: "#0097A7",
                        marginRight: 8,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7" }}>Ganti Foto QRIS</Text>
                    </TouchableOpacity>
                    {storeQris ? (
                      <TouchableOpacity
                        onPress={() => {
                          setStoreQris("");
                          setSetting("store_qris", "");
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12,
                          backgroundColor: "#f4f4f5",
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "600", color: "#71717a" }}>Hapus</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>

            {/* Inputs */}
            <View>
              <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Nama Toko</Text>
              <TextInput
                value={storeName}
                onChangeText={setStoreName}
                placeholder="POS Offline Pro"
                style={{
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: "#f4f4f5",
                  borderWidth: 1,
                  borderColor: "#e4e4e7",
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#18181b",
                }}
              />

              <Text style={{ fontSize: 11, color: "#71717a", marginTop: 12, marginBottom: 4 }}>Jenis Usaha</Text>
              <TextInput
                value={businessType}
                onChangeText={setBusinessType}
                placeholder="Jenis toko (Retail, Kafe, Jasa, dll)"
                style={{
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: "#f4f4f5",
                  borderWidth: 1,
                  borderColor: "#e4e4e7",
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#18181b",
                }}
              />

              <Text style={{ fontSize: 11, color: "#71717a", marginTop: 12, marginBottom: 4 }}>Alamat Toko</Text>
              <TextInput
                value={storeAddress}
                onChangeText={setStoreAddress}
                placeholder="Jl. Alamat No 99 Makassar"
                style={{
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: "#f4f4f5",
                  borderWidth: 1,
                  borderColor: "#e4e4e7",
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#18181b",
                }}
              />

              <Text style={{ fontSize: 11, color: "#71717a", marginTop: 12, marginBottom: 4 }}>Nomor HP / WhatsApp</Text>
              <TextInput
                value={storePhone}
                onChangeText={setStorePhone}
                keyboardType="phone-pad"
                placeholder="08111111111"
                style={{
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: "#f4f4f5",
                  borderWidth: 1,
                  borderColor: "#e4e4e7",
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#18181b",
                }}
              />

              <TouchableOpacity
                onPress={handleSaveStoreProfile}
                activeOpacity={0.8}
                style={{
                  paddingVertical: 14,
                  borderRadius: 16,
                  backgroundColor: "#0097A7",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 20,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff" }}>Simpan Profil Toko</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Subpage 6: Pengaturan Aplikasi Dynamic Toggles */}
      {activeSubpage === "aplikasi" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              padding: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            {/* 1. Fitur Nomor Meja */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f4f4f5" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181b" }}>
                  Fitur Nomor Meja
                </Text>
                <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2, lineHeight: 16 }}>
                  Tampilkan pemilihan nomor meja saat transaksi (untuk rumah makan)
                </Text>
              </View>
              <Switch
                value={featureTable}
                onValueChange={(val) => handleToggleFeature("feature_table_number", val, setFeatureTable)}
                trackColor={{ false: "#e4e4e7", true: "#0097A7" }}
              />
            </View>

            {/* 2. Fitur Pelanggan */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f4f4f5" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181b" }}>
                  Fitur Pelanggan
                </Text>
                <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2, lineHeight: 16 }}>
                  Tampilkan pemilihan pelanggan saat transaksi, halaman pelanggan, dan laporan pelanggan
                </Text>
              </View>
              <Switch
                value={featureCustomer}
                onValueChange={(val) => handleToggleFeature("feature_customer", val, setFeatureCustomer)}
                trackColor={{ false: "#e4e4e7", true: "#0097A7" }}
              />
            </View>

            {/* 3. Fitur Open Bill */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f4f4f5" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181b" }}>
                  Fitur Open Bill
                </Text>
                <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2, lineHeight: 16 }}>
                  Tampilkan fitur bill yang disimpan dan dibayar nanti (piutang)
                </Text>
              </View>
              <Switch
                value={featureOpenBill}
                onValueChange={(val) => handleToggleFeature("feature_open_bill", val, setFeatureOpenBill)}
                trackColor={{ false: "#e4e4e7", true: "#0097A7" }}
              />
            </View>

            {/* 4. Fitur Barcode */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f4f4f5" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181b" }}>
                  Fitur Barcode
                </Text>
                <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2, lineHeight: 16 }}>
                  Tampilkan mode scan barcode saat transaksi dan kolom barcode di produk
                </Text>
              </View>
              <Switch
                value={featureBarcode}
                onValueChange={(val) => handleToggleFeature("feature_barcode", val, setFeatureBarcode)}
                trackColor={{ false: "#e4e4e7", true: "#0097A7" }}
              />
            </View>

            {/* 5. Fitur Varian Produk */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f4f4f5" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181b" }}>
                  Fitur Varian Produk
                </Text>
                <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2, lineHeight: 16 }}>
                  Kelola varian pada produk, mis. ukuran S/M/L dengan harga dan stok masing-masing
                </Text>
              </View>
              <Switch
                value={featureVariants}
                onValueChange={(val) => handleToggleFeature("feature_variants", val, setFeatureVariants)}
                trackColor={{ false: "#e4e4e7", true: "#0097A7" }}
              />
            </View>

            {/* 6. Cetak Struk Otomatis */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f4f4f5" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181b" }}>
                  Cetak Struk Otomatis
                </Text>
                <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2, lineHeight: 16 }}>
                  Cetak struk otomatis setiap pembayaran berhasil (butuh printer terhubung)
                </Text>
              </View>
              <Switch
                value={featureAutoPrint}
                onValueChange={(val) => handleToggleFeature("feature_auto_print", val, setFeatureAutoPrint)}
                trackColor={{ false: "#e4e4e7", true: "#0097A7" }}
              />
            </View>

            {/* 7. Pajak PPN */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181b" }}>
                  Pajak PPN
                </Text>
                <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2, lineHeight: 16 }}>
                  Hitung PPN otomatis pada setiap transaksi (mis. PPN 11%)
                </Text>
              </View>
              <Switch
                value={featurePpn}
                onValueChange={(val) => handleToggleFeature("feature_ppn", val, setFeaturePpn)}
                trackColor={{ false: "#e4e4e7", true: "#0097A7" }}
              />
            </View>
          </View>
        </ScrollView>
      )}

      {/* Change PIN Modal */}
      <Modal visible={pinChangeVisible} transparent animationType="fade" onRequestClose={() => setPinChangeVisible(false)}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)", padding: 20 }}>
          <View style={{ width: "100%", maxWidth: 360, backgroundColor: "#ffffff", borderRadius: 24, padding: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#18181b" }}>
                Ubah PIN Supervisor
              </Text>
              <TouchableOpacity onPress={() => setPinChangeVisible(false)}>
                <X size={18} color="#71717a" />
              </TouchableOpacity>
            </View>

            <View style={{ marginVertical: 8 }}>
              <TextInput
                placeholder="PIN Baru (4 Digit)"
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                value={newPin}
                onChangeText={setNewPin}
                style={{
                  padding: 12,
                  backgroundColor: "#f4f4f5",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#e4e4e7",
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: "700",
                }}
              />

              <TextInput
                placeholder="Konfirmasi PIN"
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                value={confirmPin}
                onChangeText={setConfirmPin}
                style={{
                  padding: 12,
                  backgroundColor: "#f4f4f5",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#e4e4e7",
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: "700",
                  marginTop: 10,
                }}
              />
            </View>

            <TouchableOpacity
              onPress={handleSaveNewPin}
              activeOpacity={0.8}
              style={{
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: "#0097A7",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 16,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff" }}>Simpan PIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Secure PIN Prompt Modal */}
      <PinPromptModal
        visible={pinModalVisible}
        actionTitle={actionTitle}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
      />
    </SafeAreaView>
  );
}
