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
 * Sequential execution queue to prevent OPFS access handle collisions on Web
 */
export async function runInDbQueue<T>(task: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
  const db = await getDatabase();
  const next = queuePromise.then(
    () => task(db),
    () => task(db)
  );
  queuePromise = next.catch(() => {});
  return next;
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
  created_at?: string;
}

export interface Transaction {
  id: string;
  invoice_no: string;
  omset: number;
  total_hpp: number;
  laba_kotor: number;
  subtotal_before_tax: number;
  ppn_percent: number;
  ppn_amount: number;
  payment_method: string; // 'CASH' | 'QRIS'
  cash_tendered: number;
  change_amount: number;
  table_number?: string | null;
  customer_name?: string | null;
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
}

export interface Setting {
  key: string;
  value: string;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      dbInstance = db;
      return db;
    })();
  }
  return dbInitPromise;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    try {
      await dbInstance.closeAsync();
    } catch (e) {
      console.log("DB close notice:", e);
    }
    dbInstance = null;
    dbInitPromise = null;
  }
}

export async function reloadDatabase(): Promise<void> {
  await closeDatabase();
  await initDatabase();
}

export async function initDatabase(): Promise<void> {
  const db = await getDatabase();

  // Enable WAL mode only on native mobile (Android/iOS)
  if (Platform.OS !== "web") {
    try {
      await db.execAsync("PRAGMA journal_mode = WAL;");
    } catch (e) {
      console.log("WAL pragma note:", e);
    }
  }

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
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
      variants_json TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      invoice_no TEXT,
      omset REAL NOT NULL,
      total_hpp REAL NOT NULL,
      laba_kotor REAL NOT NULL,
      subtotal_before_tax REAL NOT NULL DEFAULT 0,
      ppn_percent REAL NOT NULL DEFAULT 0,
      ppn_amount REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'CASH',
      cash_tendered REAL NOT NULL DEFAULT 0,
      change_amount REAL NOT NULL DEFAULT 0,
      table_number TEXT,
      customer_name TEXT,
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
      FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
    );
  `);

  // Default settings
  const defaultSettings: Record<string, string> = {
    store_name: "POS Offline Pro",
    store_business_type: "Jenis toko",
    store_address: "Jl. Alamat No 99 Makassar",
    store_phone: "08111111111",
    store_logo: "",
    store_qris: "",
    is_pin_active: "0",
    supervisor_pin: "1234",
    feature_table_number: "0",
    feature_customer: "0",
    feature_open_bill: "0",
    feature_barcode: "1",
    feature_variants: "1",
    feature_auto_print: "0",
    feature_ppn: "1",
    ppn_rate: "11",
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

  // Seed sample products matching reference if empty
  const countRes = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM products"
  );
  if (countRes && countRes.count === 0) {
    await seedRealisticProducts(db);
  }
}

async function seedRealisticProducts(db: SQLite.SQLiteDatabase): Promise<void> {
  const defaultProducts = [
    {
      id: "PRD-001",
      name: "Air Botol",
      harga_jual: 5000,
      modal_hpp: 3000,
      stock: 999,
      unit: "pcs",
      is_decimal: 0,
      barcode: "8992761001",
      image_uri: "https://images.unsplash.com/photo-1559839914-ba2a1ae09a03?w=300&q=80",
      category: "Minuman",
      has_variants: 0,
      variants_json: null,
    },
    {
      id: "PRD-002",
      name: "Anggur",
      harga_jual: 50000,
      modal_hpp: 32000,
      stock: 50,
      unit: "kg",
      is_decimal: 1, // Supports Volume & Nominal popup!
      barcode: "8992761002",
      image_uri: "https://images.unsplash.com/photo-1596363505729-4190a9506133?w=300&q=80",
      category: "Buah",
      has_variants: 0,
      variants_json: null,
    },
    {
      id: "PRD-003",
      name: "Apel",
      harga_jual: 35000,
      modal_hpp: 22000,
      stock: 35,
      unit: "kg",
      is_decimal: 1,
      barcode: "8992761003",
      image_uri: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&q=80",
      category: "Buah",
      has_variants: 0,
      variants_json: null,
    },
    {
      id: "PRD-004",
      name: "Bakso kuah",
      harga_jual: 18000,
      modal_hpp: 9000,
      stock: 45,
      unit: "porsi",
      is_decimal: 0,
      barcode: "8992761004",
      image_uri: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80",
      category: "Makanan",
      has_variants: 0,
      variants_json: null,
    },
    {
      id: "PRD-005",
      name: "Kripik Pisang",
      harga_jual: 10000,
      modal_hpp: 5000,
      stock: 60,
      unit: "pcs",
      is_decimal: 0,
      barcode: "8992761005",
      image_uri: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80",
      category: "Makanan",
      has_variants: 0,
      variants_json: null,
    },
    {
      id: "PRD-006",
      name: "Mie Pangsit",
      harga_jual: 15000,
      modal_hpp: 7500,
      stock: 40,
      unit: "porsi",
      is_decimal: 0,
      barcode: "8992761006",
      image_uri: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300&q=80",
      category: "Makanan",
      has_variants: 0,
      variants_json: null,
    },
    {
      id: "PRD-007",
      name: "Nasi Kuning",
      harga_jual: 15000,
      modal_hpp: 8000,
      stock: 130,
      unit: "porsi",
      is_decimal: 0,
      barcode: "8992761007",
      image_uri: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80",
      category: "Makanan",
      has_variants: 1, // Has variants: Ayam & Rendang matching screenshot 170329.png!
      variants_json: JSON.stringify([
        { id: "VAR-1", name: "Ayam", harga_jual: 15000, modal_hpp: 8000, stock: 80 },
        { id: "VAR-2", name: "Rendang", harga_jual: 18000, modal_hpp: 10000, stock: 50 },
      ]),
    },
    {
      id: "PRD-008",
      name: "Kopi Dingin",
      harga_jual: 12000,
      modal_hpp: 6000,
      stock: 999,
      unit: "cup",
      is_decimal: 0,
      barcode: "8992761008",
      image_uri: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&q=80",
      category: "Minuman",
      has_variants: 0,
      variants_json: null,
    },
    {
      id: "PRD-009",
      name: "Jus Apel",
      harga_jual: 12000,
      modal_hpp: 5500,
      stock: 999,
      unit: "cup",
      is_decimal: 0,
      barcode: "8992761009",
      image_uri: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&q=80",
      category: "Minuman",
      has_variants: 0,
      variants_json: null,
    },
  ];

  for (const item of defaultProducts) {
    await db.runAsync(
      `INSERT INTO products (id, name, harga_jual, modal_hpp, stock, unit, is_decimal, barcode, image_uri, category, has_variants, variants_json) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.name,
        item.harga_jual,
        item.modal_hpp,
        item.stock,
        item.unit,
        item.is_decimal,
        item.barcode,
        item.image_uri,
        item.category,
        item.has_variants,
        item.variants_json,
      ]
    );
  }
}
