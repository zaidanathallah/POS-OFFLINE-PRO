/**
 * Product Repository - CRUD Operations for SQLite
 */
import { runInDbQueue, Product } from "./index";

export interface ProductInput {
  name: string;
  harga_jual: number;
  modal_hpp: number;
  stock: number;
  barcode?: string | null;
  image_uri?: string | null;
  category: string;
}

export async function getAllProducts(
  searchQuery?: string,
  categoryFilter?: string
): Promise<Product[]> {
  return await runInDbQueue(async (db) => {
    let query = "SELECT * FROM products WHERE 1=1";
    const params: any[] = [];

    if (categoryFilter && categoryFilter !== "Semua") {
      query += " AND category = ?";
      params.push(categoryFilter);
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      query += " AND (name LIKE ? OR barcode LIKE ?)";
      params.push(`%${searchQuery.trim()}%`, `%${searchQuery.trim()}%`);
    }

    query += " ORDER BY name ASC";
    return await db.getAllAsync<Product>(query, params);
  });
}

export async function getProductById(id: string): Promise<Product | null> {
  return await runInDbQueue(async (db) => {
    return await db.getFirstAsync<Product>(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );
  });
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  return await runInDbQueue(async (db) => {
    return await db.getFirstAsync<Product>(
      "SELECT * FROM products WHERE barcode = ?",
      [barcode]
    );
  });
}

export async function createProduct(input: ProductInput): Promise<Product> {
  return await runInDbQueue(async (db) => {
    const id = `PRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newProduct: Product = {
      id,
      name: input.name.trim(),
      harga_jual: Number(input.harga_jual) || 0,
      modal_hpp: Number(input.modal_hpp) || 0,
      stock: Number(input.stock) || 0,
      barcode: input.barcode?.trim() || null,
      image_uri: input.image_uri || null,
      category: input.category?.trim() || "Umum",
    };

    await db.runAsync(
      `INSERT INTO products (id, name, harga_jual, modal_hpp, stock, barcode, image_uri, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newProduct.id,
        newProduct.name,
        newProduct.harga_jual,
        newProduct.modal_hpp,
        newProduct.stock,
        newProduct.barcode,
        newProduct.image_uri,
        newProduct.category,
      ]
    );

    return newProduct;
  });
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Promise<void> {
  return await runInDbQueue(async (db) => {
    const existing = await db.getFirstAsync<Product>(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );
    if (!existing) {
      throw new Error(`Produk dengan ID ${id} tidak ditemukan.`);
    }

    const updated: Product = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      harga_jual: input.harga_jual !== undefined ? Number(input.harga_jual) : existing.harga_jual,
      modal_hpp: input.modal_hpp !== undefined ? Number(input.modal_hpp) : existing.modal_hpp,
      stock: input.stock !== undefined ? Number(input.stock) : existing.stock,
      barcode: input.barcode !== undefined ? (input.barcode?.trim() || null) : existing.barcode,
      image_uri: input.image_uri !== undefined ? input.image_uri : existing.image_uri,
      category: input.category !== undefined ? input.category.trim() : existing.category,
    };

    await db.runAsync(
      `UPDATE products 
       SET name = ?, harga_jual = ?, modal_hpp = ?, stock = ?, barcode = ?, image_uri = ?, category = ?
       WHERE id = ?`,
      [
        updated.name,
        updated.harga_jual,
        updated.modal_hpp,
        updated.stock,
        updated.barcode,
        updated.image_uri,
        updated.category,
        id,
      ]
    );
  });
}

export async function deleteProduct(id: string): Promise<void> {
  return await runInDbQueue(async (db) => {
    await db.runAsync("DELETE FROM products WHERE id = ?", [id]);
  });
}

export async function getDistinctCategories(): Promise<string[]> {
  return await runInDbQueue(async (db) => {
    const rows = await db.getAllAsync<{ category: string }>(
      "SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != '' ORDER BY category ASC"
    );
    return rows.map((r) => r.category);
  });
}
