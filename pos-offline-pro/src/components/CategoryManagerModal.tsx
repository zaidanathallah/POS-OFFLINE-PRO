import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Category } from "@/db";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/db/categoryRepository";
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Tag,
  Check,
} from "lucide-react-native";

interface CategoryManagerModalProps {
  visible: boolean;
  onClose: () => void;
  onCategoriesChanged?: () => void;
}

export function CategoryManagerModal({
  visible,
  onClose,
  onCategoriesChanged,
}: CategoryManagerModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const list = await getAllCategories();
      setCategories(list);
    } catch (e: any) {
      console.error("Gagal load categories:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadCategories();
      setNewCategoryName("");
      setEditingId(null);
      setEditingName("");
    }
  }, [visible]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Perhatian", "Nama kategori tidak boleh kosong.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createCategory(newCategoryName.trim());
      setNewCategoryName("");
      await loadCategories();
      onCategoriesChanged?.();
    } catch (err: any) {
      Alert.alert("Gagal Tambah Kategori", err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) return;

    setIsSubmitting(true);
    try {
      await updateCategory(editingId, editingName.trim());
      setEditingId(null);
      setEditingName("");
      await loadCategories();
      onCategoriesChanged?.();
    } catch (err: any) {
      Alert.alert("Gagal Ubah Kategori", err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (cat: Category) => {
    const doDelete = async () => {
      try {
        await deleteCategory(cat.id);
        await loadCategories();
        onCategoriesChanged?.();
      } catch (err: any) {
        Alert.alert("Gagal Hapus", err.message || "Terjadi kesalahan.");
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Hapus kategori "${cat.name}"? Produk yang menggunakan kategori ini akan diubah ke "Lainnya".`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        "Hapus Kategori",
        `Apakah Anda yakin ingin menghapus kategori "${cat.name}"? Produk terkait akan dipindahkan ke "Lainnya".`,
        [
          { text: "Batal", style: "cancel" },
          { text: "Hapus", style: "destructive", onPress: doDelete },
        ]
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.65)",
          padding: 16,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 440,
            backgroundColor: "#ffffff",
            borderRadius: 24,
            maxHeight: "90%",
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 6,
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
              <View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#18181b" }}>
                  Kelola Kategori
                </Text>
                <Text style={{ fontSize: 11, color: "#71717a", marginTop: 1 }}>
                  Tambah, ubah nama, atau hapus kategori produk
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

          {/* Add Category Input Section */}
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#f4f4f5", backgroundColor: "#f9fafb" }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#3f3f46", marginBottom: 6 }}>
              Tambah Kategori Baru:
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TextInput
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Contoh: Snack, Sembako, Kopi..."
                placeholderTextColor="#a1a1aa"
                style={{
                  flex: 1,
                  backgroundColor: "#ffffff",
                  borderWidth: 1,
                  borderColor: "#d4d4d8",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  fontSize: 13,
                  color: "#18181b",
                }}
              />
              <TouchableOpacity
                onPress={handleAddCategory}
                disabled={isSubmitting || !newCategoryName.trim()}
                activeOpacity={0.8}
                style={{
                  marginLeft: 8,
                  backgroundColor: newCategoryName.trim() ? "#0097A7" : "#a1a1aa",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Plus size={16} color="#ffffff" />
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff", marginLeft: 4 }}>
                  Tambah
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category List */}
          <ScrollView style={{ padding: 16, maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={{ paddingVertical: 30, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#0097A7" />
              </View>
            ) : categories.length === 0 ? (
              <View style={{ paddingVertical: 30, alignItems: "center" }}>
                <Text style={{ fontSize: 12, color: "#71717a" }}>Belum ada kategori kustom.</Text>
              </View>
            ) : (
              categories.map((cat) => {
                const isEditingThis = editingId === cat.id;

                return (
                  <View
                    key={cat.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      backgroundColor: isEditingThis ? "#f0fdfa" : "#ffffff",
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: isEditingThis ? "#0097A7" : "#e5e7eb",
                      marginBottom: 8,
                    }}
                  >
                    {isEditingThis ? (
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", marginRight: 8 }}>
                        <TextInput
                          value={editingName}
                          onChangeText={setEditingName}
                          style={{
                            flex: 1,
                            backgroundColor: "#ffffff",
                            borderWidth: 1,
                            borderColor: "#0097A7",
                            borderRadius: 10,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            fontSize: 13,
                            color: "#18181b",
                          }}
                          autoFocus
                        />
                      </View>
                    ) : (
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#0097A7",
                            marginRight: 10,
                          }}
                        />
                        <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181b" }}>
                          {cat.name}
                        </Text>
                      </View>
                    )}

                    {/* Action buttons */}
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      {isEditingThis ? (
                        <>
                          <TouchableOpacity
                            onPress={handleSaveEdit}
                            disabled={isSubmitting}
                            style={{
                              padding: 6,
                              backgroundColor: "#0097A7",
                              borderRadius: 8,
                              marginRight: 6,
                            }}
                          >
                            <Check size={14} color="#ffffff" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={handleCancelEdit}
                            style={{
                              padding: 6,
                              backgroundColor: "#f4f4f5",
                              borderRadius: 8,
                            }}
                          >
                            <X size={14} color="#71717a" />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <TouchableOpacity
                            onPress={() => handleStartEdit(cat)}
                            style={{
                              padding: 6,
                              backgroundColor: "#ecfeff",
                              borderRadius: 8,
                              marginRight: 6,
                            }}
                          >
                            <Edit2 size={14} color="#0097A7" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDelete(cat)}
                            style={{
                              padding: 6,
                              backgroundColor: "#fef2f2",
                              borderRadius: 8,
                            }}
                          >
                            <Trash2 size={14} color="#ef4444" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Footer */}
          <View
            style={{
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: "#e5e7eb",
              backgroundColor: "#ffffff",
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              style={{
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: "#0097A7",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff" }}>
                Selesai
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
