/**
 * Product Repository - CRUD Operations for SQLite
 */
import { runInDbQueue, Product, ProductVariant } from "./index";

export interface ProductInput {
  name: string;
  harga_jual: number;
  modal_hpp: number;
  stock: number;
  unit?: string;
  is_decimal?: number;
  barcode?: string | null;
  image_uri?: string | null;
  category: string;
  has_variants?: number;
  variants_json?: string | null;
  hpp_breakdown_json?: string | null;
}

export async function getAllProducts(
  searchQuery?: string,
  categoryFilter?: string
): Promise<Product[]> {
  return await runInDbQueue(async (db) => {
    let query = "SELECT * FROM products WHERE 1=1";
    const params: any[] = [];

    if (categoryFilter && categoryFilter !== "Semua") {
      query += " AND LOWER(TRIM(category)) = LOWER(TRIM(?))";
      params.push(categoryFilter);
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      query += " AND (LOWER(name) LIKE LOWER(?) OR barcode LIKE ?)";
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

export async function getVariantsByProductId(productId: string): Promise<ProductVariant[]> {
  return await runInDbQueue(async (db) => {
    const prod = await db.getFirstAsync<Product>(
      "SELECT variants_json FROM products WHERE id = ?",
      [productId]
    );
    if (prod && prod.variants_json) {
      try {
        return JSON.parse(prod.variants_json);
      } catch (e) {
        return [];
      }
    }
    return [];
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
      unit: input.unit?.trim() || "pcs",
      is_decimal: input.is_decimal ?? 0,
      barcode: input.barcode?.trim() || null,
      image_uri: input.image_uri || null,
      category: input.category?.trim() || "Umum",
      has_variants: input.has_variants ?? 0,
      variants_json: input.variants_json || null,
      hpp_breakdown_json: input.hpp_breakdown_json || null,
    };

    await db.runAsync(
      `INSERT INTO products (
        id, name, harga_jual, modal_hpp, stock, 
        unit, is_decimal, barcode, image_uri, 
        category, has_variants, variants_json, hpp_breakdown_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newProduct.id,
        newProduct.name,
        newProduct.harga_jual,
        newProduct.modal_hpp,
        newProduct.stock,
        newProduct.unit,
        newProduct.is_decimal,
        newProduct.barcode ?? null,
        newProduct.image_uri ?? null,
        newProduct.category,
        newProduct.has_variants,
        newProduct.variants_json ?? null,
        newProduct.hpp_breakdown_json ?? null,
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
      unit: input.unit !== undefined ? input.unit : existing.unit,
      is_decimal: input.is_decimal !== undefined ? input.is_decimal : existing.is_decimal,
      barcode: input.barcode !== undefined ? (input.barcode?.trim() || null) : existing.barcode,
      image_uri: input.image_uri !== undefined ? input.image_uri : existing.image_uri,
      category: input.category !== undefined ? input.category.trim() : existing.category,
      has_variants: input.has_variants !== undefined ? input.has_variants : existing.has_variants,
      variants_json: input.variants_json !== undefined ? input.variants_json : existing.variants_json,
      hpp_breakdown_json: input.hpp_breakdown_json !== undefined ? input.hpp_breakdown_json : existing.hpp_breakdown_json,
    };

    await db.runAsync(
      `UPDATE products 
       SET name = ?, harga_jual = ?, modal_hpp = ?, stock = ?, 
           unit = ?, is_decimal = ?, barcode = ?, image_uri = ?, 
           category = ?, has_variants = ?, variants_json = ?, hpp_breakdown_json = ?
       WHERE id = ?`,
      [
        updated.name,
        updated.harga_jual,
        updated.modal_hpp,
        updated.stock,
        updated.unit,
        updated.is_decimal,
        updated.barcode ?? null,
        updated.image_uri ?? null,
        updated.category,
        updated.has_variants,
        updated.variants_json ?? null,
        updated.hpp_breakdown_json ?? null,
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

export interface RestockProductInput {
  productId: string;
  addQty: number;
  variantId?: string | null;
  newHpp?: number | null;
  notes?: string | null;
}

/**
 * Restock product or variant directly with real-time SQLite sync and stock movement audit log
 */
export async function restockProduct(input: RestockProductInput): Promise<Product> {
  return await runInDbQueue(async (db) => {
    const product = await db.getFirstAsync<Product>(
      "SELECT * FROM products WHERE id = ?",
      [input.productId]
    );
    if (!product) {
      throw new Error(`Produk dengan ID ${input.productId} tidak ditemukan.`);
    }

    const prevStock = Number(product.stock) || 0;
    let newStock = prevStock + Number(input.addQty);
    let variantsJson = product.variants_json;
    let variantName: string | null = null;
    let prevVariantStock = 0;
    let newVariantStock = 0;

    if (product.has_variants && product.variants_json && input.variantId) {
      try {
        const variants: ProductVariant[] = JSON.parse(product.variants_json);
        const vIndex = variants.findIndex((v) => v.id === input.variantId);
        if (vIndex > -1) {
          variantName = variants[vIndex].name;
          prevVariantStock = Number(variants[vIndex].stock) || 0;
          variants[vIndex].stock = prevVariantStock + Number(input.addQty);
          newVariantStock = variants[vIndex].stock;
          if (input.newHpp !== undefined && input.newHpp !== null) {
            variants[vIndex].modal_hpp = Number(input.newHpp) || variants[vIndex].modal_hpp;
          }
          variantsJson = JSON.stringify(variants);
          newStock = variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
        }
      } catch (e) {
        console.error("Parse variants error in restock:", e);
      }
    }

    const updatedHpp =
      input.newHpp !== undefined && input.newHpp !== null && !input.variantId
        ? Number(input.newHpp)
        : product.modal_hpp;

    await db.runAsync(
      `UPDATE products 
       SET stock = ?, variants_json = ?, modal_hpp = ? 
       WHERE id = ?`,
      [newStock, variantsJson ?? null, updatedHpp, input.productId]
    );

    // Record into stock_movements table for audit & analytics
    const movementId = `MOV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const createdAt = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO stock_movements (
        id, product_id, product_name, variant_name, type, qty, 
        previous_stock, current_stock, unit, notes, reference_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movementId,
        product.id,
        product.name,
        variantName,
        "IN",
        Number(input.addQty),
        variantName ? prevVariantStock : prevStock,
        variantName ? newVariantStock : newStock,
        product.unit || "pcs",
        input.notes || "Restok cepat dari kasir",
        `RESTOCK-${Date.now()}`,
        createdAt,
      ]
    );

    return {
      ...product,
      stock: newStock,
      variants_json: variantsJson,
      modal_hpp: updatedHpp,
    };
  });
}

/**
 * Batch insert or upsert multiple products into SQLite database
 */
export async function createBulkProducts(
  inputs: ProductInput[],
  mode: "append" | "upsert" = "append"
): Promise<{ inserted: number; updated: number; products: Product[] }> {
  return await runInDbQueue(async (db) => {
    let inserted = 0;
    let updated = 0;
    const resultProducts: Product[] = [];

    // Collect all categories and ensure they exist in categories table
    const categoriesSet = new Set<string>();
    for (const inp of inputs) {
      if (inp.category && inp.category.trim()) {
        categoriesSet.add(inp.category.trim());
      }
    }

    for (const catName of categoriesSet) {
      await db.runAsync(
        "INSERT OR IGNORE INTO categories (id, name) VALUES (?, ?);",
        [`CAT-${catName.toUpperCase()}`, catName]
      );
    }

    for (const input of inputs) {
      if (!input.name || !input.name.trim()) continue;

      const trimmedName = input.name.trim();
      const trimmedBarcode = input.barcode?.trim() || null;
      const unit = input.unit?.trim() || "pcs";
      const isDecimal =
        input.is_decimal !== undefined
          ? input.is_decimal
          : unit === "kg" || unit === "liter" || unit === "gram" || input.category === "Buah"
          ? 1
          : 0;

      let existing: Product | null = null;

      if (mode === "upsert") {
        if (trimmedBarcode) {
          existing = await db.getFirstAsync<Product>(
            "SELECT * FROM products WHERE barcode = ?",
            [trimmedBarcode]
          );
        }
        if (!existing) {
          existing = await db.getFirstAsync<Product>(
            "SELECT * FROM products WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))",
            [trimmedName]
          );
        }
      }

      if (existing) {
        // Update existing product
        const updatedProd: Product = {
          ...existing,
          name: trimmedName,
          harga_jual: Number(input.harga_jual) || existing.harga_jual,
          modal_hpp: input.modal_hpp !== undefined ? Number(input.modal_hpp) : existing.modal_hpp,
          stock: input.stock !== undefined ? Number(input.stock) : existing.stock,
          unit: unit || existing.unit,
          is_decimal: isDecimal,
          barcode: trimmedBarcode || existing.barcode,
          category: input.category?.trim() || existing.category,
        };

        await db.runAsync(
          `UPDATE products 
           SET name = ?, harga_jual = ?, modal_hpp = ?, stock = ?, 
               unit = ?, is_decimal = ?, barcode = ?, category = ?
           WHERE id = ?`,
          [
            updatedProd.name,
            updatedProd.harga_jual,
            updatedProd.modal_hpp,
            updatedProd.stock,
            updatedProd.unit,
            updatedProd.is_decimal,
            updatedProd.barcode,
            updatedProd.category,
            existing.id,
          ]
        );
        updated++;
        resultProducts.push(updatedProd);
      } else {
        // Create new product
        const id = `PRD-${Date.now()}-${Math.floor(Math.random() * 100000) + inserted}`;
        const newProduct: Product = {
          id,
          name: trimmedName,
          harga_jual: Number(input.harga_jual) || 0,
          modal_hpp: Number(input.modal_hpp) || 0,
          stock: Number(input.stock) || 0,
          unit: unit,
          is_decimal: isDecimal,
          barcode: trimmedBarcode,
          image_uri: input.image_uri || null,
          category: input.category?.trim() || "Umum",
          has_variants: input.has_variants ?? 0,
          variants_json: input.variants_json || null,
          hpp_breakdown_json: input.hpp_breakdown_json || null,
        };

        await db.runAsync(
          `INSERT INTO products (
            id, name, harga_jual, modal_hpp, stock, 
            unit, is_decimal, barcode, image_uri, 
            category, has_variants, variants_json, hpp_breakdown_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newProduct.id,
            newProduct.name,
            newProduct.harga_jual,
            newProduct.modal_hpp,
            newProduct.stock,
            newProduct.unit,
            newProduct.is_decimal,
            newProduct.barcode ?? null,
            newProduct.image_uri ?? null,
            newProduct.category,
            newProduct.has_variants,
            newProduct.variants_json ?? null,
            newProduct.hpp_breakdown_json ?? null,
          ]
        );
        inserted++;
        resultProducts.push(newProduct);
      }
    }

    return { inserted, updated, products: resultProducts };
  });
}

