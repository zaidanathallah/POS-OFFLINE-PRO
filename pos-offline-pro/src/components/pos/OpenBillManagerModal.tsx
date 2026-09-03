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
import { getOpenBills, cancelOpenBill } from "@/db/transactionRepository";
import { formatRupiah } from "@/util/formatters";
import { X, Receipt, Clock, Users, Hash, Trash2, CreditCard, ShoppingCart } from "lucide-react-native";

interface OpenBillManagerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSettleBill: (bill: Transaction) => void;
  onSelectEditBill?: (bill: Transaction) => void;
}

export function OpenBillManagerModal({
  visible,
  onClose,
  onSelectSettleBill,
  onSelectEditBill,
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
      <View className="flex-1 bg-black/60 items-center justify-center p-4">
        <View className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[85%]">
          {/* Header */}
          <View className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-row items-center justify-between">
            <View className="flex-row items-center space-x-2">
              <View className="w-8 h-8 rounded-full bg-cyan-500/10 items-center justify-center">
                <Receipt size={18} color="#06b6d4" />
              </View>
              <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Daftar Open Bill / Piutang ({bills.length})
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <X size={20} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView className="p-4">
            {loading ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#06b6d4" />
              </View>
            ) : bills.length === 0 ? (
              <View className="py-12 items-center">
                <Text className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                  Tidak ada open bill atau piutang yang sedang aktif saat ini.
                </Text>
              </View>
            ) : (
              bills.map((bill) => (
                <View
                  key={bill.id}
                  className="bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl p-3.5 border border-zinc-200 dark:border-zinc-700 mb-3 shadow-sm"
                >
                  <View className="flex-row justify-between items-center mb-1.5">
                    <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      {bill.invoice_no || bill.id}
                    </Text>
                    <Text className="text-sm font-black text-cyan-600 dark:text-cyan-400">
                      {formatRupiah(bill.omset)}
                    </Text>
                  </View>

                  <View className="flex-row flex-wrap gap-2 mb-3">
                    {bill.table_number && (
                      <View className="flex-row items-center bg-zinc-200/60 dark:bg-zinc-700/60 px-2 py-0.5 rounded">
                        <Hash size={11} color="#71717a" />
                        <Text className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
                          Meja: {bill.table_number}
                        </Text>
                      </View>
                    )}
                    {bill.customer_name && (
                      <View className="flex-row items-center bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                        <Users size={11} color="#3b82f6" />
                        <Text className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 ml-1">
                          {bill.customer_name}
                        </Text>
                      </View>
                    )}
                    <View className="flex-row items-center bg-zinc-200/60 dark:bg-zinc-700/60 px-2 py-0.5 rounded">
                      <Clock size={11} color="#71717a" />
                      <Text className="text-[11px] text-zinc-600 dark:text-zinc-400 ml-1">
                        {new Date(bill.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="flex-row space-x-2">
                    {onSelectEditBill && (
                      <TouchableOpacity
                        onPress={() => onSelectEditBill(bill)}
                        className="flex-1 py-2 px-3 rounded-xl bg-zinc-200 dark:bg-zinc-700 items-center justify-center flex-row space-x-1"
                      >
                        <ShoppingCart size={13} color="#52525b" />
                        <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                          Tambah Item
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => onSelectSettleBill(bill)}
                      className="flex-1 py-2 px-3 rounded-xl bg-cyan-600 items-center justify-center flex-row space-x-1 shadow-sm"
                    >
                      <CreditCard size={13} color="#ffffff" />
                      <Text className="text-xs font-bold text-white">
                        Pelunasan
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleCancel(bill.id)}
                      className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 items-center justify-center"
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
