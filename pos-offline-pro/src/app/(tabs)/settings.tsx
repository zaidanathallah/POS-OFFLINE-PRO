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
  Platform,
} from "react-native";
import { useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { getSetting, setSetting } from "@/db/settingsRepository";
import {
  getFinancialSummary,
  getTopProducts,
  getPeakHoursAnalysis,
  getTransactionsForReport,
  ReportPeriod,
  FinancialSummary,
  TopProductItem,
  PeakHourItem,
} from "@/db/reportRepository";
import { deleteTransaction } from "@/db/transactionRepository";
import {
  getAllPromos,
  createPromo,
  updatePromo,
  deletePromo,
  togglePromoStatus,
  PromoInput,
} from "@/db/promoRepository";
import { exportDatabaseBackup, importDatabaseBackup } from "@/util/databaseSync";
import { exportReportToCSV } from "@/util/csvExportService";
import { PrinterService, BluetoothDeviceItem } from "@/util/printerService";
import { useSecureAction } from "@/hooks/useSecureAction";
import { PinPromptModal } from "@/components/PinPromptModal";
import { TransactionFormModal } from "@/components/TransactionFormModal";
import { TransactionDetailModal } from "@/components/TransactionDetailModal";
import { PromoFormModal } from "@/components/PromoFormModal";
import { CustomerManagerModal } from "@/components/CustomerManagerModal";
import { Transaction, Promo } from "@/db";
import { formatRupiah, formatNumber } from "@/util/formatters";
import { compressAndConvertToBase64, compressAndConvertToMonochromeBase64 } from "@/util/imageCompressor";
import { decodeQrFromImage } from "@/util/qrDecoder";
import { parseQrisMetadata, DEFAULT_BASE_QRIS } from "@/util/qrisEngine";
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
  Calendar,
  FileSpreadsheet,
  Bluetooth,
  RefreshCw,
  CheckCircle2,
  Camera,
  ImageIcon,
  MessageSquare,
  Percent,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Receipt,
  Tag,
  Gift,
  DollarSign,
  QrCode,
  Users,
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
  const [storeQrisPayload, setStoreQrisPayload] = useState(DEFAULT_BASE_QRIS);
  const [showPayloadInput, setShowPayloadInput] = useState(false);
  const [receiptFooter, setReceiptFooter] = useState("Terima Kasih Atas Kunjungan Anda!");
  const [activeCashier, setActiveCashier] = useState("Kasir 1");

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
  const [featurePromo, setFeaturePromo] = useState(true);

  // Promo State
  const [promosList, setPromosList] = useState<Promo[]>([]);
  const [promoFormVisible, setPromoFormVisible] = useState(false);
  const [customerManagerVisible, setCustomerManagerVisible] = useState(false);
  const [selectedPromoForEdit, setSelectedPromoForEdit] = useState<Promo | null>(null);

  // Detailed Report State
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("7days");
  const [customStartDate, setCustomStartDate] = useState(
    new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);

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
  const [reportTransactions, setReportTransactions] = useState<Transaction[]>([]);
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  // Transaction CRUD Modals for Laporan
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTrxForEdit, setSelectedTrxForEdit] = useState<Transaction | null>(null);
  const [selectedTrxForDetail, setSelectedTrxForDetail] = useState<Transaction | null>(null);

  // Bluetooth Printer Scanner State
  const [discoveredPrinters, setDiscoveredPrinters] = useState<BluetoothDeviceItem[]>([]);
  const [connectedPrinter, setConnectedPrinter] = useState<BluetoothDeviceItem | null>(null);
  const [isScanningBT, setIsScanningBT] = useState(false);

  // Backup state
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Secure Action Hook
  const {
    pinModalVisible,
    actionTitle,
    hintText,
    executeSecureAction,
    handlePinSuccess,
    handlePinClose,
  } = useSecureAction();

  const loadPromosData = useCallback(async () => {
    try {
      const list = await getAllPromos();
      setPromosList(list);
    } catch (e) {
      console.error("Gagal load promos:", e);
    }
  }, []);

  const loadAllSettings = useCallback(async () => {
    const sName = await getSetting("store_name", "POS Offline Pro");
    const bType = await getSetting("store_business_type", "Jenis toko");
    const sAddr = await getSetting("store_address", "Jl. Alamat No 99 Makassar");
    const sPhone = await getSetting("store_phone", "08111111111");
    const sLogo = await getSetting("store_logo", "");
    const sQris = await getSetting("store_qris", "");
    const sQrisPayload = await getSetting("store_qris_payload", DEFAULT_BASE_QRIS);
    const sFooter = await getSetting("store_receipt_footer", "Terima Kasih Atas Kunjungan Anda!");
    const sCashier = await getSetting("active_cashier_name", "Kasir 1");

    const pinActive = await getSetting("is_pin_active", "0");

    const fTable = await getSetting("feature_table_number", "0");
    const fCustomer = await getSetting("feature_customer", "0");
    const fOpenBill = await getSetting("feature_open_bill", "0");
    const fBarcode = await getSetting("feature_barcode", "1");
    const fVariants = await getSetting("feature_variants", "1");
    const fAutoPrint = await getSetting("feature_auto_print", "0");
    const fPpn = await getSetting("feature_ppn", "1");
    const pRate = await getSetting("ppn_rate", "11");
    const fPromo = await getSetting("feature_promo", "1");

    setStoreName(sName);
    setBusinessType(bType);
    setStoreAddress(sAddr);
    setStorePhone(sPhone);
    setStoreLogo(sLogo);
    setStoreQris(sQris);
    setStoreQrisPayload(sQrisPayload || DEFAULT_BASE_QRIS);
    setReceiptFooter(sFooter);
    setActiveCashier(sCashier);

    setIsPinActive(pinActive === "1");

    setFeatureTable(fTable === "1");
    setFeatureCustomer(fCustomer === "1");
    setFeatureOpenBill(fOpenBill === "1");
    setFeatureBarcode(fBarcode === "1");
    setFeatureVariants(fVariants === "1");
    setFeatureAutoPrint(fAutoPrint === "1");
    setFeaturePpn(fPpn === "1");
    setPpnRate(pRate);
    setFeaturePromo(fPromo === "1");
  }, []);

  const loadReportData = useCallback(async () => {
    try {
      const summary = await getFinancialSummary(reportPeriod, customStartDate, customEndDate);
      setReportStats(summary);

      const prods = await getTopProducts(reportPeriod, 5, customStartDate, customEndDate);
      setTopProducts(prods);

      const peak = await getPeakHoursAnalysis(reportPeriod, customStartDate, customEndDate);
      setPeakHours(peak);

      const trxs = await getTransactionsForReport(reportPeriod, customStartDate, customEndDate);
      setReportTransactions(trxs);
    } catch (e) {
      console.log("Load report error:", e);
    }
  }, [reportPeriod, customStartDate, customEndDate]);

  // Real-time automatic synchronization on tab focus
  useFocusEffect(
    useCallback(() => {
      loadAllSettings();
      loadPromosData();
      loadReportData();
      checkConnectedPrinter();
    }, [loadAllSettings, loadPromosData, loadReportData])
  );

  const checkConnectedPrinter = async () => {
    const dev = await PrinterService.getConnectedPrinter();
    if (dev) {
      setConnectedPrinter(dev);
    }
  };

  useEffect(() => {
    if (activeSubpage === "laporan") {
      loadReportData();
    }
    if (activeSubpage === "promos") {
      loadPromosData();
    }
  }, [activeSubpage, loadReportData, loadPromosData]);

  // Upload Logo & QRIS with Auto-Compression and Auto QR Decoding
  const handlePickStoreImage = async (type: "logo" | "qris") => {
    try {
      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async (e: any) => {
          const file = e.target?.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
              const rawBase64 = event.target?.result as string;
              if (type === "logo") {
                const monoCompressed = await compressAndConvertToMonochromeBase64(rawBase64, 260);
                setStoreLogo(monoCompressed);
                await setSetting("store_logo", monoCompressed);
              } else {
                const compressed = await compressAndConvertToBase64(rawBase64, 400, 0.65);
                setStoreQris(compressed);
                await setSetting("store_qris", compressed);

                // Auto decode QR from uploaded image
                try {
                  const decoded =
                    (await decodeQrFromImage(rawBase64)) ||
                    (await decodeQrFromImage(compressed));
                  if (decoded && decoded.length > 20) {
                    setStoreQrisPayload(decoded);
                    await setSetting("store_qris_payload", decoded);
                    const meta = parseQrisMetadata(decoded);
                    Alert.alert(
                      "QRIS Berhasil Dipindai",
                      `Data QRIS Berhasil Diekstrak:\nNama: ${meta.merchantName}\nNMID: ${meta.nmid}\nKota: ${meta.merchantCity}`
                    );
                  }
                } catch (e) {
                  console.warn("Decode QR warning:", e);
                }
              }
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Izin Ditolak", "Akses galeri foto diperlukan untuk mengunggah gambar.");
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.7,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const rawUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
          if (type === "logo") {
            const monoCompressed = await compressAndConvertToMonochromeBase64(rawUri, 260);
            setStoreLogo(monoCompressed);
            await setSetting("store_logo", monoCompressed);
          } else {
            const compressed = await compressAndConvertToBase64(rawUri, 400, 0.65);
            setStoreQris(compressed);
            await setSetting("store_qris", compressed);

            try {
              const decoded =
                (await decodeQrFromImage(rawUri)) ||
                (await decodeQrFromImage(compressed));
              if (decoded && decoded.length > 20) {
                setStoreQrisPayload(decoded);
                await setSetting("store_qris_payload", decoded);
                const meta = parseQrisMetadata(decoded);
                Alert.alert(
                  "QRIS Berhasil Dipindai",
                  `Data QRIS Berhasil Diekstrak:\nNama: ${meta.merchantName}\nNMID: ${meta.nmid}\nKota: ${meta.merchantCity}`
                );
              }
            } catch (e) {
              console.warn("Decode QR warning:", e);
            }
          }
        }
      }
    } catch (err: any) {
      Alert.alert("Gagal Memilih Gambar", err.message || "Terjadi kesalahan.");
    }
  };

  // Secure toggle for features
  const handleToggleFeatureWithPin = (key: string, val: boolean, setter: (v: boolean) => void) => {
    executeSecureAction(async () => {
      setter(val);
      await setSetting(key, val ? "1" : "0");
    }, "Masukkan PIN Supervisor untuk mengubah pengaturan fitur");
  };

  // Save Store Profile
  const handleSaveStoreProfile = () => {
    executeSecureAction(async () => {
      await setSetting("store_name", storeName);
      await setSetting("store_business_type", businessType);
      await setSetting("store_address", storeAddress);
      await setSetting("store_phone", storePhone);
      await setSetting("store_receipt_footer", receiptFooter);
      await setSetting("store_qris_payload", storeQrisPayload);
      await setSetting("active_cashier_name", activeCashier.trim() || "Kasir 1");
      Alert.alert("Sukses", "Profil toko, kasir shift & payload QRIS berhasil disimpan.");
    }, "Masukkan PIN Supervisor untuk menyimpan profil toko");
  };

  // Save PPN Rate
  const handleSavePpnRate = async (rate: string) => {
    setPpnRate(rate);
    await setSetting("ppn_rate", rate);
  };

  // Bluetooth Search & Connect
  const handleSearchPrinters = async () => {
    setIsScanningBT(true);
    try {
      const list = await PrinterService.searchBluetoothPrinters();
      setDiscoveredPrinters(list);
    } finally {
      setIsScanningBT(false);
    }
  };

  const handleConnectPrinter = async (device: BluetoothDeviceItem) => {
    await PrinterService.connectBluetoothPrinter(device);
    setConnectedPrinter({ ...device, connected: true });
    Alert.alert("Printer Terhubung", `Printer "${device.name}" berhasil disambungkan.`);
  };

  const handleDisconnectPrinter = async () => {
    await PrinterService.disconnectBluetoothPrinter();
    setConnectedPrinter(null);
    Alert.alert("Printer Terputus", "Koneksi printer telah dinonaktifkan.");
  };

  const handleTestPrint = async () => {
    const ok = await PrinterService.testPrint58mm();
    if (ok) {
      Alert.alert("Sukses", "Test print 58mm berhasil dikirim ke printer.");
    } else {
      Alert.alert("Gagal", "Printer tidak merespon. Pastikan Bluetooth aktif.");
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    setIsExportingCSV(true);
    try {
      const transactions = await getTransactionsForReport(
        reportPeriod,
        customStartDate,
        customEndDate
      );
      const periodLabel =
        reportPeriod === "today"
          ? "Hari_Ini"
          : reportPeriod === "7days"
          ? "7_Hari"
          : reportPeriod === "30days"
          ? "30_Hari"
          : `${customStartDate}_sd_${customEndDate}`;

      const res = await exportReportToCSV(reportStats, transactions, periodLabel);
      if (res.success) {
        Alert.alert("Export CSV Berhasil!", `File ${res.fileName} berhasil diekspor.`);
      }
    } catch (err: any) {
      Alert.alert("Gagal Export CSV", err.message || "Terjadi kesalahan.");
    } finally {
      setIsExportingCSV(false);
    }
  };

  // Export DB
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

  // Import DB
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

  // Save PIN
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
    await setSetting("is_pin_active", "1");
    setIsPinActive(true);
    setPinChangeVisible(false);
    setNewPin("");
    setConfirmPin("");
    Alert.alert("Berhasil", "PIN Supervisor 4-digit berhasil disimpan.\n\nCatatan: Tolong owner dicatat PIN nya di WA atau di catatan HP.");
  };

  // Laporan CRUD Handlers (Protected by PIN)
  const handleOpenCreateManualLaporan = () => {
    executeSecureAction(() => {
      setSelectedTrxForEdit(null);
      setFormModalVisible(true);
    }, "Masukkan PIN Supervisor untuk menambah data transaksi manual");
  };

  const handleOpenEditLaporan = (trx: Transaction) => {
    executeSecureAction(() => {
      setSelectedTrxForEdit(trx);
      setFormModalVisible(true);
    }, "Masukkan PIN Supervisor untuk mengubah data transaksi");
  };

  const handleDeleteLaporan = (trx: Transaction) => {
    executeSecureAction(() => {
      Alert.alert(
        "Hapus Transaksi dari Laporan",
        `Hapus transaksi ${trx.invoice_no || trx.id}? Omset laporan akan dikurangi dan stok dikembalikan.`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Hapus",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteTransaction(trx.id, true);
                await loadReportData();
                Alert.alert("Sukses", "Transaksi berhasil dihapus dari laporan.");
              } catch (e: any) {
                Alert.alert("Gagal", e.message || "Gagal menghapus transaksi.");
              }
            },
          },
        ]
      );
    }, "Masukkan PIN Supervisor untuk menghapus transaksi");
  };

  // Promo CRUD Handlers (Protected by PIN)
  const handleOpenCreatePromo = () => {
    executeSecureAction(() => {
      setSelectedPromoForEdit(null);
      setPromoFormVisible(true);
    }, "Masukkan PIN Supervisor untuk membuat promo baru");
  };

  const handleOpenEditPromo = (promo: Promo) => {
    executeSecureAction(() => {
      setSelectedPromoForEdit(promo);
      setPromoFormVisible(true);
    }, "Masukkan PIN Supervisor untuk mengubah promo");
  };

  const handleTogglePromoStatus = (promo: Promo, newStatus: boolean) => {
    executeSecureAction(async () => {
      await togglePromoStatus(promo.id, newStatus);
      await loadPromosData();
    }, "Masukkan PIN Supervisor untuk mengubah status promo");
  };

  const handleDeletePromo = (promo: Promo) => {
    executeSecureAction(() => {
      Alert.alert(
        "Hapus Promo",
        `Hapus promo "${promo.name}"?`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Hapus",
            style: "destructive",
            onPress: async () => {
              try {
                await deletePromo(promo.id);
                await loadPromosData();
                Alert.alert("Sukses", "Promo berhasil dihapus.");
              } catch (e: any) {
                Alert.alert("Gagal", e.message || "Gagal menghapus promo.");
              }
            },
          },
        ]
      );
    }, "Masukkan PIN Supervisor untuk menghapus promo");
  };

  const handleSavePromo = async (data: PromoInput, id?: string) => {
    if (id) {
      await updatePromo(id, data);
    } else {
      await createPromo(data);
    }
    await loadPromosData();
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
              : activeSubpage === "promos"
              ? "Promo & Diskon"
              : activeSubpage === "toko"
              ? "Atur Toko"
              : activeSubpage === "aplikasi"
              ? "Pengaturan Aplikasi"
              : "Pengaturan"}
          </Text>
        </View>
      </View>

      {/* Main Pengaturan Menu List */}
      {activeSubpage === null && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
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
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b" }}>
                    Printer
                  </Text>
                  {connectedPrinter && (
                    <Text style={{ fontSize: 10, color: "#16a34a", fontWeight: "600" }}>
                      ● {connectedPrinter.name}
                    </Text>
                  )}
                </View>
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
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b" }}>
                    Keamanan PIN
                  </Text>
                  <Text style={{ fontSize: 10, color: isPinActive ? "#16a34a" : "#71717a" }}>
                    {isPinActive ? "● PIN Aktif" : "○ Nonaktif"}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="#a1a1aa" />
            </TouchableOpacity>

            {/* 5. Promo & Diskon */}
            <TouchableOpacity
              onPress={() => setActiveSubpage("promos")}
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
                  <Tag size={20} color="#0097A7" />
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b" }}>
                    Promo & Diskon
                  </Text>
                  <Text style={{ fontSize: 10, color: "#71717a" }}>
                    Beli 2 gratis 1, diskon combo & min. belanja
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="#a1a1aa" />
            </TouchableOpacity>

            {/* 6. Atur Toko */}
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

      {/* Subpage 1: Laporan with Complete CRUD & Real Minute Peak Hours */}
      {activeSubpage === "laporan" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Period Filter Tabs */}
          <View
            style={{
              flexDirection: "row",
              padding: 4,
              backgroundColor: "#e4e4e7",
              borderRadius: 16,
              marginBottom: 12,
            }}
          >
            {(["today", "7days", "30days", "custom"] as ReportPeriod[]).map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => {
                  setReportPeriod(period);
                  if (period === "custom") {
                    setShowCustomDateModal(true);
                  }
                }}
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
                    fontSize: 11,
                    fontWeight: "700",
                    color: reportPeriod === period ? "#ffffff" : "#52525b",
                  }}
                >
                  {period === "today"
                    ? "Hari Ini"
                    : period === "7days"
                    ? "7 Hari"
                    : period === "30days"
                    ? "30 Hari"
                    : "Kustom 📅"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Date Info Banner */}
          {reportPeriod === "custom" && (
            <TouchableOpacity
              onPress={() => setShowCustomDateModal(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#ecfeff",
                padding: 10,
                borderRadius: 14,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "#a5f3fc",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Calendar size={15} color="#0097A7" />
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7", marginLeft: 6 }}>
                  Periode: {customStartDate} s/d {customEndDate}
                </Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7" }}>Ubah Tanggal</Text>
            </TouchableOpacity>
          )}

          {/* Action Row: Export CSV & Catat Transaksi Manual */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={handleExportCSV}
              disabled={isExportingCSV}
              activeOpacity={0.8}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffffff",
                paddingVertical: 10,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              {isExportingCSV ? (
                <ActivityIndicator size="small" color="#0097A7" />
              ) : (
                <>
                  <FileSpreadsheet size={15} color="#0097A7" />
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7", marginLeft: 6 }}>
                    Export CSV
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenCreateManualLaporan}
              activeOpacity={0.8}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#0097A7",
                paddingVertical: 10,
                borderRadius: 14,
                shadowColor: "#0097A7",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Plus size={15} color="#ffffff" />
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#ffffff", marginLeft: 6 }}>
                + Catat Manual
              </Text>
            </TouchableOpacity>
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
                Ringkasan Finansial
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
                Belum ada data transaksi pada periode ini
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

          {/* Jam Sibuk Card (Minute by Minute Local Device Timestamps) */}
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
                Waktu Transaksi Riil & Jam Sibuk
              </Text>
            </View>

            {peakHours.map((h, idx) => (
              <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginVertical: 5 }}>
                <Text style={{ width: 48, fontSize: 11, fontFamily: "monospace", color: "#71717a" }}>
                  {h.timeLabel}
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
                <View style={{ width: 110, alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: h.isPeak ? "#0097A7" : "#3f3f46" }}>
                    {formatRupiah(h.totalOmset)}
                  </Text>
                  {h.transactionCount > 0 && (
                    <Text style={{ fontSize: 9, color: "#71717a" }}>
                      {h.transactionCount} trx {h.invoiceNo ? `(${h.invoiceNo.split("-")[2] || ""})` : ""}
                    </Text>
                  )}
                </View>
              </View>
            ))}

            {peakHourRecord && peakHourRecord.transactionCount > 0 && (
              <Text style={{ fontSize: 11, color: "#0097A7", marginTop: 8, fontWeight: "700" }}>
                * Transaksi tertinggi pada: {peakHourRecord.timeLabel} ({formatRupiah(peakHourRecord.totalOmset)})
              </Text>
            )}
          </View>

          {/* Daftar Transaksi Laporan (CRUD with PIN) */}
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
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Receipt size={18} color="#0097A7" />
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b", marginLeft: 8 }}>
                  Daftar Transaksi Periode Ini ({reportTransactions.length})
                </Text>
              </View>
            </View>

            {reportTransactions.length === 0 ? (
              <Text style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", paddingVertical: 16 }}>
                Tidak ada transaksi pada periode ini
              </Text>
            ) : (
              reportTransactions.map((trx) => (
                <View
                  key={trx.id}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f4f4f5",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", fontFamily: "monospace", color: "#18181b" }}>
                        {trx.invoice_no || trx.id}
                      </Text>
                      <View style={{ marginLeft: 6, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, backgroundColor: "#ecfeff" }}>
                        <Text style={{ fontSize: 9, fontWeight: "700", color: "#0097A7" }}>
                          {trx.payment_method || "CASH"}
                        </Text>
                      </View>
                    </View>

                    {/* CRUD Action Buttons for Owner */}
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedTrxForDetail(trx);
                          setDetailModalVisible(true);
                        }}
                        style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: "#f4f4f5", alignItems: "center", justifyContent: "center" }}
                      >
                        <Eye size={12} color="#52525b" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleOpenEditLaporan(trx)}
                        style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: "#ecfeff", alignItems: "center", justifyContent: "center" }}
                      >
                        <Edit2 size={12} color="#0097A7" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDeleteLaporan(trx)}
                        style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center" }}
                      >
                        <Trash2 size={12} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 10, color: "#71717a" }}>
                      {new Date(trx.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} • {new Date(trx.created_at).toLocaleDateString("id-ID")}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: "800", color: "#18181b" }}>
                        {formatRupiah(trx.omset)}
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: "600", color: "#16a34a" }}>
                        +{formatRupiah(trx.laba_kotor)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Subpage 2: Printer */}
      {activeSubpage === "printer" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
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
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Printer size={20} color="#0097A7" />
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#18181b", marginLeft: 8 }}>
                  Status Printer Thermal 58mm
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: connectedPrinter ? "#f0fdf4" : "#fef2f2",
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: connectedPrinter ? "#16a34a" : "#ef4444" }}>
                  {connectedPrinter ? "Terhubung" : "Belum Terhubung"}
                </Text>
              </View>
            </View>

            {connectedPrinter ? (
              <View
                style={{
                  padding: 12,
                  borderRadius: 16,
                  backgroundColor: "#f0fdf4",
                  borderWidth: 1,
                  borderColor: "#bbf7d0",
                  marginBottom: 14,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#15803d" }}>
                  {connectedPrinter.name}
                </Text>
                <Text style={{ fontSize: 11, color: "#166534", marginTop: 2 }}>
                  ID / MAC: {connectedPrinter.address || connectedPrinter.id}
                </Text>
              </View>
            ) : (
              <Text style={{ fontSize: 12, color: "#71717a", marginBottom: 14, lineHeight: 18 }}>
                Nyalakan printer thermal Bluetooth Anda, lalu tekan tombol "Cari Printer Bluetooth" di bawah.
              </Text>
            )}

            <TouchableOpacity
              onPress={handleTestPrint}
              activeOpacity={0.8}
              style={{
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: "#0097A7",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff" }}>
                Test Cetak Struk 58mm
              </Text>
            </TouchableOpacity>

            {connectedPrinter && (
              <TouchableOpacity
                onPress={handleDisconnectPrinter}
                activeOpacity={0.8}
                style={{
                  paddingVertical: 10,
                  borderRadius: 14,
                  backgroundColor: "#fef2f2",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#ef4444" }}>
                  Putuskan Koneksi Printer
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bluetooth Scanner */}
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
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Bluetooth size={18} color="#0097A7" />
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b", marginLeft: 8 }}>
                  Pindai Perangkat Bluetooth
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleSearchPrinters}
                disabled={isScanningBT}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  backgroundColor: "#ecfeff",
                  borderWidth: 1,
                  borderColor: "#a5f3fc",
                }}
              >
                {isScanningBT ? (
                  <ActivityIndicator size="small" color="#0097A7" />
                ) : (
                  <>
                    <RefreshCw size={12} color="#0097A7" />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7", marginLeft: 4 }}>
                      Pindai Ulang
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {discoveredPrinters.length === 0 ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <Text style={{ fontSize: 12, color: "#71717a", textAlign: "center" }}>
                  Klik "Pindai Ulang" untuk mendeteksi printer Bluetooth yang aktif di sekitar Anda.
                </Text>
              </View>
            ) : (
              discoveredPrinters.map((p) => {
                const isThisConnected = connectedPrinter?.id === p.id;
                return (
                  <View
                    key={p.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 12,
                      borderRadius: 14,
                      backgroundColor: isThisConnected ? "#f0fdf4" : "#f9fafb",
                      borderWidth: 1,
                      borderColor: isThisConnected ? "#86efac" : "#e5e7eb",
                      marginBottom: 8,
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181b" }}>
                        {p.name}
                      </Text>
                      <Text style={{ fontSize: 10, color: "#71717a" }}>
                        {p.address || p.id}
                      </Text>
                    </View>

                    {isThisConnected ? (
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <CheckCircle2 size={16} color="#16a34a" />
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#16a34a", marginLeft: 4 }}>
                          Aktif
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleConnectPrinter(p)}
                        style={{
                          backgroundColor: "#0097A7",
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 10,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#ffffff" }}>
                          Sambungkan
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* Subpage 3: Manajemen Data */}
      {activeSubpage === "manajemen_data" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
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
              Ekspor seluruh data produk (beserta foto), kategori, transaksi, dan pengaturan untuk dicadangkan atau dipindahkan antar perangkat tanpa internet.
            </Text>

            <TouchableOpacity
              onPress={handleExport}
              disabled={isExporting}
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
              {isExporting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Download size={16} color="#ffffff" />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff", marginLeft: 8 }}>
                    Backup Data (Export Database)
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleImport}
              disabled={isImporting}
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
              {isImporting ? (
                <ActivityIndicator size="small" color="#0097A7" />
              ) : (
                <>
                  <Upload size={16} color="#0097A7" />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#3f3f46", marginLeft: 8 }}>
                    Pulihkan Data (Import Database)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Subpage 4: Keamanan PIN with Owner Reminder Note */}
      {activeSubpage === "pin" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Important Owner Note Banner */}
          <View
            style={{
              padding: 14,
              borderRadius: 18,
              backgroundColor: "#fffbeb",
              borderWidth: 1,
              borderColor: "#fde68a",
              marginBottom: 16,
              flexDirection: "row",
              alignItems: "flex-start",
            }}
          >
            <AlertTriangle size={18} color="#d97706" style={{ marginTop: 2, marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#b45309" }}>
                Penting untuk Owner:
              </Text>
              <Text style={{ fontSize: 12, color: "#92400e", marginTop: 2, lineHeight: 18 }}>
                tolong owner dicatat pin nya di wa atau di catatan hp agar tidak lupa.
              </Text>
            </View>
          </View>

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
                  Jika aktif, menghapus produk, memulihkan database, dan mengubah pengaturan memerlukan PIN Supervisor
                </Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: "700", color: isPinActive ? "#16a34a" : "#a1a1aa" }}>
                {isPinActive ? "Aktif" : "Nonaktif"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (isPinActive) {
                  executeSecureAction(
                    async () => {
                      await setSetting("is_pin_active", "0");
                      setIsPinActive(false);
                      Alert.alert("Sukses", "PIN Keamanan telah dinonaktifkan.");
                    },
                    "Masukkan PIN Supervisor untuk menonaktifkan keamanan PIN",
                    "tolong owner dicatat pin nya di wa atau di catatan hp"
                  );
                } else {
                  setNewPin("");
                  setConfirmPin("");
                  setPinChangeVisible(true);
                }
              }}
              activeOpacity={0.8}
              style={{
                paddingVertical: 12,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 12,
                backgroundColor: isPinActive ? "#fef2f2" : "#0097A7",
                borderWidth: isPinActive ? 1 : 0,
                borderColor: "#fca5a5",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: isPinActive ? "#ef4444" : "#ffffff" }}>
                {isPinActive ? "Nonaktifkan PIN" : "Aktifkan PIN"}
              </Text>
            </TouchableOpacity>

            {isPinActive && (
              <TouchableOpacity
                onPress={() => {
                  executeSecureAction(
                    () => {
                      setNewPin("");
                      setConfirmPin("");
                      setPinChangeVisible(true);
                    },
                    "Masukkan PIN Supervisor lama untuk mengganti PIN baru",
                    "tolong owner dicatat pin nya di wa atau di catatan hp"
                  );
                }}
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

      {/* Subpage 5: Promo & Diskon */}
      {activeSubpage === "promos" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Action Button: Tambah Promo Baru */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#18181b" }}>
                Daftar Promo & Diskon
              </Text>
              <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>
                Promo otomatis terhitung saat bertransaksi di kasir
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleOpenCreatePromo}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 16,
                backgroundColor: "#0097A7",
                shadowColor: "#0097A7",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Plus size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff" }}>
                Tambah Promo
              </Text>
            </TouchableOpacity>
          </View>

          {/* List of Promos */}
          {promosList.length === 0 ? (
            <View
              style={{
                padding: 32,
                borderRadius: 24,
                backgroundColor: "#ffffff",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <Tag size={40} color="#a1a1aa" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#27272a", marginTop: 12 }}>
                Belum Ada Promo
              </Text>
              <Text style={{ fontSize: 11, color: "#71717a", marginTop: 4, textAlign: "center", maxWidth: 280 }}>
                Buat promo seperti Beli 3 Mie Instan Diskon Rp 2.000 atau Beli 2 Gratis 1 untuk menarik pelanggan.
              </Text>
              <TouchableOpacity
                onPress={handleOpenCreatePromo}
                style={{
                  marginTop: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 14,
                  backgroundColor: "#ecfeff",
                  borderWidth: 1,
                  borderColor: "#0097A7",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#0097A7" }}>
                  + Buat Promo Pertama
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            promosList.map((promo) => {
              const isB2G1 = promo.promo_type === "BUY_X_GET_Y";
              const isCombo = promo.promo_type === "COMBO_DISCOUNT";
              const isMinSpend = promo.promo_type === "MIN_SPEND";

              const badgeColor = isB2G1 ? "#059669" : isCombo ? "#0097A7" : "#d97706";
              const badgeBg = isB2G1 ? "#ecfdf5" : isCombo ? "#ecfeff" : "#fffbeb";
              const typeLabel = isB2G1
                ? "🎁 Beli X Gratis Y"
                : isCombo
                ? "% Diskon Bundling / Grosir"
                : "💰 Minimal Belanja";

              let ruleText = "";
              if (isB2G1) {
                ruleText = `Beli ${promo.min_qty} Gratis ${promo.reward_free_qty} (${promo.target_name || "Semua Produk"})`;
              } else if (isCombo) {
                const discText = promo.discount_amount > 0 ? formatRupiah(promo.discount_amount) : `${promo.discount_percent}%`;
                ruleText = `Beli min. ${promo.min_qty} pcs ${promo.target_name || "item"} diskon ${discText}`;
              } else if (isMinSpend) {
                const discText = promo.discount_amount > 0 ? formatRupiah(promo.discount_amount) : `${promo.discount_percent}%`;
                ruleText = `Belanja min. ${formatRupiah(promo.min_spend)} diskon ${discText}`;
              }

              return (
                <View
                  key={promo.id}
                  style={{
                    padding: 16,
                    borderRadius: 20,
                    backgroundColor: "#ffffff",
                    borderWidth: 1,
                    borderColor: promo.is_active ? "#e5e7eb" : "#f4f4f5",
                    marginBottom: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 2,
                    elevation: 1,
                    opacity: promo.is_active ? 1 : 0.65,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 8,
                            backgroundColor: badgeBg,
                            marginRight: 8,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: "700", color: badgeColor }}>
                            {typeLabel}
                          </Text>
                        </View>
                        {promo.target_type !== "ALL" && (
                          <Text style={{ fontSize: 10, color: "#71717a" }}>
                            Target: {promo.target_name}
                          </Text>
                        )}
                      </View>

                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b" }}>
                        {promo.name}
                      </Text>

                      <Text style={{ fontSize: 12, fontWeight: "600", color: "#0097A7", marginTop: 4 }}>
                        {ruleText}
                      </Text>
                    </View>

                    {/* Switch Active */}
                    <Switch
                      value={promo.is_active === 1}
                      onValueChange={(val) => handleTogglePromoStatus(promo, val)}
                      trackColor={{ false: "#e4e4e7", true: "#0097A7" }}
                    />
                  </View>

                  {/* Actions: Edit & Delete */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      marginTop: 12,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: "#f4f4f5",
                      gap: 8,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => handleOpenEditPromo(promo)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 10,
                        backgroundColor: "#f4f4f5",
                      }}
                    >
                      <Edit2 size={13} color="#52525b" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 11, fontWeight: "600", color: "#52525b" }}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeletePromo(promo)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 10,
                        backgroundColor: "#fef2f2",
                      }}
                    >
                      <Trash2 size={13} color="#ef4444" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 11, fontWeight: "600", color: "#ef4444" }}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Subpage 6: Atur Toko */}
      {activeSubpage === "toko" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
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
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#18181b", marginBottom: 8 }}>Logo Toko</Text>
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
                    Logo akan dicetak di bagian atas struk thermal
                  </Text>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => handlePickStoreImage("logo")}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                        backgroundColor: "#ecfeff",
                        borderWidth: 1,
                        borderColor: "#a5f3fc",
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7" }}>Ganti Logo</Text>
                    </TouchableOpacity>
                    {storeLogo ? (
                      <TouchableOpacity
                        onPress={async () => {
                          setStoreLogo("");
                          await setSetting("store_logo", "");
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
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#18181b", marginBottom: 8 }}>Foto QRIS Toko</Text>
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
                    overflow: "hidden",
                  }}
                >
                  <Image
                    source={{
                      uri: storeQris || "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=STORE_QRIS_OFFLINE_PRO",
                    }}
                    style={{ width: 50, height: 50 }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 8 }}>
                    QRIS toko dinamis dengan nominal transaksi otomatis
                  </Text>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => handlePickStoreImage("qris")}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                        backgroundColor: "#ecfeff",
                        borderWidth: 1,
                        borderColor: "#a5f3fc",
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7" }}>Ganti QRIS</Text>
                    </TouchableOpacity>
                    {storeQris ? (
                      <TouchableOpacity
                        onPress={async () => {
                          setStoreQris("");
                          await setSetting("store_qris", "");
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

              {/* Detected Merchant & NMID badge */}
              {(() => {
                const meta = parseQrisMetadata(storeQrisPayload || DEFAULT_BASE_QRIS);
                return (
                  <View
                    style={{
                      marginTop: 10,
                      padding: 10,
                      borderRadius: 12,
                      backgroundColor: "#f0fdf4",
                      borderWidth: 1,
                      borderColor: "#bbf7d0",
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontSize: 11, fontWeight: "800", color: "#166534" }}>
                        ✓ QRIS Terdeteksi: {meta.merchantName}
                      </Text>
                      <TouchableOpacity onPress={() => setShowPayloadInput(!showPayloadInput)}>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: "#0097A7" }}>
                          {showPayloadInput ? "Sembunyikan" : "Lihat Payload"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 10, color: "#15803d", marginTop: 2 }}>
                      NMID: {meta.nmid} • Kota: {meta.merchantCity}
                    </Text>

                    {showPayloadInput && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 9, fontWeight: "700", color: "#374151", marginBottom: 2 }}>
                          Teks Kode QRIS (EMVCo String Payload):
                        </Text>
                        <TextInput
                          value={storeQrisPayload}
                          onChangeText={setStoreQrisPayload}
                          multiline
                          placeholder="000201010211..."
                          style={{
                            backgroundColor: "#ffffff",
                            borderWidth: 1,
                            borderColor: "#cbd5e1",
                            borderRadius: 8,
                            padding: 8,
                            fontSize: 10,
                            color: "#1e293b",
                            fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                            maxHeight: 70,
                          }}
                        />
                      </View>
                    )}
                  </View>
                );
              })()}
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

              <Text style={{ fontSize: 11, color: "#71717a", marginTop: 12, marginBottom: 4 }}>
                Ucapan Struk (Footer Pesan)
              </Text>
              <TextInput
                value={receiptFooter}
                onChangeText={setReceiptFooter}
                placeholder="Terima Kasih Atas Kunjungan Anda!"
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

              <Text style={{ fontSize: 11, color: "#71717a", marginTop: 12, marginBottom: 4 }}>
                Nama Kasir / Shift Aktif (Default)
              </Text>
              <TextInput
                value={activeCashier}
                onChangeText={setActiveCashier}
                placeholder="Kasir 1 / Siti / Zaidan"
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

      {/* Subpage 6: Pengaturan Aplikasi */}
      {activeSubpage === "aplikasi" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
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
                  Tampilkan input/pemilihan nomor meja saat transaksi dan cetak di struk
                </Text>
              </View>
              <Switch
                value={featureTable}
                onValueChange={(val) => handleToggleFeatureWithPin("feature_table_number", val, setFeatureTable)}
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
                  Tampilkan nama/identitas pelanggan saat transaksi dan cetak di struk
                </Text>
              </View>
              <Switch
                value={featureCustomer}
                onValueChange={(val) => handleToggleFeatureWithPin("feature_customer", val, setFeatureCustomer)}
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
                  Tampilkan tombol simpan open bill (pesanan gantung / bayar nanti)
                </Text>
              </View>
              <Switch
                value={featureOpenBill}
                onValueChange={(val) => handleToggleFeatureWithPin("feature_open_bill", val, setFeatureOpenBill)}
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
                  Tampilkan tombol scanner barcode toko & supermarket
                </Text>
              </View>
              <Switch
                value={featureBarcode}
                onValueChange={(val) => handleToggleFeatureWithPin("feature_barcode", val, setFeatureBarcode)}
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
                  Kelola dan pilih varian rasa/ukuran pada transaksi kasir
                </Text>
              </View>
              <Switch
                value={featureVariants}
                onValueChange={(val) => handleToggleFeatureWithPin("feature_variants", val, setFeatureVariants)}
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
                  Otomatis kirim struk ke printer Bluetooth sesaat setelah transaksi selesai
                </Text>
              </View>
              <Switch
                value={featureAutoPrint}
                onValueChange={(val) => handleToggleFeatureWithPin("feature_auto_print", val, setFeatureAutoPrint)}
                trackColor={{ false: "#e4e4e7", true: "#0097A7" }}
              />
            </View>

            {/* 7. Pajak PPN */}
            <View style={{ paddingVertical: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181b" }}>
                    Pajak PPN
                  </Text>
                  <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2, lineHeight: 16 }}>
                    Hitung PPN otomatis pada setiap transaksi
                  </Text>
                </View>
                <Switch
                  value={featurePpn}
                  onValueChange={(val) => handleToggleFeatureWithPin("feature_ppn", val, setFeaturePpn)}
                  trackColor={{ false: "#e4e4e7", true: "#0097A7" }}
                />
              </View>

              {featurePpn && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 10,
                    padding: 10,
                    backgroundColor: "#f9fafb",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                  }}
                >
                  <Percent size={16} color="#0097A7" />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#3f3f46", marginLeft: 6, flex: 1 }}>
                    Persentase Tarif PPN:
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TextInput
                      value={ppnRate}
                      onChangeText={handleSavePpnRate}
                      keyboardType="numeric"
                      maxLength={3}
                      style={{
                        backgroundColor: "#ffffff",
                        borderWidth: 1,
                        borderColor: "#0097A7",
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        fontSize: 13,
                        fontWeight: "700",
                        color: "#18181b",
                        width: 44,
                        textAlign: "center",
                      }}
                    />
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181b", marginLeft: 4 }}>%</Text>
                  </View>
                </View>
              )}
            </View>

            {/* 8. Fitur Promo & Diskon */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f4f4f5" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181b" }}>
                  Fitur Promo & Diskon
                </Text>
                <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2, lineHeight: 16 }}>
                  Hitung otomatis diskon beli 2 gratis 1 & promo bundling saat transaksi kasir
                </Text>
              </View>
              <Switch
                value={featurePromo}
                onValueChange={(val) => handleToggleFeatureWithPin("feature_promo", val, setFeaturePromo)}
                trackColor={{ false: "#e4e4e7", true: "#0097A7" }}
              />
            </View>
          </View>
        </ScrollView>
      )}

      {/* Custom Date Range Picker Modal */}
      <Modal visible={showCustomDateModal} transparent animationType="fade" onRequestClose={() => setShowCustomDateModal(false)}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)", padding: 20 }}>
          <View style={{ width: "100%", maxWidth: 360, backgroundColor: "#ffffff", borderRadius: 24, padding: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#18181b" }}>
                Pilih Rentang Tanggal
              </Text>
              <TouchableOpacity onPress={() => setShowCustomDateModal(false)}>
                <X size={18} color="#71717a" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Dari Tanggal (YYYY-MM-DD)</Text>
            <TextInput
              value={customStartDate}
              onChangeText={setCustomStartDate}
              placeholder="2026-08-01"
              style={{
                padding: 10,
                backgroundColor: "#f4f4f5",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#e4e4e7",
                fontSize: 13,
                fontWeight: "600",
                color: "#18181b",
                marginBottom: 10,
              }}
            />

            <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Sampai Tanggal (YYYY-MM-DD)</Text>
            <TextInput
              value={customEndDate}
              onChangeText={setCustomEndDate}
              placeholder="2026-08-31"
              style={{
                padding: 10,
                backgroundColor: "#f4f4f5",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#e4e4e7",
                fontSize: 13,
                fontWeight: "600",
                color: "#18181b",
                marginBottom: 16,
              }}
            />

            <TouchableOpacity
              onPress={() => {
                setShowCustomDateModal(false);
                loadReportData();
              }}
              activeOpacity={0.8}
              style={{
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: "#0097A7",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff" }}>Tampilkan Laporan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change/Set PIN Modal */}
      <Modal visible={pinChangeVisible} transparent animationType="fade" onRequestClose={() => setPinChangeVisible(false)}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)", padding: 20 }}>
          <View style={{ width: "100%", maxWidth: 360, backgroundColor: "#ffffff", borderRadius: 24, padding: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#18181b" }}>
                {isPinActive ? "Ubah PIN Supervisor" : "Aktifkan PIN Supervisor"}
              </Text>
              <TouchableOpacity onPress={() => setPinChangeVisible(false)}>
                <X size={18} color="#71717a" />
              </TouchableOpacity>
            </View>

            {/* Important Owner Note inside Modal */}
            <View
              style={{
                padding: 10,
                borderRadius: 12,
                backgroundColor: "#fffbeb",
                borderWidth: 1,
                borderColor: "#fde68a",
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 11, color: "#92400e", fontWeight: "600", textAlign: "center" }}>
                tolong owner dicatat pin nya di wa atau di catatan hp
              </Text>
            </View>

            <View style={{ marginVertical: 4 }}>
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
                placeholder="Konfirmasi PIN Baru"
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

      {/* Transaction Form Modal for Laporan CRUD */}
      <TransactionFormModal
        visible={formModalVisible}
        transaction={selectedTrxForEdit}
        onClose={() => setFormModalVisible(false)}
        onSaved={loadReportData}
      />

      {/* Transaction Detail Modal for Laporan */}
      <TransactionDetailModal
        visible={detailModalVisible}
        transaction={selectedTrxForDetail}
        onClose={() => setDetailModalVisible(false)}
      />

      {/* Promo Form Modal for Promo CRUD */}
      <PromoFormModal
        visible={promoFormVisible}
        promoToEdit={selectedPromoForEdit}
        onClose={() => setPromoFormVisible(false)}
        onSave={handleSavePromo}
      />

      {/* Secure PIN Prompt Modal */}
      <PinPromptModal
        visible={pinModalVisible}
        actionTitle={actionTitle}
        hintText={hintText}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
      />
    </SafeAreaView>
  );
}
