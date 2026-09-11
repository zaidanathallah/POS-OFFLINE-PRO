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
  Switch,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Product, ProductVariant, CostItem } from "@/db";
import { ProductInput, createBulkProducts } from "@/db/productRepository";
import { getAllCategories } from "@/db/categoryRepository";
import { getSetting } from "@/db/settingsRepository";
import { formatRupiah } from "@/util/formatters";
import { compressAndConvertToBase64 } from "@/util/imageCompressor";
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
  Scale,
  TrendingUp,
  ImageIcon,
  Camera,
  Scan,
} from "lucide-react-native";
import { BarcodeScannerModal } from "@/components/pos/BarcodeScannerModal";
import { lookupSupermarketBarcode } from "@/util/supermarketBarcodeDb";

export interface BulkProductCardItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  is_decimal: boolean;
  harga_jual: string;
  modal_hpp: string;
  stock: string;
  barcode: string;
  image_uri: string;
  has_variants: boolean;
  variants: ProductVariant[];
  cost_items: CostItem[];
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
    "Buah",
    "Makanan",
    "Minuman",
    "Retail",
    "Jasa",
    "Lainnya",
  ]);

  const [featureHppBreakdown, setFeatureHppBreakdown] = useState(true);
  const [featureVariants, setFeatureVariants] = useState(true);

  const createEmptyCard = (defaultCat: string = "Makanan"): BulkProductCardItem => ({
    id: `ROW-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    name: "",
    category: defaultCat,
    unit: "pcs",
    is_decimal: false,
    harga_jual: "",
    modal_hpp: "",
    stock: "50",
    barcode: "",
    image_uri: "",
    has_variants: false,
    variants: [],
    cost_items: [],
  });

  const [rows, setRows] = useState<BulkProductCardItem[]>([
    createEmptyCard("Makanan"),
    createEmptyCard("Makanan"),
    createEmptyCard("Makanan"),
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);
  const [scanningRowId, setScanningRowId] = useState<string | null>(null);

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
          const fVar = await getSetting("feature_variants", "1");
          setFeatureVariants(fVar === "1");
        } catch (e) {
          console.error("Gagal load categories / settings in bulk modal:", e);
        }
      })();
    }
  }, [visible]);

  // Row Manipulation (Add, Duplicate, Remove, Reset)
  const handleAddRow = () => {
    const lastCat = rows.length > 0 ? rows[rows.length - 1].category : "Makanan";
    setRows((prev) => [...prev, createEmptyCard(lastCat)]);
  };

  const handleAddMultipleRows = (count: number = 5) => {
    const lastCat = rows.length > 0 ? rows[rows.length - 1].category : "Makanan";
    const newItems: BulkProductCardItem[] = [];
    for (let i = 0; i < count; i++) {
      newItems.push(createEmptyCard(lastCat));
    }
    setRows((prev) => [...prev, ...newItems]);
  };

  const handleDuplicateRow = (index: number) => {
    const target = rows[index];
    const duplicated: BulkProductCardItem = {
      ...target,
      id: `ROW-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      name: target.name ? `${target.name} (Copy)` : "",
      barcode: "",
      variants: (target.variants || []).map((v) => ({
        ...v,
        id: `VAR-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      })),
      cost_items: (target.cost_items || []).map((ci) => ({
        ...ci,
        id: `COST-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      })),
    };
    const nextRows = [...rows];
    nextRows.splice(index + 1, 0, duplicated);
    setRows(nextRows);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) {
      setRows([createEmptyCard()]);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleReset = () => {
    Alert.alert("Bersihkan Semua", "Kosongkan seluruh baris input?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Bersihkan",
        style: "destructive",
        onPress: () =>
          setRows([createEmptyCard("Makanan"), createEmptyCard("Makanan"), createEmptyCard("Makanan")]),
      },
    ]);
  };

  // Field Updates
  const handleUpdateField = (
    rowId: string,
    field: keyof BulkProductCardItem,
    value: any
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r))
    );
  };

  const handleSelectCategory = (rowId: string, catName: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const isFruit = catName === "Buah";
          return {
            ...r,
            category: catName,
            is_decimal: isFruit ? true : r.is_decimal,
            unit: isFruit && (r.unit === "pcs" || r.unit === "porsi") ? "kg" : r.unit,
          };
        }
        return r;
      })
    );
  };

  const handleSelectUnit = (rowId: string, u: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const isWeightUnit = u === "kg" || u === "liter" || u === "gram";
          return {
            ...r,
            unit: u,
            is_decimal: isWeightUnit ? true : r.is_decimal,
          };
        }
        return r;
      })
    );
  };

  // Photo handlers per product row
  const handlePickImageForRow = async (rowId: string) => {
    try {
      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async (e: any) => {
          const file = e.target?.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = async () => {
              if (reader.result) {
                const rawUri = reader.result.toString();
                const compressed = await compressAndConvertToBase64(rawUri, 400, 0.65);
                handleUpdateField(rowId, "image_uri", compressed);
              }
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Izin Ditolak", "Izin akses galeri diperlukan untuk memilih foto.");
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const rawUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
          const compressed = await compressAndConvertToBase64(rawUri, 400, 0.65);
          handleUpdateField(rowId, "image_uri", compressed);
        }
      }
    } catch (err: any) {
      console.error("Gagal pilih gambar row:", err);
      Alert.alert("Gagal Memilih Gambar", err.message || "Terjadi kesalahan.");
    }
  };

  const handleTakePhotoForRow = async (rowId: string) => {
    try {
      if (Platform.OS === "web") {
        handlePickImageForRow(rowId);
      } else {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Izin Ditolak", "Izin kamera diperlukan untuk mengambil foto produk.");
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const rawUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
          const compressed = await compressAndConvertToBase64(rawUri, 400, 0.65);
          handleUpdateField(rowId, "image_uri", compressed);
        }
      }
    } catch (err: any) {
      console.error("Gagal mengambil foto row:", err);
      Alert.alert("Gagal Kamera", err.message || "Terjadi kesalahan.");
    }
  };

  // Cost items (HPP Breakdown / BOM) per row
  const handleAddCostItem = (rowId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const newItem: CostItem = {
            id: `COST-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            name: "",
            amount: 0,
          };
          return {
            ...r,
            cost_items: [...(r.cost_items || []), newItem],
          };
        }
        return r;
      })
    );
  };

  const handleUpdateCostItem = (
    rowId: string,
    costItemId: string,
    field: "name" | "amount",
    value: any
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const nextCostItems = (r.cost_items || []).map((ci) => {
            if (ci.id === costItemId) {
              return {
                ...ci,
                [field]: field === "amount" ? parseFloat(value) || 0 : value,
              };
            }
            return ci;
          });

          const totalCost = nextCostItems.reduce(
            (sum, it) => sum + (Number(it.amount) || 0),
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

  const handleRemoveCostItem = (rowId: string, costItemId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const nextCostItems = (r.cost_items || []).filter((ci) => ci.id !== costItemId);
          const totalCost = nextCostItems.reduce(
            (sum, it) => sum + (Number(it.amount) || 0),
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

  // Variants handlers per row
  const handleToggleVariants = (rowId: string, val: boolean) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          let vars = r.variants || [];
          if (val && vars.length === 0) {
            const numJual = parseFloat(r.harga_jual) || 15000;
            const numHpp = parseFloat(r.modal_hpp) || 10000;
            vars = [
              {
                id: `VAR-${Date.now()}-1`,
                name: "Varian 1",
                harga_jual: numJual,
                modal_hpp: numHpp,
                stock: parseFloat(r.stock) || 50,
              },
            ];
          }
          return {
            ...r,
            has_variants: val,
            variants: vars,
          };
        }
        return r;
      })
    );
  };

  const handleAddVariant = (rowId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const numJual = parseFloat(r.harga_jual) || 15000;
          const numHpp = parseFloat(r.modal_hpp) || 10000;
          const newVar: ProductVariant = {
            id: `VAR-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            name: `Varian ${(r.variants || []).length + 1}`,
            harga_jual: numJual,
            modal_hpp: numHpp,
            stock: parseFloat(r.stock) || 50,
          };
          return {
            ...r,
            variants: [...(r.variants || []), newVar],
          };
        }
        return r;
      })
    );
  };

  const handleUpdateVariant = (
    rowId: string,
    variantId: string,
    field: keyof ProductVariant,
    value: any
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const nextVars = (r.variants || []).map((v) => {
            if (v.id === variantId) {
              return { ...v, [field]: value };
            }
            return v;
          });
          return {
            ...r,
            variants: nextVars,
          };
        }
        return r;
      })
    );
  };

  const handleRemoveVariant = (rowId: string, variantId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          return {
            ...r,
            variants: (r.variants || []).filter((v) => v.id !== variantId),
          };
        }
        return r;
      })
    );
  };

  // Barcode Scanner handler
  const handleStartScan = (rowId: string) => {
    setScanningRowId(rowId);
    setBarcodeScannerVisible(true);
  };

  const handleBarcodeScanned = (code: string) => {
    if (!scanningRowId) return;
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === scanningRowId) {
          const updated = { ...r, barcode: code };
          if (!r.name.trim()) {
            const detected = lookupSupermarketBarcode(code);
            if (detected) {
              if (detected.name) updated.name = detected.name;
              if (detected.category) updated.category = detected.category;
              if (detected.harga_jual) updated.harga_jual = detected.harga_jual.toString();
              if (detected.modal_hpp) updated.modal_hpp = detected.modal_hpp.toString();
              if (detected.unit) updated.unit = detected.unit;
            }
          }
          return updated;
        }
        return r;
      })
    );
    setBarcodeScannerVisible(false);
    setScanningRowId(null);
  };

  // Valid entries calculation
  const validRows = rows.filter((r) => {
    const hasName = r.name.trim().length > 0;
    if (!hasName) return false;
    if (r.has_variants && r.variants.length > 0) {
      return r.variants.some((v) => v.name.trim().length > 0 && Number(v.harga_jual) > 0);
    }
    return parseFloat(r.harga_jual) > 0;
  });

  const totalEstSales = validRows.reduce((acc, r) => {
    if (r.has_variants && r.variants.length > 0) {
      const varTotal = r.variants.reduce(
        (vSum, v) => vSum + (Number(v.harga_jual) || 0) * (Number(v.stock) || 0),
        0
      );
      return acc + varTotal;
    }
    return acc + (parseFloat(r.harga_jual) || 0) * (parseFloat(r.stock) || 0);
  }, 0);

  const handleSubmit = async () => {
    if (validRows.length === 0) {
      Alert.alert(
        "Data Belum Lengkap",
        "Harap isi minimal 1 produk dengan Nama dan Harga Jual (atau Varian) yang valid."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const inputs: ProductInput[] = validRows.map((r) => {
        const numHargaJual = parseFloat(r.harga_jual) || 0;
        const numModalHpp = parseFloat(r.modal_hpp) || 0;
        const isDecimal = r.is_decimal || r.category === "Buah" ? 1 : 0;

        const validCostItems = (r.cost_items || []).filter(
          (it) => it.name.trim().length > 0 || (Number(it.amount) || 0) > 0
        );
        const hppBreakdownJson =
          validCostItems.length > 0 ? JSON.stringify(validCostItems) : null;

        const validVariants = (r.variants || []).filter((v) => v.name.trim().length > 0);
        const hasVariants = r.has_variants && validVariants.length > 0 ? 1 : 0;
        const variantsJson = hasVariants ? JSON.stringify(validVariants) : null;

        return {
          name: r.name.trim(),
          category: r.category.trim() || "Makanan",
          unit: r.unit || "pcs",
          is_decimal: isDecimal,
          harga_jual: hasVariants && validVariants.length > 0 ? validVariants[0].harga_jual : numHargaJual,
          modal_hpp: hasVariants && validVariants.length > 0 ? validVariants[0].modal_hpp : numModalHpp,
          stock: parseFloat(r.stock) || 0,
          barcode: r.barcode.trim() || null,
          image_uri: r.image_uri.trim() || null,
          has_variants: hasVariants,
          variants_json: variantsJson,
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
            minHeight: "82%",
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
                  + 1 Produk
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
                  + 5 Produk
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

          {/* Cards Scroll Area */}
          <ScrollView
            style={{ flex: 1, paddingHorizontal: 16, paddingTop: 14 }}
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
          >
            {rows.map((row, index) => {
              const hasVariants = row.has_variants;
              const numHargaJual = parseFloat(row.harga_jual) || 0;
              const numModalHpp = parseFloat(row.modal_hpp) || 0;
              const labaKotor = Math.max(0, numHargaJual - numModalHpp);
              const marginPercent =
                numHargaJual > 0 ? ((labaKotor / numHargaJual) * 100).toFixed(1) : "0.0";
              const isValid =
                row.name.trim().length > 0 &&
                (hasVariants ? (row.variants || []).length > 0 : numHargaJual > 0);

              return (
                <View
                  key={row.id}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: isValid ? "#99f6e4" : "#e2e8f0",
                    padding: 16,
                    marginBottom: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  {/* Card Top: Index, Product Title Preview & Actions */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: "#f1f5f9",
                      marginBottom: 14,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
                      <View
                        style={{
                          backgroundColor: isValid ? "#0097A7" : "#e2e8f0",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
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
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: row.name.trim() ? "#0f172a" : "#94a3b8",
                          flex: 1,
                        }}
                      >
                        {row.name.trim() || "Produk Baru"}
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => handleDuplicateRow(index)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 8,
                          paddingVertical: 5,
                          borderRadius: 8,
                          backgroundColor: "#f1f5f9",
                        }}
                      >
                        <Copy size={13} color="#475569" />
                        <Text style={{ fontSize: 10, fontWeight: "600", color: "#475569", marginLeft: 4 }}>
                          Duplikat
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRemoveRow(row.id)}
                        style={{
                          padding: 5,
                          borderRadius: 8,
                          backgroundColor: "#fee2e2",
                        }}
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 1. Foto Produk Section */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#3f3f46", marginBottom: 6 }}>
                      Foto Produk
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      {/* Preview Box */}
                      <View
                        style={{
                          width: 68,
                          height: 68,
                          borderRadius: 14,
                          backgroundColor: "#f4f4f5",
                          borderWidth: 1,
                          borderColor: "#e4e4e7",
                          overflow: "hidden",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 10,
                        }}
                      >
                        {row.image_uri ? (
                          <Image
                            source={{ uri: row.image_uri }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Package size={24} color="#a1a1aa" />
                        )}
                      </View>

                      {/* Upload Buttons */}
                      <View style={{ flex: 1, gap: 4 }}>
                        <View style={{ flexDirection: "row", gap: 6 }}>
                          <TouchableOpacity
                            onPress={() => handlePickImageForRow(row.id)}
                            activeOpacity={0.8}
                            style={{
                              flex: 1,
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                              paddingVertical: 6,
                              paddingHorizontal: 8,
                              backgroundColor: "#ecfeff",
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: "#a5f3fc",
                            }}
                          >
                            <ImageIcon size={13} color="#0097A7" />
                            <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7", marginLeft: 4 }}>
                              Galeri / File
                            </Text>
                          </TouchableOpacity>

                          {Platform.OS !== "web" && (
                            <TouchableOpacity
                              onPress={() => handleTakePhotoForRow(row.id)}
                              activeOpacity={0.8}
                              style={{
                                flex: 1,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                paddingVertical: 6,
                                paddingHorizontal: 8,
                                backgroundColor: "#f4f4f5",
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: "#e4e4e7",
                              }}
                            >
                              <Camera size={13} color="#52525b" />
                              <Text style={{ fontSize: 11, fontWeight: "700", color: "#52525b", marginLeft: 4 }}>
                                Kamera
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {row.image_uri ? (
                          <TouchableOpacity
                            onPress={() => handleUpdateField(row.id, "image_uri", "")}
                            style={{ alignSelf: "flex-start", paddingVertical: 1 }}
                          >
                            <Text style={{ fontSize: 10, color: "#ef4444", fontWeight: "600" }}>
                              Hapus Foto
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={{ fontSize: 9, color: "#71717a" }}>
                            Format: JPG, PNG, WebP (Tersimpan di SQLite)
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* 2. Nama Produk */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#3f3f46", marginBottom: 6 }}>
                      Nama Produk *
                    </Text>
                    <TextInput
                      value={row.name}
                      onChangeText={(val) => handleUpdateField(row.id, "name", val)}
                      placeholder="Contoh: Nasi Kuning, Anggur, Apel..."
                      placeholderTextColor="#a1a1aa"
                      style={{
                        backgroundColor: "#f9fafb",
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        fontSize: 13,
                        color: "#18181b",
                      }}
                    />
                  </View>

                  {/* 3. Kategori */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#3f3f46", marginBottom: 6 }}>
                      Kategori
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        {categories.map((c) => {
                          const isSelected = row.category === c;
                          return (
                            <TouchableOpacity
                              key={c}
                              onPress={() => handleSelectCategory(row.id, c)}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 16,
                                backgroundColor: isSelected ? "#0097A7" : "#f4f4f5",
                                borderWidth: 1,
                                borderColor: isSelected ? "#0097A7" : "#e5e7eb",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontWeight: isSelected ? "700" : "500",
                                  color: isSelected ? "#ffffff" : "#52525b",
                                }}
                              >
                                {c}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>

                  {/* 4. Mode Timbangan & Satuan */}
                  <View
                    style={{
                      backgroundColor: row.is_decimal ? "#f0fdfa" : "#f9fafb",
                      borderWidth: 1,
                      borderColor: row.is_decimal ? "#99f6e4" : "#e5e7eb",
                      borderRadius: 16,
                      padding: 12,
                      marginBottom: 14,
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
                        <Scale size={15} color={row.is_decimal ? "#0097A7" : "#71717a"} />
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: row.is_decimal ? "#0f766e" : "#18181b",
                            marginLeft: 6,
                          }}
                        >
                          Mode Timbangan (Desimal / kg)
                        </Text>
                      </View>
                      <Switch
                        value={row.is_decimal}
                        onValueChange={(val) => {
                          handleUpdateField(row.id, "is_decimal", val);
                          if (val && row.unit === "pcs") {
                            handleUpdateField(row.id, "unit", "kg");
                          }
                        }}
                        trackColor={{ false: "#e4e4e7", true: "#0097A7" }}
                        thumbColor="#ffffff"
                      />
                    </View>

                    <Text style={{ fontSize: 10, color: "#71717a", marginBottom: 6 }}>
                      Satuan Unit Penjualan
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
                      {UNITS.map((u) => (
                        <TouchableOpacity
                          key={u}
                          onPress={() => handleSelectUnit(row.id, u)}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 8,
                            backgroundColor: row.unit === u ? "#0097A7" : "#ffffff",
                            borderWidth: 1,
                            borderColor: row.unit === u ? "#0097A7" : "#e5e7eb",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "700",
                              color: row.unit === u ? "#ffffff" : "#52525b",
                            }}
                          >
                            {u}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* 5. Pricing Section (Harga Jual & Modal HPP) */}
                  {!hasVariants && (
                    <View style={{ marginBottom: 14 }}>
                      <View style={{ flexDirection: "row", gap: 10, marginBottom: featureHppBreakdown ? 10 : 0 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, fontWeight: "700", color: "#3f3f46", marginBottom: 5 }}>
                            Harga Jual (Rp / {row.unit}) *
                          </Text>
                          <TextInput
                            value={row.harga_jual}
                            onChangeText={(val) => handleUpdateField(row.id, "harga_jual", val)}
                            keyboardType="numeric"
                            placeholder="Contoh: 50000"
                            placeholderTextColor="#a1a1aa"
                            style={{
                              backgroundColor: "#f9fafb",
                              borderWidth: 1,
                              borderColor: "#e5e7eb",
                              borderRadius: 12,
                              paddingHorizontal: 12,
                              paddingVertical: 9,
                              fontSize: 13,
                              fontWeight: "700",
                              color: "#18181b",
                            }}
                          />
                        </View>

                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: 5,
                            }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: "700", color: "#3f3f46" }}>
                              Modal HPP (Rp)
                            </Text>
                            {(row.cost_items || []).length > 0 && (
                              <Text style={{ fontSize: 9, color: "#0097A7", fontWeight: "700" }}>
                                (Otomatis)
                              </Text>
                            )}
                          </View>
                          <TextInput
                            value={row.modal_hpp}
                            onChangeText={(val) => handleUpdateField(row.id, "modal_hpp", val)}
                            keyboardType="numeric"
                            placeholder="Contoh: 35000"
                            placeholderTextColor="#a1a1aa"
                            style={{
                              backgroundColor: "#f9fafb",
                              borderWidth: 1,
                              borderColor: (row.cost_items || []).length > 0 ? "#0097A7" : "#e5e7eb",
                              borderRadius: 12,
                              paddingHorizontal: 12,
                              paddingVertical: 9,
                              fontSize: 13,
                              color: "#18181b",
                            }}
                          />
                        </View>
                      </View>

                      {/* 6. Rincian Modal HPP (Bahan Baku) Card */}
                      {featureHppBreakdown && (
                        <View
                          style={{
                            backgroundColor: (row.cost_items || []).length > 0 ? "#f0fdfa" : "#f9fafb",
                            borderWidth: 1,
                            borderColor: (row.cost_items || []).length > 0 ? "#99f6e4" : "#e5e7eb",
                            borderRadius: 16,
                            padding: 12,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: (row.cost_items || []).length > 0 ? 10 : 0,
                            }}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
                              <Calculator size={15} color="#0097A7" />
                              <View style={{ marginLeft: 6, flex: 1 }}>
                                <Text style={{ fontSize: 11, fontWeight: "700", color: "#0f766e" }}>
                                  Rincian Modal HPP (Bahan Baku)
                                </Text>
                                <Text style={{ fontSize: 9, color: "#71717a", marginTop: 1 }}>
                                  {(row.cost_items || []).length > 0
                                    ? `${row.cost_items.length} bahan dihitung otomatis`
                                    : "Hitung total modal dari bahan (cth: Terigu, Minyak)"}
                                </Text>
                              </View>
                            </View>
                            <TouchableOpacity
                              onPress={() => handleAddCostItem(row.id)}
                              activeOpacity={0.8}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingHorizontal: 9,
                                paddingVertical: 5,
                                borderRadius: 8,
                                backgroundColor: "#0097A7",
                              }}
                            >
                              <Plus size={12} color="#ffffff" />
                              <Text style={{ fontSize: 10, fontWeight: "700", color: "#ffffff", marginLeft: 3 }}>
                                + Tambah Biaya
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {(row.cost_items || []).length > 0 && (
                            <View style={{ gap: 6 }}>
                              {row.cost_items.map((item, itemIdx) => (
                                <View
                                  key={item.id}
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 5,
                                    backgroundColor: "#ffffff",
                                    padding: 6,
                                    borderRadius: 10,
                                    borderWidth: 1,
                                    borderColor: "#e5e7eb",
                                  }}
                                >
                                  <Text style={{ fontSize: 10, fontWeight: "700", color: "#71717a", width: 16, textAlign: "center" }}>
                                    #{itemIdx + 1}
                                  </Text>
                                  <TextInput
                                    value={item.name}
                                    onChangeText={(val) => handleUpdateCostItem(row.id, item.id, "name", val)}
                                    placeholder="Nama Bahan (cth: Terigu)"
                                    placeholderTextColor="#a1a1aa"
                                    style={{
                                      flex: 1.3,
                                      backgroundColor: "#f9fafb",
                                      borderWidth: 1,
                                      borderColor: "#e5e7eb",
                                      borderRadius: 6,
                                      paddingHorizontal: 8,
                                      paddingVertical: 5,
                                      fontSize: 11,
                                      color: "#18181b",
                                    }}
                                  />
                                  <TextInput
                                    value={item.amount > 0 ? item.amount.toString() : ""}
                                    onChangeText={(val) => handleUpdateCostItem(row.id, item.id, "amount", val)}
                                    keyboardType="numeric"
                                    placeholder="Rp 0"
                                    placeholderTextColor="#a1a1aa"
                                    style={{
                                      flex: 1,
                                      backgroundColor: "#f9fafb",
                                      borderWidth: 1,
                                      borderColor: "#e5e7eb",
                                      borderRadius: 6,
                                      paddingHorizontal: 8,
                                      paddingVertical: 5,
                                      fontSize: 11,
                                      fontWeight: "600",
                                      color: "#18181b",
                                    }}
                                  />
                                  <TouchableOpacity
                                    onPress={() => handleRemoveCostItem(row.id, item.id)}
                                    style={{
                                      padding: 5,
                                      borderRadius: 6,
                                      backgroundColor: "#fef2f2",
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
                                  Total Modal Terhitung:
                                </Text>
                                <Text style={{ fontSize: 12, fontWeight: "800", color: "#0f766e" }}>
                                  {formatRupiah(row.cost_items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0))}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  )}

                  {/* 7. Real-time Profit Margin Indicator */}
                  {!hasVariants && numHargaJual > 0 && (
                    <View
                      style={{
                        padding: 10,
                        borderRadius: 12,
                        backgroundColor: "#f0fdf4",
                        borderWidth: 1,
                        borderColor: "#bbf7d0",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 14,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <TrendingUp size={14} color="#16a34a" />
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#15803d", marginLeft: 5 }}>
                          Laba Bersih per {row.unit}:
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: "800", color: "#16a34a" }}>
                        +{formatRupiah(labaKotor)} ({marginPercent}%)
                      </Text>
                    </View>
                  )}

                  {/* 8. Stock & Barcode Section */}
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#3f3f46", marginBottom: 5 }}>
                        Stok ({row.unit}) *
                      </Text>
                      <TextInput
                        value={row.stock}
                        onChangeText={(val) => handleUpdateField(row.id, "stock", val)}
                        keyboardType="numeric"
                        placeholder="50"
                        placeholderTextColor="#a1a1aa"
                        style={{
                          backgroundColor: "#f9fafb",
                          borderWidth: 1,
                          borderColor: "#e5e7eb",
                          borderRadius: 12,
                          paddingHorizontal: 12,
                          paddingVertical: 9,
                          fontSize: 13,
                          color: "#18181b",
                        }}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 5,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#3f3f46" }}>
                          Barcode / SKU
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleStartScan(row.id)}
                          activeOpacity={0.7}
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Scan size={11} color="#0097A7" />
                          <Text style={{ fontSize: 10, fontWeight: "700", color: "#0097A7", marginLeft: 3 }}>
                            Scan Kamera
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <TextInput
                        value={row.barcode}
                        onChangeText={(val) => handleUpdateField(row.id, "barcode", val)}
                        placeholder="899..."
                        placeholderTextColor="#a1a1aa"
                        style={{
                          backgroundColor: "#f9fafb",
                          borderWidth: 1,
                          borderColor: "#e5e7eb",
                          borderRadius: 12,
                          paddingHorizontal: 12,
                          paddingVertical: 9,
                          fontSize: 13,
                          color: "#18181b",
                        }}
                      />
                    </View>
                  </View>

                  {/* 9. Variants Toggle Section */}
                  {featureVariants && (
                    <View
                      style={{
                        backgroundColor: "#f9fafb",
                        borderRadius: 16,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Layers size={15} color="#0097A7" />
                          <Text style={{ fontSize: 11, fontWeight: "700", color: "#18181b", marginLeft: 6 }}>
                            Produk Memiliki Varian (Rasa / Ukuran)
                          </Text>
                        </View>
                        <Switch
                          value={hasVariants}
                          onValueChange={(val) => handleToggleVariants(row.id, val)}
                          trackColor={{ false: "#e4e4e7", true: "#0097A7" }}
                          thumbColor="#ffffff"
                        />
                      </View>

                      {hasVariants && (
                        <View style={{ marginTop: 10 }}>
                          {(row.variants || []).map((v, vIdx) => (
                            <View
                              key={v.id}
                              style={{
                                backgroundColor: "#ffffff",
                                borderRadius: 12,
                                padding: 10,
                                marginBottom: 8,
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                              }}
                            >
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginBottom: 6,
                                }}
                              >
                                <Text style={{ fontSize: 11, fontWeight: "700", color: "#18181b" }}>
                                  Varian #{vIdx + 1}
                                </Text>
                                {(row.variants || []).length > 1 && (
                                  <TouchableOpacity
                                    onPress={() => handleRemoveVariant(row.id, v.id)}
                                    style={{ padding: 2 }}
                                  >
                                    <Trash2 size={13} color="#ef4444" />
                                  </TouchableOpacity>
                                )}
                              </View>

                              <TextInput
                                value={v.name}
                                onChangeText={(val) => handleUpdateVariant(row.id, v.id, "name", val)}
                                placeholder="Nama Varian (cth: Jumbo, Pedas, Small)"
                                placeholderTextColor="#a1a1aa"
                                style={{
                                  backgroundColor: "#f9fafb",
                                  borderWidth: 1,
                                  borderColor: "#e5e7eb",
                                  borderRadius: 8,
                                  paddingHorizontal: 8,
                                  paddingVertical: 5,
                                  fontSize: 11,
                                  marginBottom: 6,
                                }}
                              />

                              <View style={{ flexDirection: "row", gap: 6 }}>
                                <TextInput
                                  value={v.harga_jual > 0 ? v.harga_jual.toString() : ""}
                                  onChangeText={(val) =>
                                    handleUpdateVariant(row.id, v.id, "harga_jual", parseFloat(val) || 0)
                                  }
                                  keyboardType="numeric"
                                  placeholder="Harga Jual"
                                  placeholderTextColor="#a1a1aa"
                                  style={{
                                    flex: 1,
                                    backgroundColor: "#f9fafb",
                                    borderWidth: 1,
                                    borderColor: "#e5e7eb",
                                    borderRadius: 8,
                                    paddingHorizontal: 8,
                                    paddingVertical: 5,
                                    fontSize: 11,
                                  }}
                                />
                                <TextInput
                                  value={v.modal_hpp > 0 ? v.modal_hpp.toString() : ""}
                                  onChangeText={(val) =>
                                    handleUpdateVariant(row.id, v.id, "modal_hpp", parseFloat(val) || 0)
                                  }
                                  keyboardType="numeric"
                                  placeholder="HPP Modal"
                                  placeholderTextColor="#a1a1aa"
                                  style={{
                                    flex: 1,
                                    backgroundColor: "#f9fafb",
                                    borderWidth: 1,
                                    borderColor: "#e5e7eb",
                                    borderRadius: 8,
                                    paddingHorizontal: 8,
                                    paddingVertical: 5,
                                    fontSize: 11,
                                  }}
                                />
                                <TextInput
                                  value={v.stock > 0 ? v.stock.toString() : ""}
                                  onChangeText={(val) =>
                                    handleUpdateVariant(row.id, v.id, "stock", parseFloat(val) || 0)
                                  }
                                  keyboardType="numeric"
                                  placeholder="Stok"
                                  placeholderTextColor="#a1a1aa"
                                  style={{
                                    flex: 0.8,
                                    backgroundColor: "#f9fafb",
                                    borderWidth: 1,
                                    borderColor: "#e5e7eb",
                                    borderRadius: 8,
                                    paddingHorizontal: 8,
                                    paddingVertical: 5,
                                    fontSize: 11,
                                  }}
                                />
                              </View>
                            </View>
                          ))}

                          <TouchableOpacity
                            onPress={() => handleAddVariant(row.id)}
                            activeOpacity={0.8}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                              paddingVertical: 7,
                              borderRadius: 8,
                              backgroundColor: "#ecfeff",
                              borderWidth: 1,
                              borderColor: "#a5f3fc",
                            }}
                          >
                            <Plus size={13} color="#0097A7" />
                            <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7", marginLeft: 4 }}>
                              Tambah Varian
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
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

      <BarcodeScannerModal
        visible={barcodeScannerVisible}
        onClose={() => {
          setBarcodeScannerVisible(false);
          setScanningRowId(null);
        }}
        onScan={handleBarcodeScanned}
      />
    </Modal>
  );
}
