import { runInDbQueue, Transaction, getLocalDateString, getLocalISODateTime } from "./index";

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

export interface DailyTrendItem {
  dateStr: string; // "2026-09-01"
  dayName: string; // "Sel", "Rab", "Kam"
  displayLabel: string; // "Hr Ini" or "Sel"
  omset: number;
  labaKotor: number;
  transactionCount: number;
  percentage: number;
  isToday: boolean;
}

function getPeriodCondition(
  period: ReportPeriod,
  customStartDate?: string,
  customEndDate?: string
): { whereClause: string; params: any[] } {
  const now = new Date();

  if (period === "today") {
    const todayStr = getLocalDateString(now);
    const invPrefix = `INV-${todayStr.replace(/-/g, "").slice(2)}%`;
    return {
      whereClause: "is_open_bill = 0 AND (substr(created_at, 1, 10) = ? OR invoice_no LIKE ?)",
      params: [todayStr, invPrefix],
    };
  }

  if (period === "7days") {
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const start7Str = getLocalDateString(sevenDaysAgo);
    return {
      whereClause: "is_open_bill = 0 AND substr(created_at, 1, 10) >= ?",
      params: [start7Str],
    };
  }

  if (period === "30days") {
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    const start30Str = getLocalDateString(thirtyDaysAgo);
    return {
      whereClause: "is_open_bill = 0 AND substr(created_at, 1, 10) >= ?",
      params: [start30Str],
    };
  }

  if (period === "custom" && customStartDate && customEndDate) {
    return {
      whereClause: "is_open_bill = 0 AND substr(created_at, 1, 10) >= ? AND substr(created_at, 1, 10) <= ?",
      params: [customStartDate, customEndDate],
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

/**
 * Calculates dynamic stats for Yesterday (for day-over-day growth comparison)
 */
export async function getYesterdaySummary(): Promise<{ omset: number; labaKotor: number }> {
  return await runInDbQueue(async (db) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = getLocalDateString(yesterday);
    const yInvPrefix = `INV-${yStr.replace(/-/g, "").slice(2)}%`;

    const row = await db.getFirstAsync<{
      total_omset: number | null;
      total_laba: number | null;
    }>(
      `SELECT SUM(omset) as total_omset, SUM(laba_kotor) as total_laba 
       FROM transactions 
       WHERE is_open_bill = 0 AND (substr(created_at, 1, 10) = ? OR invoice_no LIKE ?);`,
      [yStr, yInvPrefix]
    );

    return {
      omset: row?.total_omset || 0,
      labaKotor: row?.total_laba || 0,
    };
  });
}

/**
 * Calculates dynamic stats for Current Calendar Month (from 1st of this month to today)
 */
export async function getCurrentMonthSummary(): Promise<FinancialSummary> {
  return await runInDbQueue(async (db) => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const monthPrefix = `${year}-${month}`;
    const invPrefix = `INV-${String(year).slice(2)}${month}%`;

    const row = await db.getFirstAsync<{
      total_omset: number | null;
      total_hpp: number | null;
      total_laba: number | null;
      total_transactions: number;
    }>(
      `SELECT 
         SUM(omset) as total_omset,
         SUM(total_hpp) as total_hpp,
         SUM(laba_kotor) as total_laba,
         COUNT(*) as total_transactions
       FROM transactions 
       WHERE is_open_bill = 0 AND (substr(created_at, 1, 7) = ? OR invoice_no LIKE ?);`,
      [monthPrefix, invPrefix]
    );

    const omset = row?.total_omset || 0;
    const modalHpp = row?.total_hpp || 0;
    const labaKotor = row?.total_laba || 0;
    const totalTransactions = row?.total_transactions || 0;
    const marginPercent = omset > 0 ? Number(((labaKotor / omset) * 100).toFixed(1)) : 0;
    const avgPerTransaction = totalTransactions > 0 ? Math.round(omset / totalTransactions) : 0;
    const dayOfMonth = Math.max(1, now.getDate());
    const avgPerDay = Math.round(omset / dayOfMonth);

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

/**
 * Calculates dynamic 7-Day Trend array for Dashboard bar chart
 */
export async function getDailyTrend7Days(): Promise<DailyTrendItem[]> {
  return await runInDbQueue(async (db) => {
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const results: DailyTrendItem[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = getLocalDateString(d);
      const invPrefix = `INV-${dateStr.replace(/-/g, "").slice(2)}%`;
      const dayOfWeek = d.getDay();
      const isToday = i === 0;

      const row = await db.getFirstAsync<{
        daily_omset: number | null;
        daily_laba: number | null;
        daily_count: number;
      }>(
        `SELECT 
           SUM(omset) as daily_omset,
           SUM(laba_kotor) as daily_laba,
           COUNT(*) as daily_count
         FROM transactions 
         WHERE is_open_bill = 0 AND (substr(created_at, 1, 10) = ? OR invoice_no LIKE ?);`,
        [dateStr, invPrefix]
      );

      results.push({
        dateStr,
        dayName: dayNames[dayOfWeek],
        displayLabel: isToday ? "Hr Ini" : dayNames[dayOfWeek],
        omset: row?.daily_omset || 0,
        labaKotor: row?.daily_laba || 0,
        transactionCount: row?.daily_count || 0,
        percentage: 0,
        isToday,
      });
    }

    const maxOmset = Math.max(...results.map((r) => r.omset), 1);
    return results.map((r) => ({
      ...r,
      percentage: r.omset > 0 ? Math.max(12, Math.round((r.omset / maxOmset) * 85)) : 10,
    }));
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
