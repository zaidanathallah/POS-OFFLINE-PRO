/**
 * Transaction Repository - Atomic Checkout, History Queries & CRUD (SQLite)
 */
import { runInDbQueue, Transaction, TransactionDetail } from "./index";
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
  subtotal: number;
  discount_amount?: number;
  promo_name?: string;
  ppn_percent: number;
  ppn_amount: number;
  grand_total: number;
  total_hpp: number;
  laba_kotor: number;
  payment_method: "CASH" | "QRIS";
  cash_tendered: number;
  change_amount: number;
  table_number?: string;
  customer_name?: string;
  is_open_bill?: number;
  note?: string;
}

export async function processCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  return await runInDbQueue(async (db) => {
    if (!input.items || input.items.length === 0) {
      throw new Error("Keranjang belanja kosong.");
    }

    // Generate readable Invoice No: INV-YYMMDD-XXX
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const randomSuffix = String(Math.floor(100 + Math.random() * 900));
    const invoiceNo = `INV-${yy}${mm}${dd}-${randomSuffix}`;
    const transactionId = `TRX-${Date.now()}-${randomSuffix}`;
    const createdAt = now.toISOString();

    const newTransaction: Transaction = {
      id: transactionId,
      invoice_no: invoiceNo,
      omset: Number(input.grand_total) || 0,
      subtotal_before_tax: Number(input.subtotal) || 0,
      discount_amount: Number(input.discount_amount) || 0,
      promo_name: input.promo_name || null,
      ppn_percent: Number(input.ppn_percent) || 0,
      ppn_amount: Number(input.ppn_amount) || 0,
      total_hpp: Number(input.total_hpp) || 0,
      laba_kotor: Number(input.laba_kotor) || 0,
      payment_method: input.payment_method || "CASH",
      cash_tendered: Number(input.cash_tendered) || Number(input.grand_total) || 0,
      change_amount: Number(input.change_amount) || 0,
      table_number: input.table_number || null,
      customer_name: input.customer_name || null,
      is_open_bill: input.is_open_bill || 0,
      created_at: createdAt,
    };

    const detailedItems: (TransactionDetail & { product_name: string; harga_jual: number })[] = [];

    // 1. Insert into transactions table
    await db.runAsync(
      `INSERT INTO transactions (
        id, invoice_no, omset, total_hpp, laba_kotor, 
        subtotal_before_tax, discount_amount, promo_name, ppn_percent, ppn_amount, 
        payment_method, cash_tendered, change_amount, 
        table_number, customer_name, is_open_bill, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newTransaction.id,
        newTransaction.invoice_no ?? null,
        newTransaction.omset,
        newTransaction.total_hpp,
        newTransaction.laba_kotor,
        newTransaction.subtotal_before_tax,
        newTransaction.discount_amount ?? 0,
        newTransaction.promo_name ?? null,
        newTransaction.ppn_percent,
        newTransaction.ppn_amount,
        newTransaction.payment_method,
        newTransaction.cash_tendered,
        newTransaction.change_amount,
        newTransaction.table_number ?? null,
        newTransaction.customer_name ?? null,
        newTransaction.is_open_bill,
        newTransaction.created_at,
      ]
    );

    // 2. Insert into transaction_details & decrement product / variant stock
    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i];
      const detailId = `DTL-${transactionId}-${i + 1}`;
      const displayName = item.variant
        ? `${item.product?.name || "Produk"} (${item.variant.name})`
        : (item.product?.name || "Produk");
      const unitPrice = Number(item.unitPrice ?? item.variant?.harga_jual ?? item.product?.harga_jual ?? 0) || 0;
      const modalHpp = Number(item.modalHpp ?? item.variant?.modal_hpp ?? item.product?.modal_hpp ?? 0) || 0;
      const qty = Number(item.qty) || 1;
      const subtotal = Number(item.subtotal) || Math.round(qty * unitPrice);
      const unit = item.unit || item.product?.unit || "pcs";
      const productId = item.product?.id || `PRD-${i + 1}`;

      await db.runAsync(
        `INSERT INTO transaction_details (
          id, transaction_id, product_id, product_name, 
          variant_name, unit, harga_jual, modal_hpp, qty, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          detailId,
          transactionId,
          productId,
          displayName,
          item.variant?.name || null,
          unit,
          unitPrice,
          modalHpp,
          qty,
          subtotal,
        ]
      );

      // Decrement product stock safely
      if (item.product?.id) {
        try {
          await db.runAsync(
            `UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?`,
            [qty, item.product.id]
          );
        } catch (e) {
          console.log("Stock decrement notice:", e);
        }
      }

      detailedItems.push({
        id: detailId,
        transaction_id: transactionId,
        product_id: productId,
        product_name: displayName,
        variant_name: item.variant?.name || null,
        unit: unit,
        harga_jual: unitPrice,
        modal_hpp: modalHpp,
        qty: qty,
        subtotal: subtotal,
      });
    }

    return {
      transaction: newTransaction,
      details: detailedItems,
      payment_method: input.payment_method,
      cash_tendered: input.cash_tendered,
      change_amount: input.change_amount,
    };
  });
}

export async function getAllTransactions(limit: number = 50): Promise<Transaction[]> {
  return await runInDbQueue(async (db) => {
    return await db.getAllAsync<Transaction>(
      "SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?",
      [limit]
    );
  });
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  return await runInDbQueue(async (db) => {
    return await db.getFirstAsync<Transaction>(
      "SELECT * FROM transactions WHERE id = ? OR invoice_no = ?",
      [id, id]
    );
  });
}

export async function getTransactionDetailsWithProducts(
  transactionId: string
): Promise<(TransactionDetail & { product_name: string; harga_jual: number })[]> {
  return await runInDbQueue(async (db) => {
    return await db.getAllAsync<TransactionDetail & { product_name: string; harga_jual: number }>(
      `SELECT td.*, td.product_name, td.harga_jual 
       FROM transaction_details td
       WHERE td.transaction_id = ?`,
      [transactionId]
    );
  });
}

export async function getTransactionsSummary(): Promise<{
  totalOmset: number;
  totalHpp: number;
  totalLaba: number;
  totalCount: number;
}> {
  return await runInDbQueue(async (db) => {
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
       FROM transactions WHERE is_open_bill = 0`
    );

    return {
      totalOmset: row?.total_omset || 0,
      totalHpp: row?.total_hpp || 0,
      totalLaba: row?.total_laba || 0,
      totalCount: row?.total_count || 0,
    };
  });
}

export async function getOpenBills(): Promise<Transaction[]> {
  return await runInDbQueue(async (db) => {
    return await db.getAllAsync<Transaction>(
      "SELECT * FROM transactions WHERE is_open_bill = 1 ORDER BY created_at DESC;"
    );
  });
}

export async function cancelOpenBill(transactionId: string): Promise<void> {
  return await deleteTransaction(transactionId, true);
}

export async function settleOpenBill(
  transactionId: string,
  paymentMethod: "CASH" | "QRIS",
  cashTendered: number,
  changeAmount: number
): Promise<void> {
  return await runInDbQueue(async (db) => {
    await db.runAsync(
      `UPDATE transactions 
       SET is_open_bill = 0, payment_method = ?, cash_tendered = ?, change_amount = ? 
       WHERE id = ?;`,
      [paymentMethod, cashTendered, changeAmount, transactionId]
    );
  });
}

/**
 * CRUD: Create Manual Transaction Record (Protected by PIN)
 */
export async function createManualTransaction(data: {
  productName: string;
  qty: number;
  hargaJual: number;
  modalHpp: number;
  paymentMethod: "CASH" | "QRIS";
  discountAmount?: number;
  promoName?: string;
  customerName?: string;
  tableNumber?: string;
  customDate?: string;
}): Promise<Transaction> {
  return await runInDbQueue(async (db) => {
    const now = data.customDate ? new Date(data.customDate) : new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const randomSuffix = String(Math.floor(100 + Math.random() * 900));
    const invoiceNo = `INV-${yy}${mm}${dd}-${randomSuffix}`;
    const transactionId = `TRX-MNL-${Date.now()}-${randomSuffix}`;
    const createdAt = now.toISOString();

    const rawSubtotal = data.qty * data.hargaJual;
    const discount = data.discountAmount || 0;
    const netOmset = Math.max(0, rawSubtotal - discount);
    const totalHpp = data.qty * data.modalHpp;
    const labaKotor = Math.max(0, netOmset - totalHpp);

    const newTransaction: Transaction = {
      id: transactionId,
      invoice_no: invoiceNo,
      omset: netOmset,
      subtotal_before_tax: rawSubtotal,
      discount_amount: discount,
      promo_name: data.promoName || null,
      ppn_percent: 0,
      ppn_amount: 0,
      total_hpp: totalHpp,
      laba_kotor: labaKotor,
      payment_method: data.paymentMethod,
      cash_tendered: netOmset,
      change_amount: 0,
      table_number: data.tableNumber || null,
      customer_name: data.customerName || null,
      is_open_bill: 0,
      created_at: createdAt,
    };

    await db.runAsync(
      `INSERT INTO transactions (
        id, invoice_no, omset, total_hpp, laba_kotor, 
        subtotal_before_tax, discount_amount, promo_name, ppn_percent, ppn_amount, 
        payment_method, cash_tendered, change_amount, 
        table_number, customer_name, is_open_bill, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newTransaction.id,
        newTransaction.invoice_no ?? null,
        newTransaction.omset,
        newTransaction.total_hpp,
        newTransaction.laba_kotor,
        newTransaction.subtotal_before_tax,
        newTransaction.discount_amount ?? 0,
        newTransaction.promo_name ?? null,
        newTransaction.ppn_percent,
        newTransaction.ppn_amount,
        newTransaction.payment_method,
        newTransaction.cash_tendered,
        newTransaction.change_amount,
        newTransaction.table_number ?? null,
        newTransaction.customer_name ?? null,
        newTransaction.is_open_bill,
        newTransaction.created_at,
      ]
    );

    const detailId = `DTL-${transactionId}-1`;
    await db.runAsync(
      `INSERT INTO transaction_details (
        id, transaction_id, product_id, product_name, 
        variant_name, unit, harga_jual, modal_hpp, qty, subtotal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        detailId,
        transactionId,
        `PRD-MANUAL`,
        data.productName,
        null,
        "pcs",
        data.hargaJual,
        data.modalHpp,
        data.qty,
        rawSubtotal,
      ]
    );

    return newTransaction;
  });
}

/**
 * CRUD: Update Transaction Record (Protected by PIN)
 */
export async function updateTransaction(
  transactionId: string,
  updates: {
    omset?: number;
    total_hpp?: number;
    laba_kotor?: number;
    payment_method?: string;
    customer_name?: string;
    table_number?: string;
    created_at?: string;
  }
): Promise<void> {
  return await runInDbQueue(async (db) => {
    const current = await db.getFirstAsync<Transaction>(
      "SELECT * FROM transactions WHERE id = ?;",
      [transactionId]
    );
    if (!current) throw new Error("Transaksi tidak ditemukan.");

    const newOmset = updates.omset !== undefined ? updates.omset : current.omset;
    const newHpp = updates.total_hpp !== undefined ? updates.total_hpp : current.total_hpp;
    const newLaba = updates.laba_kotor !== undefined ? updates.laba_kotor : (newOmset - newHpp);
    const newPayment = updates.payment_method || current.payment_method;
    const newCust = updates.customer_name !== undefined ? (updates.customer_name || null) : (current.customer_name || null);
    const newTable = updates.table_number !== undefined ? (updates.table_number || null) : (current.table_number || null);
    const newCreatedAt = updates.created_at || current.created_at;

    await db.runAsync(
      `UPDATE transactions 
       SET omset = ?, total_hpp = ?, laba_kotor = ?, payment_method = ?, customer_name = ?, table_number = ?, created_at = ?
       WHERE id = ?;`,
      [newOmset, newHpp, newLaba, newPayment, newCust, newTable, newCreatedAt, transactionId]
    );
  });
}

/**
 * CRUD: Delete / Void Transaction (Protected by PIN)
 */
export async function deleteTransaction(transactionId: string, restoreStock: boolean = true): Promise<void> {
  return await runInDbQueue(async (db) => {
    if (restoreStock) {
      const details = await db.getAllAsync<TransactionDetail>(
        "SELECT * FROM transaction_details WHERE transaction_id = ?;",
        [transactionId]
      );
      for (const d of details) {
        if (d.product_id && !d.product_id.startsWith("PRD-MANUAL")) {
          await db.runAsync("UPDATE products SET stock = stock + ? WHERE id = ?;", [
            d.qty,
            d.product_id,
          ]);
        }
      }
    }

    await db.runAsync("DELETE FROM transaction_details WHERE transaction_id = ?;", [transactionId]);
    await db.runAsync("DELETE FROM transactions WHERE id = ?;", [transactionId]);
  });
}
