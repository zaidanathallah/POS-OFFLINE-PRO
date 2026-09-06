import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  X,
  Download,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
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
import { CalendarPickerModal } from "@/components/CalendarPickerModal";

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

  // Month & Year filter (Dynamically generated years)
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Custom Range filter
  const [startDate, setStartDate] = useState<string>(
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`
  );
  const [endDate, setEndDate] = useState<string>(todayStr);

  // Interactive Calendar Modals State
  const [calendarSingleVisible, setCalendarSingleVisible] = useState(false);
  const [calendarRangeVisible, setCalendarRangeVisible] = useState(false);

  // Loading & Preview State
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<TransactionExportData | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Dynamically generated years (e.g. 2020 to currentYear + 10)
  const currentRealYear = now.getFullYear();
  const availableYears = Array.from({ length: 16 }, (_, i) => currentRealYear - 5 + i);

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
          `File CSV "${res.fileName}" berhasil dibuat dan disimpan.\n\nTotal ${previewData.summary.totalCount} transaksi dengan omset ${formatRupiah(
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

  const formatDisplayDate = (dStr: string) => {
    try {
      const parts = dStr.split("-");
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[0], 10);
        return `${d} ${MONTH_NAMES[m]} ${y}`;
      }
      return dStr;
    } catch {
      return dStr;
    }
  };

  return (
    <>
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
              maxWidth: 480,
              maxHeight: "92%",
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
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 8 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: "#0097A7",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <FileSpreadsheet size={20} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: "#134E4A" }} numberOfLines={1}>
                    Export Riwayat Transaksi (CSV)
                  </Text>
                  <Text style={{ fontSize: 11, color: "#0F766E", marginTop: 1 }} numberOfLines={1}>
                    Unduh data penjualan lengkap (Tanggal, Bulan, Kasir & Item)
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

            <ScrollView style={{ padding: 18 }} showsVerticalScrollIndicator={false}>
              {/* 1. Pilih Kategori Periode */}
              <Text style={{ fontSize: 12, fontWeight: "800", color: "#374151", marginBottom: 8, letterSpacing: 0.3 }}>
                PILIH PERIODE TRANSAKSI
              </Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
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
                        paddingVertical: 7,
                        borderRadius: 12,
                        backgroundColor: isActive ? "#0097A7" : "#F3F4F6",
                        borderWidth: 1,
                        borderColor: isActive ? "#0097A7" : "#E5E7EB",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
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

              {/* Specific Date Picker View */}
              {periodType === "DATE" && (
                <View
                  style={{
                    padding: 14,
                    backgroundColor: "#F9FAFB",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    marginBottom: 14,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#374151", marginBottom: 6 }}>
                    Tanggal Transaksi:
                  </Text>
                  <TouchableOpacity
                    onPress={() => setCalendarSingleVisible(true)}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: "#FFFFFF",
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#0097A7",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Calendar size={18} color="#0097A7" style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#18181B" }}>
                        {formatDisplayDate(selectedDate)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7" }}>
                      Ubah Tanggal
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Month & Dynamic Year Selector View */}
              {periodType === "MONTH_YEAR" && (
                <View
                  style={{
                    padding: 14,
                    backgroundColor: "#F9FAFB",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    marginBottom: 14,
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
                            backgroundColor: isSelected ? "#0097A7" : "#FFFFFF",
                            borderWidth: 1,
                            borderColor: isSelected ? "#0097A7" : "#D1D5DB",
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
                    Pilih Tahun (Otomatis & Fleksibel):
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {availableYears.map((yr) => {
                        const isSelected = selectedYear === yr;
                        return (
                          <TouchableOpacity
                            key={yr}
                            onPress={() => setSelectedYear(yr)}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 8,
                              backgroundColor: isSelected ? "#0097A7" : "#FFFFFF",
                              borderWidth: 1,
                              borderColor: isSelected ? "#0097A7" : "#D1D5DB",
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
                  </ScrollView>
                </View>
              )}

              {/* Custom Date Range Picker View */}
              {periodType === "CUSTOM" && (
                <View
                  style={{
                    padding: 14,
                    backgroundColor: "#F9FAFB",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    marginBottom: 14,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#374151", marginBottom: 6 }}>
                    Rentang Tanggal Penjualan:
                  </Text>
                  <TouchableOpacity
                    onPress={() => setCalendarRangeVisible(true)}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: "#FFFFFF",
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#0097A7",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Calendar size={18} color="#0097A7" style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#18181B" }}>
                        {formatDisplayDate(startDate)} → {formatDisplayDate(endDate)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#0097A7" }}>
                      Pilih Rentang
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 2. Live Preview Summary Box */}
              <View
                style={{
                  backgroundColor: "#F0FDF4",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#BBF7D0",
                  padding: 14,
                  marginBottom: 14,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
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
                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#111827", marginTop: 2 }}>
                      {previewData?.summary.totalCount || 0} Struk
                    </Text>
                  </View>

                  <View style={{ width: "48%", backgroundColor: "#FFFFFF", padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "#DCFCE7" }}>
                    <Text style={{ fontSize: 10, color: "#6B7280" }}>Total Omset</Text>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#0097A7", marginTop: 2 }}>
                      {formatRupiah(previewData?.summary.totalOmset || 0)}
                    </Text>
                  </View>

                  <View style={{ width: "48%", backgroundColor: "#FFFFFF", padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "#DCFCE7" }}>
                    <Text style={{ fontSize: 10, color: "#6B7280" }}>Total Laba Kotor</Text>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#16A34A", marginTop: 2 }}>
                      +{formatRupiah(previewData?.summary.totalLaba || 0)}
                    </Text>
                  </View>

                  <View style={{ width: "48%", backgroundColor: "#FFFFFF", padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "#DCFCE7" }}>
                    <Text style={{ fontSize: 10, color: "#6B7280" }}>Total Modal HPP</Text>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#4B5563", marginTop: 2 }}>
                      {formatRupiah(previewData?.summary.totalHpp || 0)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Info Note */}
              <View
                style={{
                  backgroundColor: "#EFF6FF",
                  padding: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#BFDBFE",
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 10, color: "#1E40AF", lineHeight: 15 }}>
                  💡 <Text style={{ fontWeight: "700" }}>Keterangan File CSV:</Text> File berformat UTF-8
                  dengan pemisah titik koma (;) yang kompatibel langsung dengan Microsoft Excel,
                  Google Sheets, dan LibreOffice.
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
                  marginBottom: 8,
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
                  paddingVertical: 8,
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

      {/* Interactive Single Date Picker Calendar (Gambar 3) */}
      <CalendarPickerModal
        visible={calendarSingleVisible}
        mode="single"
        initialDate={selectedDate}
        title="Pilih Tanggal Transaksi"
        onConfirmSingle={(date) => {
          setSelectedDate(date);
          setCalendarSingleVisible(false);
        }}
        onClose={() => setCalendarSingleVisible(false)}
      />

      {/* Interactive Range Date Picker Calendar (Gambar 3) */}
      <CalendarPickerModal
        visible={calendarRangeVisible}
        mode="range"
        initialStartDate={startDate}
        initialEndDate={endDate}
        title="Pilih Rentang Tanggal"
        onConfirmRange={(sDate, eDate) => {
          setStartDate(sDate);
          setEndDate(eDate);
          setCalendarRangeVisible(false);
        }}
        onClose={() => setCalendarRangeVisible(false)}
      />
    </>
  );
}
