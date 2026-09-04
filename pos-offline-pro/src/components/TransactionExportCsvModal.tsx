import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  X,
  Download,
  FileSpreadsheet,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Filter,
} from "lucide-react-native";
import {
  getTransactionsForExport,
  TransactionExportFilter,
  TransactionExportData,
} from "@/db/transactionRepository";
import {
  exportTransactionsDetailedCSV,
  StoreProfileInfo,
} from "@/util/csvExportService";
import { formatRupiah } from "@/util/formatters";

interface TransactionExportCsvModalProps {
  visible: boolean;
  storeProfile: StoreProfileInfo;
  onClose: () => void;
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function TransactionExportCsvModal({
  visible,
  storeProfile,
  onClose,
}: TransactionExportCsvModalProps) {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const [periodType, setPeriodType] = useState<
    "ALL" | "TODAY" | "DATE" | "MONTH_YEAR" | "CUSTOM"
  >("ALL");

  // Specific Date filter
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Month & Year filter
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Custom Range filter
  const [startDate, setStartDate] = useState<string>(
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`
  );
  const [endDate, setEndDate] = useState<string>(todayStr);

  // Loading & Preview State
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<TransactionExportData | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Load preview data when filters change
  const loadPreview = useCallback(async () => {
    if (!visible) return;
    setLoadingPreview(true);
    try {
      const filter: TransactionExportFilter = {
        periodType,
        selectedDate: periodType === "DATE" ? selectedDate : undefined,
        selectedMonth: periodType === "MONTH_YEAR" ? selectedMonth : undefined,
        selectedYear: periodType === "MONTH_YEAR" ? selectedYear : undefined,
        startDate: periodType === "CUSTOM" ? startDate : undefined,
        endDate: periodType === "CUSTOM" ? endDate : undefined,
      };

      const data = await getTransactionsForExport(filter);
      setPreviewData(data);
    } catch (err: any) {
      console.error("Gagal memuat preview export:", err);
    } finally {
      setLoadingPreview(false);
    }
  }, [visible, periodType, selectedDate, selectedMonth, selectedYear, startDate, endDate]);

  useEffect(() => {
    if (visible) {
      loadPreview();
    }
  }, [visible, loadPreview]);

  const handleDownloadCSV = async () => {
    if (!previewData || previewData.transactions.length === 0) {
      Alert.alert(
        "Tidak Ada Data",
        "Tidak ada data transaksi yang ditemukan pada periode yang dipilih."
      );
      return;
    }

    setIsExporting(true);
    try {
      const res = await exportTransactionsDetailedCSV(previewData, storeProfile);
      if (res.success) {
        Alert.alert(
          "Download Berhasil",
          `File CSV "${res.fileName}" berhasil dibuat dan diunduh.\n\nTotal ${previewData.summary.totalCount} transaksi dengan omset ${formatRupiah(
            previewData.summary.totalOmset
          )} siap dibuka di Excel / Google Sheets.`,
          [{ text: "Tutup", onPress: onClose }]
        );
      } else {
        Alert.alert("Gagal Export CSV", res.error || "Terjadi kesalahan.");
      }
    } catch (err: any) {
      Alert.alert("Gagal Export", err.message || "Terjadi kesalahan.");
    } finally {
      setIsExporting(false);
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
            maxWidth: 620,
            maxHeight: "90%",
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#E5E7EB",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 16,
              backgroundColor: "#F0FDFA",
              borderBottomWidth: 1,
              borderBottomColor: "#CCFBF1",
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
                  borderRadius: 10,
                  backgroundColor: "#0097A7",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <FileSpreadsheet size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#134E4A" }}>
                  Export Riwayat Transaksi (CSV)
                </Text>
                <Text style={{ fontSize: 11, color: "#0F766E", marginTop: 1 }}>
                  Unduh data penjualan lengkap (Tanggal, Bulan, Tahun, Kasir & Item)
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#E6FFFA",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} color="#0F766E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            {/* 1. Pilih Kategori Periode */}
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#374151", marginBottom: 8 }}>
              PILIH PERIODE TRANSAKSI
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {[
                { id: "ALL", label: "🌟 Semua Waktu" },
                { id: "TODAY", label: "📅 Hari Ini" },
                { id: "DATE", label: "📆 Pilih Tanggal" },
                { id: "MONTH_YEAR", label: "🗓️ Bulan & Tahun" },
                { id: "CUSTOM", label: "⏳ Rentang Tanggal" },
              ].map((tab) => {
                const isActive = periodType === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => setPeriodType(tab.id as any)}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      backgroundColor: isActive ? "#0097A7" : "#F3F4F6",
                      borderWidth: 1,
                      borderColor: isActive ? "#0097A7" : "#E5E7EB",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: isActive ? "#FFFFFF" : "#4B5563",
                      }}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sub-inputs based on Period Type */}
            {periodType === "DATE" && (
              <View
                style={{
                  padding: 14,
                  backgroundColor: "#F9FAFB",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#374151", marginBottom: 6 }}>
                  Tanggal Transaksi (Format: YYYY-MM-DD):
                </Text>
                <TextInput
                  value={selectedDate}
                  onChangeText={setSelectedDate}
                  placeholder="YYYY-MM-DD (Contoh: 2026-09-04)"
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#D1D5DB",
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#111827",
                  }}
                />
              </View>
            )}

            {periodType === "MONTH_YEAR" && (
              <View
                style={{
                  padding: 14,
                  backgroundColor: "#F9FAFB",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#374151", marginBottom: 6 }}>
                  Pilih Bulan:
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {MONTH_NAMES.map((mName, idx) => {
                    const mNum = idx + 1;
                    const isSelected = selectedMonth === mNum;
                    return (
                      <TouchableOpacity
                        key={mName}
                        onPress={() => setSelectedMonth(mNum)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 8,
                          backgroundColor: isSelected ? "#0D9488" : "#FFFFFF",
                          borderWidth: 1,
                          borderColor: isSelected ? "#0D9488" : "#D1D5DB",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: isSelected ? "#FFFFFF" : "#374151",
                          }}
                        >
                          {mName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={{ fontSize: 11, fontWeight: "700", color: "#374151", marginBottom: 6 }}>
                  Tahun:
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {[2024, 2025, 2026, 2027, 2028].map((yr) => {
                    const isSelected = selectedYear === yr;
                    return (
                      <TouchableOpacity
                        key={yr}
                        onPress={() => setSelectedYear(yr)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: isSelected ? "#0D9488" : "#FFFFFF",
                          borderWidth: 1,
                          borderColor: isSelected ? "#0D9488" : "#D1D5DB",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: isSelected ? "#FFFFFF" : "#374151",
                          }}
                        >
                          {yr}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {periodType === "CUSTOM" && (
              <View
                style={{
                  padding: 14,
                  backgroundColor: "#F9FAFB",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#374151", marginBottom: 4 }}>
                      Tanggal Mulai:
                    </Text>
                    <TextInput
                      value={startDate}
                      onChangeText={setStartDate}
                      placeholder="YYYY-MM-DD"
                      style={{
                        backgroundColor: "#FFFFFF",
                        padding: 10,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: "#D1D5DB",
                        fontSize: 12,
                        fontWeight: "600",
                        color: "#111827",
                      }}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#374151", marginBottom: 4 }}>
                      Tanggal Akhir:
                    </Text>
                    <TextInput
                      value={endDate}
                      onChangeText={setEndDate}
                      placeholder="YYYY-MM-DD"
                      style={{
                        backgroundColor: "#FFFFFF",
                        padding: 10,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: "#D1D5DB",
                        fontSize: 12,
                        fontWeight: "600",
                        color: "#111827",
                      }}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* 2. Live Preview Summary Box */}
            <View
              style={{
                backgroundColor: "#F0FDF4",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#BBF7D0",
                padding: 16,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <CheckCircle2 size={16} color="#16A34A" />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "800",
                      color: "#166534",
                      marginLeft: 6,
                    }}
                  >
                    Ringkasan Data Siap Export
                  </Text>
                </View>
                {loadingPreview && <ActivityIndicator size="small" color="#16A34A" />}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <View style={{ width: "48%", backgroundColor: "#FFFFFF", padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "#DCFCE7" }}>
                  <Text style={{ fontSize: 10, color: "#6B7280" }}>Jumlah Transaksi</Text>
                  <Text style={{ fontSize: 14, fontWeight: "800", color: "#111827", marginTop: 2 }}>
                    {previewData?.summary.totalCount || 0} Struk
                  </Text>
                </View>

                <View style={{ width: "48%", backgroundColor: "#FFFFFF", padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "#DCFCE7" }}>
                  <Text style={{ fontSize: 10, color: "#6B7280" }}>Total Omset</Text>
                  <Text style={{ fontSize: 14, fontWeight: "800", color: "#0097A7", marginTop: 2 }}>
                    {formatRupiah(previewData?.summary.totalOmset || 0)}
                  </Text>
                </View>

                <View style={{ width: "48%", backgroundColor: "#FFFFFF", padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "#DCFCE7" }}>
                  <Text style={{ fontSize: 10, color: "#6B7280" }}>Total Laba Kotor</Text>
                  <Text style={{ fontSize: 14, fontWeight: "800", color: "#16A34A", marginTop: 2 }}>
                    +{formatRupiah(previewData?.summary.totalLaba || 0)}
                  </Text>
                </View>

                <View style={{ width: "48%", backgroundColor: "#FFFFFF", padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "#DCFCE7" }}>
                  <Text style={{ fontSize: 10, color: "#6B7280" }}>Total Modal HPP</Text>
                  <Text style={{ fontSize: 14, fontWeight: "800", color: "#4B5563", marginTop: 2 }}>
                    {formatRupiah(previewData?.summary.totalHpp || 0)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Info Note */}
            <View
              style={{
                backgroundColor: "#EFF6FF",
                padding: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#BFDBFE",
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 11, color: "#1E40AF", lineHeight: 16 }}>
                💡 <Text style={{ fontWeight: "700" }}>Keterangan File CSV:</Text> File berformat UTF-8
                dengan pemisah titik koma (;) yang kompatibel langsung dengan Microsoft Excel,
                Google Sheets, dan LibreOffice. Seluruh informasi kasir, no invoice, tanggal/jam,
                nama pelanggan, diskon, PPN, dan rincian produk akan terisi lengkap.
              </Text>
            </View>

            {/* Action Download Button */}
            <TouchableOpacity
              onPress={handleDownloadCSV}
              disabled={isExporting || (previewData?.summary.totalCount || 0) === 0}
              activeOpacity={0.85}
              style={{
                backgroundColor:
                  (previewData?.summary.totalCount || 0) > 0 ? "#0097A7" : "#9CA3AF",
                paddingVertical: 14,
                borderRadius: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#0097A7",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
                marginBottom: 10,
              }}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Download size={18} color="#FFFFFF" />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: "#FFFFFF",
                      marginLeft: 8,
                    }}
                  >
                    Download File CSV ({previewData?.summary.totalCount || 0} Data)
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={{
                paddingVertical: 10,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B7280" }}>Tutup</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
