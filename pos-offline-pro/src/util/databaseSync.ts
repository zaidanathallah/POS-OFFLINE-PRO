/**
 * Local Database Backup & Restore Service (Export/Import)
 * 100% Offline, Zero Cloud Dependencies.
 * Supports native SQLite file backup (.db) and Web JSON backup.
 */
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { DB_NAME, closeDatabase, reloadDatabase, runInDbQueue } from "@/db";

export interface ExportResult {
  success: boolean;
  fileName?: string;
  path?: string;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  fileName?: string;
  error?: string;
}

/**
 * Exports all tables to JSON or native SQLite file
 */
export async function exportDatabaseBackup(): Promise<ExportResult> {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  if (Platform.OS === "web") {
    try {
      // On Web, dump all SQLite tables to a structured JSON backup
      const backupData = await runInDbQueue(async (db) => {
        const categories = await db.getAllAsync("SELECT * FROM categories;");
        const products = await db.getAllAsync("SELECT * FROM products;");
        const transactions = await db.getAllAsync("SELECT * FROM transactions;");
        const transactionDetails = await db.getAllAsync("SELECT * FROM transaction_details;");
        const settings = await db.getAllAsync("SELECT * FROM settings;");

        return {
          version: "1.0",
          export_date: now.toISOString(),
          tables: {
            categories,
            products,
            transactions,
            transaction_details: transactionDetails,
            settings,
          },
        };
      });

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const fileName = `Backup_POS_${dateStr}_${timeStr}.json`;
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return {
        success: true,
        fileName,
      };
    } catch (err: any) {
      console.error("Export error on web:", err);
      return {
        success: false,
        error: err.message || "Gagal membuat backup di web.",
      };
    }
  }

  // Native Mobile export
  try {
    const dbDir = `${FileSystem.documentDirectory}SQLite/`;
    const sourceDbPath = `${dbDir}${DB_NAME}`;

    const fileInfo = await FileSystem.getInfoAsync(sourceDbPath);
    if (!fileInfo.exists) {
      return {
        success: false,
        error: "File database aktif belum ditemukan di memori aplikasi.",
      };
    }

    const fileName = `Backup_POS_${dateStr}_${timeStr}.db`;
    const destinationPath = `${FileSystem.documentDirectory}${fileName}`;

    // Copy database file
    await FileSystem.copyAsync({
      from: sourceDbPath,
      to: destinationPath,
    });

    // If sharing is available, offer to Save to Files or Share to WhatsApp/Email
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(destinationPath, {
        mimeType: "application/x-sqlite3",
        dialogTitle: "Simpan atau Bagikan File Backup Database",
        UTI: "public.database",
      });
    }

    return {
      success: true,
      fileName,
      path: destinationPath,
    };
  } catch (error: any) {
    console.error("Export database error:", error);
    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat mengekspor database.",
    };
  }
}

/**
 * Imports backup (JSON or .db file) and restores tables
 */
export async function importDatabaseBackup(): Promise<ImportResult> {
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,.db,.sqlite";
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) {
          resolve({ success: false, error: "Pemilihan file dibatalkan." });
          return;
        }

        try {
          const text = await file.text();
          const parsed = JSON.parse(text);

          if (!parsed.tables) {
            resolve({ success: false, error: "Format file JSON backup tidak valid." });
            return;
          }

          await runInDbQueue(async (db) => {
            const { categories, products, transactions, transaction_details, settings } = parsed.tables;

            if (categories && Array.isArray(categories)) {
              for (const c of categories) {
                await db.runAsync(
                  "INSERT OR REPLACE INTO categories (id, name, created_at) VALUES (?, ?, ?);",
                  [c.id, c.name, c.created_at || new Date().toISOString()]
                );
              }
            }

            if (products && Array.isArray(products)) {
              for (const p of products) {
                await db.runAsync(
                  `INSERT OR REPLACE INTO products (
                    id, name, harga_jual, modal_hpp, stock, unit, is_decimal, barcode, image_uri, category, has_variants, variants_json
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                  [
                    p.id,
                    p.name,
                    p.harga_jual,
                    p.modal_hpp,
                    p.stock,
                    p.unit || "pcs",
                    p.is_decimal || 0,
                    p.barcode || null,
                    p.image_uri || null,
                    p.category || "Umum",
                    p.has_variants || 0,
                    p.variants_json || null,
                  ]
                );
              }
            }

            if (transactions && Array.isArray(transactions)) {
              for (const t of transactions) {
                await db.runAsync(
                  `INSERT OR REPLACE INTO transactions (
                    id, invoice_no, omset, total_hpp, laba_kotor, subtotal_before_tax, ppn_percent, ppn_amount, payment_method, cash_tendered, change_amount, table_number, customer_name, is_open_bill, created_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                  [
                    t.id,
                    t.invoice_no,
                    t.omset,
                    t.total_hpp,
                    t.laba_kotor,
                    t.subtotal_before_tax || 0,
                    t.ppn_percent || 0,
                    t.ppn_amount || 0,
                    t.payment_method || "CASH",
                    t.cash_tendered || 0,
                    t.change_amount || 0,
                    t.table_number || null,
                    t.customer_name || null,
                    t.is_open_bill || 0,
                    t.created_at || new Date().toISOString(),
                  ]
                );
              }
            }

            if (transaction_details && Array.isArray(transaction_details)) {
              for (const d of transaction_details) {
                await db.runAsync(
                  `INSERT OR REPLACE INTO transaction_details (
                    id, transaction_id, product_id, product_name, variant_name, unit, harga_jual, modal_hpp, qty, subtotal
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                  [
                    d.id,
                    d.transaction_id,
                    d.product_id,
                    d.product_name || "Produk",
                    d.variant_name || null,
                    d.unit || "pcs",
                    d.harga_jual,
                    d.modal_hpp || 0,
                    d.qty,
                    d.subtotal,
                  ]
                );
              }
            }

            if (settings && Array.isArray(settings)) {
              for (const s of settings) {
                await db.runAsync(
                  "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);",
                  [s.key, s.value]
                );
              }
            }
          });

          await reloadDatabase();
          resolve({ success: true, fileName: file.name });
        } catch (err: any) {
          resolve({ success: false, error: err.message || "Gagal memproses file import." });
        }
      };
      input.click();
    });
  }

  // Native Mobile import
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["*/*", "application/x-sqlite3", "application/octet-stream"],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return {
        success: false,
        error: "Pemilihan file dibatalkan.",
      };
    }

    const selectedFile = result.assets[0];
    const fileName = selectedFile.name.toLowerCase();

    // Validate file extension
    if (!fileName.endsWith(".db") && !fileName.endsWith(".sqlite") && !fileName.endsWith(".sqlite3")) {
      return {
        success: false,
        error: "Format file tidak valid. Harap pilih file database berekstensi .db atau .sqlite.",
      };
    }

    const dbDir = `${FileSystem.documentDirectory}SQLite/`;
    const targetDbPath = `${dbDir}${DB_NAME}`;

    // Ensure SQLite directory exists
    const dirInfo = await FileSystem.getInfoAsync(dbDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
    }

    // Safely close existing connection before file replacement
    await closeDatabase();

    // Overwrite old database with new backup file
    await FileSystem.copyAsync({
      from: selectedFile.uri,
      to: targetDbPath,
    });

    // Reopen & reload database connection
    await reloadDatabase();

    return {
      success: true,
      fileName: selectedFile.name,
    };
  } catch (error: any) {
    console.error("Import database error:", error);
    return {
      success: false,
      error: error.message || "Gagal memulihkan database dari file backup.",
    };
  }
}
