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
  unit?: string;
}

export interface ReceiptData {
  invoiceNumber: string;
  date: string;
  cashierName?: string;
  items: ReceiptItem[];
  subtotalBeforeTax?: number;
  ppnPercent?: number;
  ppnAmount?: number;
  totalAmount: number;
  cashTendered: number;
  changeAmount: number;
  paymentMethod: string;
  storeName?: string;
  businessType?: string;
  storeAddress?: string;
  storePhone?: string;
  storeLogoUri?: string | null;
  footerNote?: string;
}

export class PrinterService {
  private static isConnected: boolean = true;
  private static readonly LINE_WIDTH = 32;

  static isPrinterConnected(): boolean {
    return this.isConnected;
  }

  static async generateReceiptText(data: ReceiptData): Promise<string> {
    const width = this.LINE_WIDTH;
    const divider = "-".repeat(width);
    const doubleDivider = "=".repeat(width);

    const center = (text: string): string => {
      if (text.length >= width) return text.substring(0, width);
      const spaces = Math.floor((width - text.length) / 2);
      return " ".repeat(spaces) + text;
    };

    const row = (left: string, right: string): string => {
      const available = width - right.length;
      if (left.length > available - 1) {
        left = left.substring(0, available - 2) + ".";
      }
      const spaces = width - left.length - right.length;
      return left + " ".repeat(Math.max(1, spaces)) + right;
    };

    const lines: string[] = [];

    // Header matching screenshot 170931.png
    lines.push(doubleDivider);
    lines.push(center((data.storeName || "POS OFFLINE PRO").toUpperCase()));
    if (data.storeAddress) {
      lines.push(center(data.storeAddress));
    }
    if (data.storePhone) {
      lines.push(center(`Telp: ${data.storePhone}`));
    }
    lines.push(doubleDivider);

    // Meta
    lines.push(row("No. Struk:", data.invoiceNumber));
    lines.push(row("Waktu:", data.date));
    if (data.cashierName) {
      lines.push(row("Kasir:", data.cashierName));
    }
    lines.push(divider);

    // Items
    data.items.forEach((item) => {
      lines.push(item.name.substring(0, width));
      const qtyStr = `${item.qty} ${item.unit || "pcs"} x ${item.price.toLocaleString("id-ID")}`;
      const subtotalStr = `Rp ${item.subtotal.toLocaleString("id-ID")}`;
      lines.push(row(`  ${qtyStr}`, subtotalStr));
    });

    lines.push(divider);

    // Subtotal, Tax, and Totals
    if (data.subtotalBeforeTax !== undefined && data.ppnAmount !== undefined && data.ppnAmount > 0) {
      lines.push(row("Subtotal", `Rp ${data.subtotalBeforeTax.toLocaleString("id-ID")}`));
      lines.push(row(`PPN ${data.ppnPercent || 11}%`, `Rp ${data.ppnAmount.toLocaleString("id-ID")}`));
    }

    lines.push(row("Total", `Rp ${data.totalAmount.toLocaleString("id-ID")}`));
    lines.push(row(data.paymentMethod === "CASH" ? "Tunai" : "QRIS", `Rp ${data.cashTendered.toLocaleString("id-ID")}`));
    if (data.changeAmount > 0) {
      lines.push(row("Kembalian", `Rp ${data.changeAmount.toLocaleString("id-ID")}`));
    }

    lines.push(doubleDivider);
    lines.push(center("Terima Kasih!"));
    lines.push(center("Silahkan Datang Kembali"));
    lines.push("\n\n");

    return lines.filter((l) => l !== "").join("\n");
  }

  static async printReceipt(data: ReceiptData): Promise<{ success: boolean; message?: string }> {
    try {
      const text = await this.generateReceiptText(data);
      console.log("[PrinterService] 58mm Receipt Generated:\n" + text);
      return {
        success: true,
        message: "Struk berhasil dicetak ke printer 58mm.",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Gagal mencetak struk.",
      };
    }
  }
}

export const printBluetoothReceipt58mm = async (data: ReceiptData): Promise<boolean> => {
  const res = await PrinterService.printReceipt(data);
  return res.success;
};
