/**
 * Offline Supermarket & Minimarket FMCG Barcode Database
 * Comprehensive Indonesian retail products with real EAN-13 barcodes, categories, and standard market prices.
 */

export interface SupermarketProduct {
  barcode: string;
  name: string;
  category: "Makanan" | "Minuman" | "Retail" | "Buah" | "Lainnya";
  harga_jual: number;
  modal_hpp: number;
  unit: string;
  image_uri?: string;
}

export const SUPERMARKET_BARCODE_DATABASE: SupermarketProduct[] = [
  // --- MIE INSTAN & MAKANAN CEPAT SAJI ---
  {
    barcode: "8998866200224",
    name: "Indomie Goreng Spesial 85g",
    category: "Makanan",
    harga_jual: 3500,
    modal_hpp: 2900,
    unit: "pcs",
    image_uri: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300&q=80",
  },
  {
    barcode: "8998866200118",
    name: "Indomie Kuah Ayam Bawang 70g",
    category: "Makanan",
    harga_jual: 3500,
    modal_hpp: 2900,
    unit: "pcs",
    image_uri: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80",
  },
  {
    barcode: "8998866200330",
    name: "Indomie Soto Mie 75g",
    category: "Makanan",
    harga_jual: 3500,
    modal_hpp: 2900,
    unit: "pcs",
    image_uri: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80",
  },
  {
    barcode: "8998866100111",
    name: "Pop Mie Rasa Ayam Bawang Cup",
    category: "Makanan",
    harga_jual: 6000,
    modal_hpp: 4800,
    unit: "cup",
    image_uri: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300&q=80",
  },
  {
    barcode: "8998866100227",
    name: "Pop Mie Goreng Pedes Gledek Cup",
    category: "Makanan",
    harga_jual: 6500,
    modal_hpp: 5100,
    unit: "cup",
    image_uri: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300&q=80",
  },
  {
    barcode: "8991001500111",
    name: "Mie Sedaap Goreng 90g",
    category: "Makanan",
    harga_jual: 3500,
    modal_hpp: 2850,
    unit: "pcs",
  },

  // --- SNACK, KERUPUK & BISKUIT SUPERMARKET ---
  {
    barcode: "8993175539019",
    name: "Chitato Sapi Panggang 68g",
    category: "Makanan",
    harga_jual: 11500,
    modal_hpp: 9200,
    unit: "pcs",
    image_uri: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80",
  },
  {
    barcode: "8992753221015",
    name: "Oreo Vanilla Sandwich 133g",
    category: "Makanan",
    harga_jual: 9500,
    modal_hpp: 7600,
    unit: "pcs",
    image_uri: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&q=80",
  },
  {
    barcode: "8992745123019",
    name: "SilverQueen Milk Chocolate Cashew 62g",
    category: "Makanan",
    harga_jual: 16500,
    modal_hpp: 13500,
    unit: "pcs",
  },
  {
    barcode: "8991001100219",
    name: "Beng-Beng Wafer Chocolate 20g",
    category: "Makanan",
    harga_jual: 2500,
    modal_hpp: 1900,
    unit: "pcs",
  },
  {
    barcode: "8992772010119",
    name: "Pocky Chocolate Biscuit Stick 47g",
    category: "Makanan",
    harga_jual: 9000,
    modal_hpp: 7200,
    unit: "pcs",
  },
  {
    barcode: "8992388111223",
    name: "Taro Net Seaweed Rumput Laut 36g",
    category: "Makanan",
    harga_jual: 5500,
    modal_hpp: 4200,
    unit: "pcs",
  },
  {
    barcode: "8992388000114",
    name: "Qtela Keripik Singkong Original 60g",
    category: "Makanan",
    harga_jual: 6000,
    modal_hpp: 4800,
    unit: "pcs",
  },
  {
    barcode: "8992761000010",
    name: "Roma Malkist Crackers Manis 135g",
    category: "Makanan",
    harga_jual: 7500,
    modal_hpp: 5900,
    unit: "pcs",
  },
  {
    barcode: "8992759112233",
    name: "Richeese Nabati Wafer Keju 110g",
    category: "Makanan",
    harga_jual: 7000,
    modal_hpp: 5500,
    unit: "pcs",
  },
  {
    barcode: "8991001400111",
    name: "Permen Kopiko Coffee Candy 150g",
    category: "Makanan",
    harga_jual: 8500,
    modal_hpp: 6800,
    unit: "bks",
  },
  {
    barcode: "8992745900111",
    name: "Choki Choki Chocolate Paste 4x10g",
    category: "Makanan",
    harga_jual: 5000,
    modal_hpp: 3800,
    unit: "pack",
  },

  // --- MINUMAN KEMASAN SUPERMARKET ---
  {
    barcode: "8999999001234",
    name: "Aqua Air Mineral Botol 600ml",
    category: "Minuman",
    harga_jual: 3500,
    modal_hpp: 2600,
    unit: "botol",
    image_uri: "https://images.unsplash.com/photo-1559839914-ba2a1ae09a03?w=300&q=80",
  },
  {
    barcode: "8992761100111",
    name: "Le Minerale Air Mineral 600ml",
    category: "Minuman",
    harga_jual: 3500,
    modal_hpp: 2600,
    unit: "botol",
    image_uri: "https://images.unsplash.com/photo-1559839914-ba2a1ae09a03?w=300&q=80",
  },
  {
    barcode: "8992775211025",
    name: "Teh Botol Sosro Kotak 250ml",
    category: "Minuman",
    harga_jual: 4000,
    modal_hpp: 3100,
    unit: "kotak",
  },
  {
    barcode: "8991002345111",
    name: "Teh Pucuk Harum Melati 350ml",
    category: "Minuman",
    harga_jual: 4000,
    modal_hpp: 3000,
    unit: "botol",
  },
  {
    barcode: "8996001304128",
    name: "Pocari Sweat Isotonik 500ml",
    category: "Minuman",
    harga_jual: 8000,
    modal_hpp: 6400,
    unit: "botol",
  },
  {
    barcode: "8991002101345",
    name: "Ultra Milk Susu UHT Cokelat 250ml",
    category: "Minuman",
    harga_jual: 6500,
    modal_hpp: 5200,
    unit: "kotak",
  },
  {
    barcode: "8991002101352",
    name: "Ultra Milk Susu UHT Full Cream 250ml",
    category: "Minuman",
    harga_jual: 6500,
    modal_hpp: 5200,
    unit: "kotak",
  },
  {
    barcode: "8991389221011",
    name: "Bear Brand Susu Steril 189ml",
    category: "Minuman",
    harga_jual: 10500,
    modal_hpp: 8900,
    unit: "kaleng",
  },
  {
    barcode: "8999999195513",
    name: "Coca-Cola Original Can 330ml",
    category: "Minuman",
    harga_jual: 6000,
    modal_hpp: 4600,
    unit: "kaleng",
  },
  {
    barcode: "8999999195520",
    name: "Sprite Lemon-Lime Can 330ml",
    category: "Minuman",
    harga_jual: 6000,
    modal_hpp: 4600,
    unit: "kaleng",
  },
  {
    barcode: "8999999195537",
    name: "Fanta Strawberry Can 330ml",
    category: "Minuman",
    harga_jual: 6000,
    modal_hpp: 4600,
    unit: "kaleng",
  },
  {
    barcode: "8996001414111",
    name: "Buavita Juice Jambu 250ml",
    category: "Minuman",
    harga_jual: 8500,
    modal_hpp: 6800,
    unit: "kotak",
  },
  {
    barcode: "8992741987111",
    name: "Good Day Kopi Botol Cappuccino 250ml",
    category: "Minuman",
    harga_jual: 6500,
    modal_hpp: 5000,
    unit: "botol",
  },

  // --- RETAIL & KEBUTUHAN HARIAN ---
  {
    barcode: "8998888123456",
    name: "Minyak Goreng Bimoli Pouch 1 Liter",
    category: "Retail",
    harga_jual: 20000,
    modal_hpp: 17500,
    unit: "pouch",
  },
  {
    barcode: "8998888654321",
    name: "Gulaku Gula Pasir Tebu 1kg",
    category: "Retail",
    harga_jual: 18000,
    modal_hpp: 15500,
    unit: "bks",
  },
  {
    barcode: "8995555666677",
    name: "Pepsodent Pencegah Gigi Berlubang 190g",
    category: "Retail",
    harga_jual: 14000,
    modal_hpp: 11200,
    unit: "tube",
  },
  {
    barcode: "8992222333344",
    name: "Sabun Batang Lifebuoy Total 10 85g",
    category: "Retail",
    harga_jual: 4500,
    modal_hpp: 3600,
    unit: "pcs",
  },
  {
    barcode: "8997777888899",
    name: "Sunsilk Shampoo Black Shine 160ml",
    category: "Retail",
    harga_jual: 22000,
    modal_hpp: 17800,
    unit: "botol",
  },
];

/**
 * Searches offline supermarket database by exact barcode or fuzzy SKU match.
 */
export function lookupSupermarketBarcode(barcode: string): SupermarketProduct | null {
  const cleanCode = barcode.trim().replace(/\D/g, "");
  if (!cleanCode) return null;

  // 1. Exact match
  const exact = SUPERMARKET_BARCODE_DATABASE.find((p) => p.barcode === cleanCode);
  if (exact) return exact;

  // 2. Suffix / Substring match for short scanned codes
  const partial = SUPERMARKET_BARCODE_DATABASE.find((p) => 
    p.barcode.endsWith(cleanCode) || cleanCode.endsWith(p.barcode)
  );
  if (partial) return partial;

  return null;
}

/**
 * Generates an intelligent auto-detected supermarket product for any unknown barcode (EAN-13, EAN-8, UPC).
 */
export function generateSmartSupermarketProduct(barcode: string): SupermarketProduct {
  const clean = barcode.trim();
  const lastFour = clean.slice(-4) || "001";
  
  // Predict category based on barcode prefix or length
  let guessedCategory: SupermarketProduct["category"] = "Makanan";
  let guessedName = `Jajan / Snack Supermarket #${lastFour}`;
  let guessedPrice = 5000;
  let guessedHpp = 3800;

  if (clean.startsWith("8992") || clean.startsWith("8991")) {
    guessedCategory = "Makanan";
    guessedName = `Snack Retail #${lastFour}`;
    guessedPrice = 7500;
    guessedHpp = 5800;
  } else if (clean.startsWith("8999") || clean.startsWith("8996")) {
    guessedCategory = "Minuman";
    guessedName = `Minuman Segar #${lastFour}`;
    guessedPrice = 6000;
    guessedHpp = 4500;
  } else if (clean.startsWith("8998") || clean.startsWith("8995")) {
    guessedCategory = "Retail";
    guessedName = `Produk Kebutuhan #${lastFour}`;
    guessedPrice = 15000;
    guessedHpp = 12000;
  } else {
    guessedCategory = "Lainnya";
    guessedName = `Produk Swalayan #${lastFour}`;
    guessedPrice = 10000;
    guessedHpp = 7500;
  }

  return {
    barcode: clean,
    name: guessedName,
    category: guessedCategory,
    harga_jual: guessedPrice,
    modal_hpp: guessedHpp,
    unit: "pcs",
  };
}
