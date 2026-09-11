import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Product } from "@/db";
import { ProductInput, createBulkProducts } from "@/db/productRepository";
import {
  downloadProductTemplateCSV,
  exportProductsToCSV,
  pickAndParseProductCSV,
} from "@/util/csvProductService";
import { formatRupiah } from "@/util/formatters";
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  ArrowRight,
  Database,
  RefreshCw,
} from "lucide-react-native";

interface CsvProductImportModalProps {
  visible: boolean;
  products: Product[];
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function CsvProductImportModal({
  visible,
  products,
  onClose,
  onSuccess,
}: CsvProductImportModalProps) {
  const [activeTab, setActiveTab] = useState<"import" | "export">("import");
  const [parsedProducts, setParsedProducts] = useState<ProductInput[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"append" | "upsert">("upsert");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handlePickFile = async () => {
    setIsLoading(true);
    try {
      const res = await pickAndParseProductCSV();
      if (res.success && res.data) {
        setParsedProducts(res.data);
        setSelectedFileName(res.fileName || "File_Produk.csv");
        setParseErrors(res.errors || []);
      } else if (res.error && res.error !== "Pemilihan file dibatalkan.") {
        Alert.alert("Gagal Membaca File", res.error);
      }
    } catch (err: any) {
      Alert.alert("Gagal Membuka File", err.message || "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (parsedProducts.length === 0) {
      Alert.alert("Belum Ada Data", "Silakan pilih file CSV terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createBulkProducts(parsedProducts, importMode);
      await onSuccess();
      Alert.alert(
        "Impor Selesai!",
        `Berhasil memproses ${parsedProducts.length} produk:\n• Ditambahkan baru: ${result.inserted}\n• Diperbarui: ${result.updated}\n\nSeluruh data langsung tersinkronisasi ke database SQLite.`
      );
      setParsedProducts([]);
      setSelectedFileName(null);
      setParseErrors([]);
      onClose();
    } catch (e: any) {
      console.error("Execute import error:", e);
      Alert.alert("Gagal Impor", e.message || "Terjadi kesalahan saat menyimpan ke database.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setIsExporting(true);
    try {
      const res = await downloadProductTemplateCSV();
      if (res.success) {
        Alert.alert(
          "Template Siap!",
          `File "${res.fileName}" berhasil diunduh. Anda dapat membukanya di Microsoft Excel atau Google Sheets untuk mengisi produk massal.`
        );
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    if (products.length === 0) {
      Alert.alert("Katalog Kosong", "Belum ada produk di database untuk diekspor.");
      return;
    }

    setIsExporting(true);
    try {
      const res = await exportProductsToCSV(products);
      if (res.success) {
        Alert.alert(
          "Ekspor Berhasil!",
          `File "${res.fileName}" berisi ${products.length} produk berhasil diekspor.`
        );
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetPicker = () => {
    setParsedProducts([]);
    setSelectedFileName(null);
    setParseErrors([]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: "#ffffff",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: "92%",
            minHeight: "75%",
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
                <FileSpreadsheet size={20} color="#0097A7" />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#18181b" }}>
                  Kelola Produk Excel / CSV
                </Text>
                <Text style={{ fontSize: 11, color: "#71717a" }}>
                  Impor & ekspor katalog massal secara offline
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

          {/* Navigation Tabs */}
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: "#f8fafc",
              borderBottomWidth: 1,
              borderBottomColor: "#e2e8f0",
              gap: 10,
            }}
          >
            <TouchableOpacity
              onPress={() => setActiveTab("import")}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: activeTab === "import" ? "#0097A7" : "#ffffff",
                borderWidth: 1,
                borderColor: activeTab === "import" ? "#0097A7" : "#e2e8f0",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: activeTab === "import" ? "#ffffff" : "#475569",
                }}
              >
                📥 Impor File CSV
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("export")}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: activeTab === "export" ? "#0097A7" : "#ffffff",
                borderWidth: 1,
                borderColor: activeTab === "export" ? "#0097A7" : "#e2e8f0",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: activeTab === "export" ? "#ffffff" : "#475569",
                }}
              >
                📤 Ekspor & Template
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: Impor CSV */}
          {activeTab === "import" && (
            <ScrollView
              style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}
              contentContainerStyle={{ paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
            >
              {parsedProducts.length === 0 ? (
                <View>
                  {/* Step Banner */}
                  <View
                    style={{
                      backgroundColor: "#f0fdfa",
                      borderWidth: 1,
                      borderColor: "#99f6e4",
                      borderRadius: 16,
                      padding: 14,
                      marginBottom: 16,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#0f766e", marginBottom: 4 }}>
                      Petunjuk Format CSV / Excel:
                    </Text>
                    <Text style={{ fontSize: 11, color: "#115e59", lineHeight: 17 }}>
                      Pastikan file CSV memiliki kolom header:{"\n"}
                      <Text style={{ fontWeight: "700" }}>
                        Nama Produk, Kategori, Satuan, Harga Jual, Modal HPP, Stok, Barcode
                      </Text>
                      {"\n"}Atau unduh template di tab "Ekspor & Template" agar tidak salah format.
                    </Text>
                  </View>

                  {/* Pick File Button */}
                  <TouchableOpacity
                    onPress={handlePickFile}
                    disabled={isLoading}
                    activeOpacity={0.8}
                    style={{
                      borderWidth: 2,
                      borderColor: "#0097A7",
                      borderStyle: "dashed",
                      borderRadius: 20,
                      paddingVertical: 32,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="large" color="#0097A7" />
                    ) : (
                      <>
                        <View
                          style={{
                            width: 54,
                            height: 54,
                            borderRadius: 27,
                            backgroundColor: "#ecfeff",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 10,
                          }}
                        >
                          <Upload size={24} color="#0097A7" />
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a" }}>
                          Pilih File CSV dari Perangkat
                        </Text>
                        <Text style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                          Format didukung: .csv, text/csv (Excel Delimited)
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  {/* File Info Bar */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "#f1f5f9",
                      padding: 12,
                      borderRadius: 14,
                      marginBottom: 14,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                      <FileText size={18} color="#0097A7" />
                      <View style={{ marginLeft: 8, flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: "#0f172a" }} numberOfLines={1}>
                          {selectedFileName}
                        </Text>
                        <Text style={{ fontSize: 10, color: "#64748b" }}>
                          {parsedProducts.length} produk siap diimpor
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={handleResetPicker}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: "#fee2e2",
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: "700", color: "#ef4444" }}>Ganti File</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Mode Selector */}
                  <View
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                      padding: 12,
                      marginBottom: 14,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#475569", marginBottom: 8 }}>
                      Metode Penanganan Data:
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => setImportMode("upsert")}
                        style={{
                          flex: 1,
                          padding: 10,
                          borderRadius: 10,
                          backgroundColor: importMode === "upsert" ? "#ecfeff" : "#f8fafc",
                          borderWidth: 1,
                          borderColor: importMode === "upsert" ? "#0097A7" : "#e2e8f0",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: importMode === "upsert" ? "#0097A7" : "#475569",
                          }}
                        >
                          🔄 Update & Tambah
                        </Text>
                        <Text style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>
                          Update jika nama/barcode sudah ada, atau tambahkan baru
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setImportMode("append")}
                        style={{
                          flex: 1,
                          padding: 10,
                          borderRadius: 10,
                          backgroundColor: importMode === "append" ? "#ecfeff" : "#f8fafc",
                          borderWidth: 1,
                          borderColor: importMode === "append" ? "#0097A7" : "#e2e8f0",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: importMode === "append" ? "#0097A7" : "#475569",
                          }}
                        >
                          ➕ Tambah Baru Saja
                        </Text>
                        <Text style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>
                          Selalu buat entri produk baru
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Preview Table Header */}
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#0f172a" }}>
                      Preview Data ({parsedProducts.length} Produk):
                    </Text>
                  </View>

                  {/* Preview Table Rows */}
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                      borderRadius: 14,
                      overflow: "hidden",
                      marginBottom: 16,
                    }}
                  >
                    {parsedProducts.slice(0, 15).map((p, idx) => (
                      <View
                        key={idx}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: 10,
                          backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                          borderBottomWidth: idx < 14 ? 1 : 0,
                          borderBottomColor: "#f1f5f9",
                        }}
                      >
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={{ fontSize: 12, fontWeight: "700", color: "#0f172a" }} numberOfLines={1}>
                            {p.name}
                          </Text>
                          <Text style={{ fontSize: 10, color: "#64748b" }}>
                            {p.category} • {p.stock} {p.unit} {p.barcode ? `• ${p.barcode}` : ""}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={{ fontSize: 12, fontWeight: "800", color: "#0097A7" }}>
                            {formatRupiah(p.harga_jual)}
                          </Text>
                          <Text style={{ fontSize: 9, color: "#94a3b8" }}>
                            Modal: {formatRupiah(p.modal_hpp)}
                          </Text>
                        </View>
                      </View>
                    ))}
                    {parsedProducts.length > 15 && (
                      <View style={{ padding: 8, alignItems: "center", backgroundColor: "#f8fafc" }}>
                        <Text style={{ fontSize: 10, color: "#64748b" }}>
                          ...dan {parsedProducts.length - 15} produk lainnya
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handleExecuteImport}
                    disabled={isLoading}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: "#0097A7",
                      paddingVertical: 14,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      shadowColor: "#0097A7",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Database size={16} color="#ffffff" />
                        <Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff", marginLeft: 8 }}>
                          Impor Sekarang ({parsedProducts.length} Produk)
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}

          {/* Tab 2: Ekspor & Template */}
          {activeTab === "export" && (
            <ScrollView
              style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}
              contentContainerStyle={{ paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Option 1: Download Template */}
              <View
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  padding: 16,
                  marginBottom: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: "#ecfeff",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    <Download size={16} color="#0097A7" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#0f172a" }}>
                      Unduh Template CSV Excel
                    </Text>
                    <Text style={{ fontSize: 10, color: "#64748b" }}>
                      File template kosong dengan contoh format produk
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 11, color: "#475569", lineHeight: 16, marginBottom: 12 }}>
                  Gunakan template ini untuk mengisi ratusan produk di Excel atau Spreadsheet sebelum diimpor ke aplikasi.
                </Text>

                <TouchableOpacity
                  onPress={handleDownloadTemplate}
                  disabled={isExporting}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: "#0097A7",
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                  }}
                >
                  {isExporting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Download size={14} color="#ffffff" />
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff", marginLeft: 6 }}>
                        Download Template CSV
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Option 2: Export All Products */}
              <View
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  padding: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: "#f0fdf4",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    <FileSpreadsheet size={16} color="#16a34a" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#0f172a" }}>
                      Ekspor Katalog Produk ke CSV
                    </Text>
                    <Text style={{ fontSize: 10, color: "#64748b" }}>
                      Cadangkan atau edit seluruh {products.length} produk di Excel
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 11, color: "#475569", lineHeight: 16, marginBottom: 12 }}>
                  Mengekspor seluruh daftar produk yang tersimpan saat ini di database SQLite ke dalam file CSV spreadsheet.
                </Text>

                <TouchableOpacity
                  onPress={handleExportAll}
                  disabled={isExporting || products.length === 0}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: products.length > 0 ? "#16a34a" : "#cbd5e1",
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                  }}
                >
                  {isExporting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <FileSpreadsheet size={14} color="#ffffff" />
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff", marginLeft: 6 }}>
                        Ekspor {products.length} Produk ke CSV
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
