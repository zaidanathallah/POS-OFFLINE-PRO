/**
 * CSV Export Service for POS Offline Pro Financial Reports
 * 100% Offline, Zero Cloud Dependencies
 */
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { FinancialSummary } from "@/db/reportRepository";
import { Transaction } from "@/db";

export async function exportReportToCSV(
  summary: FinancialSummary,
  transactions: Transaction[],
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

    // Ringkasan Finansial
    csv += `RINGKASAN FINANSIAL\n`;
    csv += `Total Omset;Rp ${summary.omset.toLocaleString("id-ID")}\n`;
    csv += `Total Modal HPP;Rp ${summary.modalHpp.toLocaleString("id-ID")}\n`;
    csv += `Laba Kotor;Rp ${summary.labaKotor.toLocaleString("id-ID")}\n`;
    csv += `Margin Keuntungan;${summary.marginPercent}%\n`;
    csv += `Total Transaksi;${summary.totalTransactions}\n`;
    csv += `Rata-rata per Transaksi;Rp ${summary.avgPerTransaction.toLocaleString("id-ID")}\n`;
    csv += `Rata-rata per Hari;Rp ${summary.avgPerDay.toLocaleString("id-ID")}\n\n`;

    // Daftar Transaksi
    csv += `DAFTAR DETAIL TRANSAKSI\n`;
    csv += `No;Invoice;Waktu;Metode;Meja;Pelanggan;Subtotal;Diskon Promo;Nama Promo;PPN;Total Omset;Modal HPP;Laba Kotor\n`;

    transactions.forEach((trx, idx) => {
      const timeFormatted = new Date(trx.created_at).toLocaleString("id-ID");
      csv += `${idx + 1};${trx.invoice_no || trx.id};${timeFormatted};${trx.payment_method};${trx.table_number || "-"};${trx.customer_name || "-"};${trx.subtotal_before_tax};${trx.discount_amount || 0};${trx.promo_name || "-"};${trx.ppn_amount};${trx.omset};${trx.total_hpp};${trx.laba_kotor}\n`;
    });

    // 2. Export on Web vs Native
    if (Platform.OS === "web") {
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { success: true, fileName };
    } else {
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, "\ufeff" + csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: `Export Laporan Keuangan (${periodLabel})`,
          UTI: "public.comma-separated-values-text",
        });
      }
      return { success: true, fileName };
    }
  } catch (error: any) {
    console.error("Export CSV Error:", error);
    return { success: false, error: error.message || "Gagal mengunduh CSV." };
  }
}

import { StockMovement } from "@/db";

export async function exportStockMovementsToCSV(
  movements: StockMovement[],
  periodLabel: string = "Semua"
): Promise<{ success: boolean; fileName?: string; error?: string }> {
  try {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const fileName = `Laporan_Pergerakan_Stok_${dateStr}_${timeStr}.csv`;

    let csv = `LAPORAN PERGERAKAN & STOK KELUAR - POS OFFLINE PRO
`;
    csv += `Periode;${periodLabel}
`;
    csv += `Tanggal Export;${now.toLocaleString("id-ID")}

`;

    csv += `No;Waktu;Nama Produk;Varian;Jenis Pergerakan;Jumlah Qty;Satuan;Stok Sebelum;Stok Sesudah;Keterangan;No Referensi
`;

    movements.forEach((m, idx) => {
      const timeFormatted = new Date(m.created_at || now).toLocaleString("id-ID");
      let typeLabel: string = m.type;
      if (m.type === "SALE") typeLabel = "Penjualan";
      else if (m.type === "DAMAGE") typeLabel = "Barang Rusak";
      else if (m.type === "EXPIRED") typeLabel = "Kadaluarsa";
      else if (m.type === "LOST") typeLabel = "Barang Hilang";
      else if (m.type === "ADJUSTMENT") typeLabel = "Opname / Penyesuaian";
      else if (m.type === "IN") typeLabel = "Stok Masuk";

      csv += `${idx + 1};${timeFormatted};${m.product_name};${m.variant_name || "-"};${typeLabel};${m.qty};${m.unit};${m.previous_stock};${m.current_stock};"${(m.notes || "-").replace(/"/g, '""')}";${m.reference_id || "-"}
`;
    });

    if (Platform.OS === "web") {
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { success: true, fileName };
    } else {
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, "﻿" + csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Export Laporan Pergerakan Stok",
          UTI: "public.comma-separated-values-text",
        });
      }
      return { success: true, fileName };
    }
  } catch (error: any) {
    console.error("Export Stock CSV Error:", error);
    return { success: false, error: error.message || "Gagal mengunduh CSV." };
  }
}
