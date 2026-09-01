import { runInDbQueue, Transaction } from "./index";

export type ReportPeriod = "today" | "7days" | "30days" | "custom";

export interface FinancialSummary {
  omset: number;
  modalHpp: number;
  labaKotor: number;
  marginPercent: number;
  totalTransactions: number;
  avgPerTransaction: number;
  avgPerDay: number;
}

export interface TopProductItem {
  id: string;
  name: string;
  category: string;
  totalQty: number;
  totalOmset: number;
  totalLaba: number;
  percentage: number;
}

export interface PeakHourItem {
  timeLabel: string; // e.g. "12:07", "12:12", "19:38" (Device local time)
  totalOmset: number;
  transactionCount: number;
  invoiceNo?: string;
  percentage: number;
  isPeak: boolean;
}

function getPeriodCondition(
  period: ReportPeriod,
  customStartDate?: string,
  customEndDate?: string
): { whereClause: string; params: any[] } {
  const now = new Date();

  if (period === "today") {
    const todayStr = now.toISOString().split("T")[0];
    return {
      whereClause: "is_open_bill = 0 AND created_at LIKE ?",
      params: [`${todayStr}%`],
    };
  }

  if (period === "7days") {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      whereClause: "is_open_bill = 0 AND created_at >= ?",
      params: [sevenDaysAgo.toISOString()],
    };
  }

  if (period === "30days") {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      whereClause: "is_open_bill = 0 AND created_at >= ?",
      params: [thirtyDaysAgo.toISOString()],
    };
  }

  if (period === "custom" && customStartDate && customEndDate) {
    return {
      whereClause: "is_open_bill = 0 AND created_at >= ? AND created_at <= ?",
      params: [`${customStartDate}T00:00:00.000Z`, `${customEndDate}T23:59:59.999Z`],
    };
  }

  return {
    whereClause: "is_open_bill = 0",
    params: [],
  };
}

export async function getFinancialSummary(
  period: ReportPeriod,
  customStartDate?: string,
  customEndDate?: string
): Promise<FinancialSummary> {
  return await runInDbQueue(async (db) => {
    const { whereClause, params } = getPeriodCondition(period, customStartDate, customEndDate);

    const query = `
      SELECT 
        SUM(omset) as total_omset,
        SUM(total_hpp) as total_hpp,
        SUM(laba_kotor) as total_laba,
        COUNT(*) as total_transactions
      FROM transactions
      WHERE ${whereClause}
    `;

    const row = await db.getFirstAsync<{
      total_omset: number | null;
      total_hpp: number | null;
      total_laba: number | null;
      total_transactions: number;
    }>(query, params);

    const omset = row?.total_omset || 0;
    const modalHpp = row?.total_hpp || 0;
    const labaKotor = row?.total_laba || 0;
    const totalTransactions = row?.total_transactions || 0;

    const marginPercent =
      omset > 0 ? Number(((labaKotor / omset) * 100).toFixed(1)) : 0;
    const avgPerTransaction =
      totalTransactions > 0 ? Math.round(omset / totalTransactions) : 0;

    let divisorDays = 1;
    if (period === "7days") divisorDays = 7;
    else if (period === "30days") divisorDays = 30;
    else if (period === "custom" && customStartDate && customEndDate) {
      const diffMs = new Date(customEndDate).getTime() - new Date(customStartDate).getTime();
      divisorDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }
    const avgPerDay = Math.round(omset / divisorDays);

    return {
      omset,
      modalHpp,
      labaKotor,
      marginPercent,
      totalTransactions,
      avgPerTransaction,
      avgPerDay,
    };
  });
}

export async function getTopProducts(
  period: ReportPeriod,
  limit: number = 5,
  customStartDate?: string,
  customEndDate?: string
): Promise<TopProductItem[]> {
  return await runInDbQueue(async (db) => {
    const { whereClause, params } = getPeriodCondition(period, customStartDate, customEndDate);

    const query = `
      SELECT 
        p.id,
        p.name,
        p.category,
        SUM(td.qty) as total_qty,
        SUM(td.subtotal) as total_omset,
        SUM(td.subtotal - (td.qty * td.modal_hpp)) as total_laba
      FROM transaction_details td
      JOIN transactions t ON td.transaction_id = t.id
      JOIN products p ON td.product_id = p.id
      WHERE ${whereClause.replace(/created_at/g, "t.created_at")}
      GROUP BY p.id
      ORDER BY total_qty DESC
      LIMIT ?
    `;

    const rows = await db.getAllAsync<{
      id: string;
      name: string;
      category: string;
      total_qty: number;
      total_omset: number;
      total_laba: number;
    }>(query, [...params, limit]);

    if (!rows || rows.length === 0) return [];

    const maxQty = Math.max(...rows.map((r) => r.total_qty), 1);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      totalQty: r.total_qty,
      totalOmset: r.total_omset,
      totalLaba: r.total_laba,
      percentage: Math.round((r.total_qty / maxQty) * 100),
    }));
  });
}

/**
 * Calculates dynamic peak minutes/hours based on actual transaction timestamps in device local time
 */
export async function getPeakHoursAnalysis(
  period: ReportPeriod,
  customStartDate?: string,
  customEndDate?: string
): Promise<PeakHourItem[]> {
  return await runInDbQueue(async (db) => {
    const { whereClause, params } = getPeriodCondition(period, customStartDate, customEndDate);

    const rows = await db.getAllAsync<{
      invoice_no: string | null;
      created_at: string;
      omset: number;
    }>(
      `SELECT invoice_no, created_at, omset 
       FROM transactions 
       WHERE ${whereClause} 
       ORDER BY created_at DESC;`,
      params
    );

    if (!rows || rows.length === 0) {
      return [
        { timeLabel: "08:00", totalOmset: 0, transactionCount: 0, percentage: 0, isPeak: false },
        { timeLabel: "12:00", totalOmset: 0, transactionCount: 0, percentage: 0, isPeak: false },
        { timeLabel: "18:00", totalOmset: 0, transactionCount: 0, percentage: 0, isPeak: false },
        { timeLabel: "20:00", totalOmset: 0, transactionCount: 0, percentage: 0, isPeak: false },
      ];
    }

    // Group by exact HH:mm local time
    const timeMap: Record<string, { omset: number; count: number; invoiceNo?: string }> = {};

    for (const row of rows) {
      const d = new Date(row.created_at);
      const hours = String(isNaN(d.getHours()) ? 12 : d.getHours()).padStart(2, "0");
      const minutes = String(isNaN(d.getMinutes()) ? 0 : d.getMinutes()).padStart(2, "0");
      const key = `${hours}:${minutes}`;

      if (!timeMap[key]) {
        timeMap[key] = { omset: 0, count: 0, invoiceNo: row.invoice_no || undefined };
      }
      timeMap[key].omset += row.omset || 0;
      timeMap[key].count += 1;
    }

    const timeKeys = Object.keys(timeMap);
    const maxOmset = Math.max(...timeKeys.map((k) => timeMap[k].omset), 1);

    return timeKeys.map((k) => {
      const item = timeMap[k];
      return {
        timeLabel: k,
        totalOmset: item.omset,
        transactionCount: item.count,
        invoiceNo: item.invoiceNo,
        percentage: Math.round((item.omset / maxOmset) * 100),
        isPeak: item.omset === maxOmset && item.omset > 0,
      };
    });
  });
}

/**
 * Fetches all transaction rows for CSV export & detail management
 */
export async function getTransactionsForReport(
  period: ReportPeriod,
  customStartDate?: string,
  customEndDate?: string
): Promise<Transaction[]> {
  return await runInDbQueue(async (db) => {
    const { whereClause, params } = getPeriodCondition(period, customStartDate, customEndDate);
    return await db.getAllAsync<Transaction>(
      `SELECT * FROM transactions WHERE ${whereClause} ORDER BY created_at DESC;`,
      params
    );
  });
}
