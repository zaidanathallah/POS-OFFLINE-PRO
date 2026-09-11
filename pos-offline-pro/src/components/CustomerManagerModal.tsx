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
  Linking,
  Platform,
} from "react-native";
import { Customer } from "@/db";
import {
  getAllCustomers,
  searchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/db/customerRepository";
import { formatRupiah } from "@/util/formatters";
import {
  X,
  Search,
  UserPlus,
  Phone,
  User,
  Edit2,
  Trash2,
  MessageCircle,
  ShoppingBag,
  TrendingUp,
} from "lucide-react-native";

interface CustomerManagerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CustomerManagerModal({ visible, onClose }: CustomerManagerModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "spent" | "recent">("spent");

  // Edit / Add Form State
  const [formVisible, setFormVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = searchQuery.trim()
        ? await searchCustomers(searchQuery)
        : await getAllCustomers(sortBy);
      setCustomers(data);
    } catch (e) {
      console.error("Gagal load customer CRM:", e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy]);

  useEffect(() => {
    if (visible) {
      fetchCustomers();
    }
  }, [visible, fetchCustomers]);

  const openAddForm = () => {
    setEditingCustomer(null);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setNotes("");
    setFormVisible(true);
  };

  const openEditForm = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone || "");
    setEmail(c.email || "");
    setAddress(c.address || "");
    setNotes(c.notes || "");
    setFormVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Perhatian", "Nama pelanggan wajib diisi.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          name,
          phone,
          email,
          address,
          notes,
        });
      } else {
        await createCustomer({
          name,
          phone,
          email,
          address,
          notes,
        });
      }
      setFormVisible(false);
      await fetchCustomers();
    } catch (err: any) {
      Alert.alert("Gagal Menyimpan", err.message || "Terjadi kesalahan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (c: Customer) => {
    const doDelete = async () => {
      await deleteCustomer(c.id);
      await fetchCustomers();
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Apakah Anda yakin ingin menghapus data pelanggan "${c.name}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        "Hapus Pelanggan",
        `Apakah Anda yakin ingin menghapus data pelanggan "${c.name}"?`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Hapus",
            style: "destructive",
            onPress: doDelete,
          },
        ]
      );
    }
  };

  const openWhatsApp = (phoneStr: string) => {
    let clean = phoneStr.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
      clean = "62" + clean.slice(1);
    }
    const url = `https://wa.me/${clean}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Gagal", "Tidak dapat membuka WhatsApp.");
    });
  };

  const totalSpentAll = customers.reduce((acc, c) => acc + c.total_spent, 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 items-center justify-center p-4">
        <View className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90%]">
          {/* Header */}
          <View className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-row items-center justify-between">
            <View className="flex-row items-center space-x-2.5">
              <View className="w-9 h-9 rounded-full bg-blue-500/10 items-center justify-center">
                <User size={20} color="#3b82f6" />
              </View>
              <View>
                <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Manajemen Pelanggan (CRM)
                </Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                  Kelola kontak, riwayat belanja & program loyalitas
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <X size={20} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Top Summary Cards */}
          <View className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 flex-row space-x-3">
            <View className="flex-1 p-3 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <Text className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                Total Pelanggan Terdaftar
              </Text>
              <Text className="text-lg font-black text-zinc-900 dark:text-zinc-50 mt-0.5">
                {customers.length} Orang
              </Text>
            </View>

            <View className="flex-1 p-3 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <Text className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                Akumulasi Omset Pelanggan
              </Text>
              <Text className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatRupiah(totalSpentAll)}
              </Text>
            </View>
          </View>

          {/* Search & Actions Bar */}
          <View className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex-row space-x-2">
            <View className="flex-1 flex-row items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 border border-zinc-200 dark:border-zinc-700">
              <Search size={16} color="#71717a" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Cari pelanggan berdasarkan nama / no HP..."
                placeholderTextColor="#a1a1aa"
                className="flex-1 ml-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 p-0"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={15} color="#71717a" />
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={openAddForm}
              className="px-4 py-2 bg-blue-600 rounded-xl flex-row items-center space-x-1.5"
            >
              <UserPlus size={16} color="#ffffff" />
              <Text className="text-xs font-bold text-white">Tambah</Text>
            </TouchableOpacity>
          </View>

          {/* Customer Table / Cards List */}
          <ScrollView className="p-4">
            {loading ? (
              <View className="py-16 items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
            ) : customers.length === 0 ? (
              <View className="py-12 items-center">
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                  {searchQuery ? "Tidak ada hasil pencarian." : "Belum ada data pelanggan."}
                </Text>
              </View>
            ) : (
              customers.map((c) => (
                <View
                  key={c.id}
                  className="p-4 rounded-2xl bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 mb-3 shadow-sm flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center space-x-2">
                      <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                        {c.name}
                      </Text>
                      {c.total_orders > 0 && (
                        <View className="bg-amber-500/15 px-2 py-0.5 rounded-md">
                          <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            {c.total_orders}x Transaksi
                          </Text>
                        </View>
                      )}
                    </View>

                    {c.phone ? (
                      <Text className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">
                        📱 {c.phone}
                      </Text>
                    ) : null}

                    {c.address ? (
                      <Text className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        📍 {c.address}
                      </Text>
                    ) : null}

                    <View className="flex-row items-center space-x-3 mt-1.5">
                      <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Total Belanja: {formatRupiah(c.total_spent)}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="flex-row items-center space-x-1.5">
                    {c.phone ? (
                      <TouchableOpacity
                        onPress={() => openWhatsApp(c.phone!)}
                        className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 items-center justify-center"
                      >
                        <MessageCircle size={16} color="#10b981" />
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      onPress={() => openEditForm(c)}
                      className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-700/60 border border-zinc-200 dark:border-zinc-600 items-center justify-center"
                    >
                      <Edit2 size={15} color="#71717a" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(c)}
                      className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 items-center justify-center"
                    >
                      <Trash2 size={15} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Add / Edit Form Modal Sub-view */}
          {formVisible && (
            <Modal visible={true} transparent animationType="fade" onRequestClose={() => setFormVisible(false)}>
              <View className="flex-1 bg-black/60 items-center justify-center p-4">
                <View className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800">
                  <View className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      {editingCustomer ? "Edit Data Pelanggan" : "Tambah Pelanggan Baru"}
                    </Text>
                    <TouchableOpacity onPress={() => setFormVisible(false)}>
                      <X size={18} color="#71717a" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView className="p-5 space-y-3">
                    <View>
                      <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                        Nama Lengkap *
                      </Text>
                      <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Contoh: Budi Santoso"
                        placeholderTextColor="#a1a1aa"
                        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                      />
                    </View>

                    <View>
                      <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                        No. WhatsApp / HP
                      </Text>
                      <TextInput
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        placeholder="Contoh: 08123456789"
                        placeholderTextColor="#a1a1aa"
                        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                      />
                    </View>

                    <View>
                      <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                        Email (Opsional)
                      </Text>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        placeholder="Contoh: pelanggan@gmail.com"
                        placeholderTextColor="#a1a1aa"
                        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100"
                      />
                    </View>

                    <View>
                      <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                        Alamat
                      </Text>
                      <TextInput
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Contoh: Jl. Mawar No. 12"
                        placeholderTextColor="#a1a1aa"
                        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100"
                      />
                    </View>

                    <View>
                      <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                        Catatan
                      </Text>
                      <TextInput
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Contoh: Pelanggan setia / diskon khusus"
                        placeholderTextColor="#a1a1aa"
                        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100"
                      />
                    </View>
                  </ScrollView>

                  <View className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex-row space-x-2">
                    <TouchableOpacity
                      onPress={() => setFormVisible(false)}
                      className="flex-1 py-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 items-center justify-center"
                    >
                      <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSave}
                      disabled={isSaving}
                      className="flex-1 py-3 rounded-xl bg-blue-600 items-center justify-center"
                    >
                      {isSaving ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text className="text-xs font-bold text-white">Simpan</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </View>
    </Modal>
  );
}
