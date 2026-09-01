import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Transaction } from "@/db";
import { getOpenBills, cancelOpenBill, getTransactionDetailsWithProducts } from "@/db/transactionRepository";
import { formatRupiah } from "@/util/formatters";
import { X, Receipt, Clock, Users, Hash, Trash2, CreditCard } from "lucide-react-native";

interface OpenBillManagerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSettleBill: (bill: Transaction) => void;
}

export function OpenBillManagerModal({
  visible,
  onClose,
  onSelectSettleBill,
}: OpenBillManagerModalProps) {
  const [bills, setBills] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOpenBills();
      setBills(data);
    } catch (e) {
      console.error("Gagal load open bills:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchBills();
    }
  }, [visible, fetchBills]);

  const handleCancel = (billId: string) => {
    Alert.alert(
      "Batalkan Open Bill",
      "Apakah Anda yakin ingin membatalkan bill ini? Stok produk akan dikembalikan.",
      [
        { text: "Kembali", style: "cancel" },
        {
          text: "Ya, Batalkan",
          style: "destructive",
          onPress: async () => {
            await cancelOpenBill(billId);
            await fetchBills();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.6)",
          padding: 16,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 480,
            backgroundColor: "#ffffff",
            borderRadius: 24,
            maxHeight: "85%",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Receipt size={20} color="#0097A7" />
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#18181b", marginLeft: 8 }}>
                Daftar Open Bill (Pesanan Tersimpan)
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <X size={20} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {loading ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#0097A7" />
              </View>
            ) : bills.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <Text style={{ fontSize: 13, color: "#71717a", textAlign: "center" }}>
                  Tidak ada open bill yang tersimpan saat ini.
                </Text>
              </View>
            ) : (
              bills.map((bill) => (
                <View
                  key={bill.id}
                  style={{
                    backgroundColor: "#f9fafb",
                    borderRadius: 16,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: "#18181b" }}>
                      {bill.invoice_no || bill.id}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: "#0097A7" }}>
                      {formatRupiah(bill.omset)}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                    {bill.table_number && (
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Hash size={12} color="#71717a" />
                        <Text style={{ fontSize: 11, color: "#52525b", marginLeft: 3 }}>
                          Meja: {bill.table_number}
                        </Text>
                      </View>
                    )}
                    {bill.customer_name && (
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Users size={12} color="#71717a" />
                        <Text style={{ fontSize: 11, color: "#52525b", marginLeft: 3 }}>
                          {bill.customer_name}
                        </Text>
                      </View>
                    )}
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Clock size={12} color="#71717a" />
                      <Text style={{ fontSize: 11, color: "#71717a", marginLeft: 3 }}>
                        {new Date(bill.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => onSelectSettleBill(bill)}
                      style={{
                        flex: 1,
                        backgroundColor: "#0097A7",
                        paddingVertical: 8,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                      }}
                    >
                      <CreditCard size={14} color="#ffffff" />
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff", marginLeft: 6 }}>
                        Selesaikan / Bayar
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleCancel(bill.id)}
                      style={{
                        backgroundColor: "#fee2e2",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
