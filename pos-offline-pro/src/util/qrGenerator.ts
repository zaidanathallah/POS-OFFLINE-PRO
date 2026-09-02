/**
 * Pure TypeScript Offline QR Code Generator (Model 2, Byte Encoding)
 * Generates boolean matrix for SVG / Canvas rendering without any network or external dependencies.
 */

// QR Code Constants & Tables
const PAD0 = 0xec;
const PAD1 = 0x11;

const EXP_TABLE = new Array(256);
const LOG_TABLE = new Array(256);

for (let i = 0; i < 8; i++) {
  EXP_TABLE[i] = 1 << i;
}
for (let i = 8; i < 256; i++) {
  EXP_TABLE[i] =
    EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8];
}
for (let i = 0; i < 255; i++) {
  LOG_TABLE[EXP_TABLE[i]] = i;
}

function glog(n: number) {
  if (n < 1) throw new Error("glog(" + n + ")");
  return LOG_TABLE[n];
}

function gexp(n: number) {
  while (n < 0) n += 255;
  while (n >= 256) n -= 255;
  return EXP_TABLE[n];
}

class Polynomial {
  num: number[];
  constructor(num: number[], shift: number = 0) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift).fill(0);
    for (let i = 0; i < num.length - offset; i++) {
      this.num[i] = num[offset + i];
    }
  }

  get(index: number) {
    return this.num[index];
  }

  getLength() {
    return this.num.length;
  }

  multiply(e: Polynomial): Polynomial {
    const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= gexp(glog(this.get(i)) + glog(e.get(j)));
      }
    }
    return new Polynomial(num);
  }

  mod(e: Polynomial): Polynomial {
    if (this.getLength() - e.getLength() < 0) return this;
    const ratio = glog(this.get(0)) - glog(e.get(0));
    const num = new Array(this.getLength());
    for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
    for (let i = 0; i < e.getLength(); i++) {
      num[i] ^= gexp(glog(e.get(i)) + ratio);
    }
    return new Polynomial(num).mod(e);
  }
}

// RS Block definitions for Error Correction Level L (Low - ideal for QRIS) and M
// [totalCount, dataCount]
const RS_BLOCK_TABLE: { [version: number]: number[] } = {
  1: [26, 19],
  2: [44, 34],
  3: [70, 55],
  4: [100, 80],
  5: [134, 108],
  6: [172, 136],
  7: [196, 156],
  8: [242, 194],
  9: [292, 232],
  10: [346, 274],
  11: [404, 324],
  12: [466, 370],
  13: [532, 428],
  14: [581, 461],
};

function getErrorCorrectPolynomial(errorCorrectLength: number): Polynomial {
  let a = new Polynomial([1], 0);
  for (let i = 0; i < errorCorrectLength; i++) {
    a = a.multiply(new Polynomial([1, gexp(i)], 0));
  }
  return a;
}

class BitBuffer {
  buffer: number[] = [];
  length: number = 0;

  get(index: number): boolean {
    const bufIndex = Math.floor(index / 8);
    return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1;
  }

  put(num: number, length: number) {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  }

  putBit(bit: boolean) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0);
    }
    if (bit) {
      this.buffer[bufIndex] |= 0x80 >>> (this.length % 8);
    }
    this.length++;
  }
}

export function generateQrMatrix(text: string): boolean[][] {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(text);

  // Find minimum version that fits dataBytes length
  let typeNumber = 1;
  for (let v = 1; v <= 14; v++) {
    const maxDataBytes = RS_BLOCK_TABLE[v][1] - 3; // header overhead
    if (dataBytes.length <= maxDataBytes) {
      typeNumber = v;
      break;
    }
  }

  const moduleCount = typeNumber * 4 + 17;
  const modules: (boolean | null)[][] = Array.from({ length: moduleCount }, () =>
    new Array(moduleCount).fill(null)
  );

  // 1. Position probe patterns
  function setupPositionProbePattern(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || moduleCount <= col + c) continue;
        if (
          (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
          (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4)
        ) {
          modules[row + r][col + c] = true;
        } else {
          modules[row + r][col + c] = false;
        }
      }
    }
  }

  setupPositionProbePattern(0, 0);
  setupPositionProbePattern(moduleCount - 7, 0);
  setupPositionProbePattern(0, moduleCount - 7);

  // 2. Timing patterns
  for (let r = 8; r < moduleCount - 8; r++) {
    if (modules[r][6] === null) modules[r][6] = r % 2 === 0;
  }
  for (let c = 8; c < moduleCount - 8; c++) {
    if (modules[6][c] === null) modules[6][c] = c % 2 === 0;
  }

  // 3. Alignment patterns for version >= 2
  if (typeNumber >= 2) {
    const pos = typeNumber * 4 + 10;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        modules[pos + r][pos + c] =
          Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
      }
    }
  }

  // 4. Reserve format info area
  for (let i = 0; i < 9; i++) {
    if (modules[i][8] === null) modules[i][8] = false;
    if (modules[8][i] === null) modules[8][i] = false;
  }
  for (let i = 0; i < 8; i++) {
    if (modules[moduleCount - 1 - i][8] === null)
      modules[moduleCount - 1 - i][8] = false;
    if (modules[8][moduleCount - 1 - i] === null)
      modules[8][moduleCount - 1 - i] = false;
  }
  modules[moduleCount - 8][8] = true;

  // 5. Build Data Stream (Byte mode = 0100)
  const buffer = new BitBuffer();
  buffer.put(4, 4); // Mode 8-bit byte
  buffer.put(dataBytes.length, typeNumber < 10 ? 8 : 16);
  for (let i = 0; i < dataBytes.length; i++) {
    buffer.put(dataBytes[i], 8);
  }

  const [totalCount, dataCount] = RS_BLOCK_TABLE[typeNumber];
  // Terminator
  if (buffer.length + 4 <= dataCount * 8) {
    buffer.put(0, 4);
  } else if (buffer.length < dataCount * 8) {
    buffer.put(0, dataCount * 8 - buffer.length);
  }

  // Padding
  while (buffer.length % 8 !== 0) {
    buffer.putBit(false);
  }
  while (buffer.length < dataCount * 8) {
    buffer.put(PAD0, 8);
    if (buffer.length < dataCount * 8) {
      buffer.put(PAD1, 8);
    }
  }

  // Calculate Error Correction
  const ecLength = totalCount - dataCount;
  const rawData: number[] = [];
  for (let i = 0; i < dataCount; i++) {
    rawData.push(buffer.buffer[i]);
  }

  const rawPoly = new Polynomial(rawData, ecLength);
  const ecPoly = getErrorCorrectPolynomial(ecLength);
  const modPoly = rawPoly.mod(ecPoly);

  const finalData: number[] = [...rawData];
  for (let i = 0; i < ecLength; i++) {
    const modIndex = i + modPoly.getLength() - ecLength;
    finalData.push(modIndex >= 0 ? modPoly.get(modIndex) : 0);
  }

  // Put data into matrix
  let inc = -1;
  let row = moduleCount - 1;
  let bitIndex = 0;
  const totalBits = finalData.length * 8;

  for (let col = moduleCount - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    while (true) {
      for (let c = 0; c < 2; c++) {
        if (modules[row][col - c] === null) {
          let dark = false;
          if (bitIndex < totalBits) {
            const byteIdx = Math.floor(bitIndex / 8);
            const bitOffset = 7 - (bitIndex % 8);
            dark = ((finalData[byteIdx] >>> bitOffset) & 1) === 1;
          }
          // Mask pattern 0: (row + col) % 2 === 0
          const mask = (row + (col - c)) % 2 === 0;
          modules[row][col - c] = dark !== mask;
          bitIndex++;
        }
      }
      row += inc;
      if (row < 0 || moduleCount <= row) {
        row -= inc;
        inc = -inc;
        break;
      }
    }
  }

  // 6. Format info for Mask 0 + Error Correct L (01)
  const formatInfo = 0x77c4; // Pre-calculated masked format info for L / Pattern 0
  for (let i = 0; i < 15; i++) {
    const mod = ((formatInfo >>> i) & 1) === 1;
    if (i < 6) {
      modules[i][8] = mod;
    } else if (i < 8) {
      modules[i + 1][8] = mod;
    } else {
      modules[moduleCount - 15 + i][8] = mod;
    }

    if (i < 8) {
      modules[8][moduleCount - i - 1] = mod;
    } else if (i < 9) {
      modules[8][15 - i - 1 + 1] = mod;
    } else {
      modules[8][15 - i - 1] = mod;
    }
  }
  modules[moduleCount - 8][8] = true;

  // Convert to clean boolean matrix
  return modules.map((r) => r.map((cell) => cell === true));
}
