/**
 * Settings Repository - Key-Value SQLite Storage
 */
import { runInDbQueue } from "./index";

export async function getSetting(key: string, defaultValue: string = ""): Promise<string> {
  return await runInDbQueue(async (db) => {
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = ?",
      [key]
    );
    return row ? row.value : defaultValue;
  });
}

export async function setSetting(key: string, value: string): Promise<void> {
  return await runInDbQueue(async (db) => {
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [key, value]
    );
  });
}

export async function getAllSettings(): Promise<Record<string, string>> {
  return await runInDbQueue(async (db) => {
    const rows = await db.getAllAsync<{ key: string; value: string }>(
      "SELECT key, value FROM settings"
    );
    const result: Record<string, string> = {};
    rows.forEach((row) => {
      result[row.key] = row.value;
    });
    return result;
  });
}
