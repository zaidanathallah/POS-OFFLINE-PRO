import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Transaction } from "@/db";
import {
  createManualTransaction,
  updateTransaction,
} from "@/db/transactionRepository";
import { formatRupiah } from "@/util/formatters";
import { X, Save, Receipt, DollarSign, Calendar } from "lucide-react-native";

interface TransactionFormModalProps {
  visible: boolean;
  transaction?: Transaction | null;
  onClose: () => void;
  onSaved: () => void;
}

export function TransactionFormModal({
  visible,
  transaction,
  onClose,
  onSaved,
}: TransactionFormModalProps) {
  const isEdit = !!transaction;

  // Form Fields
  const [productName, setProductName] = useState("");
  const [qty, setQty] = useState("1");
  const [hargaJual, setHargaJual] = useState("");
  const [modalHpp, setModalHpp] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [cashierName, setCashierName] = useState("Kasir 1");
  const [omsetEdit, setOmsetEdit] = useState("");
  const [customDate, setCustomDate] = useState("");

  useEffect(() => {
    if (visible) {
      if (transaction) {
        setProductName("Transaksi " + (transaction.invoice_no || transaction.id));
        setQty("1");
        setHargaJual(String(transaction.omset || 0));
        setModalHpp(String(transaction.total_hpp || 0));
        setPaymentMethod((transaction.payment_method as "CASH" | "QRIS") || "CASH");
        setCustomerName(transaction.customer_name || "");
        setTableNumber(transaction.table_number || "");
        setCashierName(transaction.cashier_name || "Kasir 1");
        setOmsetEdit(String(transaction.omset || 0));
        setCustomDate(transaction.created_at || new Date().toISOString());
      } else {
        setProductName("");
        setQty("1");
        setHargaJual("");
        setModalHpp("0");
        setPaymentMethod("CASH");
        setCustomerName("");
        setTableNumber("");
        setCashierName("Kasir 1");
        setOmsetEdit("");
        setCustomDate(new Date().toISOString().slice(0, 16).replace("T", " "));
      }
    }
  }, [visible, transaction]);

  const handleSave = async () => {
    try {
      if (isEdit && transaction) {
        const omsetNum = Number(omsetEdit) || Number(hargaJual) || 0;
        const hppNum = Number(modalHpp) || 0;
        const labaNum = Math.max(0, omsetNum - hppNum);

        await updateTransaction(transaction.id, {
          omset: omsetNum,
          total_hpp: hppNum,
          laba_kotor: labaNum,
          payment_method: paymentMethod,
          customer_name: customerName.trim() || undefined,
          table_number: tableNumber.trim() || undefined,
          cashier_name: cashierName.trim() || "Kasir 1",
        });

        Alert.alert("Sukses", "Data transaksi berhasil diperbarui.");
      } else {
        if (!productName.trim()) {
          Alert.alert("Validasi Gagal", "Nama produk/keterangan wajib diisi.");
          return;
        }
        const qtyNum = Number(qty) || 1;
        const hargaNum = Number(hargaJual) || 0;
        const hppNum = Number(modalHpp) || 0;

        if (hargaNum <= 0) {
          Alert.alert("Validasi Gagal", "Harga jual harus lebih dari 0.");
          return;
        }

        await createManualTransaction({
          productName: productName.trim(),
          qty: qtyNum,
          hargaJual: hargaNum,
          modalHpp: hppNum,
          paymentMethod: paymentMethod,
          customerName: customerName.trim() || undefined,
          tableNumber: tableNumber.trim() || undefined,
          cashierName: cashierName.trim() || "Kasir 1",
          customDate: customDate || undefined,
        });

        Alert.alert("Sukses", "Transaksi manual berhasil dicatat ke SQLite.");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      Alert.alert("Gagal Menyimpan", err.message || "Terjadi kesalahan.");
    }
  };

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
            maxWidth: 420,
            backgroundColor: "#ffffff",
            borderRadius: 24,
            padding: 20,
            maxHeight: "90%",
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
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#18181b" }}>
                {isEdit ? "Edit Transaksi" : "Catat Transaksi Manual"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={18} color="#71717a" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {!isEdit ? (
              <>
                <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Nama Produk / Keterangan Transaksi</Text>
                <TextInput
                  value={productName}
                  onChangeText={setProductName}
                  placeholder="Contoh: Paket Nasi Ayam, Jasa Servis, dll"
                  style={{
                    padding: 12,
                    backgroundColor: "#f4f4f5",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#e4e4e7",
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#18181b",
                    marginBottom: 10,
                  }}
                />

                <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Qty / Jumlah</Text>
                    <TextInput
                      value={qty}
                      onChangeText={setQty}
                      keyboardType="numeric"
                      placeholder="1"
                      style={{
                        padding: 12,
                        backgroundColor: "#f4f4f5",
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: "#e4e4e7",
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#18181b",
                      }}
                    />
                  </View>

                  <View style={{ flex: 1.5 }}>
                    <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Harga Satuan (Rp)</Text>
                    <TextInput
                      value={hargaJual}
                      onChangeText={setHargaJual}
                      keyboardType="numeric"
                      placeholder="25000"
                      style={{
                        padding: 12,
                        backgroundColor: "#f4f4f5",
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: "#e4e4e7",
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#18181b",
                      }}
                    />
                  </View>
                </View>

                <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Modal HPP Satuan (Rp)</Text>
                <TextInput
                  value={modalHpp}
                  onChangeText={setModalHpp}
                  keyboardType="numeric"
                  placeholder="15000"
                  style={{
                    padding: 12,
                    backgroundColor: "#f4f4f5",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#e4e4e7",
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#18181b",
                    marginBottom: 10,
                  }}
                />
              </>
            ) : (
              <>
                <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>No. Invoice / ID</Text>
                <View style={{ padding: 12, backgroundColor: "#f4f4f5", borderRadius: 14, marginBottom: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", fontFamily: "monospace", color: "#18181b" }}>
                    {transaction?.invoice_no || transaction?.id}
                  </Text>
                </View>

                <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Total Omset Transaksi (Rp)</Text>
                <TextInput
                  value={omsetEdit}
                  onChangeText={setOmsetEdit}
                  keyboardType="numeric"
                  placeholder="Total Omset"
                  style={{
                    padding: 12,
                    backgroundColor: "#f4f4f5",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#e4e4e7",
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#18181b",
                    marginBottom: 10,
                  }}
                />

                <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Total Modal HPP (Rp)</Text>
                <TextInput
                  value={modalHpp}
                  onChangeText={setModalHpp}
                  keyboardType="numeric"
                  placeholder="Total HPP"
                  style={{
                    padding: 12,
                    backgroundColor: "#f4f4f5",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#e4e4e7",
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#18181b",
                    marginBottom: 10,
                  }}
                />
              </>
            )}

            {/* Metode Pembayaran */}
            <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 6 }}>Metode Pembayaran</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
              {(["CASH", "QRIS"] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setPaymentMethod(m)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: paymentMethod === m ? "#0097A7" : "#f4f4f5",
                    borderWidth: 1,
                    borderColor: paymentMethod === m ? "#0097A7" : "#e4e4e7",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: paymentMethod === m ? "#ffffff" : "#52525b",
                    }}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Optional Customer, Table & Cashier */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Nama Pelanggan (Opsi)</Text>
                <TextInput
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Bpk. Budi"
                  style={{
                    padding: 12,
                    backgroundColor: "#f4f4f5",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#e4e4e7",
                    fontSize: 12,
                    color: "#18181b",
                  }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>No. Meja (Opsi)</Text>
                <TextInput
                  value={tableNumber}
                  onChangeText={setTableNumber}
                  placeholder="Meja 05"
                  style={{
                    padding: 12,
                    backgroundColor: "#f4f4f5",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#e4e4e7",
                    fontSize: 12,
                    color: "#18181b",
                  }}
                />
              </View>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Nama Kasir / Shift</Text>
              <TextInput
                value={cashierName}
                onChangeText={setCashierName}
                placeholder="Kasir 1 / Siti / Zaidan"
                style={{
                  padding: 12,
                  backgroundColor: "#f4f4f5",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#e4e4e7",
                  fontSize: 12,
                  fontWeight: "600",
                  color: "#18181b",
                }}
              />
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.8}
              style={{
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: "#0097A7",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
              }}
            >
              <Save size={16} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff" }}>
                {isEdit ? "Simpan Perubahan Transaksi" : "Catat Transaksi Manual"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
