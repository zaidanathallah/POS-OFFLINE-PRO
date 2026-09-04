import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { ReceiptModal } from "@/components/ReceiptModal";
import { TransactionFormModal } from "@/components/TransactionFormModal";
import { TransactionDetailModal } from "@/components/TransactionDetailModal";
import { TransactionExportCsvModal } from "@/components/TransactionExportCsvModal";
import { PinPromptModal } from "@/components/PinPromptModal";
import { useSecureAction } from "@/hooks/useSecureAction";
import { Transaction } from "@/db";
import {
  getAllTransactions,
  getTransactionDetailsWithProducts,
  getTransactionsSummary,
  deleteTransaction,
} from "@/db/transactionRepository";
import { getSetting } from "@/db/settingsRepository";
import { ReceiptData } from "@/util/printerService";
import { formatRupiah } from "@/util/formatters";
import { StockMovement, StockMovementType } from "@/db";
import { getStockMovements, getStockMovementSummary } from "@/db/stockMovementRepository";
import { exportStockMovementsToCSV } from "@/util/csvExportService";
import { Package, AlertTriangle, ArrowDownRight, ArrowUpRight, RotateCcw, Download, Filter, RefreshCw, FileSpreadsheet } from "lucide-react-native";
import {
  Receipt,
  Printer,
  Inbox,
  Plus,
  Edit2,
  Trash2,
  Eye,
} from "lucide-react-native";

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({ totalOmset: 0, totalLaba: 0 });
  // Sub-Tab Switcher: 'TRANSACTIONS' or 'STOCK_MOVEMENTS'
  const [activeTab, setActiveTab] = useState<"TRANSACTIONS" | "STOCK_MOVEMENTS">("TRANSACTIONS");

  // Stock Movement State
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementFilter, setMovementFilter] = useState<StockMovementType | "ALL">("ALL");
  const [stockSummary, setStockSummary] = useState({
    totalSoldQty: 0,
    totalDamageQty: 0,
    totalExpiredQty: 0,
    totalLostQty: 0,
    totalRestockedQty: 0,
  });
  const [isExportingStock, setIsExportingStock] = useState(false);

  // Store profile
  const [storeName, setStoreName] = useState("POS Offline Pro");
  const [storeBusinessType, setStoreBusinessType] = useState("Makanan Dan Minuman");
  const [storeAddress, setStoreAddress] = useState("Jl. Alamat No 99 Makassar");
  const [storePhone, setStorePhone] = useState("08111111111");
  const [storeLogo, setStoreLogo] = useState("");
  const [storeFooter, setStoreFooter] = useState("Terima Kasih Atas Kunjungan Anda!");

  // Receipt Modal for Re-printing
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  // CRUD Modals
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [exportCsvModalVisible, setExportCsvModalVisible] = useState(false);
  const [selectedTrxForEdit, setSelectedTrxForEdit] = useState<Transaction | null>(null);
  const [selectedTrxForDetail, setSelectedTrxForDetail] = useState<Transaction | null>(null);

  // Secure Action Hook for PIN Protection
  const {
    pinModalVisible,
    actionTitle,
    hintText,
    executeSecureAction,
    handlePinSuccess,
    handlePinClose,
  } = useSecureAction();

  const handleOpenExportCsv = () => {
    executeSecureAction(
      () => setExportCsvModalVisible(true),
      "PIN Supervisor - Export CSV",
      "Masukkan PIN Supervisor untuk membuka menu export laporan transaksi CSV"
    );
  };

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
      const sType = await getSetting("store_business_type", "Makanan Dan Minuman");
      const sAddr = await getSetting("store_address", "Jl. Alamat No 99 Makassar");
      const sPhone = await getSetting("store_phone", "08111111111");
      const sLogo = await getSetting("store_logo", "");
      const sFooter = await getSetting("store_receipt_footer", "Terima Kasih Atas Kunjungan Anda!");

      setStoreName(sName);
      setStoreBusinessType(sType);
      setStoreAddress(sAddr);
      setStorePhone(sPhone);
      setStoreLogo(sLogo);
      setStoreFooter(sFooter);

      const movList = await getStockMovements({
        type: movementFilter === "ALL" ? undefined : movementFilter,
      });
      setMovements(movList);

      const movSum = await getStockMovementSummary(30);
      setStockSummary(movSum);
    } catch (err) {
      console.error("Gagal load riwayat:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Real-time automatic synchronization on tab focus
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const handleExportStockCSV = async () => {
    setIsExportingStock(true);
    try {
      const res = await exportStockMovementsToCSV(movements, movementFilter);
      if (res.success) {
        Alert.alert("Export Berhasil", `File CSV ${res.fileName} berhasil dibuat.`);
      } else {
        Alert.alert("Gagal Export", res.error || "Terjadi kesalahan.");
      }
    } catch (e: any) {
      Alert.alert("Gagal Export", e.message);
    } finally {
      setIsExportingStock(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  // 1. Create Manual Transaction (PIN Protected)
  const handleOpenCreateManual = () => {
    executeSecureAction(() => {
      setSelectedTrxForEdit(null);
      setFormModalVisible(true);
    }, "Masukkan PIN Supervisor untuk menambah transaksi manual");
  };

  // 2. Edit Transaction (PIN Protected)
  const handleOpenEditTrx = (trx: Transaction) => {
    executeSecureAction(() => {
      setSelectedTrxForEdit(trx);
      setFormModalVisible(true);
    }, "Masukkan PIN Supervisor untuk mengubah data transaksi");
  };

  // 3. Delete Transaction (PIN Protected)
  const handleDeleteTrx = (trx: Transaction) => {
    executeSecureAction(() => {
      Alert.alert(
        "Hapus / Batalkan Transaksi",
        `Apakah Anda yakin ingin menghapus transaksi ${trx.invoice_no || trx.id}? Stok produk akan dikembalikan otomatis.`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Hapus",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteTransaction(trx.id, true);
                await loadTransactions();
                Alert.alert("Sukses", "Transaksi berhasil dihapus dan stok dikembalikan.");
              } catch (e: any) {
                Alert.alert("Gagal", e.message || "Gagal menghapus transaksi.");
              }
            },
          },
        ]
      );
    }, "Masukkan PIN Supervisor untuk menghapus transaksi");
  };

  // 4. Detail Modal
  const handleOpenDetail = (trx: Transaction) => {
    setSelectedTrxForDetail(trx);
    setDetailModalVisible(true);
  };

  // Print Receipt
  const handlePrintReceipt = async (trx: Transaction) => {
    try {
      const details = await getTransactionDetailsWithProducts(trx.id);
      const txDate = new Date(trx.created_at);
      const pad = (n: number) => n.toString().padStart(2, "0");
      const formattedDate = `${txDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}, ${pad(txDate.getHours())}:${pad(txDate.getMinutes())}:${pad(txDate.getSeconds())}`;

      const receiptData: ReceiptData = {
        invoiceNumber: trx.invoice_no || trx.id,
        date: formattedDate,
        storeName: storeName,
        businessType: storeBusinessType,
        storeAddress: storeAddress,
        storePhone: storePhone,
        storeLogoUri: storeLogo || undefined,
        footerNote: storeFooter,
        items: details.map((d) => ({
          name: d.product_name || "Produk",
          qty: d.qty,
          price: d.harga_jual || (d.qty > 0 ? d.subtotal / d.qty : 0),
          subtotal: d.subtotal,
          unit: d.unit || "pcs",
        })),
        totalAmount: trx.omset,
        subtotalBeforeTax: trx.subtotal_before_tax,
        discountAmount: trx.discount_amount,
        promoName: trx.promo_name,
        ppnPercent: trx.ppn_percent,
        ppnAmount: trx.ppn_amount,
        cashTendered: trx.cash_tendered || trx.omset,
        changeAmount: trx.change_amount || 0,
        paymentMethod: trx.payment_method || "CASH",
        cashierName: trx.cashier_name || "Kasir 1",
        tableNumber: trx.table_number || undefined,
        customerName: trx.customer_name || undefined,
      };
      setSelectedReceipt(receiptData);
      setReceiptModalVisible(true);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Gagal memuat struk.");
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#F9F7F4" }}>
      {/* Header with Add Button */}
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
        <View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#18181b" }}>
            Riwayat Transaksi
          </Text>
          <Text style={{ fontSize: 12, color: "#71717a", marginTop: 1 }}>
            Daftar Struk Penjualan & Kelola Transaksi (CRUD)
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {/* Export CSV Button (Protected by PIN) */}
          <TouchableOpacity
            onPress={handleOpenExportCsv}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#ECFEFF",
              borderWidth: 1,
              borderColor: "#A5F3FC",
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 14,
            }}
          >
            <FileSpreadsheet size={14} color="#0097A7" />
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7", marginLeft: 4 }}>
              Export CSV
            </Text>
          </TouchableOpacity>

          {/* Catat Manual Button (Protected by PIN) */}
          <TouchableOpacity
            onPress={handleOpenCreateManual}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#0097A7",
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 14,
            }}
          >
            <Plus size={14} color="#ffffff" />
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#ffffff", marginLeft: 4 }}>
              Catat Manual
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transaction List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>
            Daftar Struk ({transactions.length})
          </Text>
          <Text style={{ fontSize: 12, color: "#71717a" }}>
            Total Omset: {formatRupiah(summary.totalOmset)}
          </Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#0097A7" />
          </View>
        ) : transactions.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 }}>
            <Inbox size={40} color="#9ca3af" />
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b", marginTop: 10, marginBottom: 4 }}>
              Belum Ada Transaksi
            </Text>
            <Text style={{ fontSize: 12, color: "#71717a", textAlign: "center" }}>
              Transaksi kasir yang telah selesai akan otomatis tercatat di sini dan tersimpan di database SQLite lokal.
            </Text>
          </View>
        ) : (
          transactions.map((trx) => (
            <View
              key={trx.id}
              style={{
                marginBottom: 12,
                padding: 16,
                borderRadius: 22,
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
              {/* Header Struk: Invoice, Method, & Action Icons */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: "#f4f4f5",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Receipt size={16} color="#0097A7" />
                  <Text style={{ fontSize: 13, fontWeight: "700", fontFamily: "monospace", color: "#18181b", marginLeft: 6 }}>
                    {trx.invoice_no || trx.id}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: "#ecfeff" }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#0097A7" }}>
                      {trx.payment_method || "CASH"}
                    </Text>
                  </View>

                  {/* Edit Button (PIN Protected) */}
                  <TouchableOpacity
                    onPress={() => handleOpenEditTrx(trx)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: "#f4f4f5",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Edit2 size={12} color="#0097A7" />
                  </TouchableOpacity>

                  {/* Delete Button (PIN Protected) */}
                  <TouchableOpacity
                    onPress={() => handleDeleteTrx(trx)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: "#fef2f2",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trash2 size={12} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Body Struk */}
              <View style={{ paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 11, color: "#71717a" }}>
                    {(() => {
                      const t = new Date(trx.created_at);
                      const pad = (n: number) => n.toString().padStart(2, "0");
                      return `${t.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}, ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
                    })()}
                  </Text>
                  <View style={{ backgroundColor: "#f0fdfa", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, borderWidth: 1, borderColor: "#ccfbf1" }}>
                    <Text style={{ fontSize: 9, fontWeight: "700", color: "#0d9488" }}>
                      Kasir: {trx.cashier_name || "Kasir 1"}
                    </Text>
                  </View>
                </View>
                {trx.ppn_amount && trx.ppn_amount > 0 ? (
                  <Text style={{ fontSize: 10, color: "#71717a", fontFamily: "monospace" }}>
                    PPN {trx.ppn_percent}%: {formatRupiah(trx.ppn_amount)}
                  </Text>
                ) : null}
              </View>

              {/* Financial Breakdown & Action Buttons */}
              <View
                style={{
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: "#f4f4f5",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: "#18181b" }}>
                    {formatRupiah(trx.omset)}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#16a34a", fontWeight: "600", marginTop: 1 }}>
                    Laba: +{formatRupiah(trx.laba_kotor)}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", gap: 6 }}>
                  {/* Detail Button */}
                  <TouchableOpacity
                    onPress={() => handleOpenDetail(trx)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#e4e4e7",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    <Eye size={13} color="#52525b" />
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#52525b", marginLeft: 4 }}>
                      Detail
                    </Text>
                  </TouchableOpacity>

                  {/* Print 58mm Button */}
                  <TouchableOpacity
                    onPress={() => handlePrintReceipt(trx)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#a5f3fc",
                      backgroundColor: "#ecfeff",
                    }}
                  >
                    <Printer size={13} color="#0097A7" />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7", marginLeft: 4 }}>
                      Cetak 58mm
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Detail Modal */}
      <TransactionDetailModal
        visible={detailModalVisible}
        transaction={selectedTrxForDetail}
        onClose={() => setDetailModalVisible(false)}
      />

      {/* Form (Create / Edit) Modal */}
      <TransactionFormModal
        visible={formModalVisible}
        transaction={selectedTrxForEdit}
        onClose={() => setFormModalVisible(false)}
        onSaved={loadTransactions}
      />

      {/* Re-print Receipt Modal */}
      <ReceiptModal
        visible={receiptModalVisible}
        receiptData={selectedReceipt}
        onClose={() => setReceiptModalVisible(false)}
        onNewTransaction={() => setReceiptModalVisible(false)}
      />

      {/* Secure PIN Prompt Modal */}
      <PinPromptModal
        visible={pinModalVisible}
        actionTitle={actionTitle}
        hintText={hintText}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
      />

      {/* Export CSV Modal (PIN Protected) */}
      <TransactionExportCsvModal
        visible={exportCsvModalVisible}
        storeProfile={{
          storeName,
          storeBusinessType,
          storeAddress,
          storePhone,
        }}
        onClose={() => setExportCsvModalVisible(false)}
      />
    </SafeAreaView>
  );
}
