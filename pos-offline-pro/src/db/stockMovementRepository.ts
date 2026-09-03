import { runInDbQueue, StockMovement, StockMovementType, Product } from "./index";

/**
 * Stock Movement Repository - Track sales, waste, loss, damage, restock & opname
 */

export interface RecordMovementInput {
  product_id: string;
  product_name: string;
  variant_name?: string | null;
  type: StockMovementType;
  qty: number;
  unit?: string;
  notes?: string | null;
  reference_id?: string | null;
}

export async function recordStockMovement(input: RecordMovementInput): Promise<StockMovement> {
  return await runInDbQueue(async (db) => {
    const product = await db.getFirstAsync<Product>(
      "SELECT * FROM products WHERE id = ?",
      [input.product_id]
    );

    const prevStock = product ? product.stock : 0;
    let newStock = prevStock;

    if (input.type === "IN" || input.type === "ADJUSTMENT") {
      if (input.type === "IN") {
        newStock = prevStock + input.qty;
      } else {
        // Direct set/adjustment
        newStock = input.qty;
      }
    } else {
      // Outgoing: SALE, DAMAGE, EXPIRED, LOST
      newStock = Math.max(0, prevStock - input.qty);
    }

    // Update product table
    if (product) {
      await db.runAsync(
        "UPDATE products SET stock = ? WHERE id = ?",
        [newStock, input.product_id]
      );
    }

    const id = `MOV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const createdAt = new Date().toISOString();
    const unit = input.unit || (product ? product.unit : "pcs");

    await db.runAsync(
      `INSERT INTO stock_movements (
        id, product_id, product_name, variant_name, type, qty, 
        previous_stock, current_stock, unit, notes, reference_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.product_id,
        input.product_name,
        input.variant_name || null,
        input.type,
        input.qty,
        prevStock,
        newStock,
        unit,
        input.notes || null,
        input.reference_id || null,
        createdAt,
      ]
    );

    return {
      id,
      product_id: input.product_id,
      product_name: input.product_name,
      variant_name: input.variant_name || null,
      type: input.type,
      qty: input.qty,
      previous_stock: prevStock,
      current_stock: newStock,
      unit,
      notes: input.notes || null,
      reference_id: input.reference_id || null,
      created_at: createdAt,
    };
  });
}

export interface StockMovementFilter {
  type?: StockMovementType | "ALL";
  startDate?: string;
  endDate?: string;
  productId?: string;
  limit?: number;
}

export async function getStockMovements(filter: StockMovementFilter = {}): Promise<StockMovement[]> {
  return await runInDbQueue(async (db) => {
    let sql = "SELECT * FROM stock_movements WHERE 1=1";
    const params: any[] = [];

    if (filter.type && filter.type !== "ALL") {
      sql += " AND type = ?";
      params.push(filter.type);
    }

    if (filter.productId) {
      sql += " AND product_id = ?";
      params.push(filter.productId);
    }

    if (filter.startDate) {
      sql += " AND created_at >= ?";
      params.push(filter.startDate);
    }

    if (filter.endDate) {
      sql += " AND created_at <= ?";
      params.push(filter.endDate);
    }

    sql += " ORDER BY created_at DESC";

    if (filter.limit) {
      sql += " LIMIT ?";
      params.push(filter.limit);
    } else {
      sql += " LIMIT 200";
    }

    return await db.getAllAsync<StockMovement>(sql, params);
  });
}

export async function getStockMovementSummary(days: number = 30): Promise<{
  totalSoldQty: number;
  totalDamageQty: number;
  totalExpiredQty: number;
  totalLostQty: number;
  totalRestockedQty: number;
}> {
  return await runInDbQueue(async (db) => {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const rows = await db.getAllAsync<{ type: string; total_qty: number }>(
      `SELECT type, SUM(qty) as total_qty 
       FROM stock_movements 
       WHERE created_at >= ? 
       GROUP BY type`,
      [startDate]
    );

    let totalSoldQty = 0;
    let totalDamageQty = 0;
    let totalExpiredQty = 0;
    let totalLostQty = 0;
    let totalRestockedQty = 0;

    for (const r of rows) {
      if (r.type === "SALE") totalSoldQty = r.total_qty || 0;
      else if (r.type === "DAMAGE") totalDamageQty = r.total_qty || 0;
      else if (r.type === "EXPIRED") totalExpiredQty = r.total_qty || 0;
      else if (r.type === "LOST") totalLostQty = r.total_qty || 0;
      else if (r.type === "IN") totalRestockedQty = r.total_qty || 0;
    }

    return {
      totalSoldQty,
      totalDamageQty,
      totalExpiredQty,
      totalLostQty,
      totalRestockedQty,
    };
  });
}
