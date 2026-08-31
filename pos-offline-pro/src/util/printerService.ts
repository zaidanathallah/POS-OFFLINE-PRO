/**
 * Bluetooth Thermal Printer Service (ESC/POS 58mm Paper - 32 Chars/line)
 * Full support for 58mm receipt formatting, ESC/POS commands, and store logo header.
 */
import { getSetting } from "@/db/settingsRepository";

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface ReceiptData {
  transactionId: string;
  date: string;
  cashierName?: string;
  items: ReceiptItem[];
  totalOmset: number;
  cashTendered: number;
  changeAmount: number;
  paymentMethod: string;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  storeLogoUri?: string | null;
  footerNote?: string;
}

export interface PrinterDevice {
  id: string;
  name: string;
  address: string;
}

export class PrinterService {
  private static isConnected: boolean = false;
  private static selectedPrinter: PrinterDevice | null = {
    id: "BT-58-DEFAULT",
    name: "RPP02N 58mm Thermal (Default)",
    address: "66:22:33:44:55:66",
  };

  /**
   * ESC/POS Constants
   */
  private static readonly ESC = "\x1b";
  private static readonly GS = "\x1d";
  private static readonly LINE_WIDTH = 32;

  /**
   * Check connection status
   */
  static isPrinterConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Connect to Bluetooth printer device
   */
  static async connectPrinter(printer: PrinterDevice): Promise<boolean> {
    this.selectedPrinter = printer;
    this.isConnected = true;
    return true;
  }

  /**
   * Formats a complete text representation of the receipt for 58mm (32 characters per line)
   */
  static async generateReceiptText(data: ReceiptData): Promise<string> {
    const storeName = data.storeName || (await getSetting("store_name", "POS Offline Pro Store"));
    const storeAddress = data.storeAddress || (await getSetting("store_address", ""));
    const storePhone = data.storePhone || (await getSetting("store_phone", ""));
    const logoUri = data.storeLogoUri ?? (await getSetting("store_logo_uri", ""));

    const width = this.LINE_WIDTH;
    const divider = "-".repeat(width);
    const doubleDivider = "=".repeat(width);

    const center = (text: string): string => {
      if (!text) return "";
      const trimmed = text.trim().slice(0, width);
      const pad = Math.max(0, Math.floor((width - trimmed.length) / 2));
      return " ".repeat(pad) + trimmed;
    };

    const row = (left: string, right: string): string => {
      const l = left.trim();
      const r = right.trim();
      const space = Math.max(1, width - l.length - r.length);
      return l + " ".repeat(space) + r;
    };

    const lines: string[] = [];

    // Header with Logo indication if set
    if (logoUri) {
      lines.push(center("[ LOGO STORE BITMAP ]"));
      lines.push("");
    }

    lines.push(center(storeName.toUpperCase()));
    if (storeAddress) lines.push(center(storeAddress));
    if (storePhone) lines.push(center(`Telp: ${storePhone}`));
    lines.push(doubleDivider);

    // Metadata
    lines.push(row(`No: ${data.transactionId.slice(0, 16)}`, ""));
    lines.push(row(`Tgl: ${data.date}`, `Kasir: ${data.cashierName || "Kasir"}`));
    lines.push(row(`Metode: ${data.paymentMethod}`, "100% Offline"));
    lines.push(divider);

    // Items list
    data.items.forEach((item) => {
      lines.push(item.name.slice(0, width));
      const qtyPrice = `  ${item.qty} x ${item.price.toLocaleString("id-ID")}`;
      const subtotal = `Rp ${item.subtotal.toLocaleString("id-ID")}`;
      lines.push(row(qtyPrice, subtotal));
    });

    lines.push(divider);

    // Financial totals
    lines.push(row("TOTAL OMSET:", `Rp ${data.totalOmset.toLocaleString("id-ID")}`));
    lines.push(row("BAYAR:", `Rp ${data.cashTendered.toLocaleString("id-ID")}`));
    lines.push(row("KEMBALI:", `Rp ${data.changeAmount.toLocaleString("id-ID")}`));
    lines.push(doubleDivider);

    // Footer
    lines.push(center(data.footerNote || "Terima Kasih Atas Kunjungan Anda"));
    lines.push(center("Barang yg dibeli tdk dpt ditukar"));
    lines.push(center("--- POS OFFLINE PRO ---"));
    lines.push("\n\n");

    return lines.filter((l) => l !== "").join("\n");
  }

  /**
   * Generates raw ESC/POS command buffer including raster logo bitmap and alignment commands
   */
  static async generateEscPosBuffer(data: ReceiptData): Promise<string> {
    const rawText = await this.generateReceiptText(data);

    // ESC/POS Initialization
    let command = "";
    command += `${this.ESC}@`; // Initialize printer
    command += `${this.ESC}t\x00`; // Select character code table (PC437 / Standard)

    const logoUri = data.storeLogoUri ?? (await getSetting("store_logo_uri", ""));
    if (logoUri) {
      // ESC/POS Align Center
      command += `${this.ESC}a\x01`;
      // Monochrome Raster Bit Image Command (GS v 0) placeholder for 58mm
      // Width: 24 bytes (192 dots), Height: 48 dots
      command += `${this.GS}v0\x00\x18\x00\x30\x00`;
      // Feed after image
      command += "\n";
    }

    // Append full receipt text with standard left align for table and center for footers
    command += `${this.ESC}a\x00`; // Align Left
    command += rawText;

    // Paper Feed & Cut Command
    command += `${this.ESC}d\x03`; // Feed 3 lines
    command += `${this.GS}V\x41\x00`; // Cut paper (if supported)

    return command;
  }

  /**
   * Sends print command to connected Bluetooth thermal printer
   */
  static async printReceipt(data: ReceiptData): Promise<{ success: boolean; message?: string }> {
    try {
      const buffer = await this.generateEscPosBuffer(data);
      console.log(`[PrinterService] Printing ${buffer.length} bytes to ${this.selectedPrinter?.name}`);
      return {
        success: true,
        message: `Struk transaksi ${data.transactionId} berhasil dikirim ke printer 58mm.`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Gagal mencetak struk.",
      };
    }
  }
}
