import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Customer } from "@/db";
import { getAllCustomers, searchCustomers, createCustomer } from "@/db/customerRepository";
import { formatRupiah } from "@/util/formatters";
import { X, Search, UserPlus, Phone, User, Check, ShoppingBag } from "lucide-react-native";

interface CustomerSelectModalProps {
  visible: boolean;
  selectedCustomerName: string;
  selectedCustomerPhone: string;
  onClose: () => void;
  onSelectCustomer: (customer: { name: string; phone?: string | null }) => void;
}

export function CustomerSelectModal({
  visible,
  selectedCustomerName,
  selectedCustomerPhone,
  onClose,
  onSelectCustomer,
}: CustomerSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New Customer Form State
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchCustomers = useCallback(async (query: string = "") => {
    setLoading(true);
    try {
      const data = query.trim() ? await searchCustomers(query) : await getAllCustomers("spent");
      setCustomers(data);
    } catch (e) {
      console.error("Gagal load customer:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setSearchQuery("");
      setShowAddForm(false);
      fetchCustomers();
    }
  }, [visible, fetchCustomers]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    fetchCustomers(text);
  };

  const handleCreateCustomer = async () => {
    if (!newName.trim()) {
      Alert.alert("Perhatian", "Nama pelanggan wajib diisi.");
      return;
    }

    setIsSaving(true);
    try {
      const created = await createCustomer({
        name: newName,
        phone: newPhone,
        address: newAddress,
      });

      onSelectCustomer({ name: created.name, phone: created.phone });
      onClose();
    } catch (err: any) {
      Alert.alert("Gagal Simpan", err.message || "Terjadi kesalahan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 items-center justify-center p-4">
        <View className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[85%]">
          {/* Header */}
          <View className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-row items-center justify-between">
            <View className="flex-row items-center space-x-2">
              <View className="w-8 h-8 rounded-full bg-blue-500/10 items-center justify-center">
                <User size={18} color="#3b82f6" />
              </View>
              <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Pilih Pelanggan (CRM)
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <X size={20} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Quick Search & Add Toggle */}
          <View className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
            <View className="flex-row items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 border border-zinc-200 dark:border-zinc-700">
              <Search size={16} color="#71717a" />
              <TextInput
                value={searchQuery}
                onChangeText={handleSearch}
                placeholder="Cari nama atau No. WhatsApp..."
                placeholderTextColor="#a1a1aa"
                className="flex-1 ml-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 p-0"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => handleSearch("")}>
                  <X size={15} color="#71717a" />
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={() => setShowAddForm(!showAddForm)}
              className="flex-row items-center justify-center py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-x-1.5"
            >
              <UserPlus size={15} color="#3b82f6" />
              <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {showAddForm ? "Tutup Form Tambah" : "+ Tambah Pelanggan Baru"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Add New Customer Inline Form */}
          {showAddForm && (
            <View className="p-4 bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <Text className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                Data Pelanggan Baru:
              </Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Nama Pelanggan *"
                placeholderTextColor="#a1a1aa"
                className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100"
              />
              <TextInput
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
                placeholder="No. HP / WhatsApp (Contoh: 08123456789)"
                placeholderTextColor="#a1a1aa"
                className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100"
              />
              <TextInput
                value={newAddress}
                onChangeText={setNewAddress}
                placeholder="Alamat / Catatan (Opsional)"
                placeholderTextColor="#a1a1aa"
                className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100"
              />

              <TouchableOpacity
                onPress={handleCreateCustomer}
                disabled={isSaving}
                className="py-2.5 rounded-lg bg-blue-600 items-center justify-center mt-1"
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-xs font-bold text-white">Simpan & Pilih Pelanggan</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Customer List */}
          <ScrollView className="p-4">
            {/* Quick Guest / Non-Member Option */}
            <TouchableOpacity
              onPress={() => {
                onSelectCustomer({ name: "", phone: "" });
                onClose();
              }}
              className={`p-3 rounded-2xl mb-2 flex-row items-center justify-between border ${
                !selectedCustomerName
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500"
                  : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <View className="flex-row items-center space-x-2.5">
                <View className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 items-center justify-center">
                  <User size={15} color="#71717a" />
                </View>
                <View>
                  <Text className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Pelanggan Umum (Tanpa Nama)
                  </Text>
                  <Text className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Transaksi reguler kasir
                  </Text>
                </View>
              </View>
              {!selectedCustomerName && <Check size={16} color="#10b981" />}
            </TouchableOpacity>

            {loading ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
            ) : customers.length === 0 ? (
              <View className="py-10 items-center">
                <Text className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                  {searchQuery ? "Pelanggan tidak ditemukan." : "Belum ada data pelanggan."}
                </Text>
              </View>
            ) : (
              customers.map((c) => {
                const isSelected =
                  selectedCustomerName === c.name ||
                  (c.phone && selectedCustomerPhone === c.phone);

                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => {
                      onSelectCustomer({ name: c.name, phone: c.phone });
                      onClose();
                    }}
                    className={`p-3 rounded-2xl mb-2 border flex-row items-center justify-between ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500"
                        : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center space-x-2">
                        <Text className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                          {c.name}
                        </Text>
                        {c.total_orders > 0 && (
                          <View className="bg-amber-500/15 px-1.5 py-0.5 rounded">
                            <Text className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                              {c.total_orders}x Belanja
                            </Text>
                          </View>
                        )}
                      </View>

                      {c.phone ? (
                        <View className="flex-row items-center space-x-1 mt-0.5">
                          <Phone size={10} color="#71717a" />
                          <Text className="text-[11px] text-zinc-600 dark:text-zinc-400">
                            {c.phone}
                          </Text>
                        </View>
                      ) : null}

                      {c.total_spent > 0 && (
                        <Text className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Total Belanja: {formatRupiah(c.total_spent)}
                        </Text>
                      )}
                    </View>

                    {isSelected && <Check size={16} color="#3b82f6" />}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
