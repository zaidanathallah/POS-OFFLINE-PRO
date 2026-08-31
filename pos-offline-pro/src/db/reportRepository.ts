/**
 * Report Repository - SQLite Aggregation Queries for Financial & Analytics Reporting
 */
import { runInDbQueue } from "./index";

export type ReportPeriod = "today" | "7days" | "30days";

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
  percentage: number;
  isPeak: boolean;
}

function getPeriodCondition(period: ReportPeriod): { whereClause: string; params: any[] } {
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
  } else {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateStr = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, "0")}-${String(thirtyDaysAgo.getDate()).padStart(2, "0")}T00:00:00`;
    return {
      whereClause: "created_at >= ?",
      params: [dateStr],
    };
  }
}

export async function getFinancialSummary(period: ReportPeriod): Promise<FinancialSummary> {
  return await runInDbQueue(async (db) => {
    const { whereClause, params } = getPeriodCondition(period);

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
  limit: number = 5
): Promise<TopProductItem[]> {
  return await runInDbQueue(async (db) => {
    const { whereClause, params } = getPeriodCondition(period);

    const query = `
      SELECT 
        p.id,
        p.name,
        p.category,
        SUM(td.qty) as total_qty,
        SUM(td.subtotal) as total_omset,
        SUM(td.subtotal - (td.qty * p.modal_hpp)) as total_laba
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

export async function getPeakHoursAnalysis(period: ReportPeriod): Promise<PeakHourItem[]> {
  return await runInDbQueue(async (db) => {
    const { whereClause, params } = getPeriodCondition(period);

    const query = `
      SELECT 
        substr(created_at, 12, 2) as hour,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE ${whereClause}
      GROUP BY hour
      ORDER BY hour ASC
    `;

    const rows = await db.getAllAsync<{
      hour: string;
      transaction_count: number;
    }>(query, params);

    const defaultHours = ["08", "10", "12", "14", "16", "18", "20"];

    if (!rows || rows.length === 0) {
      return defaultHours.map((h) => ({
        hour: `${h}:00`,
        transactionCount: 0,
        percentage: 0,
        isPeak: false,
      }));
    }

    const maxCount = Math.max(...rows.map((r) => r.transaction_count), 1);

    return rows.map((r) => ({
      hour: `${r.hour || "12"}:00`,
      transactionCount: r.transaction_count,
      percentage: Math.round((r.transaction_count / maxCount) * 100),
      isPeak: r.transaction_count === maxCount && maxCount > 0,
    }));
  });
}
