import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Promo, PromoType, Product, Category } from "@/db";
import { PromoInput } from "@/db/promoRepository";
import { getAllProducts } from "@/db/productRepository";
import { getAllCategories } from "@/db/categoryRepository";
import { formatRupiah } from "@/util/formatters";
import { X, Tag, Gift, Percent, DollarSign, Layers, Package, Check } from "lucide-react-native";

interface PromoFormModalProps {
  visible: boolean;
  promoToEdit?: Promo | null;
  onClose: () => void;
  onSave: (data: PromoInput, id?: string) => Promise<void>;
}

export function PromoFormModal({
  visible,
  promoToEdit,
  onClose,
  onSave,
}: PromoFormModalProps) {
  const [name, setName] = useState("");
  const [promoType, setPromoType] = useState<PromoType>("COMBO_DISCOUNT");
  const [targetType, setTargetType] = useState<"ALL" | "CATEGORY" | "PRODUCT">("CATEGORY");
  const [targetId, setTargetId] = useState<string>("");
  const [targetName, setTargetName] = useState<string>("");

  const [minQty, setMinQty] = useState("3");
  const [minSpend, setMinSpend] = useState("0");
  const [rewardFreeQty, setRewardFreeQty] = useState("1");
  const [discountAmount, setDiscountAmount] = useState("2000");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [discountMode, setDiscountMode] = useState<"NOMINAL" | "PERCENT">("NOMINAL");
  const [isActive, setIsActive] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      (async () => {
        const cats = await getAllCategories();
        setCategories(cats);
        const prods = await getAllProducts();
        setProducts(prods);

        if (promoToEdit) {
          setName(promoToEdit.name);
          setPromoType(promoToEdit.promo_type);
          setTargetType(promoToEdit.target_type);
          setTargetId(promoToEdit.target_id || "");
          setTargetName(promoToEdit.target_name || "");
          setMinQty(String(promoToEdit.min_qty || 1));
          setMinSpend(String(promoToEdit.min_spend || 0));
          setRewardFreeQty(String(promoToEdit.reward_free_qty || 0));
          setDiscountAmount(String(promoToEdit.discount_amount || 0));
          setDiscountPercent(String(promoToEdit.discount_percent || 0));
          setDiscountMode(promoToEdit.discount_percent > 0 ? "PERCENT" : "NOMINAL");
          setIsActive(promoToEdit.is_active === 1);
        } else {
          resetForm(cats);
        }
      })();
    }
  }, [visible, promoToEdit]);

  const resetForm = (cats: Category[]) => {
    setName("");
    setPromoType("COMBO_DISCOUNT");
    setTargetType("CATEGORY");
    const defaultCat = cats.length > 0 ? cats[0].name : "Makanan";
    setTargetId(defaultCat);
    setTargetName(defaultCat);
    setMinQty("3");
    setMinSpend("0");
    setRewardFreeQty("1");
    setDiscountAmount("2000");
    setDiscountPercent("0");
    setDiscountMode("NOMINAL");
    setIsActive(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Validasi Gagal", "Nama promo wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(
        {
          name: name.trim(),
          promo_type: promoType,
          target_type: targetType,
          target_id: targetType === "ALL" ? null : targetId || null,
          target_name: targetType === "ALL" ? "Semua Produk" : targetName || targetId || null,
          min_qty: Number(minQty) || 1,
          min_spend: Number(minSpend) || 0,
          reward_free_qty: promoType === "BUY_X_GET_Y" ? Number(rewardFreeQty) || 1 : 0,
          discount_amount:
            promoType !== "BUY_X_GET_Y" && discountMode === "NOMINAL" ? Number(discountAmount) || 0 : 0,
          discount_percent:
            promoType !== "BUY_X_GET_Y" && discountMode === "PERCENT" ? Number(discountPercent) || 0 : 0,
          is_active: isActive ? 1 : 0,
        },
        promoToEdit ? promoToEdit.id : undefined
      );
      onClose();
    } catch (err: any) {
      Alert.alert("Gagal Simpan Promo", err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 16 }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 480,
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
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: "#ecfeff",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <Tag size={18} color="#0097A7" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#18181b" }}>
                {promoToEdit ? "Edit Promo & Diskon" : "Tambah Promo Baru"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={18} color="#71717a" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 1. Nama Promo */}
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#71717a", marginBottom: 4 }}>
              Nama Promo *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Contoh: Beli 3 Mie Instan Diskon Rp 2.000"
              style={{
                padding: 12,
                borderRadius: 14,
                backgroundColor: "#f4f4f5",
                borderWidth: 1,
                borderColor: "#e4e4e7",
                fontSize: 13,
                fontWeight: "600",
                color: "#18181b",
                marginBottom: 14,
              }}
            />

            {/* 2. Tipe Promo */}
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#71717a", marginBottom: 6 }}>
              Tipe Promo
            </Text>
            <View style={{ flexDirection: "row", gap: 6, marginBottom: 14 }}>
              <TouchableOpacity
                onPress={() => setPromoType("COMBO_DISCOUNT")}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  borderRadius: 14,
                  alignItems: "center",
                  backgroundColor: promoType === "COMBO_DISCOUNT" ? "#ecfeff" : "#f4f4f5",
                  borderWidth: 1,
                  borderColor: promoType === "COMBO_DISCOUNT" ? "#0097A7" : "#e4e4e7",
                }}
              >
                <Percent size={16} color={promoType === "COMBO_DISCOUNT" ? "#0097A7" : "#71717a"} />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: promoType === "COMBO_DISCOUNT" ? "#0097A7" : "#71717a",
                    marginTop: 4,
                    textAlign: "center",
                  }}
                >
                  Beli X Diskon Rp
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPromoType("BUY_X_GET_Y")}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  borderRadius: 14,
                  alignItems: "center",
                  backgroundColor: promoType === "BUY_X_GET_Y" ? "#ecfeff" : "#f4f4f5",
                  borderWidth: 1,
                  borderColor: promoType === "BUY_X_GET_Y" ? "#0097A7" : "#e4e4e7",
                }}
              >
                <Gift size={16} color={promoType === "BUY_X_GET_Y" ? "#0097A7" : "#71717a"} />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: promoType === "BUY_X_GET_Y" ? "#0097A7" : "#71717a",
                    marginTop: 4,
                    textAlign: "center",
                  }}
                >
                  Beli X Gratis Y
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPromoType("MIN_SPEND")}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  borderRadius: 14,
                  alignItems: "center",
                  backgroundColor: promoType === "MIN_SPEND" ? "#ecfeff" : "#f4f4f5",
                  borderWidth: 1,
                  borderColor: promoType === "MIN_SPEND" ? "#0097A7" : "#e4e4e7",
                }}
              >
                <DollarSign size={16} color={promoType === "MIN_SPEND" ? "#0097A7" : "#71717a"} />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: promoType === "MIN_SPEND" ? "#0097A7" : "#71717a",
                    marginTop: 4,
                    textAlign: "center",
                  }}
                >
                  Min. Belanja
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. Target Promo */}
            {promoType !== "MIN_SPEND" && (
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#71717a", marginBottom: 6 }}>
                  Berlaku Untuk
                </Text>
                <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setTargetType("CATEGORY");
                      if (categories.length > 0) {
                        setTargetId(categories[0].name);
                        setTargetName(categories[0].name);
                      }
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 12,
                      alignItems: "center",
                      backgroundColor: targetType === "CATEGORY" ? "#0097A7" : "#f4f4f5",
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: targetType === "CATEGORY" ? "#ffffff" : "#52525b" }}>
                      Per Kategori
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setTargetType("PRODUCT");
                      if (products.length > 0) {
                        setTargetId(products[0].id);
                        setTargetName(products[0].name);
                      }
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 12,
                      alignItems: "center",
                      backgroundColor: targetType === "PRODUCT" ? "#0097A7" : "#f4f4f5",
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: targetType === "PRODUCT" ? "#ffffff" : "#52525b" }}>
                      Produk Spesifik
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setTargetType("ALL");
                      setTargetId("");
                      setTargetName("Semua Produk");
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 12,
                      alignItems: "center",
                      backgroundColor: targetType === "ALL" ? "#0097A7" : "#f4f4f5",
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: targetType === "ALL" ? "#ffffff" : "#52525b" }}>
                      Semua Produk
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Category Picker list */}
                {targetType === "CATEGORY" && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row", marginTop: 4 }}>
                    {categories.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => {
                          setTargetId(c.name);
                          setTargetName(c.name);
                        }}
                        style={{
                          marginRight: 6,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12,
                          backgroundColor: targetId === c.name ? "#ecfeff" : "#f4f4f5",
                          borderWidth: 1,
                          borderColor: targetId === c.name ? "#0097A7" : "#e4e4e7",
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: targetId === c.name ? "#0097A7" : "#52525b" }}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {/* Product Picker list */}
                {targetType === "PRODUCT" && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row", marginTop: 4 }}>
                    {products.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => {
                          setTargetId(p.id);
                          setTargetName(p.name);
                        }}
                        style={{
                          marginRight: 6,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12,
                          backgroundColor: targetId === p.id ? "#ecfeff" : "#f4f4f5",
                          borderWidth: 1,
                          borderColor: targetId === p.id ? "#0097A7" : "#e4e4e7",
                        }}
                      >
                        <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: "700", color: targetId === p.id ? "#0097A7" : "#52525b" }}>
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* 4. Conditional Inputs based on promoType */}
            {promoType === "BUY_X_GET_Y" && (
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: "#71717a", marginBottom: 4 }}>
                    Beli Jumlah (X)
                  </Text>
                  <TextInput
                    value={minQty}
                    onChangeText={setMinQty}
                    keyboardType="numeric"
                    placeholder="2"
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      backgroundColor: "#f4f4f5",
                      borderWidth: 1,
                      borderColor: "#e4e4e7",
                      fontSize: 13,
                      fontWeight: "700",
                      color: "#18181b",
                      textAlign: "center",
                    }}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: "#71717a", marginBottom: 4 }}>
                    Gratis Jumlah (Y)
                  </Text>
                  <TextInput
                    value={rewardFreeQty}
                    onChangeText={setRewardFreeQty}
                    keyboardType="numeric"
                    placeholder="1"
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      backgroundColor: "#f4f4f5",
                      borderWidth: 1,
                      borderColor: "#e4e4e7",
                      fontSize: 13,
                      fontWeight: "700",
                      color: "#18181b",
                      textAlign: "center",
                    }}
                  />
                </View>
              </View>
            )}

            {promoType === "COMBO_DISCOUNT" && (
              <View style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#71717a", marginBottom: 4 }}>
                      Minimal Beli (Qty)
                    </Text>
                    <TextInput
                      value={minQty}
                      onChangeText={setMinQty}
                      keyboardType="numeric"
                      placeholder="3"
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        backgroundColor: "#f4f4f5",
                        borderWidth: 1,
                        borderColor: "#e4e4e7",
                        fontSize: 13,
                        fontWeight: "700",
                        color: "#18181b",
                        textAlign: "center",
                      }}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#71717a", marginBottom: 4 }}>
                      Jenis Diskon
                    </Text>
                    <View style={{ flexDirection: "row", backgroundColor: "#f4f4f5", borderRadius: 14, padding: 2 }}>
                      <TouchableOpacity
                        onPress={() => setDiscountMode("NOMINAL")}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 12,
                          alignItems: "center",
                          backgroundColor: discountMode === "NOMINAL" ? "#0097A7" : "transparent",
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: discountMode === "NOMINAL" ? "#ffffff" : "#71717a" }}>
                          Rp
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setDiscountMode("PERCENT")}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 12,
                          alignItems: "center",
                          backgroundColor: discountMode === "PERCENT" ? "#0097A7" : "transparent",
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: discountMode === "PERCENT" ? "#ffffff" : "#71717a" }}>
                          %
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <Text style={{ fontSize: 11, fontWeight: "600", color: "#71717a", marginBottom: 4 }}>
                  {discountMode === "NOMINAL" ? "Potongan Harga (Rp)" : "Potongan Persentase (%)"}
                </Text>
                <TextInput
                  value={discountMode === "NOMINAL" ? discountAmount : discountPercent}
                  onChangeText={discountMode === "NOMINAL" ? setDiscountAmount : setDiscountPercent}
                  keyboardType="numeric"
                  placeholder={discountMode === "NOMINAL" ? "2000" : "10"}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: "#f4f4f5",
                    borderWidth: 1,
                    borderColor: "#e4e4e7",
                    fontSize: 13,
                    fontWeight: "700",
                    color: "#18181b",
                  }}
                />
              </View>
            )}

            {promoType === "MIN_SPEND" && (
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#71717a", marginBottom: 4 }}>
                  Minimal Total Belanja (Rp)
                </Text>
                <TextInput
                  value={minSpend}
                  onChangeText={setMinSpend}
                  keyboardType="numeric"
                  placeholder="50000"
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: "#f4f4f5",
                    borderWidth: 1,
                    borderColor: "#e4e4e7",
                    fontSize: 13,
                    fontWeight: "700",
                    color: "#18181b",
                    marginBottom: 10,
                  }}
                />

                <Text style={{ fontSize: 11, fontWeight: "600", color: "#71717a", marginBottom: 4 }}>
                  Potongan Diskon (Rp)
                </Text>
                <TextInput
                  value={discountAmount}
                  onChangeText={setDiscountAmount}
                  keyboardType="numeric"
                  placeholder="5000"
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: "#f4f4f5",
                    borderWidth: 1,
                    borderColor: "#e4e4e7",
                    fontSize: 13,
                    fontWeight: "700",
                    color: "#18181b",
                  }}
                />
              </View>
            )}

            {/* 5. Switch Aktifkan */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 10,
                borderTopWidth: 1,
                borderTopColor: "#f4f4f5",
                marginBottom: 14,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#18181b" }}>
                Status Promo Aktif
              </Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: "#e4e4e7", true: "#0097A7" }}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
              style={{
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: "#0097A7",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff" }}>
                {isSubmitting ? "Menyimpan..." : "Simpan Promo"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
