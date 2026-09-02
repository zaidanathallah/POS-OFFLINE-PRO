/**
 * Promo & Discount Repository (100% Offline SQLite)
 * Manages "Beli X Gratis Y", Combo/Bundling Discounts, and Minimum Spend Promos.
 */
import { runInDbQueue, Promo, PromoType } from "./index";

export interface PromoInput {
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
  is_active: number;
}

export async function getAllPromos(): Promise<Promo[]> {
  return await runInDbQueue(async (db) => {
    return await db.getAllAsync<Promo>(
      "SELECT * FROM promos ORDER BY created_at DESC;"
    );
  });
}

export async function getActivePromos(): Promise<Promo[]> {
  return await runInDbQueue(async (db) => {
    return await db.getAllAsync<Promo>(
      "SELECT * FROM promos WHERE is_active = 1 ORDER BY created_at DESC;"
    );
  });
}

export async function getPromoById(id: string): Promise<Promo | null> {
  return await runInDbQueue(async (db) => {
    return await db.getFirstAsync<Promo>(
      "SELECT * FROM promos WHERE id = ?;",
      [id]
    );
  });
}

export async function createPromo(input: PromoInput): Promise<Promo> {
  return await runInDbQueue(async (db) => {
    const randomSuffix = String(Math.floor(1000 + Math.random() * 9000));
    const promoId = `PRM-${Date.now()}-${randomSuffix}`;
    const createdAt = new Date().toISOString();

    const newPromo: Promo = {
      id: promoId,
      name: input.name.trim(),
      promo_type: input.promo_type,
      target_type: input.target_type,
      target_id: input.target_id || null,
      target_name: input.target_name || null,
      min_qty: Number(input.min_qty) || 1,
      min_spend: Number(input.min_spend) || 0,
      reward_free_qty: Number(input.reward_free_qty) || 0,
      discount_amount: Number(input.discount_amount) || 0,
      discount_percent: Number(input.discount_percent) || 0,
      is_active: input.is_active !== undefined ? input.is_active : 1,
      created_at: createdAt,
    };

    await db.runAsync(
      `INSERT INTO promos (
        id, name, promo_type, target_type, target_id, target_name, 
        min_qty, min_spend, reward_free_qty, discount_amount, discount_percent, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        newPromo.id,
        newPromo.name,
        newPromo.promo_type,
        newPromo.target_type,
        newPromo.target_id ?? null,
        newPromo.target_name ?? null,
        newPromo.min_qty,
        newPromo.min_spend,
        newPromo.reward_free_qty,
        newPromo.discount_amount,
        newPromo.discount_percent,
        newPromo.is_active,
        newPromo.created_at ?? null,
      ]
    );

    return newPromo;
  });
}

export async function updatePromo(id: string, updates: Partial<PromoInput>): Promise<void> {
  return await runInDbQueue(async (db) => {
    const current = await db.getFirstAsync<Promo>("SELECT * FROM promos WHERE id = ?;", [id]);
    if (!current) throw new Error("Promo tidak ditemukan.");

    const name = updates.name !== undefined ? updates.name.trim() : current.name;
    const promo_type = updates.promo_type !== undefined ? updates.promo_type : current.promo_type;
    const target_type = updates.target_type !== undefined ? updates.target_type : current.target_type;
    const target_id = updates.target_id !== undefined ? updates.target_id : current.target_id;
    const target_name = updates.target_name !== undefined ? updates.target_name : current.target_name;
    const min_qty = updates.min_qty !== undefined ? Number(updates.min_qty) : current.min_qty;
    const min_spend = updates.min_spend !== undefined ? Number(updates.min_spend) : current.min_spend;
    const reward_free_qty = updates.reward_free_qty !== undefined ? Number(updates.reward_free_qty) : current.reward_free_qty;
    const discount_amount = updates.discount_amount !== undefined ? Number(updates.discount_amount) : current.discount_amount;
    const discount_percent = updates.discount_percent !== undefined ? Number(updates.discount_percent) : current.discount_percent;
    const is_active = updates.is_active !== undefined ? updates.is_active : current.is_active;

    await db.runAsync(
      `UPDATE promos SET 
        name = ?, promo_type = ?, target_type = ?, target_id = ?, target_name = ?,
        min_qty = ?, min_spend = ?, reward_free_qty = ?, discount_amount = ?, discount_percent = ?, is_active = ?
       WHERE id = ?;`,
      [
        name,
        promo_type,
        target_type,
        target_id ?? null,
        target_name ?? null,
        min_qty,
        min_spend,
        reward_free_qty,
        discount_amount,
        discount_percent,
        is_active,
        id,
      ]
    );
  });
}

export async function togglePromoStatus(id: string, isActive: boolean): Promise<void> {
  return await runInDbQueue(async (db) => {
    await db.runAsync("UPDATE promos SET is_active = ? WHERE id = ?;", [isActive ? 1 : 0, id]);
  });
}

export async function deletePromo(id: string): Promise<void> {
  return await runInDbQueue(async (db) => {
    await db.runAsync("DELETE FROM promos WHERE id = ?;", [id]);
  });
}
