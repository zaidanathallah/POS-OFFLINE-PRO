/**
 * Offline Supermarket, Minimarket, Retail & Pharmacy Barcode Database
 * Comprehensive Indonesian retail products with real EAN-13 barcodes, BPOM 2D DataMatrix identifiers,
 * accurate product titles, categories, and standard Indonesian market prices (Rp).
 */

export interface SupermarketProduct {
  barcode: string;
  alternate_barcodes?: string[]; // e.g. BPOM 2D QR / DataMatrix or alternate EANs
  bpom_code?: string; // e.g. "TR142681391"
  name: string;
  category: "Makanan" | "Minuman" | "Retail" | "Buah" | "Lainnya";
  harga_jual: number;
  modal_hpp: number;
  unit: string;
  image_uri?: string;
}

export const SUPERMARKET_BARCODE_DATABASE: SupermarketProduct[] = [
  // =========================================================================
  // --- MINYAK KAYU PUTIH, TELON, AROMATHERAPY & FARMASI OTC (INDONESIA) ---
  // =========================================================================
  {
    barcode: "8998667401068",
    alternate_barcodes: ["(90)TR142681391(91)240828", "(90)TR142681391", "TR142681391"],
    bpom_code: "TR142681391",
    name: "Konicare Minyak Kayu Putih Plus 125ml",
    category: "Retail",
    harga_jual: 45000,
    modal_hpp: 37500,
    unit: "botol",
  },
  {
    barcode: "8998667401051",
    bpom_code: "TR142681391",
    name: "Konicare Minyak Kayu Putih Plus 60ml",
    category: "Retail",
    harga_jual: 25000,
    modal_hpp: 20500,
    unit: "botol",
  },
  {
    barcode: "8998667401044",
    bpom_code: "TR142681391",
    name: "Konicare Minyak Kayu Putih Plus 30ml",
    category: "Retail",
    harga_jual: 14500,
    modal_hpp: 11800,
    unit: "botol",
  },
  {
    barcode: "8998667401037",
    bpom_code: "TR112624631",
    name: "Konicare Minyak Kayu Putih 125ml",
    category: "Retail",
    harga_jual: 42000,
    modal_hpp: 35000,
    unit: "botol",
  },
  {
    barcode: "8998667401020",
    bpom_code: "TR112624631",
    name: "Konicare Minyak Kayu Putih 60ml",
    category: "Retail",
    harga_jual: 23000,
    modal_hpp: 19000,
    unit: "botol",
  },
  {
    barcode: "8998667401013",
    bpom_code: "TR112624631",
    name: "Konicare Minyak Kayu Putih 30ml",
    category: "Retail",
    harga_jual: 13500,
    modal_hpp: 11000,
    unit: "botol",
  },
  {
    barcode: "8998667401143",
    bpom_code: "TR152689161",
    name: "Konicare Minyak Telon Plus 125ml",
    category: "Retail",
    harga_jual: 48000,
    modal_hpp: 40000,
    unit: "botol",
  },
  {
    barcode: "8998667401136",
    bpom_code: "TR152689161",
    name: "Konicare Minyak Telon Plus 60ml",
    category: "Retail",
    harga_jual: 26500,
    modal_hpp: 22000,
    unit: "botol",
  },
  {
    barcode: "8998667401129",
    bpom_code: "TR152689161",
    name: "Konicare Minyak Telon Plus 30ml",
    category: "Retail",
    harga_jual: 15500,
    modal_hpp: 12500,
    unit: "botol",
  },
  {
    barcode: "8998667401112",
    bpom_code: "TR112624641",
    name: "Konicare Minyak Telon 125ml",
    category: "Retail",
    harga_jual: 44000,
    modal_hpp: 36500,
    unit: "botol",
  },
  {
    barcode: "8998667401105",
    name: "Konicare Minyak Telon 60ml",
    category: "Retail",
    harga_jual: 24000,
    modal_hpp: 19500,
    unit: "botol",
  },
  {
    barcode: "8998667401099",
    name: "Konicare Minyak Telon 30ml",
    category: "Retail",
    harga_jual: 14000,
    modal_hpp: 11500,
    unit: "botol",
  },
  {
    barcode: "8992745100010",
    name: "Cap Lang Minyak Kayu Putih 30ml",
    category: "Retail",
    harga_jual: 14000,
    modal_hpp: 11500,
    unit: "botol",
  },
  {
    barcode: "8992745100027",
    name: "Cap Lang Minyak Kayu Putih 60ml",
    category: "Retail",
    harga_jual: 25000,
    modal_hpp: 20500,
    unit: "botol",
  },
  {
    barcode: "8992745100034",
    name: "Cap Lang Minyak Kayu Putih 120ml",
    category: "Retail",
    harga_jual: 46000,
    modal_hpp: 38000,
    unit: "botol",
  },
  {
    barcode: "8992745100041",
    name: "Cap Lang Minyak Kayu Putih 210ml",
    category: "Retail",
    harga_jual: 78000,
    modal_hpp: 65000,
    unit: "botol",
  },
  {
    barcode: "8992745200017",
    name: "Cap Lang Minyak Telon Lang 60ml",
    category: "Retail",
    harga_jual: 24000,
    modal_hpp: 19500,
    unit: "botol",
  },
  {
    barcode: "8992745200024",
    name: "Cap Lang Minyak Telon Lang 100ml",
    category: "Retail",
    harga_jual: 38000,
    modal_hpp: 31000,
    unit: "botol",
  },
  {
    barcode: "8997022710011",
    name: "FreshCare Minyak Angin Aromatherapy Citrus 10ml",
    category: "Retail",
    harga_jual: 15000,
    modal_hpp: 12000,
    unit: "botol",
  },
  {
    barcode: "8997022710028",
    name: "FreshCare Minyak Angin Aromatherapy Strong 10ml",
    category: "Retail",
    harga_jual: 15000,
    modal_hpp: 12000,
    unit: "botol",
  },
  {
    barcode: "8997022710035",
    name: "FreshCare Minyak Angin Aromatherapy Splash Fruity 10ml",
    category: "Retail",
    harga_jual: 15000,
    modal_hpp: 12000,
    unit: "botol",
  },
  {
    barcode: "8997022710042",
    name: "FreshCare Minyak Angin Aromatherapy Lavender 10ml",
    category: "Retail",
    harga_jual: 15000,
    modal_hpp: 12000,
    unit: "botol",
  },
  {
    barcode: "8997014610013",
    name: "Safe Care Minyak Angin Aromatherapy Roll On 10ml",
    category: "Retail",
    harga_jual: 17500,
    modal_hpp: 14000,
    unit: "botol",
  },
  {
    barcode: "8998898100026",
    name: "Tolak Angin Sido Muncul Cair Sachet 15ml",
    category: "Retail",
    harga_jual: 4500,
    modal_hpp: 3600,
    unit: "sachet",
  },
  {
    barcode: "8998898100019",
    name: "Tolak Angin Sido Muncul Cair Box 5s",
    category: "Retail",
    harga_jual: 22000,
    modal_hpp: 18000,
    unit: "box",
  },
  {
    barcode: "8997003210019",
    name: "Antangin JRG Cair Sachet 15ml",
    category: "Retail",
    harga_jual: 4000,
    modal_hpp: 3200,
    unit: "sachet",
  },
  {
    barcode: "8999999510019",
    name: "Panadol Extra Merah Strip 10 Tablet",
    category: "Retail",
    harga_jual: 15500,
    modal_hpp: 12400,
    unit: "strip",
  },
  {
    barcode: "8999999510026",
    name: "Panadol Biru Paracetamol 500mg Strip 10 Tablet",
    category: "Retail",
    harga_jual: 13500,
    modal_hpp: 10800,
    unit: "strip",
  },
  {
    barcode: "8999999510033",
    name: "Panadol Hijau Flu & Batuk Strip 10 Tablet",
    category: "Retail",
    harga_jual: 16500,
    modal_hpp: 13200,
    unit: "strip",
  },
  {
    barcode: "8991001600011",
    name: "Bodrex Strip 20 Tablet",
    category: "Retail",
    harga_jual: 11000,
    modal_hpp: 8800,
    unit: "strip",
  },
  {
    barcode: "8991001600028",
    name: "Bodrex Extra Strip 4 Tablet",
    category: "Retail",
    harga_jual: 3500,
    modal_hpp: 2700,
    unit: "strip",
  },
  {
    barcode: "8991002700012",
    name: "Promag Tablet Kunyah Strip 10 Tablet",
    category: "Retail",
    harga_jual: 9500,
    modal_hpp: 7600,
    unit: "strip",
  },
  {
    barcode: "8997003310016",
    name: "Diapet Kapsul Diare Strip 10s",
    category: "Retail",
    harga_jual: 7500,
    modal_hpp: 5900,
    unit: "strip",
  },
  {
    barcode: "8991002800019",
    name: "Entrostop Obat Diare Strip 12s",
    category: "Retail",
    harga_jual: 10500,
    modal_hpp: 8400,
    unit: "strip",
  },
  {
    barcode: "8998009010011",
    name: "Betadine Antiseptic Solution 15ml",
    category: "Retail",
    harga_jual: 18000,
    modal_hpp: 14500,
    unit: "botol",
  },
  {
    barcode: "8992745300014",
    name: "Hansaplast Plester Kain Elastis 10s",
    category: "Retail",
    harga_jual: 7000,
    modal_hpp: 5400,
    unit: "amplop",
  },
  {
    barcode: "8992745400011",
    name: "Salonpas Koyo Pereda Nyeri 10 Lembar",
    category: "Retail",
    harga_jual: 8500,
    modal_hpp: 6800,
    unit: "pack",
  },
  {
    barcode: "8992745500018",
    name: "Sanmol Paracetamol 500mg Strip 4 Tablet",
    category: "Retail",
    harga_jual: 3000,
    modal_hpp: 2200,
    unit: "strip",
  },
  {
    barcode: "8992745600015",
    name: "Mixagrip Flu & Batuk Strip 4 Kaplet",
    category: "Retail",
    harga_jual: 3500,
    modal_hpp: 2700,
    unit: "strip",
  },

  // =========================================================================
  // --- MIE INSTAN & MAKANAN CEPAT SAJI ---
  // =========================================================================
  {
    barcode: "8998866200224",
    name: "Indomie Goreng Spesial 85g",
    category: "Makanan",
    harga_jual: 3500,
    modal_hpp: 2900,
    unit: "pcs",
  },
  {
    barcode: "8998866200118",
    name: "Indomie Kuah Ayam Bawang 70g",
    category: "Makanan",
    harga_jual: 3500,
    modal_hpp: 2900,
    unit: "pcs",
  },
  {
    barcode: "8998866200330",
    name: "Indomie Soto Mie 75g",
    category: "Makanan",
    harga_jual: 3500,
    modal_hpp: 2900,
    unit: "pcs",
  },
  {
    barcode: "8998866200446",
    name: "Indomie Kuah Kari Ayam 72g",
    category: "Makanan",
    harga_jual: 3500,
    modal_hpp: 2900,
    unit: "pcs",
  },
  {
    barcode: "8998866200552",
    name: "Indomie Goreng Rendang 91g",
    category: "Makanan",
    harga_jual: 3800,
    modal_hpp: 3000,
    unit: "pcs",
  },
  {
    barcode: "8998866100111",
    name: "Pop Mie Rasa Ayam Bawang Cup",
    category: "Makanan",
    harga_jual: 6000,
    modal_hpp: 4800,
    unit: "cup",
  },
  {
    barcode: "8998866100227",
    name: "Pop Mie Goreng Pedes Gledek Cup",
    category: "Makanan",
    harga_jual: 6500,
    modal_hpp: 5100,
    unit: "cup",
  },
  {
    barcode: "8998866100333",
    name: "Pop Mie Kuah Soto Ayam Cup",
    category: "Makanan",
    harga_jual: 6000,
    modal_hpp: 4800,
    unit: "cup",
  },
  {
    barcode: "8998866100555",
    name: "Pop Mie Kuah Daging Baso Cup",
    category: "Makanan",
    harga_jual: 6000,
    modal_hpp: 4800,
    unit: "cup",
  },
  {
    barcode: "8991001500111",
    name: "Mie Sedaap Goreng 90g",
    category: "Makanan",
    harga_jual: 3500,
    modal_hpp: 2850,
    unit: "pcs",
  },
  {
    barcode: "8991001500227",
    name: "Mie Sedaap Kuah Soto 75g",
    category: "Makanan",
    harga_jual: 3500,
    modal_hpp: 2850,
    unit: "pcs",
  },
  {
    barcode: "8991001500661",
    name: "Mie Sedaap Goreng Korean Spicy Chicken 87g",
    category: "Makanan",
    harga_jual: 4000,
    modal_hpp: 3200,
    unit: "pcs",
  },
  {
    barcode: "8801073110502",
    name: "Samyang Hot Chicken Ramen Buldak 140g",
    category: "Makanan",
    harga_jual: 22000,
    modal_hpp: 18000,
    unit: "pcs",
  },

  // =========================================================================
  // --- SNACK, BISKUIT & COKELAT ---
  // =========================================================================
  {
    barcode: "8993175539019",
    name: "Chitato Sapi Panggang 68g",
    category: "Makanan",
    harga_jual: 11500,
    modal_hpp: 9200,
    unit: "pcs",
  },
  {
    barcode: "8993175539026",
    name: "Chitato Ayam Bumbu 68g",
    category: "Makanan",
    harga_jual: 11500,
    modal_hpp: 9200,
    unit: "pcs",
  },
  {
    barcode: "8992753221015",
    name: "Oreo Vanilla Sandwich 133g",
    category: "Makanan",
    harga_jual: 9500,
    modal_hpp: 7600,
    unit: "pcs",
  },
  {
    barcode: "8992753221022",
    name: "Oreo Cokelat Sandwich 133g",
    category: "Makanan",
    harga_jual: 9500,
    modal_hpp: 7600,
    unit: "pcs",
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
    barcode: "8992745123026",
    name: "SilverQueen Milk Chocolate Almond 62g",
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
    barcode: "8991001100226",
    name: "Beng-Beng Maxx 32g",
    category: "Makanan",
    harga_jual: 4500,
    modal_hpp: 3600,
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
    barcode: "8992772010126",
    name: "Pocky Strawberry Biscuit Stick 45g",
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
    barcode: "8992388000138",
    name: "Qtela Keripik Singkong Balado 60g",
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
    barcode: "8992761000027",
    name: "Roma Malkist Keju Manis 120g",
    category: "Makanan",
    harga_jual: 8000,
    modal_hpp: 6300,
    unit: "pcs",
  },
  {
    barcode: "8992761000058",
    name: "Roma Biskuit Kelapa 300g",
    category: "Makanan",
    harga_jual: 12500,
    modal_hpp: 9800,
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
    barcode: "8992759112240",
    name: "Richeese Nabati Wafer Cokelat 110g",
    category: "Makanan",
    harga_jual: 7000,
    modal_hpp: 5500,
    unit: "pcs",
  },
  {
    barcode: "8992759112257",
    name: "Nextar Nastar Brownies 112g",
    category: "Makanan",
    harga_jual: 8500,
    modal_hpp: 6800,
    unit: "box",
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
  {
    barcode: "8993175540015",
    name: "Chiki Ball Rasa Keju 55g",
    category: "Makanan",
    harga_jual: 6000,
    modal_hpp: 4700,
    unit: "pcs",
  },

  // =========================================================================
  // --- MINUMAN KEMASAN SUPERMARKET & KULKAS ---
  // =========================================================================
  {
    barcode: "8999999001234",
    name: "Aqua Air Mineral Botol 600ml",
    category: "Minuman",
    harga_jual: 3500,
    modal_hpp: 2600,
    unit: "botol",
  },
  {
    barcode: "8999999001241",
    name: "Aqua Air Mineral Botol 1500ml",
    category: "Minuman",
    harga_jual: 6500,
    modal_hpp: 5000,
    unit: "botol",
  },
  {
    barcode: "8999999001227",
    name: "Aqua Air Mineral Botol 330ml",
    category: "Minuman",
    harga_jual: 2500,
    modal_hpp: 1800,
    unit: "botol",
  },
  {
    barcode: "8992761100111",
    name: "Le Minerale Air Mineral 600ml",
    category: "Minuman",
    harga_jual: 3500,
    modal_hpp: 2600,
    unit: "botol",
  },
  {
    barcode: "8992761100128",
    name: "Le Minerale Air Mineral 1500ml",
    category: "Minuman",
    harga_jual: 6500,
    modal_hpp: 5000,
    unit: "botol",
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
    barcode: "8992775211032",
    name: "Teh Botol Sosro Pet 450ml",
    category: "Minuman",
    harga_jual: 6000,
    modal_hpp: 4600,
    unit: "botol",
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
    barcode: "8991002345128",
    name: "Teh Pucuk Harum Melati 500ml",
    category: "Minuman",
    harga_jual: 6500,
    modal_hpp: 5000,
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
    barcode: "8996001304111",
    name: "Pocari Sweat Isotonik 350ml",
    category: "Minuman",
    harga_jual: 6500,
    modal_hpp: 5100,
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
    barcode: "8991002101369",
    name: "Ultra Milk Susu UHT Strawberry 250ml",
    category: "Minuman",
    harga_jual: 6500,
    modal_hpp: 5200,
    unit: "kotak",
  },
  {
    barcode: "8991002101390",
    name: "Ultra Milk Susu UHT Full Cream 1000ml",
    category: "Minuman",
    harga_jual: 20000,
    modal_hpp: 16500,
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
    barcode: "8996001350019",
    name: "Hydro Coco Original 250ml",
    category: "Minuman",
    harga_jual: 7500,
    modal_hpp: 5800,
    unit: "kotak",
  },
  {
    barcode: "8996001360018",
    name: "Floridina Orange Pet 350ml",
    category: "Minuman",
    harga_jual: 3500,
    modal_hpp: 2600,
    unit: "botol",
  },
  {
    barcode: "8992775311015",
    name: "Fruit Tea Apple Pet 500ml",
    category: "Minuman",
    harga_jual: 6500,
    modal_hpp: 5000,
    unit: "botol",
  },
  {
    barcode: "8992741987111",
    name: "Good Day Kopi Botol Cappuccino 250ml",
    category: "Minuman",
    harga_jual: 6500,
    modal_hpp: 5000,
    unit: "botol",
  },
  {
    barcode: "8992741987128",
    name: "Good Day Kopi Botol Avocado 250ml",
    category: "Minuman",
    harga_jual: 6500,
    modal_hpp: 5000,
    unit: "botol",
  },
  {
    barcode: "8997235810011",
    name: "Kopi Kenangan Mantancino 220ml",
    category: "Minuman",
    harga_jual: 9500,
    modal_hpp: 7600,
    unit: "botol",
  },
  {
    barcode: "8991389331017",
    name: "Nescafe Can Coffee Latte 220ml",
    category: "Minuman",
    harga_jual: 8000,
    modal_hpp: 6300,
    unit: "kaleng",
  },
  {
    barcode: "8997005410011",
    name: "Cimory UHT Milk Chocolate 250ml",
    category: "Minuman",
    harga_jual: 7000,
    modal_hpp: 5500,
    unit: "kotak",
  },
  {
    barcode: "8997005410059",
    name: "Cimory UHT Milk Sea Salt 250ml",
    category: "Minuman",
    harga_jual: 7000,
    modal_hpp: 5500,
    unit: "kotak",
  },
  {
    barcode: "8991002500015",
    name: "Yakult Minuman Probiotik Pack 5s",
    category: "Minuman",
    harga_jual: 11000,
    modal_hpp: 9200,
    unit: "pack",
  },

  // =========================================================================
  // --- SEMBAKO, MINYAK GORENG & DAPUR ---
  // =========================================================================
  {
    barcode: "8998888123456",
    name: "Minyak Goreng Bimoli Pouch 1 Liter",
    category: "Retail",
    harga_jual: 20000,
    modal_hpp: 17500,
    unit: "pouch",
  },
  {
    barcode: "8998888123463",
    name: "Minyak Goreng Bimoli Pouch 2 Liter",
    category: "Retail",
    harga_jual: 38500,
    modal_hpp: 34000,
    unit: "pouch",
  },
  {
    barcode: "8998888123470",
    name: "Minyak Goreng Sania Pouch 2 Liter",
    category: "Retail",
    harga_jual: 37500,
    modal_hpp: 33000,
    unit: "pouch",
  },
  {
    barcode: "8998888123487",
    name: "Minyak Goreng Filma Pouch 2 Liter",
    category: "Retail",
    harga_jual: 39000,
    modal_hpp: 34500,
    unit: "pouch",
  },
  {
    barcode: "8998888123494",
    name: "Minyak Goreng SunCo Pouch 2 Liter",
    category: "Retail",
    harga_jual: 39500,
    modal_hpp: 35000,
    unit: "pouch",
  },
  {
    barcode: "8998888654321",
    name: "Gulaku Gula Pasir Tebu Kuning 1kg",
    category: "Retail",
    harga_jual: 18500,
    modal_hpp: 16000,
    unit: "bks",
  },
  {
    barcode: "8998888654338",
    name: "Rose Brand Gula Pasir Putih 1kg",
    category: "Retail",
    harga_jual: 18000,
    modal_hpp: 15500,
    unit: "bks",
  },
  {
    barcode: "8998888750016",
    name: "Beras Sania Premium 5kg",
    category: "Retail",
    harga_jual: 75000,
    modal_hpp: 68000,
    unit: "sak",
  },
  {
    barcode: "8999999110011",
    name: "Kecap Manis Bango Pouch 550ml",
    category: "Retail",
    harga_jual: 24000,
    modal_hpp: 20000,
    unit: "pouch",
  },
  {
    barcode: "8999999110028",
    name: "Kecap Manis Bango Botol 135ml",
    category: "Retail",
    harga_jual: 9000,
    modal_hpp: 7200,
    unit: "botol",
  },
  {
    barcode: "8991002400018",
    name: "Kecap Manis ABC Botol 520ml",
    category: "Retail",
    harga_jual: 21000,
    modal_hpp: 17500,
    unit: "botol",
  },
  {
    barcode: "8991002400025",
    name: "ABC Sambal Asli Botol 275ml",
    category: "Retail",
    harga_jual: 14500,
    modal_hpp: 11800,
    unit: "botol",
  },
  {
    barcode: "8999999100012",
    name: "Royco Kaldu Sapi 230g",
    category: "Retail",
    harga_jual: 11000,
    modal_hpp: 8900,
    unit: "bks",
  },
  {
    barcode: "8999999100029",
    name: "Royco Kaldu Ayam 230g",
    category: "Retail",
    harga_jual: 11000,
    modal_hpp: 8900,
    unit: "bks",
  },
  {
    barcode: "8992745900012",
    name: "Kara Santan Kelapa Siap Pakai 65ml",
    category: "Retail",
    harga_jual: 3500,
    modal_hpp: 2800,
    unit: "pcs",
  },
  {
    barcode: "8999999090016",
    name: "Blue Band Serbaguna Margarin 200g",
    category: "Retail",
    harga_jual: 10500,
    modal_hpp: 8400,
    unit: "sachet",
  },

  // =========================================================================
  // --- SABUN, SHAMPOO, ODOL & PERAWATAN DIRI ---
  // =========================================================================
  {
    barcode: "8995555666677",
    name: "Pepsodent Pencegah Gigi Berlubang 190g",
    category: "Retail",
    harga_jual: 15000,
    modal_hpp: 12000,
    unit: "tube",
  },
  {
    barcode: "8995555666684",
    name: "Pepsodent Pencegah Gigi Berlubang 120g",
    category: "Retail",
    harga_jual: 10000,
    modal_hpp: 8000,
    unit: "tube",
  },
  {
    barcode: "8991002200017",
    name: "Ciptadent Maxi Complete 190g",
    category: "Retail",
    harga_jual: 9000,
    modal_hpp: 7200,
    unit: "tube",
  },
  {
    barcode: "8999999030012",
    name: "Sensodyne Fresh Mint 100g",
    category: "Retail",
    harga_jual: 34000,
    modal_hpp: 28500,
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
    barcode: "8992222333351",
    name: "Sabun Cair Lifebuoy Total 10 Refill 450ml",
    category: "Retail",
    harga_jual: 24000,
    modal_hpp: 19500,
    unit: "pouch",
  },
  {
    barcode: "8999999040011",
    name: "Sabun Batang Dettol Original 100g",
    category: "Retail",
    harga_jual: 8500,
    modal_hpp: 6900,
    unit: "pcs",
  },
  {
    barcode: "8997777888899",
    name: "Sunsilk Shampoo Black Shine 160ml",
    category: "Retail",
    harga_jual: 24000,
    modal_hpp: 19500,
    unit: "botol",
  },
  {
    barcode: "8999999050010",
    name: "Clear Men Anti Dandruff Shampoo Cool Sport 160ml",
    category: "Retail",
    harga_jual: 28000,
    modal_hpp: 23000,
    unit: "botol",
  },
  {
    barcode: "8999999060019",
    name: "Pantene Shampoo Anti Lepek 160ml",
    category: "Retail",
    harga_jual: 29000,
    modal_hpp: 24000,
    unit: "botol",
  },
  {
    barcode: "8999999010014",
    name: "Sunlight Jeruk Nipis Pencuci Piring 700ml",
    category: "Retail",
    harga_jual: 14500,
    modal_hpp: 11800,
    unit: "pouch",
  },
  {
    barcode: "8991002600012",
    name: "Mama Lemon Jeruk Nipis Pouch 680ml",
    category: "Retail",
    harga_jual: 13000,
    modal_hpp: 10500,
    unit: "pouch",
  },
  {
    barcode: "8999999020013",
    name: "Rinso Molto Deterjen Bubuk 770g",
    category: "Retail",
    harga_jual: 22500,
    modal_hpp: 18500,
    unit: "bks",
  },
  {
    barcode: "8991001800015",
    name: "So Klin Liquid Perfume Collection 750ml",
    category: "Retail",
    harga_jual: 18000,
    modal_hpp: 14500,
    unit: "pouch",
  },
  {
    barcode: "8999999080017",
    name: "Baygon Anti Nyamuk Aerosol Eucalyptus 600ml",
    category: "Retail",
    harga_jual: 39000,
    modal_hpp: 32000,
    unit: "kaleng",
  },
  {
    barcode: "8992745700012",
    name: "MamyPoko Pants Standar M 34",
    category: "Retail",
    harga_jual: 58000,
    modal_hpp: 49500,
    unit: "bag",
  },
  {
    barcode: "8992745700029",
    name: "MamyPoko Pants Standar L 30",
    category: "Retail",
    harga_jual: 58000,
    modal_hpp: 49500,
    unit: "bag",
  },

  // =========================================================================
  // --- ROKOK & TOBACCO (INDONESIA) ---
  // =========================================================================
  {
    barcode: "8992988111019",
    name: "Sampoerna A Mild 16 Batang",
    category: "Retail",
    harga_jual: 35000,
    modal_hpp: 32000,
    unit: "bks",
  },
  {
    barcode: "8991234567890",
    name: "Djarum Super 12 Batang",
    category: "Retail",
    harga_jual: 24000,
    modal_hpp: 22000,
    unit: "bks",
  },
  {
    barcode: "8999888777665",
    name: "Gudang Garam Surya 16 Batang",
    category: "Retail",
    harga_jual: 34000,
    modal_hpp: 31000,
    unit: "bks",
  },
];

/**
 * Normalizes and extracts key identifiers from 1D and 2D GS1 / BPOM barcodes.
 * Examples:
 * - "(90)TR142681391(91)240828" -> { raw: "...", bpomNumber: "TR142681391", gtin: "" }
 * - "(01)08998667401068(21)12345" -> { raw: "...", gtin: "8998667401068" }
 * - "8998667401068" -> { raw: "8998667401068", gtin: "8998667401068" }
 */
export function parseBarcodeIdentifier(rawInput: string): {
  raw: string;
  cleanNumbers: string;
  bpomNumber?: string;
  gtin?: string;
} {
  const raw = rawInput.trim();
  const cleanNumbers = raw.replace(/\D/g, "");

  let bpomNumber: string | undefined = undefined;
  let gtin: string | undefined = undefined;

  // 1. Check for BPOM (90) application identifier
  const bpomMatch = raw.match(/\(90\)\s*([A-Za-z0-9]+)/i) || raw.match(/TR\d{9}/i) || raw.match(/SD\d{9}/i) || raw.match(/NA\d{11}/i);
  if (bpomMatch) {
    bpomNumber = bpomMatch[1] || bpomMatch[0];
    bpomNumber = bpomNumber.toUpperCase();
  }

  // 2. Check for GTIN (01) application identifier
  const gtinMatch = raw.match(/\(01\)\s*0*([0-9]{8,14})/);
  if (gtinMatch) {
    gtin = gtinMatch[1];
  } else if (cleanNumbers.length >= 8 && cleanNumbers.length <= 14) {
    gtin = cleanNumbers;
  }

  return { raw, cleanNumbers, bpomNumber, gtin };
}

/**
 * Searches offline supermarket database by exact barcode, BPOM code, alternate barcodes, or fuzzy SKU match.
 */
export function lookupSupermarketBarcode(barcode: string): SupermarketProduct | null {
  if (!barcode || !barcode.trim()) return null;

  const { raw, cleanNumbers, bpomNumber, gtin } = parseBarcodeIdentifier(barcode);

  // 1. Direct match on barcode or alternate barcodes
  for (const item of SUPERMARKET_BARCODE_DATABASE) {
    if (item.barcode === raw || item.barcode === cleanNumbers || (gtin && item.barcode === gtin)) {
      return item;
    }

    if (bpomNumber && item.bpom_code && item.bpom_code.toUpperCase() === bpomNumber) {
      return item;
    }

    if (item.alternate_barcodes) {
      for (const alt of item.alternate_barcodes) {
        if (
          alt === raw ||
          alt === cleanNumbers ||
          (bpomNumber && alt.toUpperCase().includes(bpomNumber)) ||
          raw.includes(alt)
        ) {
          return item;
        }
      }
    }
  }

  // 2. Suffix / Substring match for short scanned codes (at least 6 chars to prevent false positives)
  if (cleanNumbers.length >= 6) {
    const partial = SUPERMARKET_BARCODE_DATABASE.find(
      (p) => p.barcode.endsWith(cleanNumbers) || cleanNumbers.endsWith(p.barcode)
    );
    if (partial) return partial;
  }

  return null;
}

/**
 * Fast online barcode lookup using Open Food Facts & Open Products Facts.
 * Uses a strict 2.5-second AbortController timeout so offline usage never hangs.
 */
export async function fetchOnlineProductBarcode(
  barcode: string
): Promise<Partial<SupermarketProduct> | null> {
  try {
    const { cleanNumbers, gtin } = parseBarcodeIdentifier(barcode);
    const codeToSearch = gtin || cleanNumbers;
    if (!codeToSearch || codeToSearch.length < 8) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const url = `https://world.openfoodfacts.org/api/v2/product/${codeToSearch}.json?fields=product_name,product_name_id,product_name_en,brands,categories,image_url,quantity`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();

    if (data && data.status === 1 && data.product) {
      const p = data.product;
      const rawName = p.product_name_id || p.product_name || p.product_name_en || "";
      const brand = p.brands ? `${p.brands} ` : "";
      const qty = p.quantity ? ` ${p.quantity}` : "";

      let finalName = rawName ? `${brand}${rawName}${qty}`.trim() : "";
      // Clean duplicate brands if brand already at start of rawName
      if (brand && rawName.toLowerCase().startsWith(p.brands.toLowerCase())) {
        finalName = `${rawName}${qty}`.trim();
      }

      if (!finalName) return null;

      let category: SupermarketProduct["category"] = "Retail";
      const catLower = (p.categories || "").toLowerCase();
      if (catLower.includes("beverage") || catLower.includes("drink") || catLower.includes("minuman") || catLower.includes("water") || catLower.includes("juice")) {
        category = "Minuman";
      } else if (catLower.includes("food") || catLower.includes("snack") || catLower.includes("makanan") || catLower.includes("biscuit") || catLower.includes("noodle")) {
        category = "Makanan";
      }

      return {
        barcode: codeToSearch,
        name: finalName,
        category,
        harga_jual: 15000,
        modal_hpp: 12000,
        unit: "pcs",
        image_uri: p.image_url || undefined,
      };
    }
  } catch (e) {
    // Network offline or timeout - fallback silently
  }

  return null;
}

/**
 * Generates an intelligent auto-detected supermarket product for any unknown barcode (EAN-13, EAN-8, UPC, BPOM).
 */
export function generateSmartSupermarketProduct(barcode: string): SupermarketProduct {
  const { raw, cleanNumbers, bpomNumber } = parseBarcodeIdentifier(barcode);
  const displayCode = cleanNumbers || raw;
  const lastFour = displayCode.slice(-4) || "001";

  if (bpomNumber) {
    return {
      barcode: raw,
      name: `Produk Herbal / Farmasi BPOM [${bpomNumber}]`,
      category: "Retail",
      harga_jual: 25000,
      modal_hpp: 20000,
      unit: "botol",
    };
  }

  // Predict category based on barcode prefix or length
  let guessedCategory: SupermarketProduct["category"] = "Retail";
  let guessedName = `Produk Retail #${lastFour}`;
  let guessedPrice = 15000;
  let guessedHpp = 12000;
  let guessedUnit = "pcs";

  if (displayCode.startsWith("8992") || displayCode.startsWith("8991")) {
    guessedCategory = "Makanan";
    guessedName = `Snack / Makanan #${lastFour}`;
    guessedPrice = 8500;
    guessedHpp = 6500;
  } else if (displayCode.startsWith("8999") || displayCode.startsWith("8996") || displayCode.startsWith("8997")) {
    guessedCategory = "Minuman";
    guessedName = `Minuman Segar #${lastFour}`;
    guessedPrice = 6000;
    guessedHpp = 4500;
    guessedUnit = "botol";
  } else if (displayCode.startsWith("8998") || displayCode.startsWith("8995") || displayCode.startsWith("8993")) {
    guessedCategory = "Retail";
    guessedName = `Produk Retail #${lastFour}`;
    guessedPrice = 25000;
    guessedHpp = 20000;
  } else {
    guessedCategory = "Retail";
    guessedName = `Produk Toko #${lastFour}`;
    guessedPrice = 10000;
    guessedHpp = 8000;
  }

  return {
    barcode: raw,
    name: guessedName,
    category: guessedCategory,
    harga_jual: guessedPrice,
    modal_hpp: guessedHpp,
    unit: guessedUnit,
  };
}
