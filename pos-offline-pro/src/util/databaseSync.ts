/**
 * Local Database Backup & Restore Service (Export/Import)
 * 100% Offline, Zero Cloud Dependencies.
 * Supports native SQLite file backup (.db) and Universal JSON backup with Base64 compressed images.
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
 * Helper to ensure local file images are converted to standalone base64 Data URLs
 */
async function convertUriToBase64(uri?: string | null): Promise<string | null> {
  if (!uri) return null;
  if (uri.startsWith("data:image/")) return uri; // Already base64
  if (Platform.OS === "web") return uri;

  try {
    if (uri.startsWith("file://") || uri.startsWith("/")) {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:image/jpeg;base64,${base64}`;
      }
    }
  } catch (err) {
    console.log("convertUriToBase64 error:", err);
  }
  return uri;
}

/**
 * Exports all tables with compressed base64 images to JSON or native SQLite file
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
        const promos = await db.getAllAsync("SELECT * FROM promos;");
        const transactions = await db.getAllAsync("SELECT * FROM transactions;");
        const transactionDetails = await db.getAllAsync("SELECT * FROM transaction_details;");
        const customers = await db.getAllAsync("SELECT * FROM customers;");
        const stockMovements = await db.getAllAsync("SELECT * FROM stock_movements;");
        const settings = await db.getAllAsync("SELECT * FROM settings;");

        return {
          version: "1.0",
          export_date: now.toISOString(),
          tables: {
            categories,
            products,
            promos,
            transactions,
            transaction_details: transactionDetails,
            customers,
            stock_movements: stockMovements,
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

  // Native Mobile export (Generates JSON with standalone base64 images)
  try {
    const backupData = await runInDbQueue(async (db) => {
      const categories = await db.getAllAsync("SELECT * FROM categories;");
      const rawProducts = await db.getAllAsync<any>("SELECT * FROM products;");
      const products = await Promise.all(
        rawProducts.map(async (p) => ({
          ...p,
          image_uri: await convertUriToBase64(p.image_uri),
        }))
      );

      const promos = await db.getAllAsync("SELECT * FROM promos;");
      const transactions = await db.getAllAsync("SELECT * FROM transactions;");
      const transactionDetails = await db.getAllAsync("SELECT * FROM transaction_details;");
      const customers = await db.getAllAsync("SELECT * FROM customers;");
      const stockMovements = await db.getAllAsync("SELECT * FROM stock_movements;");
      const rawSettings = await db.getAllAsync<any>("SELECT * FROM settings;");
      const settings = await Promise.all(
        rawSettings.map(async (s) => ({
          ...s,
          value:
            s.key === "store_logo" || s.key === "store_qris"
              ? (await convertUriToBase64(s.value)) || s.value
              : s.value,
        }))
      );

      return {
        version: "1.0",
        export_date: now.toISOString(),
        tables: {
          categories,
          products,
          promos,
          transactions,
          transaction_details: transactionDetails,
          customers,
          stock_movements: stockMovements,
          settings,
        },
      };
    });

    const fileName = `Backup_POS_${dateStr}_${timeStr}.json`;
    const destinationPath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(destinationPath, JSON.stringify(backupData, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(destinationPath, {
        mimeType: "application/json",
        dialogTitle: "Simpan atau Bagikan File Cadangan Database POS",
        UTI: "public.json",
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
      input.accept = ".json,application/json,.db,.sqlite";
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
          const parsed = JSON.parse(text);

          if (!parsed.tables) {
            resolve({
              success: false,
              error: "Format file JSON backup tidak valid. Objek 'tables' tidak ditemukan.",
            });
            return;
          }

          await restoreJsonTables(parsed.tables);
          await reloadDatabase();
          resolve({ success: true, fileName: file.name });
        } catch (err: any) {
          resolve({ success: false, error: err.message || "Gagal memproses file import." });
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

  // Native Mobile import (supports .json, .db, .sqlite)
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["*/*", "application/json", "text/*", "application/x-sqlite3", "application/octet-stream"],
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

    // 1. If JSON backup file
    if (fileName.endsWith(".json") || selectedFile.mimeType === "application/json" || selectedFile.mimeType?.includes("json")) {
      const content = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const parsed = JSON.parse(content);
      if (!parsed.tables) {
        return {
          success: false,
          error: "Struktur file JSON backup tidak sesuai standar POS Offline Pro.",
        };
      }

      await restoreJsonTables(parsed.tables);
      await reloadDatabase();

      return {
        success: true,
        fileName: selectedFile.name,
      };
    }

    // 2. If SQLite binary database file
    if (fileName.endsWith(".db") || fileName.endsWith(".sqlite") || fileName.endsWith(".sqlite3")) {
      const dbDir = `${FileSystem.documentDirectory}SQLite/`;
      const targetDbPath = `${dbDir}${DB_NAME}`;

      const dirInfo = await FileSystem.getInfoAsync(dbDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
      }

      await closeDatabase();

      await FileSystem.copyAsync({
        from: selectedFile.uri,
        to: targetDbPath,
      });

      await reloadDatabase();

      return {
        success: true,
        fileName: selectedFile.name,
      };
    }

    // Fallback: try parsing as JSON anyway in case extension was stripped
    try {
      const content = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const parsed = JSON.parse(content);
      if (parsed.tables) {
        await restoreJsonTables(parsed.tables);
        await reloadDatabase();
        return {
          success: true,
          fileName: selectedFile.name,
        };
      }
    } catch (_) {}

    return {
      success: false,
      error: "Format file tidak didukung. Harap pilih file .json atau .db cadangan.",
    };
  } catch (error: any) {
    console.error("Import database error:", error);
    return {
      success: false,
      error: error.message || "Gagal memulihkan database dari file backup.",
    };
  }
}

/**
 * Helper to safely clear and restore all tables from JSON backup
 */
async function restoreJsonTables(tables: any): Promise<void> {
  await runInDbQueue(async (db) => {
    // Clear old tables first so no leftover/dummy data remains
    await db.execAsync(`
      DELETE FROM transaction_details;
      DELETE FROM transactions;
      DELETE FROM stock_movements;
      DELETE FROM customers;
      DELETE FROM promos;
      DELETE FROM products;
      DELETE FROM categories;
    `);

    const {
      categories,
      products,
      promos,
      transactions,
      transaction_details,
      customers,
      stock_movements,
      settings,
    } = tables;

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
            id, name, harga_jual, modal_hpp, stock, unit, is_decimal, barcode, image_uri, category, has_variants, variants_json, hpp_breakdown_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            p.id,
            p.name,
            Number(p.harga_jual) || 0,
            Number(p.modal_hpp) || 0,
            Number(p.stock) || 0,
            p.unit || "pcs",
            p.is_decimal ? 1 : 0,
            p.barcode || null,
            p.image_uri || null,
            p.category || "Umum",
            p.has_variants ? 1 : 0,
            p.variants_json || null,
            p.hpp_breakdown_json || null,
          ]
        );
      }
    }

    if (promos && Array.isArray(promos)) {
      for (const pr of promos) {
        await db.runAsync(
          `INSERT OR REPLACE INTO promos (
            id, name, promo_type, target_type, target_id, target_name, 
            min_qty, min_spend, reward_free_qty, discount_amount, discount_percent, is_active, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            pr.id,
            pr.name,
            pr.promo_type,
            pr.target_type || "ALL",
            pr.target_id || null,
            pr.target_name || null,
            Number(pr.min_qty) || 1,
            Number(pr.min_spend) || 0,
            Number(pr.reward_free_qty) || 0,
            Number(pr.discount_amount) || 0,
            Number(pr.discount_percent) || 0,
            pr.is_active !== undefined ? Number(pr.is_active) : 1,
            pr.created_at || new Date().toISOString(),
          ]
        );
      }
    }

    if (transactions && Array.isArray(transactions)) {
      for (const t of transactions) {
        await db.runAsync(
          `INSERT OR REPLACE INTO transactions (
            id, invoice_no, omset, total_hpp, laba_kotor, subtotal_before_tax, discount_amount, promo_name, ppn_percent, ppn_amount, payment_method, cash_tendered, change_amount, table_number, customer_name, customer_phone, customer_id, cashier_name, is_open_bill, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            t.id,
            t.invoice_no || null,
            Number(t.omset) || 0,
            Number(t.total_hpp) || 0,
            Number(t.laba_kotor) || 0,
            Number(t.subtotal_before_tax) || 0,
            Number(t.discount_amount) || 0,
            t.promo_name || null,
            Number(t.ppn_percent) || 0,
            Number(t.ppn_amount) || 0,
            t.payment_method || "CASH",
            Number(t.cash_tendered) || 0,
            Number(t.change_amount) || 0,
            t.table_number || null,
            t.customer_name || null,
            t.customer_phone || null,
            t.customer_id || null,
            t.cashier_name || "Kasir 1",
            t.is_open_bill ? 1 : 0,
            t.created_at || new Date().toISOString(),
          ]
        );
      }
    }

    if (transaction_details && Array.isArray(transaction_details)) {
      for (const d of transaction_details) {
        await db.runAsync(
          `INSERT OR REPLACE INTO transaction_details (
            id, transaction_id, product_id, product_name, variant_name, unit, harga_jual, modal_hpp, qty, subtotal, discount_type, discount_value, discount_amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            d.id,
            d.transaction_id,
            d.product_id,
            d.product_name || "Produk",
            d.variant_name || null,
            d.unit || "pcs",
            Number(d.harga_jual) || 0,
            Number(d.modal_hpp) || 0,
            Number(d.qty) || 1,
            Number(d.subtotal) || 0,
            d.discount_type || null,
            Number(d.discount_value) || 0,
            Number(d.discount_amount) || 0,
          ]
        );
      }
    }

    if (customers && Array.isArray(customers)) {
      for (const cu of customers) {
        await db.runAsync(
          `INSERT OR REPLACE INTO customers (
            id, name, phone, email, address, notes, total_orders, total_spent, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            cu.id,
            cu.name,
            cu.phone || null,
            cu.email || null,
            cu.address || null,
            cu.notes || null,
            Number(cu.total_orders) || 0,
            Number(cu.total_spent) || 0,
            cu.created_at || new Date().toISOString(),
          ]
        );
      }
    }

    if (stock_movements && Array.isArray(stock_movements)) {
      for (const sm of stock_movements) {
        await db.runAsync(
          `INSERT OR REPLACE INTO stock_movements (
            id, product_id, product_name, variant_name, type, qty, previous_stock, current_stock, unit, notes, reference_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            sm.id,
            sm.product_id,
            sm.product_name,
            sm.variant_name || null,
            sm.type,
            Number(sm.qty) || 1,
            Number(sm.previous_stock) || 0,
            Number(sm.current_stock) || 0,
            sm.unit || "pcs",
            sm.notes || null,
            sm.reference_id || null,
            sm.created_at || new Date().toISOString(),
          ]
        );
      }
    }

    if (settings && Array.isArray(settings)) {
      for (const s of settings) {
        await db.runAsync(
          "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);",
          [s.key, String(s.value || "")]
        );
      }
    }
  });
}

/**
 * Resets all database tables to a clean, empty state with default categories
 */
export async function resetDatabaseToClean(): Promise<boolean> {
  try {
    await runInDbQueue(async (db) => {
      await db.execAsync(`
        DELETE FROM transaction_details;
        DELETE FROM transactions;
        DELETE FROM stock_movements;
        DELETE FROM customers;
        DELETE FROM promos;
        DELETE FROM products;
        DELETE FROM categories;
      `);

      // Seed default clean categories
      const defaultCategories = ["Buah", "Makanan", "Minuman", "Retail", "Jasa", "Lainnya"];
      for (const catName of defaultCategories) {
        await db.runAsync(
          "INSERT OR IGNORE INTO categories (id, name) VALUES (?, ?);",
          [`CAT-${catName.toUpperCase()}`, catName]
        );
      }
    });

    await reloadDatabase();
    return true;
  } catch (err) {
    console.error("resetDatabaseToClean error:", err);
    return false;
  }
}
