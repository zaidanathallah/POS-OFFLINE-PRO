/**
 * Report Repository - SQLite Aggregation Queries for Financial & Analytics Reporting
 * Dynamic timezone-aware device calculations and custom date ranges
 */
import { runInDbQueue } from "./index";

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
  hour: string;
  transactionCount: number;
  totalOmset: number;
  percentage: number;
  isPeak: boolean;
}

export interface TransactionReportRow {
  id: string;
  invoice_no: string;
  created_at: string;
  payment_method: string;
  subtotal_before_tax: number;
  ppn_amount: number;
  omset: number;
  total_hpp: number;
  laba_kotor: number;
  table_number?: string | null;
  customer_name?: string | null;
}

function getPeriodCondition(
  period: ReportPeriod,
  customStartDate?: string,
  customEndDate?: string
): { whereClause: string; params: any[] } {
  const now = new Date();
  if (period === "today") {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T00:00:00`;
    return {
      whereClause: "created_at >= ?",
      params: [todayStr],
    };
  } else if (period === "7days") {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dateStr = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, "0")}-${String(sevenDaysAgo.getDate()).padStart(2, "0")}T00:00:00`;
    return {
      whereClause: "created_at >= ?",
      params: [dateStr],
    };
  } else if (period === "30days") {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateStr = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, "0")}-${String(thirtyDaysAgo.getDate()).padStart(2, "0")}T00:00:00`;
    return {
      whereClause: "created_at >= ?",
      params: [dateStr],
    };
  } else {
    // Custom date range (YYYY-MM-DD)
    const start = customStartDate ? `${customStartDate}T00:00:00` : "2020-01-01T00:00:00";
    const end = customEndDate ? `${customEndDate}T23:59:59` : `${now.getFullYear()}-12-31T23:59:59`;
    return {
      whereClause: "created_at >= ? AND created_at <= ?",
      params: [start, end],
    };
  }
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
        COALESCE(SUM(omset), 0) as total_omset,
        COALESCE(SUM(total_hpp), 0) as total_hpp,
        COALESCE(SUM(laba_kotor), 0) as total_laba,
        COUNT(*) as total_count,
        COUNT(DISTINCT substr(created_at, 1, 10)) as distinct_days
      FROM transactions
      WHERE ${whereClause}
    `;

    const row = await db.getFirstAsync<{
      total_omset: number;
      total_hpp: number;
      total_laba: number;
      total_count: number;
      distinct_days: number;
    }>(query, params);

    const omset = row?.total_omset || 0;
    const modalHpp = row?.total_hpp || 0;
    const labaKotor = row?.total_laba || 0;
    const totalTransactions = row?.total_count || 0;
    const daysCount = Math.max(1, row?.distinct_days || 1);

    const marginPercent = omset > 0 ? (labaKotor / omset) * 100 : 0;
    const avgPerTransaction = totalTransactions > 0 ? Math.round(omset / totalTransactions) : 0;
    const avgPerDay = Math.round(omset / daysCount);

    return {
      omset,
      modalHpp,
      labaKotor,
      marginPercent: parseFloat(marginPercent.toFixed(1)),
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
 * Calculates dynamic hourly peak hours based on the device's local timezone
 */
export async function getPeakHoursAnalysis(
  period: ReportPeriod,
  customStartDate?: string,
  customEndDate?: string
): Promise<PeakHourItem[]> {
  return await runInDbQueue(async (db) => {
    const { whereClause, params } = getPeriodCondition(period, customStartDate, customEndDate);

    const rows = await db.getAllAsync<{
      created_at: string;
      omset: number;
    }>(`SELECT created_at, omset FROM transactions WHERE ${whereClause};`, params);

    // Default time buckets: 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00
    const hourMap: Record<number, { count: number; omset: number }> = {};
    for (let h = 0; h < 24; h++) {
      hourMap[h] = { count: 0, omset: 0 };
    }

    // Accumulate each transaction in device local hour
    if (rows && rows.length > 0) {
      for (const row of rows) {
        const date = new Date(row.created_at);
        const localHour = isNaN(date.getHours()) ? 12 : date.getHours();
        hourMap[localHour].count += 1;
        hourMap[localHour].omset += row.omset || 0;
      }
    }

    // Find hours with transactions or display top business hours
    const activeHours = Object.keys(hourMap)
      .map(Number)
      .filter((h) => hourMap[h].count > 0);

    const displayHours =
      activeHours.length > 0
        ? activeHours.sort((a, b) => a - b)
        : [8, 10, 12, 14, 16, 18, 20];

    const maxCount = Math.max(...displayHours.map((h) => hourMap[h].count), 1);

    return displayHours.map((h) => {
      const padHour = String(h).padStart(2, "0");
      const count = hourMap[h].count;
      const omset = hourMap[h].omset;

      return {
        hour: `${padHour}:00`,
        transactionCount: count,
        totalOmset: omset,
        percentage: count > 0 ? Math.round((count / maxCount) * 100) : 0,
        isPeak: count === maxCount && count > 0,
      };
    });
  });
}

/**
 * Fetches all transaction rows for CSV export
 */
export async function getTransactionsForReport(
  period: ReportPeriod,
  customStartDate?: string,
  customEndDate?: string
): Promise<TransactionReportRow[]> {
  return await runInDbQueue(async (db) => {
    const { whereClause, params } = getPeriodCondition(period, customStartDate, customEndDate);

    const query = `
      SELECT 
        id,
        invoice_no,
        created_at,
        payment_method,
        subtotal_before_tax,
        ppn_amount,
        omset,
        total_hpp,
        laba_kotor,
        table_number,
        customer_name
      FROM transactions
      WHERE ${whereClause}
      ORDER BY created_at DESC
    `;

    return await db.getAllAsync<TransactionReportRow>(query, params);
  });
}
