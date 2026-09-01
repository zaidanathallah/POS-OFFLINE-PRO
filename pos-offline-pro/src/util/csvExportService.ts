/**
 * CSV Export Service for POS Offline Pro Financial Reports
 * 100% Offline, Zero Cloud Dependencies
 */
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  FinancialSummary,
  TransactionReportRow,
  ReportPeriod,
} from "@/db/reportRepository";

export async function exportReportToCSV(
  summary: FinancialSummary,
  transactions: TransactionReportRow[],
  periodLabel: string
): Promise<{ success: boolean; fileName?: string; error?: string }> {
  try {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const fileName = `Laporan_POS_${periodLabel.replace(/\s+/g, "_")}_${dateStr}_${timeStr}.csv`;

    // 1. Build CSV content
    let csv = `LAPORAN KEUANGAN & PENJUALAN - POS OFFLINE PRO\n`;
    csv += `Periode Laporan;${periodLabel}\n`;
    csv += `Tanggal Export;${now.toLocaleString("id-ID")}\n\n`;

    // Ringkasan
    csv += `RINGKASAN KEUANGAN\n`;
    csv += `Total Omset;Rp ${summary.omset.toLocaleString("id-ID")}\n`;
    csv += `Total Modal (HPP);Rp ${summary.modalHpp.toLocaleString("id-ID")}\n`;
    csv += `Laba Kotor;Rp ${summary.labaKotor.toLocaleString("id-ID")}\n`;
    csv += `Margin Keuntungan;${summary.marginPercent}%\n`;
    csv += `Total Transaksi;${summary.totalTransactions}\n`;
    csv += `Rata-rata per Transaksi;Rp ${summary.avgPerTransaction.toLocaleString("id-ID")}\n\n`;

    // Header Transaksi
    csv += `DAFTAR TRANSAKSI\n`;
    csv += `No;No. Invoice;Waktu Transaksi;Metode;Meja;Pelanggan;Subtotal;PPN;Total Omset;Modal HPP;Laba Kotor\n`;

    transactions.forEach((t, idx) => {
      const formattedDate = new Date(t.created_at).toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const inv = t.invoice_no || t.id;
      const meja = t.table_number || "-";
      const customer = t.customer_name || "-";

      csv += `${idx + 1};${inv};${formattedDate};${t.payment_method};${meja};${customer};${t.subtotal_before_tax};${t.ppn_amount};${t.omset};${t.total_hpp};${t.laba_kotor}\n`;
    });

    // 2. Export on Web
    if (Platform.OS === "web") {
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { success: true, fileName };
    }

    // 3. Export on Native Mobile
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(filePath, "\uFEFF" + csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: "text/csv",
        dialogTitle: "Bagikan / Simpan Laporan Penjualan CSV",
        UTI: "public.comma-separated-values-text",
      });
    }

    return { success: true, fileName };
  } catch (error: any) {
    console.error("Export CSV error:", error);
    return { success: false, error: error.message || "Gagal mengekspor CSV." };
  }
}
