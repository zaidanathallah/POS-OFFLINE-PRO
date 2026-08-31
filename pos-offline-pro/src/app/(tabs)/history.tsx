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
import { ReceiptModal } from "@/components/ReceiptModal";
import { Transaction } from "@/db";
import {
  getAllTransactions,
  getTransactionDetailsWithProducts,
  getTransactionsSummary,
} from "@/db/transactionRepository";
import { getSetting } from "@/db/settingsRepository";
import { ReceiptData } from "@/util/printerService";
import { formatRupiah } from "@/util/formatters";
import {
  Receipt,
  Printer,
  Inbox,
} from "lucide-react-native";

export default function HistoryScreen() {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9F7F4" }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: "#e5e7eb",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#18181b" }}>
          Riwayat Transaksi
        </Text>
        <Text style={{ fontSize: 12, color: "#71717a", marginTop: 1 }}>
          Daftar Struk Penjualan & Cetak Ulang (58mm)
        </Text>
      </View>

      {/* Transaction List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 60 }}
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
              {/* Header Struk: Invoice & Method */}
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
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, backgroundColor: "#ecfeff" }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: "#0097A7" }}>
                    {trx.payment_method || "CASH"}
                  </Text>
                </View>
              </View>

              {/* Body Struk */}
              <View style={{ paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 11, color: "#71717a" }}>
                  {new Date(trx.created_at).toLocaleString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                {trx.ppn_amount && trx.ppn_amount > 0 ? (
                  <Text style={{ fontSize: 10, color: "#71717a", fontFamily: "monospace" }}>
                    PPN {trx.ppn_percent}%: {formatRupiah(trx.ppn_amount)}
                  </Text>
                ) : null}
              </View>

              {/* Financial Breakdown & Print Button */}
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
                    borderColor: "#d4d4d8",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <Printer size={14} color="#0097A7" />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#3f3f46", marginLeft: 6 }}>
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
