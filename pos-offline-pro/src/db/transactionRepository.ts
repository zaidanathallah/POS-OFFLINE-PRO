/**
 * Transaction Repository - Atomic Checkout & History Queries (SQLite)
 */
import { getDatabase, Transaction, TransactionDetail } from "./index";
import { CartItem } from "@/stores/useCartStore";

export interface CheckoutResult {
  transaction: Transaction;
  details: (TransactionDetail & { product_name: string; harga_jual: number })[];
  payment_method: string;
  cash_tendered: number;
  change_amount: number;
}

export interface CheckoutInput {
  items: CartItem[];
  omset: number;
  total_hpp: number;
  laba_kotor: number;
  payment_method: "CASH" | "QRIS";
  cash_tendered: number;
  change_amount: number;
  note?: string;
}

export async function processCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const db = await getDatabase();

  if (!input.items || input.items.length === 0) {
    throw new Error("Keranjang belanja kosong.");
  }

  // Generate clean readable transaction ID: TRX-YYYYMMDD-HHMMSS
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const transactionId = `TRX-${dateStr}-${timeStr}-${randomSuffix}`;
  const createdAt = now.toISOString();

  const newTransaction: Transaction = {
    id: transactionId,
    omset: input.omset,
    total_hpp: input.total_hpp,
    laba_kotor: input.laba_kotor,
    created_at: createdAt,
  };

  const detailedItems: (TransactionDetail & { product_name: string; harga_jual: number })[] = [];

  // Execute atomic SQLite transaction
  await db.withTransactionAsync(async () => {
    // 1. Insert into transactions table
    await db.runAsync(
      `INSERT INTO transactions (id, omset, total_hpp, laba_kotor, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        newTransaction.id,
        newTransaction.omset,
        newTransaction.total_hpp,
        newTransaction.laba_kotor,
        newTransaction.created_at,
      ]
    );

    // 2. Insert into transaction_details & decrement product stock
    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i];
      const detailId = `DTL-${transactionId}-${i + 1}`;

      await db.runAsync(
        `INSERT INTO transaction_details (id, transaction_id, product_id, qty, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [
          detailId,
          transactionId,
          item.product.id,
          item.qty,
          item.subtotal,
        ]
      );

      // Decrement stock
      await db.runAsync(
        `UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?`,
        [item.qty, item.product.id]
      );

      detailedItems.push({
        id: detailId,
        transaction_id: transactionId,
        product_id: item.product.id,
        product_name: item.product.name,
        harga_jual: item.product.harga_jual,
        qty: item.qty,
        subtotal: item.subtotal,
      });
    }
  });

  return {
    transaction: newTransaction,
    details: detailedItems,
    payment_method: input.payment_method,
    cash_tendered: input.cash_tendered,
    change_amount: input.change_amount,
  };
}

export async function getAllTransactions(limit: number = 50): Promise<Transaction[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Transaction>(
    "SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
}

export async function getTransactionDetailsWithProducts(
  transactionId: string
): Promise<(TransactionDetail & { product_name: string; harga_jual: number })[]> {
  const db = await getDatabase();
  return await db.getAllAsync<TransactionDetail & { product_name: string; harga_jual: number }>(
    `SELECT td.*, p.name as product_name, p.harga_jual 
     FROM transaction_details td
     JOIN products p ON td.product_id = p.id
     WHERE td.transaction_id = ?`,
    [transactionId]
  );
}

export async function getTransactionsSummary(): Promise<{
  totalOmset: number;
  totalHpp: number;
  totalLaba: number;
  totalCount: number;
}> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    total_omset: number | null;
    total_hpp: number | null;
    total_laba: number | null;
    total_count: number;
  }>(
    `SELECT 
       SUM(omset) as total_omset, 
       SUM(total_hpp) as total_hpp, 
       SUM(laba_kotor) as total_laba, 
       COUNT(*) as total_count 
     FROM transactions`
  );

  return {
    totalOmset: row?.total_omset || 0,
    totalHpp: row?.total_hpp || 0,
    totalLaba: row?.total_laba || 0,
    totalCount: row?.total_count || 0,
  };
}
