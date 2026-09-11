/**
 * CSV Product Export, Import & Template Service for POS Offline Pro
 * 100% Offline, Zero Cloud Dependencies
 */
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { Product } from "@/db";
import { ProductInput } from "@/db/productRepository";

/**
 * Downloads / shares a sample CSV template for bulk product import
 */
export async function downloadProductTemplateCSV(): Promise<{
  success: boolean;
  fileName?: string;
  error?: string;
}> {
  try {
    const fileName = `Template_Import_Produk_POS.csv`;

    let csv = `Nama Produk;Kategori;Satuan;Harga Jual;Modal HPP;Stok;Barcode\n`;
    csv += `Nasi Kuning Komplit;Makanan;porsi;20000;12000;50;899123456701\n`;
    csv += `Es Teh Manis;Minuman;cup;5000;2000;100;899123456702\n`;
    csv += `Apel Fuji Segar;Buah;kg;35000;25000;30;899123456703\n`;
    csv += `Minyak Goreng 1L;Retail;pcs;18000;15000;45;899123456704\n`;
    csv += `Kopi Susu Gula Aren;Minuman;cup;15000;7000;60;899123456705\n`;

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
          dialogTitle: "Download Template CSV Produk",
          UTI: "public.comma-separated-values-text",
        });
      }
      return { success: true, fileName };
    }
  } catch (error: any) {
    console.error("Download Template CSV Error:", error);
    return { success: false, error: error.message || "Gagal mengunduh template." };
  }
}

/**
 * Exports current products from SQLite to CSV file
 */
export async function exportProductsToCSV(
  products: Product[]
): Promise<{ success: boolean; fileName?: string; error?: string }> {
  try {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const fileName = `Katalog_Produk_POS_${dateStr}_${timeStr}.csv`;

    let csv = `Nama Produk;Kategori;Satuan;Harga Jual;Modal HPP;Stok;Barcode\n`;

    products.forEach((p) => {
      const safeName = (p.name || "").replace(/;/g, ",").replace(/"/g, '""');
      const safeCat = (p.category || "Umum").replace(/;/g, ",").replace(/"/g, '""');
      const safeUnit = (p.unit || "pcs").replace(/;/g, ",");
      const safeBarcode = (p.barcode || "").replace(/;/g, ",");

      csv += `"${safeName}";"${safeCat}";${safeUnit};${p.harga_jual || 0};${p.modal_hpp || 0};${p.stock || 0};"${safeBarcode}"\n`;
    });

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
          dialogTitle: "Ekspor Katalog Produk CSV",
          UTI: "public.comma-separated-values-text",
        });
      }
      return { success: true, fileName };
    }
  } catch (error: any) {
    console.error("Export Products CSV Error:", error);
    return { success: false, error: error.message || "Gagal mengekspor katalog produk." };
  }
}

/**
 * Robust CSV Parser that handles delimiters (; , \t) and quotes
 */
export function parseProductsCSV(csvContent: string): {
  valid: ProductInput[];
  errors: string[];
} {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { valid: [], errors: ["File CSV kosong."] };
  }

  // Detect delimiter from header
  const firstLine = lines[0];
  let delimiter = ";";
  if (firstLine.includes(";") && (firstLine.match(/;/g) || []).length >= 2) {
    delimiter = ";";
  } else if (firstLine.includes(",") && (firstLine.match(/,/g) || []).length >= 2) {
    delimiter = ",";
  } else if (firstLine.includes("\t")) {
    delimiter = "\t";
  }

  const valid: ProductInput[] = [];
  const errors: string[] = [];

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(firstLine).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

  // Check if first line is header or data
  const isHeader =
    headers.some((h) => h.includes("nama") || h.includes("name") || h.includes("produk") || h.includes("harga"));
  const startIndex = isHeader ? 1 : 0;

  // Header column index mapping
  let nameIdx = 0;
  let catIdx = 1;
  let unitIdx = 2;
  let hargaJualIdx = 3;
  let modalHppIdx = 4;
  let stockIdx = 5;
  let barcodeIdx = 6;

  if (isHeader) {
    headers.forEach((h, idx) => {
      if (h.includes("nama") || h.includes("produk") || h.includes("name") || h.includes("item")) nameIdx = idx;
      else if (h.includes("kategori") || h.includes("category")) catIdx = idx;
      else if (h.includes("satuan") || h.includes("unit")) unitIdx = idx;
      else if (h.includes("jual") || h.includes("price") || (h.includes("harga") && !h.includes("modal") && !h.includes("hpp"))) hargaJualIdx = idx;
      else if (h.includes("hpp") || h.includes("modal") || h.includes("cogs") || h.includes("cost")) modalHppIdx = idx;
      else if (h.includes("stok") || h.includes("stock") || h.includes("qty")) stockIdx = idx;
      else if (h.includes("barcode") || h.includes("sku") || h.includes("kode")) barcodeIdx = idx;
    });
  }

  for (let i = startIndex; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;

    const name = row[nameIdx] ? row[nameIdx].replace(/^["']|["']$/g, "").trim() : "";
    if (!name) {
      errors.push(`Baris ${i + 1}: Nama produk kosong.`);
      continue;
    }

    const rawHargaJual = row[hargaJualIdx] ? row[hargaJualIdx].replace(/[^0-9.]/g, "") : "0";
    const hargaJual = parseFloat(rawHargaJual) || 0;

    const rawModalHpp = row[modalHppIdx] ? row[modalHppIdx].replace(/[^0-9.]/g, "") : "0";
    const modalHpp = parseFloat(rawModalHpp) || 0;

    const rawStock = row[stockIdx] ? row[stockIdx].replace(/[^0-9.]/g, "") : "0";
    const stock = parseFloat(rawStock) || 0;

    const category = row[catIdx] ? row[catIdx].replace(/^["']|["']$/g, "").trim() || "Makanan" : "Makanan";
    const unit = row[unitIdx] ? row[unitIdx].replace(/^["']|["']$/g, "").trim() || "pcs" : "pcs";
    const barcode = row[barcodeIdx] ? row[barcodeIdx].replace(/^["']|["']$/g, "").trim() || null : null;

    const isDecimal =
      unit === "kg" || unit === "liter" || unit === "gram" || category.toLowerCase() === "buah" ? 1 : 0;

    valid.push({
      name,
      category,
      unit,
      is_decimal: isDecimal,
      harga_jual: hargaJual,
      modal_hpp: modalHpp,
      stock,
      barcode,
      has_variants: 0,
    });
  }

  return { valid, errors };
}

/**
 * File Picker & Parser for CSV files on Web and Native
 */
export async function pickAndParseProductCSV(): Promise<{
  success: boolean;
  data?: ProductInput[];
  fileName?: string;
  errors?: string[];
  error?: string;
}> {
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".csv,text/csv,text/plain";
      input.style.position = "fixed";
      input.style.top = "-1000px";
      input.style.left = "-1000px";
      input.style.opacity = "0";
      document.body.appendChild(input);

      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (input.parentNode) {
          document.body.removeChild(input);
        }
        if (!file) {
          resolve({ success: false, error: "Pemilihan file dibatalkan." });
          return;
        }

        try {
          const text = await file.text();
          const { valid, errors } = parseProductsCSV(text);
          if (valid.length === 0) {
            resolve({
              success: false,
              error: "Tidak ada data produk yang valid di dalam file CSV.",
              errors,
            });
            return;
          }
          resolve({
            success: true,
            fileName: file.name,
            data: valid,
            errors,
          });
        } catch (err: any) {
          resolve({ success: false, error: err.message || "Gagal membaca file CSV." });
        }
      };

      input.oncancel = () => {
        if (input.parentNode) {
          document.body.removeChild(input);
        }
        resolve({ success: false, error: "Pemilihan file dibatalkan." });
      };

      input.click();
    });
  }

  // Native Mobile
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["text/csv", "text/comma-separated-values", "text/plain", "*/*"],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, error: "Pemilihan file dibatalkan." };
    }

    const selectedFile = result.assets[0];
    const content = await FileSystem.readAsStringAsync(selectedFile.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const { valid, errors } = parseProductsCSV(content);
    if (valid.length === 0) {
      return {
        success: false,
        error: "Tidak ada data produk yang valid di dalam file CSV.",
        errors,
      };
    }

    return {
      success: true,
      fileName: selectedFile.name,
      data: valid,
      errors,
    };
  } catch (err: any) {
    console.error("Pick CSV Error on Native:", err);
    return {
      success: false,
      error: err.message || "Gagal memilih atau membaca file CSV.",
    };
  }
}
