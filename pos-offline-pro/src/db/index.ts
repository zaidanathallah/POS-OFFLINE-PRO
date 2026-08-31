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
 * Sequential execution queue to prevent OPFS (Origin Private File System)
 * access handle collisions on Web while maintaining high performance.
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

export interface Product {
  id: string;
  name: string;
  harga_jual: number;
  modal_hpp: number;
  stock: number;
  barcode: string | null;
  image_uri: string | null;
  category: string;
  created_at?: string;
}

export interface Transaction {
  id: string;
  omset: number;
  total_hpp: number;
  laba_kotor: number;
  created_at: string;
}

export interface TransactionDetail {
  id: string;
  transaction_id: string;
  product_id: string;
  qty: number;
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
      stock INTEGER NOT NULL DEFAULT 0,
      barcode TEXT,
      image_uri TEXT,
      category TEXT NOT NULL DEFAULT 'Umum'
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      omset REAL NOT NULL,
      total_hpp REAL NOT NULL,
      laba_kotor REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transaction_details (
      id TEXT PRIMARY KEY NOT NULL,
      transaction_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      qty INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
    );
  `);

  // Initialize default store settings if not exists
  const existingStore = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'store_name'"
  );
  if (!existingStore) {
    await db.runAsync(
      `INSERT OR REPLACE INTO settings (key, value) VALUES 
       ('store_name', 'POS Offline Pro Store'),
       ('store_address', 'Jl. Malioboro No. 45, Yogyakarta'),
       ('store_phone', '0812-3456-7890'),
       ('is_pin_active', '1'),
       ('supervisor_pin', '1234'),
       ('currency_symbol', 'Rp')`
    );
  }

  // Check if products table is empty, seed realistic starter products
  const countRes = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM products"
  );
  if (countRes && countRes.count === 0) {
    await seedDefaultProducts(db);
  }
}

async function seedDefaultProducts(db: SQLite.SQLiteDatabase): Promise<void> {
  const defaultProducts = [
    {
      id: "PRD-" + Date.now() + "-1",
      name: "Kopi Susu Gula Aren",
      harga_jual: 22000,
      modal_hpp: 9500,
      stock: 50,
      barcode: "8992761001",
      image_uri: null,
      category: "Minuman",
    },
    {
      id: "PRD-" + Date.now() + "-2",
      name: "Croissant Almond Toast",
      harga_jual: 28000,
      modal_hpp: 12000,
      stock: 25,
      barcode: "8992761002",
      image_uri: null,
      category: "Makanan",
    },
    {
      id: "PRD-" + Date.now() + "-3",
      name: "Matcha Latte Ice",
      harga_jual: 24000,
      modal_hpp: 11000,
      stock: 30,
      barcode: "8992761003",
      image_uri: null,
      category: "Minuman",
    },
    {
      id: "PRD-" + Date.now() + "-4",
      name: "Kaos Polos Cotton 30s",
      harga_jual: 65000,
      modal_hpp: 38000,
      stock: 100,
      barcode: "8992761004",
      image_uri: null,
      category: "Retail / Toko",
    },
    {
      id: "PRD-" + Date.now() + "-5",
      name: "Jasa Cuci Sepatu Deep Clean",
      harga_jual: 45000,
      modal_hpp: 8000,
      stock: 999,
      barcode: "8992761005",
      image_uri: null,
      category: "Jasa",
    },
  ];

  for (const item of defaultProducts) {
    await db.runAsync(
      `INSERT INTO products (id, name, harga_jual, modal_hpp, stock, barcode, image_uri, category) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.name,
        item.harga_jual,
        item.modal_hpp,
        item.stock,
        item.barcode,
        item.image_uri,
        item.category,
      ]
    );
  }
}
