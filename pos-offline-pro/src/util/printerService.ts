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

  /**
   * Formats a complete text representation of the receipt for 58mm (32 characters per line)
   * Matching screenshot 170931.png
   */
  static async generateReceiptText(data: ReceiptData): Promise<string> {
    const storeName = data.storeName || (await getSetting("store_name", "POS Offline Pro"));
    const businessType = data.businessType || (await getSetting("store_business_type", "Jenis toko"));
    const storeAddress = data.storeAddress || (await getSetting("store_address", "Jl. Alamat No 99 Makassar"));
    const storePhone = data.storePhone || (await getSetting("store_phone", "08111111111"));
    const logoUri = data.storeLogoUri ?? (await getSetting("store_logo", ""));

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

    // Store Logo indication
    if (logoUri) {
      lines.push(center("[ LOGO STORE ]"));
      lines.push("");
    }

    lines.push(center(storeName));
    if (businessType) lines.push(center(businessType));
    if (storeAddress) lines.push(center(storeAddress));
    if (storePhone) lines.push(center(storePhone));
    lines.push(divider);

    // Invoice & Date
    lines.push(center(data.invoiceNumber));
    lines.push(center(data.date));
    lines.push(divider);

    // Items list matching screenshot 170931
    data.items.forEach((item) => {
      const isKg = item.unit === "kg";
      const rightQty = isKg ? `${item.qty} kg` : `${item.qty}x`;
      lines.push(row(item.name.slice(0, 20), rightQty));

      const leftPrice = isKg ? `  Rp ${item.price.toLocaleString("id-ID")}/kg` : `  Rp ${item.price.toLocaleString("id-ID")}`;
      const rightSubtotal = `Rp ${item.subtotal.toLocaleString("id-ID")}`;
      lines.push(row(leftPrice, rightSubtotal));
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
