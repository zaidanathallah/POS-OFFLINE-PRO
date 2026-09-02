import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Transaction, TransactionDetail } from "@/db";
import { getTransactionDetailsWithProducts } from "@/db/transactionRepository";
import { formatRupiah } from "@/util/formatters";
import { X, Receipt, Calendar, User, Hash, Tag } from "lucide-react-native";

interface TransactionDetailModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onPrint?: () => void;
}

export function TransactionDetailModal({
  visible,
  transaction,
  onClose,
  onPrint,
}: TransactionDetailModalProps) {
  const [details, setDetails] = useState<(TransactionDetail & { product_name: string; harga_jual: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && transaction) {
      setLoading(true);
      getTransactionDetailsWithProducts(transaction.id)
        .then((res) => setDetails(res))
        .catch((err) => console.log("Detail load err:", err))
        .finally(() => setLoading(false));
    }
  }, [visible, transaction]);

  if (!transaction) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          padding: 16,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 400,
            backgroundColor: "#ffffff",
            borderRadius: 24,
            padding: 20,
            maxHeight: "85%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  backgroundColor: "#ecfeff",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <Receipt size={18} color="#0097A7" />
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#18181b" }}>
                  Detail Transaksi
                </Text>
                <Text style={{ fontSize: 11, fontFamily: "monospace", color: "#0097A7", marginTop: 1 }}>
                  {transaction.invoice_no || transaction.id}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={18} color="#71717a" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Meta Info Box */}
            <View style={{ backgroundColor: "#f9fafb", borderRadius: 16, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: "#f4f4f5" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={{ fontSize: 11, color: "#71717a" }}>Waktu Transaksi</Text>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#18181b" }}>
                  {new Date(transaction.created_at).toLocaleString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={{ fontSize: 11, color: "#71717a" }}>Metode Bayar</Text>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7" }}>
                  {transaction.payment_method || "CASH"}
                </Text>
              </View>

              {transaction.customer_name ? (
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, color: "#71717a" }}>Pelanggan</Text>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: "#18181b" }}>
                    {transaction.customer_name}
                  </Text>
                </View>
              ) : null}

              {transaction.table_number ? (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 11, color: "#71717a" }}>Nomor Meja</Text>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: "#18181b" }}>
                    {transaction.table_number}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Item List */}
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#18181b", marginBottom: 8 }}>
              Rincian Item Terjual
            </Text>

            {loading ? (
              <ActivityIndicator size="small" color="#0097A7" style={{ marginVertical: 20 }} />
            ) : details.length === 0 ? (
              <View style={{ paddingVertical: 14, alignItems: "center" }}>
                <Text style={{ fontSize: 11, color: "#a1a1aa" }}>Item tidak ditemukan atau transaksi manual.</Text>
              </View>
            ) : (
              details.map((d) => (
                <View
                  key={d.id}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f4f4f5",
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "700", color: "#18181b" }}>
                      {d.product_name}
                    </Text>
                    <Text style={{ fontSize: 10, color: "#71717a" }}>
                      {d.qty} x {formatRupiah(d.harga_jual)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#18181b" }}>
                    {formatRupiah(d.subtotal)}
                  </Text>
                </View>
              ))
            )}

            {/* Financial Summary */}
            <View style={{ marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#e5e7eb" }}>
              {transaction.discount_amount && transaction.discount_amount > 0 ? (
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: "#16a34a", fontWeight: "700" }}>
                    {transaction.promo_name ? `Diskon (${transaction.promo_name})` : "Diskon Promo"}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#16a34a" }}>
                    -{formatRupiah(transaction.discount_amount)}
                  </Text>
                </View>
              ) : null}

              {transaction.ppn_amount && transaction.ppn_amount > 0 ? (
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: "#71717a" }}>PPN {transaction.ppn_percent}%</Text>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: "#18181b" }}>
                    {formatRupiah(transaction.ppn_amount)}
                  </Text>
                </View>
              ) : null}

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181b" }}>Total Omset</Text>
                <Text style={{ fontSize: 15, fontWeight: "900", color: "#0097A7" }}>
                  {formatRupiah(transaction.omset)}
                </Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <Text style={{ fontSize: 11, color: "#71717a" }}>Estimasi Laba Kotor</Text>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#16a34a" }}>
                  +{formatRupiah(transaction.laba_kotor)}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
