/**
 * Bank Indonesia & ASPI Official EMVCo QRIS Dynamic Engine
 * Converts static QRIS into genuine dynamic QRIS with pre-filled transaction amounts.
 */

/**
 * Calculate CRC16-CCITT (Polynomial 0x1021, Initial 0xFFFF)
 * Required by ASPI / Bank Indonesia EMVCo QR Code standard.
 */
export function calculateCRC16(str: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      const bit = ((code >> (7 - j)) & 1) === 1;
      const c15 = ((crc >> 15) & 1) === 1;
      crc <<= 1;
      if (c15 !== bit) crc ^= polynomial;
    }
  }

  crc &= 0xffff;
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Standard Default QRIS Base for Sukrimu / Padi Halal Slaughter / Indonesian Merchants
 * Acquirer: ShopeePay (ID: 9360-0918-0022-8956-811), ASPI QRIS Compliant
 */
export const DEFAULT_BASE_QRIS =
  "00020101021126680016ID.CO.SHOPEE.PAY0118936009180022895681102150000000000000000303UME51440014ID.CO.QRIS.WWW0215ID10200228956810303UME5204541153033605802ID5920SUKRIMU FROZEN MILK6008SURABAYA61056029362070703A016304";

export interface ParsedQrisMetadata {
  merchantName: string;
  merchantCity: string;
  postalCode?: string;
  acquirerName?: string;
  isDynamic: boolean;
}

/**
 * Parse human readable metadata from QRIS string
 */
export function parseQrisMetadata(qrisStr: string): ParsedQrisMetadata {
  let name = "Toko POS Offline Pro";
  let city = "SURABAYA";
  let isDynamic = false;

  try {
    let index = 0;
    while (index < qrisStr.length - 4) {
      const tag = qrisStr.substring(index, index + 2);
      const len = parseInt(qrisStr.substring(index + 2, index + 4), 10);
      if (isNaN(len) || len <= 0) break;
      const val = qrisStr.substring(index + 4, index + 4 + len);

      if (tag === "01") {
        isDynamic = val === "12";
      } else if (tag === "59") {
        name = val;
      } else if (tag === "60") {
        city = val;
      }
      index += 4 + len;
    }
  } catch (e) {}

  return {
    merchantName: name,
    merchantCity: city,
    isDynamic,
  };
}

/**
 * Convert any static or base QRIS into an Official Dynamic QRIS with exact nominal amount
 * Tag 01: '11' (Static) -> '12' (Dynamic)
 * Tag 54: Added with exact amount (e.g. 540538850 for Rp 38.850)
 * Tag 63: CRC16 recalculated
 */
export function convertToDynamicQris(
  baseQris: string,
  nominalAmount: number,
  invoiceNo?: string
): string {
  if (!baseQris || baseQris.length < 20) {
    baseQris = DEFAULT_BASE_QRIS;
  }

  // 1. Clean string (remove trailing CRC if present)
  let cleanQris = baseQris.trim();
  const crcIndex = cleanQris.indexOf("6304");
  if (crcIndex !== -1) {
    cleanQris = cleanQris.substring(0, crcIndex);
  }

  // 2. Change Tag 01 from 010211 (Static) to 010212 (Dynamic)
  if (cleanQris.includes("010211")) {
    cleanQris = cleanQris.replace("010211", "010212");
  } else if (!cleanQris.includes("010212")) {
    cleanQris = "000201010212" + cleanQris.substring(12);
  }

  // 3. Remove existing Tag 54 if present
  const tag54Regex = /54\d{2}\d+(\.\d{2})?/;
  cleanQris = cleanQris.replace(tag54Regex, "");

  // 4. Format Nominal Amount for Tag 54 (e.g. "38850")
  const roundedAmount = Math.round(nominalAmount);
  const amountStr = roundedAmount.toString();
  const amountLen = amountStr.length.toString().padStart(2, "0");
  const tag54Str = `54${amountLen}${amountStr}`;

  // 5. Insert Tag 54 before Tag 58 (Country Code '5802ID')
  const tag58Index = cleanQris.indexOf("5802ID");
  if (tag58Index !== -1) {
    cleanQris =
      cleanQris.substring(0, tag58Index) +
      tag54Str +
      cleanQris.substring(tag58Index);
  } else {
    cleanQris = cleanQris + tag54Str;
  }

  // 6. Append Tag 63 and calculate final CRC16
  const payloadToHash = cleanQris + "6304";
  const checksum = calculateCRC16(payloadToHash);

  return payloadToHash + checksum;
}
