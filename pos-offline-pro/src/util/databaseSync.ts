/**
 * Local Database Backup & Restore Service (Export/Import)
 * 100% Offline, Zero Cloud Dependencies.
 */
import * as FileSystem from "expo-file-system/legacy";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { DB_NAME, closeDatabase, reloadDatabase } from "@/db";

export interface ExportResult {
  success: boolean;
  fileName?: string;
  path?: string;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  fileName?: string;
  error?: string;
}

/**
 * Exports the active SQLite database file to local storage and prompts user to save/share
 */
export async function exportDatabaseBackup(): Promise<ExportResult> {
  try {
    const dbDir = `${FileSystem.documentDirectory}SQLite/`;
    const sourceDbPath = `${dbDir}${DB_NAME}`;

    const fileInfo = await FileSystem.getInfoAsync(sourceDbPath);
    if (!fileInfo.exists) {
      return {
        success: false,
        error: "File database aktif belum ditemukan di memori aplikasi.",
      };
    }

    // Format timestamp: Backup_POS_YYYYMMDD_HHMMSS.db
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const fileName = `Backup_POS_${dateStr}_${timeStr}.db`;
    const destinationPath = `${FileSystem.documentDirectory}${fileName}`;

    // Copy database file
    await FileSystem.copyAsync({
      from: sourceDbPath,
      to: destinationPath,
    });

    // If sharing is available, offer to Save to Files or Share to WhatsApp/Email
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(destinationPath, {
        mimeType: "application/x-sqlite3",
        dialogTitle: "Simpan atau Bagikan File Backup Database",
        UTI: "public.database",
      });
    }

    return {
      success: true,
      fileName,
      path: destinationPath,
    };
  } catch (error: any) {
    console.error("Export database error:", error);
    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat mengekspor database.",
    };
  }
}

/**
 * Imports a SQLite backup file from phone storage and overwrites the active database
 */
export async function importDatabaseBackup(): Promise<ImportResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["*/*", "application/x-sqlite3", "application/octet-stream"],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return {
        success: false,
        error: "Pemilihan file dibatalkan.",
      };
    }

    const selectedFile = result.assets[0];
    const fileName = selectedFile.name.toLowerCase();

    // Validate file extension
    if (!fileName.endsWith(".db") && !fileName.endsWith(".sqlite") && !fileName.endsWith(".sqlite3")) {
      return {
        success: false,
        error: "Format file tidak valid. Harap pilih file database berekstensi .db atau .sqlite.",
      };
    }

    const dbDir = `${FileSystem.documentDirectory}SQLite/`;
    const targetDbPath = `${dbDir}${DB_NAME}`;

    // Ensure SQLite directory exists
    const dirInfo = await FileSystem.getInfoAsync(dbDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
    }

    // Safely close existing connection before file replacement
    await closeDatabase();

    // Overwrite old database with new backup file
    await FileSystem.copyAsync({
      from: selectedFile.uri,
      to: targetDbPath,
    });

    // Reopen & reload database connection
    await reloadDatabase();

    return {
      success: true,
      fileName: selectedFile.name,
    };
  } catch (error: any) {
    console.error("Import database error:", error);
    return {
      success: false,
      error: error.message || "Gagal memulihkan database dari file backup.",
    };
  }
}
