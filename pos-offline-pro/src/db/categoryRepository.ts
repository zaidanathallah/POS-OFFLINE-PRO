/**
 * Category Repository - CRUD Operations for SQLite
 */
import { runInDbQueue, Category } from "./index";

export async function getAllCategories(): Promise<Category[]> {
  return await runInDbQueue(async (db) => {
    return await db.getAllAsync<Category>(
      "SELECT * FROM categories ORDER BY created_at ASC"
    );
  });
}

export async function createCategory(name: string): Promise<Category> {
  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error("Nama kategori tidak boleh kosong.");
  }

  const id = `CAT-${Date.now()}`;
  return await runInDbQueue(async (db) => {
    // Check duplicate
    const existing = await db.getFirstAsync<Category>(
      "SELECT * FROM categories WHERE LOWER(name) = LOWER(?)",
      [cleanName]
    );
    if (existing) {
      throw new Error(`Kategori "${cleanName}" sudah ada.`);
    }

    await db.runAsync(
      "INSERT INTO categories (id, name) VALUES (?, ?)",
      [id, cleanName]
    );

    return {
      id,
      name: cleanName,
    };
  });
}

export async function updateCategory(id: string, name: string): Promise<void> {
  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error("Nama kategori tidak boleh kosong.");
  }

  return await runInDbQueue(async (db) => {
    const existing = await db.getFirstAsync<Category>(
      "SELECT * FROM categories WHERE id = ?",
      [id]
    );
    if (!existing) {
      throw new Error("Kategori tidak ditemukan.");
    }

    // Check if new name already taken by another category
    const duplicate = await db.getFirstAsync<Category>(
      "SELECT * FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?",
      [cleanName, id]
    );
    if (duplicate) {
      throw new Error(`Kategori "${cleanName}" sudah ada.`);
    }

    const oldName = existing.name;

    // Update category table
    await db.runAsync(
      "UPDATE categories SET name = ? WHERE id = ?",
      [cleanName, id]
    );

    // Update products table that use this category
    await db.runAsync(
      "UPDATE products SET category = ? WHERE category = ?",
      [cleanName, oldName]
    );
  });
}

export async function deleteCategory(id: string): Promise<void> {
  return await runInDbQueue(async (db) => {
    const cat = await db.getFirstAsync<Category>(
      "SELECT * FROM categories WHERE id = ?",
      [id]
    );
    if (!cat) {
      throw new Error("Kategori tidak ditemukan.");
    }

    // Delete category
    await db.runAsync("DELETE FROM categories WHERE id = ?", [id]);

    // Set products with this category to 'Lainnya'
    await db.runAsync(
      "UPDATE products SET category = 'Lainnya' WHERE category = ?",
      [cat.name]
    );
  });
}
