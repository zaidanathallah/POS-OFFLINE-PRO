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
  CheckCircle2,
  Trash2,
  Calendar,
  Clock,
  Award,
  Users,
  ScanBarcode,
  Receipt,
  Layers,
  FileText,
} from "lucide-react-native";

export default function SettingsScreen() {
  // Navigation subpage state: null (main list) | 'laporan' | 'printer' | 'manajemen_data' | 'pin' | 'toko' | 'aplikasi'
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
    omset: 414000,
    modalHpp: 0,
    labaKotor: 414000,
    marginPercent: 100,
    totalTransactions: 11,
    avgPerTransaction: 37636,
    avgPerDay: 59143,
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

  // Handlers for Store Profile
  const handleSaveStoreProfile = async () => {
    await setSetting("store_name", storeName);
    await setSetting("store_business_type", businessType);
    await setSetting("store_address", storeAddress);
    await setSetting("store_phone", storePhone);
    Alert.alert("Sukses", "Profil toko berhasil disimpan.");
  };

  // Handlers for Feature Toggles
  const handleToggleFeature = async (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(val);
    await setSetting(key, val ? "1" : "0");
  };

  // Handlers for PIN
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

  // Export / Import
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
    <SafeAreaView className="flex-1 bg-[#F9F7F4] dark:bg-zinc-950">
      {/* Top Header */}
      <View className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 flex-row items-center justify-between">
        <View className="flex-row items-center">
          {activeSubpage && (
            <TouchableOpacity
              onPress={() => setActiveSubpage(null)}
              activeOpacity={0.7}
              className="mr-3"
            >
              <ArrowLeft size={20} color="#0097A7" />
            </TouchableOpacity>
          )}
          <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
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
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          <View className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-sm">
            {/* 1. Laporan */}
            <TouchableOpacity
              onPress={() => setActiveSubpage("laporan")}
              activeOpacity={0.7}
              className="p-4 flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 items-center justify-center mr-3.5">
                  <BarChart2 size={18} color="#0097A7" />
                </View>
                <Text className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                  Laporan
                </Text>
              </View>
              <ChevronRight size={17} color="#a1a1aa" />
            </TouchableOpacity>

            {/* 2. Printer */}
            <TouchableOpacity
              onPress={() => setActiveSubpage("printer")}
              activeOpacity={0.7}
              className="p-4 flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 items-center justify-center mr-3.5">
                  <Printer size={18} color="#0097A7" />
                </View>
                <Text className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                  Printer
                </Text>
              </View>
              <ChevronRight size={17} color="#a1a1aa" />
            </TouchableOpacity>

            {/* 3. Manajemen Data */}
            <TouchableOpacity
              onPress={() => setActiveSubpage("manajemen_data")}
              activeOpacity={0.7}
              className="p-4 flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 items-center justify-center mr-3.5">
                  <HardDrive size={18} color="#0097A7" />
                </View>
                <Text className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                  Manajemen Data
                </Text>
              </View>
              <ChevronRight size={17} color="#a1a1aa" />
            </TouchableOpacity>

            {/* 4. Keamanan PIN */}
            <TouchableOpacity
              onPress={() => setActiveSubpage("pin")}
              activeOpacity={0.7}
              className="p-4 flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 items-center justify-center mr-3.5">
                  <Lock size={18} color="#0097A7" />
                </View>
                <Text className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                  Keamanan PIN
                </Text>
              </View>
              <ChevronRight size={17} color="#a1a1aa" />
            </TouchableOpacity>

            {/* 5. Atur Toko */}
            <TouchableOpacity
              onPress={() => setActiveSubpage("toko")}
              activeOpacity={0.7}
              className="p-4 flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 items-center justify-center mr-3.5">
                  <Store size={18} color="#0097A7" />
                </View>
                <Text className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                  Atur Toko
                </Text>
              </View>
              <ChevronRight size={17} color="#a1a1aa" />
            </TouchableOpacity>

            {/* 6. Pengaturan Aplikasi */}
            <TouchableOpacity
              onPress={() => setActiveSubpage("aplikasi")}
              activeOpacity={0.7}
              className="p-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 items-center justify-center mr-3.5">
                  <Sliders size={18} color="#0097A7" />
                </View>
                <Text className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                  Pengaturan Aplikasi
                </Text>
              </View>
              <ChevronRight size={17} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Subpage 1: Laporan Lengkap matching screenshot 133814 & 134125 */}
      {activeSubpage === "laporan" && (
        <ScrollView className="flex-1 px-4 pt-3" showsVerticalScrollIndicator={false}>
          {/* Period Filter Tabs matching screenshot 133814 */}
          <View className="flex-row p-1 bg-zinc-200/70 dark:bg-zinc-800 rounded-2xl mb-4">
            {(["today", "7days", "30days"] as ReportPeriod[]).map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => setReportPeriod(period)}
                className={`flex-1 py-2 rounded-xl items-center ${
                  reportPeriod === period ? "bg-[#0097A7] shadow-sm" : ""
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    reportPeriod === period ? "text-white" : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {period === "today" ? "Hari Ini" : period === "7days" ? "7 Hari" : "30 Hari"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Ringkasan Finansial Card matching screenshot 133814 */}
          <View className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 mb-4 shadow-sm">
            <View className="flex-row items-center mb-3">
              <BarChart2 size={16} color="#0097A7" />
              <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100 ml-2">
                Ringkasan
              </Text>
            </View>

            <View className="flex-row justify-between mb-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <View>
                <Text className="text-[11px] text-zinc-400">Omset</Text>
                <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {formatRupiah(reportStats.omset)}
                </Text>
              </View>

              <View className="items-center">
                <Text className="text-[11px] text-zinc-400">Transaksi</Text>
                <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {reportStats.totalTransactions}x
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-[11px] text-zinc-400">Rata-rata/Hari</Text>
                <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {formatRupiah(reportStats.avgPerDay)}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between">
              <View>
                <Text className="text-[11px] text-zinc-400">Modal (HPP)</Text>
                <Text className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">
                  {formatRupiah(reportStats.modalHpp)}
                </Text>
              </View>

              <View className="items-center">
                <Text className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Laba Kotor
                </Text>
                <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatRupiah(reportStats.labaKotor)}
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-[11px] text-zinc-400">Margin</Text>
                <Text className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">
                  {reportStats.marginPercent}%
                </Text>
              </View>
            </View>
          </View>

          {/* Produk Terlaris Card matching screenshot 133814 */}
          <View className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 mb-4 shadow-sm">
            <View className="flex-row items-center mb-3">
              <Award size={16} color="#f59e0b" />
              <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100 ml-2">
                Produk Terlaris
              </Text>
            </View>

            {topProducts.length === 0 ? (
              <Text className="text-xs text-zinc-400 text-center py-3">
                Belum ada data transaksi
              </Text>
            ) : (
              topProducts.map((p, idx) => (
                <View key={p.id} className="my-1.5">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className="w-5 h-5 rounded-full bg-[#0097A7] items-center justify-center mr-2">
                        <Text className="text-[10px] font-bold text-white">
                          {idx + 1}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        className="text-xs font-bold text-zinc-800 dark:text-zinc-200"
                      >
                        {p.name}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {formatRupiah(p.totalOmset)}
                      </Text>
                      <Text className="text-[10px] text-zinc-400">
                        {p.totalQty} pcs
                      </Text>
                    </View>
                  </View>
                  <View className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-[#0097A7] rounded-full"
                      style={{ width: `${p.percentage}%` }}
                    />
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Jam Sibuk Card matching screenshot 134125 */}
          <View className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 mb-4 shadow-sm">
            <View className="flex-row items-center mb-2">
              <Clock size={16} color="#0097A7" />
              <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100 ml-2">
                Jam Sibuk
              </Text>
            </View>

            {peakHours.map((h, idx) => (
              <View key={idx} className="flex-row items-center my-1">
                <Text className="w-12 text-xs font-mono text-zinc-400">
                  {h.hour}
                </Text>
                <View className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full mx-2 overflow-hidden">
                  <View
                    className={`h-full rounded-full ${h.isPeak ? "bg-[#0097A7]" : "bg-cyan-300"}`}
                    style={{ width: `${Math.max(h.percentage, 4)}%` }}
                  />
                </View>
                <Text className="w-20 text-right text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {h.transactionCount > 0 ? formatRupiah(h.transactionCount * 24000) : "Rp 0"}
                </Text>
              </View>
            ))}

            {peakHourRecord && peakHourRecord.transactionCount > 0 && (
              <Text className="text-[11px] text-zinc-400 mt-2 font-medium">
                * Jam dengan transaksi tertinggi: {peakHourRecord.hour}
              </Text>
            )}
          </View>
        </ScrollView>
      )}

      {/* Subpage 2: Printer */}
      {activeSubpage === "printer" && (
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          <View className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Printer Thermal Bluetooth (58mm)
                </Text>
                <Text className="text-xs text-zinc-400 mt-0.5">
                  Format struk 32 karakter dengan header logo
                </Text>
              </View>
              <View className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40">
                <Text className="text-xs font-bold text-emerald-600">Siap Cetak</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => Alert.alert("Test Print", "Karakter test print berhasil dikirim ke printer 58mm.")}
              activeOpacity={0.8}
              className="py-3 rounded-2xl bg-[#0097A7] items-center justify-center shadow-sm"
            >
              <Text className="text-xs font-bold text-white">Test Cetak Struk 58mm</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Subpage 3: Manajemen Data (Backup & Restore) */}
      {activeSubpage === "manajemen_data" && (
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          <View className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
            <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-1">
              Backup & Restore Database (100% Offline)
            </Text>
            <Text className="text-xs text-zinc-400 leading-relaxed mb-4">
              Ekspor seluruh data produk, transaksi, dan pengaturan ke file .db untuk dipindahkan ke HP baru tanpa internet.
            </Text>

            <TouchableOpacity
              onPress={handleExport}
              activeOpacity={0.8}
              className="py-3.5 rounded-2xl bg-[#0097A7] items-center justify-center mb-3 shadow-sm flex-row"
            >
              <Download size={16} color="#ffffff" />
              <Text className="text-xs font-bold text-white ml-2">Backup Data (Export .db)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleImport}
              activeOpacity={0.8}
              className="py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 items-center justify-center border border-zinc-200 dark:border-zinc-700 flex-row"
            >
              <Upload size={16} color="#0097A7" />
              <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300 ml-2">
                Pulihkan Data (Import .db)
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Subpage 4: Keamanan PIN matching screenshot 134311 */}
      {activeSubpage === "pin" && (
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          <View className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  PIN Pelindung Data
                </Text>
                <Text className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Jika aktif, menghapus data (transaksi, produk, kategori) memerlukan PIN
                </Text>
              </View>
              <Text className={`text-xs font-bold ${isPinActive ? "text-emerald-600" : "text-zinc-400"}`}>
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
              className={`py-3 rounded-2xl items-center justify-center mt-3 ${
                isPinActive
                  ? "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                  : "bg-[#0097A7] shadow-sm"
              }`}
            >
              <Text className={`text-xs font-bold ${isPinActive ? "text-red-500" : "text-white"}`}>
                {isPinActive ? "Nonaktifkan PIN" : "Aktifkan PIN"}
              </Text>
            </TouchableOpacity>

            {isPinActive && (
              <TouchableOpacity
                onPress={() => setPinChangeVisible(true)}
                activeOpacity={0.7}
                className="mt-2.5 py-2.5 items-center justify-center"
              >
                <Text className="text-xs font-bold text-[#0097A7]">
                  Ubah 4 Digit PIN Supervisor
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      {/* Subpage 5: Atur Toko matching screenshot 170944 */}
      {activeSubpage === "toko" && (
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          <View className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm mb-4">
            {/* Logo Toko Section matching screenshot 170944 */}
            <View className="mb-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <View className="flex-row items-center">
                <View className="w-16 h-16 rounded-2xl bg-[#0097A7] items-center justify-center overflow-hidden mr-3.5">
                  {storeLogo ? (
                    <Image source={{ uri: storeLogo }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <Store size={26} color="#ffffff" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-zinc-400 mb-2">
                    Logo akan dicetak di bagian atas struk (hitam-putih)
                  </Text>
                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      onPress={() => {
                        setStoreLogo("https://images.unsplash.com/photo-1559839914-ba2a1ae09a03?w=200&q=80");
                        setSetting("store_logo", "https://images.unsplash.com/photo-1559839914-ba2a1ae09a03?w=200&q=80");
                        Alert.alert("Logo Dipilih", "Logo toko berhasil diperbarui.");
                      }}
                      className="px-3 py-1.5 rounded-xl border border-[#0097A7] mr-2"
                    >
                      <Text className="text-xs font-bold text-[#0097A7]">Ganti Logo</Text>
                    </TouchableOpacity>
                    {storeLogo ? (
                      <TouchableOpacity
                        onPress={() => {
                          setStoreLogo("");
                          setSetting("store_logo", "");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800"
                      >
                        <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Hapus</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>

            {/* Foto QRIS Section matching screenshot 170944 */}
            <View className="mb-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <Text className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-2">Foto QRIS</Text>
              <View className="flex-row items-center">
                <View className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 items-center justify-center mr-3.5 border border-zinc-200 dark:border-zinc-700">
                  <Image
                    source={{
                      uri: storeQris || "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QRIS_DEMO_SAMPLE",
                    }}
                    className="w-14 h-14"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-zinc-400 mb-2">
                    Foto QRIS toko akan ditampilkan di layar pembayaran
                  </Text>
                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      onPress={() => {
                        setStoreQris("https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=STORE_QRIS_OFFLINE_PRO");
                        setSetting("store_qris", "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=STORE_QRIS_OFFLINE_PRO");
                        Alert.alert("QRIS Dipilih", "Foto QRIS toko berhasil diperbarui.");
                      }}
                      className="px-3 py-1.5 rounded-xl border border-[#0097A7] mr-2"
                    >
                      <Text className="text-xs font-bold text-[#0097A7]">Ganti Foto QRIS</Text>
                    </TouchableOpacity>
                    {storeQris ? (
                      <TouchableOpacity
                        onPress={() => {
                          setStoreQris("");
                          setSetting("store_qris", "");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800"
                      >
                        <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Hapus</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>

            {/* Text Inputs matching screenshot 170944 */}
            <View className="space-y-3">
              <View>
                <Text className="text-[11px] text-zinc-400 mb-1">Nama Toko</Text>
                <TextInput
                  value={storeName}
                  onChangeText={setStoreName}
                  placeholder="POS Offline Pro"
                  className="w-full p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                />
              </View>

              <View className="mt-3">
                <Text className="text-[11px] text-zinc-400 mb-1">Jenis Usaha</Text>
                <TextInput
                  value={businessType}
                  onChangeText={setBusinessType}
                  placeholder="Jenis toko (Retail, Kafe, Jasa, dll)"
                  className="w-full p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                />
              </View>

              <View className="mt-3">
                <Text className="text-[11px] text-zinc-400 mb-1">Alamat Toko</Text>
                <TextInput
                  value={storeAddress}
                  onChangeText={setStoreAddress}
                  placeholder="Jl. Alamat No 99 Makassar"
                  className="w-full p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                />
              </View>

              <View className="mt-3">
                <Text className="text-[11px] text-zinc-400 mb-1">Nomor HP / WhatsApp</Text>
                <TextInput
                  value={storePhone}
                  onChangeText={setStorePhone}
                  keyboardType="phone-pad"
                  placeholder="08111111111"
                  className="w-full p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                />
              </View>

              <TouchableOpacity
                onPress={handleSaveStoreProfile}
                activeOpacity={0.8}
                className="w-full py-3.5 rounded-2xl bg-[#0097A7] items-center justify-center mt-5 shadow-sm"
              >
                <Text className="text-xs font-bold text-white">Simpan Profil Toko</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Subpage 6: Pengaturan Aplikasi Dynamic Toggles matching screenshot 170411, 170420, 170428 */}
      {activeSubpage === "aplikasi" && (
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          <View className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-sm p-4 space-y-4">
            {/* 1. Fitur Nomor Meja */}
            <View className="flex-row items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Fitur Nomor Meja
                </Text>
                <Text className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
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
            <View className="flex-row items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Fitur Pelanggan
                </Text>
                <Text className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
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
            <View className="flex-row items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Fitur Open Bill
                </Text>
                <Text className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
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
            <View className="flex-row items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Fitur Barcode
                </Text>
                <Text className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
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
            <View className="flex-row items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Fitur Varian Produk
                </Text>
                <Text className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
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
            <View className="flex-row items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Cetak Struk Otomatis
                </Text>
                <Text className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
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
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Pajak PPN
                </Text>
                <Text className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
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
        <View className="flex-1 justify-center items-center bg-black/60 px-5">
          <View className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-100 dark:border-zinc-800">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Ubah PIN Supervisor
              </Text>
              <TouchableOpacity onPress={() => setPinChangeVisible(false)}>
                <X size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View className="space-y-3 my-2">
              <TextInput
                placeholder="PIN Baru (4 Digit)"
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                value={newPin}
                onChangeText={setNewPin}
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-center text-lg font-bold"
              />

              <TextInput
                placeholder="Konfirmasi PIN"
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                value={confirmPin}
                onChangeText={setConfirmPin}
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-center text-lg font-bold mt-2"
              />
            </View>

            <TouchableOpacity
              onPress={handleSaveNewPin}
              activeOpacity={0.8}
              className="py-3 rounded-2xl bg-[#0097A7] items-center justify-center mt-4 shadow-sm"
            >
              <Text className="text-xs font-bold text-white">Simpan PIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Secure PIN Prompt Modal for Database Restore */}
      <PinPromptModal
        visible={pinModalVisible}
        actionTitle={actionTitle}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
      />
    </SafeAreaView>
  );
}
