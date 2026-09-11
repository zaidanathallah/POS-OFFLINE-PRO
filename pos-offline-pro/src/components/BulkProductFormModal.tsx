import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ProductInput, createBulkProducts } from "@/db/productRepository";
import { getAllCategories } from "@/db/categoryRepository";
import { getSetting } from "@/db/settingsRepository";
import { formatRupiah } from "@/util/formatters";
import {
  X,
  Plus,
  Trash2,
  Copy,
  Layers,
  CheckCircle2,
  Sparkles,
  Package,
  RotateCcw,
  Calculator,
} from "lucide-react-native";

export interface BulkRowCostItem {
  id: string;
  name: string;
  amount: string;
}

interface BulkRowItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  harga_jual: string;
  modal_hpp: string;
  stock: string;
  barcode: string;
  cost_items: BulkRowCostItem[];
  show_cost_breakdown?: boolean;
}

interface BulkProductFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

const UNITS = ["pcs", "kg", "porsi", "cup", "liter", "box", "gram"];

export function BulkProductFormModal({
  visible,
  onClose,
  onSuccess,
}: BulkProductFormModalProps) {
  const [categories, setCategories] = useState<string[]>([
    "Makanan",
    "Minuman",
    "Buah",
    "Retail",
    "Jasa",
    "Lainnya",
  ]);

  const [featureHppBreakdown, setFeatureHppBreakdown] = useState(true);

  const createEmptyRow = (defaultCat: string = "Makanan"): BulkRowItem => ({
    id: `ROW-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    name: "",
    category: defaultCat,
    unit: "pcs",
    harga_jual: "",
    modal_hpp: "",
    stock: "50",
    barcode: "",
    cost_items: [],
    show_cost_breakdown: false,
  });

  const [rows, setRows] = useState<BulkRowItem[]>([
    createEmptyRow("Makanan"),
    createEmptyRow("Makanan"),
    createEmptyRow("Makanan"),
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      (async () => {
        try {
          const list = await getAllCategories();
          if (list.length > 0) {
            setCategories(list.map((c) => c.name));
          }
          const fHpp = await getSetting("feature_hpp_breakdown", "1");
          setFeatureHppBreakdown(fHpp === "1");
        } catch (e) {
          console.error("Gagal load categories / settings in bulk modal:", e);
        }
      })();
    }
  }, [visible]);

  const handleAddRow = () => {
    const lastCat = rows.length > 0 ? rows[rows.length - 1].category : "Makanan";
    setRows((prev) => [...prev, createEmptyRow(lastCat)]);
  };

  const handleAddMultipleRows = (count: number = 5) => {
    const lastCat = rows.length > 0 ? rows[rows.length - 1].category : "Makanan";
    const newItems: BulkRowItem[] = [];
    for (let i = 0; i < count; i++) {
      newItems.push(createEmptyRow(lastCat));
    }
    setRows((prev) => [...prev, ...newItems]);
  };

  const handleDuplicateRow = (index: number) => {
    const target = rows[index];
    const duplicated: BulkRowItem = {
      ...target,
      id: `ROW-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      name: target.name ? `${target.name} (Copy)` : "",
      barcode: "",
      cost_items: (target.cost_items || []).map((ci) => ({
        ...ci,
        id: `COST-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      })),
      show_cost_breakdown: target.show_cost_breakdown,
    };
    const nextRows = [...rows];
    nextRows.splice(index + 1, 0, duplicated);
    setRows(nextRows);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) {
      setRows([createEmptyRow()]);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRow = (id: string, field: keyof BulkRowItem, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, [field]: value };
          if (field === "category" && value === "Buah" && r.unit === "pcs") {
            updated.unit = "kg";
          }
          return updated;
        }
        return r;
      })
    );
  };

  // Cost items (HPP Breakdown / BOM) per row
  const handleToggleRowCostBreakdown = (rowId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const nextShow = !r.show_cost_breakdown;
          let items = r.cost_items || [];
          if (nextShow && items.length === 0) {
            items = [
              {
                id: `COST-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
                name: "",
                amount: "",
              },
            ];
          }
          return {
            ...r,
            show_cost_breakdown: nextShow,
            cost_items: items,
          };
        }
        return r;
      })
    );
  };

  const handleAddRowCostItem = (rowId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const newItem: BulkRowCostItem = {
            id: `COST-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            name: "",
            amount: "",
          };
          return {
            ...r,
            show_cost_breakdown: true,
            cost_items: [...(r.cost_items || []), newItem],
          };
        }
        return r;
      })
    );
  };

  const handleUpdateRowCostItem = (
    rowId: string,
    costItemId: string,
    field: keyof BulkRowCostItem,
    value: string
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const nextCostItems = (r.cost_items || []).map((ci) => {
            if (ci.id === costItemId) {
              return { ...ci, [field]: value };
            }
            return ci;
          });

          // Compute total cost items sum
          const totalCost = nextCostItems.reduce(
            (sum, it) => sum + (parseFloat(it.amount) || 0),
            0
          );

          return {
            ...r,
            cost_items: nextCostItems,
            modal_hpp: totalCost > 0 ? totalCost.toString() : r.modal_hpp,
          };
        }
        return r;
      })
    );
  };

  const handleRemoveRowCostItem = (rowId: string, costItemId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const nextCostItems = (r.cost_items || []).filter((ci) => ci.id !== costItemId);
          const totalCost = nextCostItems.reduce(
            (sum, it) => sum + (parseFloat(it.amount) || 0),
            0
          );
          return {
            ...r,
            cost_items: nextCostItems,
            modal_hpp:
              nextCostItems.length > 0
                ? totalCost > 0
                  ? totalCost.toString()
                  : "0"
                : r.modal_hpp,
          };
        }
        return r;
      })
    );
  };

  const handleReset = () => {
    Alert.alert("Bersihkan Semua", "Kosongkan seluruh baris input?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Bersihkan",
        style: "destructive",
        onPress: () =>
          setRows([createEmptyRow("Makanan"), createEmptyRow("Makanan"), createEmptyRow("Makanan")]),
      },
    ]);
  };

  // Valid entries calculation
  const validRows = rows.filter((r) => r.name.trim().length > 0 && parseFloat(r.harga_jual) > 0);
  const totalEstSales = validRows.reduce(
    (acc, r) => acc + (parseFloat(r.harga_jual) || 0) * (parseFloat(r.stock) || 0),
    0
  );

  const handleSubmit = async () => {
    if (validRows.length === 0) {
      Alert.alert(
        "Data Belum Lengkap",
        "Harap isi minimal 1 produk dengan Nama dan Harga Jual lebih dari 0."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const inputs: ProductInput[] = validRows.map((r) => {
        const isDecimal =
          r.unit === "kg" || r.unit === "liter" || r.unit === "gram" || r.category === "Buah"
            ? 1
            : 0;

        const validCostItems = (r.cost_items || [])
          .filter((it) => it.name.trim().length > 0 || (parseFloat(it.amount) || 0) > 0)
          .map((it) => ({
            id: it.id,
            name: it.name.trim(),
            amount: parseFloat(it.amount) || 0,
          }));

        const hppBreakdownJson =
          validCostItems.length > 0 ? JSON.stringify(validCostItems) : null;

        return {
          name: r.name.trim(),
          category: r.category.trim() || "Makanan",
          unit: r.unit || "pcs",
          is_decimal: isDecimal,
          harga_jual: parseFloat(r.harga_jual) || 0,
          modal_hpp: parseFloat(r.modal_hpp) || 0,
          stock: parseFloat(r.stock) || 0,
          barcode: r.barcode.trim() || null,
          has_variants: 0,
          hpp_breakdown_json: hppBreakdownJson,
        };
      });

      const res = await createBulkProducts(inputs, "append");
      await onSuccess();
      Alert.alert(
        "Sukses Menambahkan!",
        `Berhasil menyimpan ${res.inserted} produk baru ke database SQLite.`
      );
      onClose();
    } catch (error: any) {
      console.error("Bulk add error:", error);
      Alert.alert("Gagal Menyimpan", error.message || "Terjadi kesalahan saat menyimpan produk massal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            backgroundColor: "#ffffff",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: "94%",
            minHeight: "80%",
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
              backgroundColor: "#ffffff",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: "#ecfeff",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <Layers size={20} color="#0097A7" />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#18181b" }}>
                  Tambah Produk Massal (Multi-Baris)
                </Text>
                <Text style={{ fontSize: 11, color: "#71717a" }}>
                  Input cepat banyak produk sekaligus ke database lokal
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f4f4f5",
              }}
            >
              <X size={16} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Action Quickbar */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: "#f8fafc",
              borderBottomWidth: 1,
              borderBottomColor: "#e2e8f0",
            }}
          >
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={handleAddRow}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: "#0097A7",
                }}
              >
                <Plus size={14} color="#ffffff" />
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#ffffff", marginLeft: 4 }}>
                  + 1 Baris
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAddMultipleRows(5)}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: "#ecfeff",
                  borderWidth: 1,
                  borderColor: "#a5f3fc",
                }}
              >
                <Sparkles size={14} color="#0097A7" />
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7", marginLeft: 4 }}>
                  + 5 Baris
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleReset}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
                backgroundColor: "#fee2e2",
              }}
            >
              <RotateCcw size={12} color="#dc2626" />
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#dc2626", marginLeft: 4 }}>
                Reset
              </Text>
            </TouchableOpacity>
          </View>

          {/* Rows Scroll Area */}
          <ScrollView
            style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {rows.map((row, index) => {
              const isValid = row.name.trim().length > 0 && parseFloat(row.harga_jual) > 0;
              const hasCostItems = (row.cost_items || []).length > 0;

              return (
                <View
                  key={row.id}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: isValid ? "#99f6e4" : "#e2e8f0",
                    padding: 12,
                    marginBottom: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  {/* Row Top: Index, Category, Unit, & Actions */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View
                        style={{
                          backgroundColor: isValid ? "#0097A7" : "#e2e8f0",
                          width: 24,
                          height: 24,
                          borderRadius: 8,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "800",
                            color: isValid ? "#ffffff" : "#64748b",
                          }}
                        >
                          #{index + 1}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#475569" }}>
                        Kategori:
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 6 }}>
                        <View style={{ flexDirection: "row", gap: 4 }}>
                          {categories.map((c) => (
                            <TouchableOpacity
                              key={c}
                              onPress={() => handleUpdateRow(row.id, "category", c)}
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 8,
                                backgroundColor: row.category === c ? "#0097A7" : "#f1f5f9",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: row.category === c ? "700" : "500",
                                  color: row.category === c ? "#ffffff" : "#475569",
                                }}
                              >
                                {c}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => handleDuplicateRow(index)}
                        style={{
                          padding: 5,
                          borderRadius: 6,
                          backgroundColor: "#f1f5f9",
                        }}
                      >
                        <Copy size={13} color="#475569" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRemoveRow(row.id)}
                        style={{
                          padding: 5,
                          borderRadius: 6,
                          backgroundColor: "#fee2e2",
                        }}
                      >
                        <Trash2 size={13} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Input: Nama Produk */}
                  <TextInput
                    value={row.name}
                    onChangeText={(val) => handleUpdateRow(row.id, "name", val)}
                    placeholder="Nama Produk (cth: Kopi Susu, Terigu 1kg)..."
                    placeholderTextColor="#94a3b8"
                    style={{
                      backgroundColor: "#f8fafc",
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                      fontSize: 13,
                      fontWeight: "600",
                      color: "#0f172a",
                      marginBottom: 8,
                    }}
                  />

                  {/* Pricing & Stock Row */}
                  <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
                    <View style={{ flex: 1.2 }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: "#64748b", marginBottom: 3 }}>
                        Harga Jual (Rp) *
                      </Text>
                      <TextInput
                        value={row.harga_jual}
                        onChangeText={(val) => handleUpdateRow(row.id, "harga_jual", val)}
                        keyboardType="numeric"
                        placeholder="Cth: 15000"
                        placeholderTextColor="#94a3b8"
                        style={{
                          backgroundColor: "#f8fafc",
                          borderWidth: 1,
                          borderColor: "#e2e8f0",
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          fontSize: 12,
                          fontWeight: "700",
                          color: "#0f172a",
                        }}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 3,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: "700", color: "#64748b" }}>
                          Modal HPP (Rp)
                        </Text>
                        {featureHppBreakdown && (
                          <TouchableOpacity
                            onPress={() => handleToggleRowCostBreakdown(row.id)}
                            activeOpacity={0.8}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingHorizontal: 5,
                              paddingVertical: 1,
                              borderRadius: 5,
                              backgroundColor: hasCostItems ? "#0097A7" : "#ecfeff",
                              borderWidth: 1,
                              borderColor: hasCostItems ? "#0097A7" : "#a5f3fc",
                            }}
                          >
                            <Calculator
                              size={10}
                              color={hasCostItems ? "#ffffff" : "#0097A7"}
                            />
                            <Text
                              style={{
                                fontSize: 9,
                                fontWeight: "700",
                                color: hasCostItems ? "#ffffff" : "#0097A7",
                                marginLeft: 2,
                              }}
                            >
                              {hasCostItems ? `${row.cost_items.length} Bahan` : "+ Bahan"}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <TextInput
                        value={row.modal_hpp}
                        onChangeText={(val) => handleUpdateRow(row.id, "modal_hpp", val)}
                        keyboardType="numeric"
                        placeholder="Cth: 10000"
                        placeholderTextColor="#94a3b8"
                        style={{
                          backgroundColor: "#f8fafc",
                          borderWidth: 1,
                          borderColor: hasCostItems ? "#0097A7" : "#e2e8f0",
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          fontSize: 12,
                          color: "#0f172a",
                          fontWeight: hasCostItems ? "700" : "400",
                        }}
                      />
                    </View>

                    <View style={{ flex: 0.8 }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: "#64748b", marginBottom: 3 }}>
                        Stok
                      </Text>
                      <TextInput
                        value={row.stock}
                        onChangeText={(val) => handleUpdateRow(row.id, "stock", val)}
                        keyboardType="numeric"
                        placeholder="50"
                        placeholderTextColor="#94a3b8"
                        style={{
                          backgroundColor: "#f8fafc",
                          borderWidth: 1,
                          borderColor: "#e2e8f0",
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          fontSize: 12,
                          color: "#0f172a",
                        }}
                      />
                    </View>
                  </View>

                  {/* Expandable HPP Breakdown (BOM / Rincian Bahan Baku) for this row */}
                  {featureHppBreakdown && row.show_cost_breakdown && (
                    <View
                      style={{
                        backgroundColor: "#f0fdfa",
                        borderWidth: 1,
                        borderColor: "#99f6e4",
                        borderRadius: 12,
                        padding: 10,
                        marginBottom: 8,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Calculator size={13} color="#0097A7" />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "700",
                              color: "#0f766e",
                              marginLeft: 5,
                            }}
                          >
                            Rincian Bahan Baku #{index + 1}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleAddRowCostItem(row.id)}
                          activeOpacity={0.8}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            backgroundColor: "#0097A7",
                          }}
                        >
                          <Plus size={11} color="#ffffff" />
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "700",
                              color: "#ffffff",
                              marginLeft: 3,
                            }}
                          >
                            + Tambah Biaya
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {(!row.cost_items || row.cost_items.length === 0) ? (
                        <TouchableOpacity
                          onPress={() => handleAddRowCostItem(row.id)}
                          style={{
                            paddingVertical: 8,
                            alignItems: "center",
                            justifyContent: "center",
                            borderStyle: "dashed",
                            borderWidth: 1,
                            borderColor: "#5eead4",
                            borderRadius: 8,
                            backgroundColor: "#ffffff",
                          }}
                        >
                          <Text style={{ fontSize: 10, color: "#0f766e", fontWeight: "600" }}>
                            + Klik di sini untuk menambah bahan (cth: Terigu 10.000, Minyak 10.000)
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={{ gap: 6 }}>
                          {row.cost_items.map((item, itemIdx) => (
                            <View
                              key={item.id}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 4,
                                backgroundColor: "#ffffff",
                                padding: 6,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: "#e2e8f0",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: "700",
                                  color: "#64748b",
                                  width: 16,
                                  textAlign: "center",
                                }}
                              >
                                #{itemIdx + 1}
                              </Text>
                              <TextInput
                                value={item.name}
                                onChangeText={(val) =>
                                  handleUpdateRowCostItem(row.id, item.id, "name", val)
                                }
                                placeholder="Nama Bahan (cth: Terigu)"
                                placeholderTextColor="#94a3b8"
                                style={{
                                  flex: 1.3,
                                  backgroundColor: "#f8fafc",
                                  borderWidth: 1,
                                  borderColor: "#e2e8f0",
                                  borderRadius: 6,
                                  paddingHorizontal: 8,
                                  paddingVertical: 4,
                                  fontSize: 11,
                                  color: "#0f172a",
                                }}
                              />
                              <TextInput
                                value={item.amount}
                                onChangeText={(val) =>
                                  handleUpdateRowCostItem(row.id, item.id, "amount", val)
                                }
                                keyboardType="numeric"
                                placeholder="Rp 0"
                                placeholderTextColor="#94a3b8"
                                style={{
                                  flex: 1,
                                  backgroundColor: "#f8fafc",
                                  borderWidth: 1,
                                  borderColor: "#e2e8f0",
                                  borderRadius: 6,
                                  paddingHorizontal: 8,
                                  paddingVertical: 4,
                                  fontSize: 11,
                                  fontWeight: "600",
                                  color: "#0f172a",
                                }}
                              />
                              <TouchableOpacity
                                onPress={() => handleRemoveRowCostItem(row.id, item.id)}
                                style={{
                                  padding: 4,
                                  borderRadius: 6,
                                  backgroundColor: "#fee2e2",
                                }}
                              >
                                <Trash2 size={12} color="#ef4444" />
                              </TouchableOpacity>
                            </View>
                          ))}

                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              paddingTop: 6,
                              borderTopWidth: 1,
                              borderTopColor: "#ccfbf1",
                              marginTop: 2,
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: "600", color: "#0f766e" }}>
                              Total Modal Otomatis:
                            </Text>
                            <Text style={{ fontSize: 11, fontWeight: "800", color: "#0f766e" }}>
                              {formatRupiah(
                                row.cost_items.reduce(
                                  (sum, it) => sum + (parseFloat(it.amount) || 0),
                                  0
                                )
                              )}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Satuan & Barcode Row */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: "#64748b", marginRight: 4 }}>
                        Satuan:
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: 170 }}>
                        <View style={{ flexDirection: "row", gap: 3 }}>
                          {UNITS.map((u) => (
                            <TouchableOpacity
                              key={u}
                              onPress={() => handleUpdateRow(row.id, "unit", u)}
                              style={{
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 6,
                                backgroundColor: row.unit === u ? "#0097A7" : "#f1f5f9",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: row.unit === u ? "700" : "500",
                                  color: row.unit === u ? "#ffffff" : "#475569",
                                }}
                              >
                                {u}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                    <TextInput
                      value={row.barcode}
                      onChangeText={(val) => handleUpdateRow(row.id, "barcode", val)}
                      placeholder="Barcode (Opsional)"
                      placeholderTextColor="#94a3b8"
                      style={{
                        flex: 1,
                        backgroundColor: "#f8fafc",
                        borderWidth: 1,
                        borderColor: "#e2e8f0",
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        fontSize: 11,
                        color: "#0f172a",
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Footer Summary & Submit */}
          <View
            style={{
              padding: 16,
              backgroundColor: "#ffffff",
              borderTopWidth: 1,
              borderTopColor: "#e2e8f0",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <CheckCircle2 size={15} color={validRows.length > 0 ? "#059669" : "#94a3b8"} />
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#0f172a", marginLeft: 6 }}>
                  {validRows.length} Produk Valid
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                Total Estimasi: {formatRupiah(totalEstSales)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || validRows.length === 0}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: validRows.length > 0 ? "#0097A7" : "#cbd5e1",
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 14,
                shadowColor: "#0097A7",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: validRows.length > 0 ? 0.25 : 0,
                shadowRadius: 4,
                elevation: validRows.length > 0 ? 2 : 0,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Package size={16} color="#ffffff" />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff", marginLeft: 6 }}>
                    Simpan Semua ({validRows.length})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
