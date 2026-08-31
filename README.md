# POS-OFFLINE-PRO 📱⚡

**Aplikasi Kasir (Point of Sale) Full Offline Pro & Super Cepat**  
Dibuat khusus untuk pengusaha UMKM, Kafe, Resto, Toko Kelontong, dan Retail dengan dukungan penuh **100% Offline (SQLite Lokal murni tanpa internet)**, Bluetooth Thermal Printer ESC/POS 58mm, Sistem Keamanan PIN Supervisor, dan Tampilan UI Modern Dinamis.

---

## 🌟 Fitur Unggulan Dinamis (Sesuai Referensi Pro)

### 1. ⚡ Layar Kasir POS Interaktif & Responsif
- **Mode Timbangan (Volume vs Nominal)**: 
  - Input jumlah desimal/berat (misal `0,5 kg` otomatis menghitung `Rp 25.000`).
  - Input nominal uang belanja (misal `Rp 20.000` otomatis mengonversi ke `0,4 kg`).
- **Pilihan Varian Produk**: Modal popup dinamis untuk produk dengan varian (misal `Nasi Kuning: Ayam Rp 15.000 (Stok 80)` vs `Rendang Rp 18.000 (Stok 50)`).
- **Cari Produk Cepat**: Dialog modal pencarian produk real-time dengan filter instan.
- **Scan Barcode / SKU**: Scanner kamera terintegrasi dengan tombol senter dan input manual.
- **Split Screen / Landscape Layout**: Tampilan split view untuk layar tablet atau landscape dengan ringkasan pesanan di kiri dan panel pembayaran di kanan.

### 2. 💳 Pembayaran & Struk Thermal 58mm
- **Metode Pembayaran**: Tunai (Cash) dengan Keypad Numerik & Quick Nominal (Uang Pas, 100rb, 50rb, 20rb, 10rb, 5rb) serta pembayaran QRIS Statis.
- **Kalkulasi Pajak PPN Dinamis**: PPN 11% otomatis terhitung dan tercetak pada struk.
- **Format Struk 58mm Standar ESC/POS**: 
  - Logo toko, Nama Usaha, Jenis Toko, Alamat, dan No. HP.
  - Nomor Faktur `INV-YYMMDD-XXX` & Tanggal/Waktu transaksi.
  - Rincian item belanja, Subtotal, PPN, Grand Total, Uang Tunai, dan Kembalian.
  - Catatan kaki *"Terima Kasih! Silahkan Datang Kembali"*.

### 3. 📊 Dashboard Finansial & Laporan Lengkap
- **Banner "Mulai Menjual"**: Akses instan ke kasir POS.
- **3 Kartu Ringkasan Cepat**: Total Produk, Total Transaksi, dan Total Item Terjual.
- **Penjualan Hari Ini**: Total Omset, Perbandingan kemarin, Rata-rata/trx, Modal HPP, Laba Hari Ini (dalam warna hijau), dan Margin Profit (%).
- **Grafik Tren 7 Hari**: Bar chart 7 hari (`Sab`, `Min`, `Sen`, `Sel`, `Rab`, `Kam`, `Hr Ini`).
- **2x2 Kartu Kinerja**: 7 Hari, Bulan Ini, Laba 7 Hari, Laba Bulan Ini.
- **Analisis Jam Sibuk (Peak Hours)**: Distribusi kepadatan transaksi per jam operasional.
- **Top 5 Produk Terlaris**: Ranking produk berdasarkan kuantitas dan omset.

### 4. ⚙️ Pengaturan Toko & Fitur Fleksibel
- **Pengaturan Aplikasi (Toggle Dinamis)**:
  - Fitur Nomor Meja (untuk resto/kafe)
  - Fitur Pelanggan (data membership/kontak)
  - Fitur Open Bill (simpan tagihan / piutang)
  - Fitur Scan Barcode
  - Fitur Varian Produk
  - Cetak Struk Otomatis
  - Pajak PPN
- **Atur Toko**: Upload Logo Toko, Foto QRIS, Nama Toko, Jenis Usaha, Alamat, dan WhatsApp.
- **Keamanan PIN Supervisor**: Proteksi 4-digit PIN saat menghapus data master atau memulihkan database.
- **Backup & Restore Database (100% Offline)**: Ekspor & Impor file `.db` langsung ke memori internal perangkat tanpa cloud.

---

## 🛠️ Stack Teknologi

- **Framework**: React Native + Expo SDK 53 + Expo Router (File-based Routing)
- **Styling**: NativeWind (Tailwind CSS v3) + Shadcn UI Design Tokens
- **Database Lokal**: `expo-sqlite` dengan sequential query queue (`runInDbQueue`)
- **State Management**: Zustand (Keranjang Belanja, Varian, Desimal, dan Pajak)
- **Iconography**: Lucide React Native Icons
- **Printer Service**: Raw ESC/POS 58mm Buffer & Bluetooth Thermal Handler

---

## 🚀 Cara Menjalankan Project

### 1. Install Dependencies
```bash
cd pos-offline-pro
npm install
```

### 2. Jalankan Metro Bundler
```bash
npx expo start -c
```
- Tekan `w` untuk membuka di browser Web.
- Tekan `a` untuk membuka di Android Emulator / Device via Expo Go.

### 3. Build APK Preview Offline
```bash
eas build --platform android --profile preview
```

---

## 📂 Struktur Direktori

```
pos-offline-pro/
├── src/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx      # Tab bar navigation dengan tema Cyan Teal (#0097A7)
│   │   │   ├── index.tsx        # Dashboard Finansial, Tren 7 Hari & Kinerja
│   │   │   ├── products.tsx     # Master Katalog Produk, Desimal & Varian
│   │   │   ├── history.tsx      # Riwayat Transaksi & Cetak Ulang Struk 58mm
│   │   │   └── settings.tsx     # Menu Pengaturan, Profil Toko & Feature Toggles
│   │   ├── modal-pos.tsx        # Layar Kasir POS Split Screen & Responsif
│   │   └── _layout.tsx          # Root Layout & SQLite Initializer
│   ├── components/
│   │   ├── pos/
│   │   │   ├── DecimalVolumeModal.tsx      # Modal Volume vs Nominal Timbangan
│   │   │   ├── VariantSelectionModal.tsx  # Modal Pemilihan Varian Produk
│   │   │   ├── ProductSearchModal.tsx     # Modal Pencarian Produk Cepat
│   │   │   ├── BarcodeScannerModal.tsx    # Modal Scan Barcode & Manual Input
│   │   │   └── CheckoutLandscapeModal.tsx # Modal Split Checkout & Keypad
│   │   ├── ProductFormModal.tsx           # Form Tambah/Edit Produk & HPP
│   │   ├── ReceiptModal.tsx               # Preview & Cetak Struk 58mm
│   │   └── PinPromptModal.tsx             # Modal Input PIN Keamanan
│   ├── db/
│   │   ├── index.ts                       # Skema SQLite, Seeding, & Db Queue
│   │   ├── productRepository.ts           # CRUD Produk & Varian
│   │   ├── transactionRepository.ts       # Atomic Checkout & SQLite Queries
│   │   ├── reportRepository.ts            # Agregasi Laba, Jam Sibuk & Top Produk
│   │   └── settingsRepository.ts          # Key-Value Store Konfigurasi
│   ├── stores/
│   │   ├── useCartStore.ts                # Zustand Cart Store
│   │   └── useThemeStore.ts               # Dark/Light Mode Store
│   └── util/
│       ├── databaseSync.ts                # Backup & Restore Database .db
│       ├── printerService.ts              # ESC/POS 58mm Formatter & Service
│       └── formatters.ts                  # Formatter Rupiah & Tanggal
```
