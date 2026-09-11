/**
 * SQLite Pure Local Database Setup for POS Offline Pro
 * 100% Offline-First Architecture using expo-sqlite
 */
import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

export const DB_NAME = "pos_offline_pro.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;
let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let queuePromise: Promise<any> = Promise.resolve();

/**
 * Returns ISO string in Device Local Time (e.g. "2026-09-05T05:50:08")
 * Prevents UTC timezone discrepancies on early morning transactions in WIB/WITA/WIT.
 */
export function getLocalISODateTime(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Returns "YYYY-MM-DD" in Device Local Time
 */
export function getLocalDateString(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export interface CostItem {
  id: string;
  name: string;
  amount: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  harga_jual: number;
  modal_hpp: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  harga_jual: number;
  modal_hpp: number;
  stock: number;
  unit: string; // 'pcs' | 'kg' | 'porsi' | 'liter'
  is_decimal: number; // 0 or 1 (for weight/volume input)
  barcode: string | null;
  image_uri: string | null;
  category: string;
  has_variants: number; // 0 or 1
  variants_json?: string | null; // JSON string array of ProductVariant
  hpp_breakdown_json?: string | null; // JSON string array of CostItem (BOM / Rincian Biaya Modal)
  created_at?: string;
}

export type PromoType = "BUY_X_GET_Y" | "COMBO_DISCOUNT" | "MIN_SPEND";

export interface Promo {
  id: string;
  name: string;
  promo_type: PromoType;
  target_type: "CATEGORY" | "PRODUCT" | "ALL";
  target_id?: string | null;
  target_name?: string | null;
  min_qty: number;
  min_spend: number;
  reward_free_qty: number;
  discount_amount: number;
  discount_percent: number;
  is_active: number; // 1 or 0
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  total_orders: number;
  total_spent: number;
  created_at?: string;
}

export type StockMovementType = 'SALE' | 'DAMAGE' | 'EXPIRED' | 'LOST' | 'IN' | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  variant_name?: string | null;
  type: StockMovementType;
  qty: number;
  previous_stock: number;
  current_stock: number;
  unit: string;
  notes?: string | null;
  reference_id?: string | null;
  created_at?: string;
}

export interface Transaction {
  id: string;
  invoice_no: string;
  omset: number;
  total_hpp: number;
  laba_kotor: number;
  subtotal_before_tax: number;
  discount_amount?: number;
  promo_name?: string | null;
  ppn_percent: number;
  ppn_amount: number;
  payment_method: string; // 'CASH' | 'QRIS'
  cash_tendered: number;
  change_amount: number;
  table_number?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_id?: string | null;
  cashier_name?: string | null;
  is_open_bill: number;
  created_at: string;
}

export interface TransactionDetail {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  variant_name?: string | null;
  unit: string;
  harga_jual: number;
  modal_hpp: number;
  qty: number; // supports float for kg/decimal
  subtotal: number;
  discount_type?: 'PERCENT' | 'NOMINAL' | null;
  discount_value?: number;
  discount_amount?: number;
}

export interface Setting {
  key: string;
  value: string;
}

export interface Category {
  id: string;
  name: string;
  created_at?: string;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await setupDatabaseSchema(db);
      dbInstance = db;
      return db;
    })();
  }
  return dbInitPromise;
}

export async function initDatabase(): Promise<void> {
  await getDatabase();
}

let activeDbQueueContext: SQLite.SQLiteDatabase | null = null;

/**
 * Sequential execution queue to prevent OPFS access handle collisions on Web.
 * Fully re-entrant: allows nested repository calls without deadlocking.
 */
export async function runInDbQueue<T>(task: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
  if (activeDbQueueContext) {
    return await task(activeDbQueueContext);
  }

  const execute = async () => {
    const db = await getDatabase();
    activeDbQueueContext = db;
    try {
      return await task(db);
    } finally {
      activeDbQueueContext = null;
    }
  };

  const next = queuePromise.then(execute, execute);
  queuePromise = next.catch(() => {});
  return next;
}

export async function closeDatabase(): Promise<void> {
  if (Platform.OS !== "web" && dbInstance) {
    try {
      await dbInstance.closeAsync();
    } catch (e) {
      console.log("DB close notice:", e);
    }
  }
  dbInstance = null;
  dbInitPromise = null;
}

export async function reloadDatabase(): Promise<void> {
  if (Platform.OS === "web") {
    const db = await getDatabase();
    await setupDatabaseSchema(db);
    return;
  }
  await closeDatabase();
  await initDatabase();
}

async function ensureColumnExists(
  db: SQLite.SQLiteDatabase,
  tableName: string,
  columnName: string,
  columnTypeAndDefault: string
): Promise<void> {
  try {
    const tableInfo = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName});`);
    const columnExists = tableInfo.some((col) => col.name.toLowerCase() === columnName.toLowerCase());
    if (!columnExists) {
      console.log(`[DB Migration] Adding missing column '${columnName}' to '${tableName}'`);
      await db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnTypeAndDefault};`);
    }
  } catch (err) {
    console.log(`[DB Migration] Notice for ${tableName}.${columnName}:`, err);
  }
}

async function setupDatabaseSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  // Enable WAL mode only on native mobile (Android/iOS)
  if (Platform.OS !== "web") {
    try {
      await db.execAsync("PRAGMA journal_mode = WAL;");
    } catch (e) {
      console.log("WAL pragma note:", e);
    }
  }

  // Create tables if they do not exist
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      harga_jual REAL NOT NULL,
      modal_hpp REAL NOT NULL,
      stock REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'pcs',
      is_decimal INTEGER NOT NULL DEFAULT 0,
      barcode TEXT,
      image_uri TEXT,
      category TEXT NOT NULL DEFAULT 'Umum',
      has_variants INTEGER NOT NULL DEFAULT 0,
      variants_json TEXT,
      hpp_breakdown_json TEXT
    );

    CREATE TABLE IF NOT EXISTS promos (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      promo_type TEXT NOT NULL,
      target_type TEXT NOT NULL DEFAULT 'ALL',
      target_id TEXT,
      target_name TEXT,
      min_qty REAL NOT NULL DEFAULT 1,
      min_spend REAL NOT NULL DEFAULT 0,
      reward_free_qty REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      discount_percent REAL NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      invoice_no TEXT,
      omset REAL NOT NULL,
      total_hpp REAL NOT NULL,
      laba_kotor REAL NOT NULL,
      subtotal_before_tax REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      promo_name TEXT,
      ppn_percent REAL NOT NULL DEFAULT 0,
      ppn_amount REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'CASH',
      cash_tendered REAL NOT NULL DEFAULT 0,
      change_amount REAL NOT NULL DEFAULT 0,
      table_number TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      customer_id TEXT,
      cashier_name TEXT NOT NULL DEFAULT 'Kasir 1',
      is_open_bill INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transaction_details (
      id TEXT PRIMARY KEY NOT NULL,
      transaction_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      variant_name TEXT,
      unit TEXT NOT NULL DEFAULT 'pcs',
      harga_jual REAL NOT NULL,
      modal_hpp REAL NOT NULL DEFAULT 0,
      qty REAL NOT NULL,
      subtotal REAL NOT NULL,
      discount_type TEXT,
      discount_value REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      total_orders INTEGER NOT NULL DEFAULT 0,
      total_spent REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      variant_name TEXT,
      type TEXT NOT NULL,
      qty REAL NOT NULL,
      previous_stock REAL NOT NULL DEFAULT 0,
      current_stock REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'pcs',
      notes TEXT,
      reference_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Run dynamic column migrations for existing databases
  await ensureColumnExists(db, "transactions", "invoice_no", "TEXT");
  await ensureColumnExists(db, "transactions", "subtotal_before_tax", "REAL NOT NULL DEFAULT 0");
  await ensureColumnExists(db, "transactions", "discount_amount", "REAL NOT NULL DEFAULT 0");
  await ensureColumnExists(db, "transactions", "promo_name", "TEXT");
  await ensureColumnExists(db, "transactions", "ppn_percent", "REAL NOT NULL DEFAULT 0");
  await ensureColumnExists(db, "transactions", "ppn_amount", "REAL NOT NULL DEFAULT 0");
  await ensureColumnExists(db, "transactions", "payment_method", "TEXT NOT NULL DEFAULT 'CASH'");
  await ensureColumnExists(db, "transactions", "cash_tendered", "REAL NOT NULL DEFAULT 0");
  await ensureColumnExists(db, "transactions", "change_amount", "REAL NOT NULL DEFAULT 0");
  await ensureColumnExists(db, "transactions", "table_number", "TEXT");
  await ensureColumnExists(db, "transactions", "customer_name", "TEXT");
  await ensureColumnExists(db, "transactions", "customer_phone", "TEXT");
  await ensureColumnExists(db, "transactions", "customer_id", "TEXT");
  await ensureColumnExists(db, "transactions", "cashier_name", "TEXT NOT NULL DEFAULT 'Kasir 1'");
  await ensureColumnExists(db, "transactions", "is_open_bill", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumnExists(db, "transactions", "omset", "REAL NOT NULL DEFAULT 0");
  await ensureColumnExists(db, "transactions", "total_hpp", "REAL NOT NULL DEFAULT 0");
  await ensureColumnExists(db, "transactions", "laba_kotor", "REAL NOT NULL DEFAULT 0");

  await ensureColumnExists(db, "products", "modal_hpp", "REAL NOT NULL DEFAULT 0");
  await ensureColumnExists(db, "products", "unit", "TEXT NOT NULL DEFAULT 'pcs'");
  await ensureColumnExists(db, "products", "is_decimal", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumnExists(db, "products", "barcode", "TEXT");
  await ensureColumnExists(db, "products", "image_uri", "TEXT");
  await ensureColumnExists(db, "products", "category", "TEXT NOT NULL DEFAULT 'Umum'");
  await ensureColumnExists(db, "products", "has_variants", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumnExists(db, "products", "variants_json", "TEXT");
  await ensureColumnExists(db, "products", "hpp_breakdown_json", "TEXT");

  await ensureColumnExists(db, "transaction_details", "product_name", "TEXT NOT NULL DEFAULT 'Produk'");
  await ensureColumnExists(db, "transaction_details", "variant_name", "TEXT");
  await ensureColumnExists(db, "transaction_details", "unit", "TEXT NOT NULL DEFAULT 'pcs'");
  await ensureColumnExists(db, "transaction_details", "modal_hpp", "REAL NOT NULL DEFAULT 0");
  await ensureColumnExists(db, "transaction_details", "discount_type", "TEXT");
  await ensureColumnExists(db, "transaction_details", "discount_value", "REAL NOT NULL DEFAULT 0");
  await ensureColumnExists(db, "transaction_details", "discount_amount", "REAL NOT NULL DEFAULT 0");

  // Default settings
  const defaultSettings: Record<string, string> = {
    store_name: "POS Offline Pro",
    store_business_type: "Jenis toko",
    store_address: "Jl. Alamat No 99 Makassar",
    store_phone: "08111111111",
    store_logo: "",
    store_qris: "",
    active_cashier_name: "Kasir 1",
    is_pin_active: "0",
    supervisor_pin: "1234",
    feature_table_number: "0",
    feature_customer: "0",
    feature_open_bill: "0",
    feature_barcode: "1",
    feature_variants: "1",
    feature_hpp_breakdown: "1",
    feature_auto_print: "0",
    feature_ppn: "1",
    ppn_rate: "11",
    feature_promo: "1",
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    const existing = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = ?",
      [key]
    );
    if (!existing) {
      await db.runAsync(
        "INSERT INTO settings (key, value) VALUES (?, ?)",
        [key, value]
      );
    }
  }

  // Normalize created_at for transactions if stored in UTC format to local time string
  try {
    const rawTrx = await db.getAllAsync<{ id: string; invoice_no: string | null; created_at: string }>(
      "SELECT id, invoice_no, created_at FROM transactions WHERE created_at LIKE '%Z' OR created_at LIKE '%+00:00';"
    );
    for (const t of rawTrx) {
      if (t.created_at) {
        const d = new Date(t.created_at);
        if (!isNaN(d.getTime())) {
          const localStr = getLocalISODateTime(d);
          await db.runAsync("UPDATE transactions SET created_at = ? WHERE id = ?;", [localStr, t.id]);
        }
      }
    }
  } catch (err) {
    console.log("Timezone normalization notice:", err);
  }

  // Seed default categories if table is empty
  const defaultCategories = ["Buah", "Makanan", "Minuman", "Retail", "Jasa", "Lainnya"];
  for (const catName of defaultCategories) {
    await db.runAsync(
      "INSERT OR IGNORE INTO categories (id, name) VALUES (?, ?);",
      [`CAT-${catName.toUpperCase()}`, catName]
    );
  }
}

