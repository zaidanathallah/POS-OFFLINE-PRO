# POS Offline Pro 📱💼
> **"Satu Aplikasi, Semua Jenis Usaha"** — Aplikasi Point of Sales (POS) Kasir Multi-Platform 100% Offline-First Tanpa Server Luar & Tanpa Biaya Langganan.

[![React Native](https://img.shields.io/badge/React_Native-0.86-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK-57-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![NativeWind](https://img.shields.io/badge/NativeWind-v4_(Tailwind)-38bdf8.svg)](https://www.nativewind.dev/)
[![SQLite](https://img.shields.io/badge/Database-Expo_SQLite_(WAL)-003b57.svg)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![Offline](https://img.shields.io/badge/Architecture-100%25_Offline-emerald.svg)]()

---

## 🚀 Gambaran Umum Produk (Product Overview)

**POS Offline Pro** dirancang khusus untuk memenuhi kebutuhan berbagai sektor UMKM (Retail, F&B/Kafe, Jasa, Grosir) dengan arsitektur **Local-First (Pure Offline)**. Seluruh data transaksi, katalog produk, inventaris stok, dan laporan finansial tersimpan 100% di memori internal perangkat pengguna tanpa ketergantungan pada koneksi internet, server cloud eksternal, atau biaya langganan bulanan.

---

## ✨ Fitur Unggulan (Core Features)

### 1. 📊 Dashboard Finansial & Analisis Penjualan Dinamis
- **Kalkulasi Otomatis**: Rekapitulasi Total Omset, Modal Pokok (HPP), Laba Kotor, dan Margin Keuntungan (%) secara real-time.
- **Filter Waktu Cepat**: Analisis data *Hari Ini*, *7 Hari Terakhir*, dan *30 Hari Terakhir*.
- **🏆 Top 5 Produk Terlaris**: Peringkat produk dengan visualisasi bar penjualan dan kontribusi laba.
- **⏰ Analisis Jam Sibuk (Peak Hours)**: Horizontal bar chart yang memetakan jam operasional terpadat.

### 2. 📦 Master Katalog Produk & Manajemen HPP
- **Live Profit Preview**: Form tambah/edit produk menghitung estimasi Laba Kotor dan Margin (%) secara instan saat mengetik Harga Jual dan Modal HPP.
- **Barcode & SKU Generator**: Dukungan pencarian cepat dan auto-generate kode barcode acak.
- **Filter Kategori & Indikator Stok**: Klasifikasi kategori (*Makanan, Minuman, Retail, Jasa*) serta badge peringatan stok menipis.

### 3. 🛒 Kasir POS & Transaksi Atomik
- **Keranjang Belanja Reaktif (Zustand)**: Validasi otomatis agar kasir tidak dapat menjual barang melebihi stok yang tersedia di SQLite.
- **Transaksi Database Atomik**: Eksekusi `db.withTransactionAsync` untuk pencatatan `transactions`, `transaction_details`, dan pemotongan stok produk secara simultan.
- **Modal Pembayaran Lengkap**: Pilihan Tunai (Cash) & QRIS Offline, tombol nominal cepat (*Uang Pas, 20rb, 50rb, 100rb*), serta kalkulasi kembalian pelanggan.

### 4. 🖨️ Cetak Struk Bluetooth Thermal 58mm (ESC/POS)
- **Format Presisi 32 Karakter**: Tata letak struk kasir standar kertas 58mm.
- **Header Logo Toko**: Konversi logo toko menjadi format monochrome bitmap di posisi tengah (align center).
- **Preview & Cetak Ulang**: Cetak langsung setelah checkout atau cetak ulang transaksi lama dari tab Riwayat.

### 5. 🔒 Keamanan & Proteksi PIN Supervisor
- **Interseptor `useSecureAction`**: Mengunci tindakan sensitif (penghapusan produk, reset/restore database) dengan modal dialog PIN 4-digit.
- **Pengaturan PIN**: Toggle aktivasi proteksi dan fitur ganti PIN supervisor.

### 6. 💾 Backup & Restore Database Lokal (Pure Offline)
- **Backup Data (Export)**: Mengekstrak file SQLite aktif menjadi file `Backup_POS_YYYYMMDD_HHMMSS.db` ke memori HP (Downloads/Documents) atau dapat dikirim via WhatsApp/Bluetooth/Email.
- **Pulihkan Data (Import)**: Memulihkan seluruh data toko di HP baru dengan memilih file `.db` melalui File Picker tanpa perlu internet.

---

## 🛠️ Tech Stack & Arsitektur

- **Framework**: [Expo SDK 57](https://expo.dev/) (React Native 0.86, React 19)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Styling**: [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS) dengan Token HSL Shadcn (Dark/Light mode)
- **Icons**: [Lucide React Native](https://lucide.dev/)
- **Database**: [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (SQLite WAL Mode)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **File System & Sharing**: `expo-file-system`, `expo-document-picker`, `expo-sharing`
- **EAS Build ID**: `cc16a892-d276-49de-ba05-4994b1f89d40`

---

## 📁 Struktur Direktori Project

```
POS-OFFLINE-PRO/
├── pos-offline-pro/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (tabs)/
│   │   │   │   ├── _layout.tsx       # Bottom Tabs Navigation Bar
│   │   │   │   ├── index.tsx         # Dashboard & Analisis Laporan
│   │   │   │   ├── products.tsx      # Katalog Produk & Master Data
│   │   │   │   ├── history.tsx       # Riwayat Struk & Cetak Ulang
│   │   │   │   └── settings.tsx      # Pengaturan Toko, PIN, & Backup/Restore
│   │   │   ├── _layout.tsx           # Root Layout & Theme Provider
│   │   │   └── modal-pos.tsx         # Layar Kasir POS & Checkout
│   │   ├── components/
│   │   │   ├── ui/                   # Shadcn UI Primitives (Button, Card, Badge, Input, Typography)
│   │   │   ├── Header.tsx            # Top Bar (100% Offline Badge & Theme Switcher)
│   │   │   ├── ProductFormModal.tsx  # Form Tambah/Edit Produk + Live Margin
│   │   │   ├── CheckoutModal.tsx     # Modal Pembayaran & Kembalian
│   │   │   ├── ReceiptModal.tsx      # Preview Struk Thermal 58mm & Bluetooth Print
│   │   │   └── PinPromptModal.tsx    # Dialog Input PIN Supervisor
│   │   ├── db/
│   │   │   ├── index.ts              # Inisialisasi SQLite Schema & Seeding
│   │   │   ├── productRepository.ts  # CRUD Master Produk
│   │   │   ├── transactionRepository.ts # Transaksi Atomik & Stock Decrement
│   │   │   ├── reportRepository.ts   # Query Agregasi Omset, HPP, & Jam Sibuk
│   │   │   └── settingsRepository.ts # Key-Value Store Pengaturan
│   │   ├── hooks/
│   │   │   └── useSecureAction.ts    # Interseptor Keamanan PIN
│   │   ├── stores/
│   │   │   ├── useCartStore.ts       # Keranjang Kasir & Validasi Stok
│   │   │   └── useThemeStore.ts      # Switcher Tema Gelap / Terang
│   │   ├── util/
│   │   │   ├── databaseSync.ts       # Export / Import File Database Lokal
│   │   │   ├── printerService.ts     # Driver Struk ESC/POS 58mm
│   │   │   └── formatters.ts         # Formatter Rupiah & Waktu
│   │   └── global.css                # Tailwind Base & Shadcn HSL CSS Variables
│   ├── app.json                      # Expo App Config & EAS Link
│   ├── eas.json                      # EAS Build Profiles (APK & Production)
│   ├── metro.config.js               # Metro Bundler Config
│   ├── tailwind.config.js            # Tailwind Theme Config
│   └── package.json
├── planning.md                       # Task Breakdown & Tracking
├── prd.md                            # Product Requirements Document
├── sdd.md                            # System Design Document
├── srs.md                            # Software Requirements Specification
├── ui_ux_flow.md                     # UI/UX & Flow Specifications
└── agentic.md                        # Panduan Prompt & Arsitektur AI
```

---

## ⚡ Panduan Menjalankan Project

### 1. Prasyarat
- Node.js versi 18+ (Disarankan v20 / v22)
- npm atau yarn
- HP Android/iOS dengan aplikasi **Expo Go** (tersedia di Play Store / App Store)

### 2. Instalasi & Menjalankan Development Server
```bash
# 1. Masuk ke folder project
cd pos-offline-pro

# 2. Install dependensi
npm install

# 3. Jalankan development server
npx expo start -c
```
> Scan QR code yang tampil di terminal menggunakan aplikasi **Expo Go** pada HP Anda.

---

## 📦 Panduan Build Menjadi File APK (Standalone Android)

Project telah terkonfigurasi dengan profil build APK pada `eas.json`.

```bash
# Masuk ke folder project
cd pos-offline-pro

# Jalankan perintah build APK mandiri
eas build --platform android --profile preview
```
Setelah build selesai di cloud EAS, link download file `.apk` akan diberikan di terminal dan siap dipasang di HP Android tanpa perlu Expo Go.

---

## 📋 Catatan Perubahan & Implementasi (Changelog)

### **Phase 1: Setup & UI Shell**
- Menginisialisasi project Expo dengan TypeScript dan Expo Router.
- Setup NativeWind v4 (Tailwind CSS) dengan dukungan Light & Dark Mode.
- Membangun komponen UI Shadcn: `Button`, `Card`, `Badge`, `Input`, `Typography`, `Header`.
- Membuat sistem navigasi 4 Bottom Tabs: Dashboard, Produk, Riwayat, Pengaturan.

### **Phase 2: Database Lokal SQLite & Master Data**
- Skema tabel relasional SQLite: `products`, `transactions`, `transaction_details`, `settings`.
- Inisialisasi otomatis produk starter UMKM saat pertama kali dibuka.
- Repository layer CRUD produk dan pencarian real-time.
- Form modal Tambah/Edit Produk dengan kalkulasi **Live Profit & Margin Preview**.

### **Phase 3: Transaksi Kasir & Bluetooth Printer 58mm**
- State Management Keranjang Kasir (Zustand) dengan validasi batas stok inventaris.
- Layar Kasir POS (`modal-pos.tsx`) dengan grid produk, pencarian barcode, dan drawer keranjang.
- Checkout Modal dengan metode Tunai/QRIS dan tombol nominal cepat (*Uang Pas, 20rb, 50rb, 100rb*).
- Transaksi database atomik SQLite yang otomatis memotong stok produk.
- Engine Cetak Struk ESC/POS 58mm (32 kolom + logo monochrome bitmap).
- Modal Preview Struk thermal dan cetak ulang dari tab Riwayat.

### **Phase 4: Laporan Finansial Dinamis & Keamanan PIN**
- Query agregasi SQLite untuk Omset, Modal (HPP), Laba Kotor, Margin %, dan Top 5 Produk Terlaris.
- Visualisasi horizontal bar chart **Jam Sibuk (Peak Hours)**.
- Interseptor keamanan `useSecureAction` dan `PinPromptModal` untuk proteksi penghapusan data dengan PIN supervisor.
- Pengaturan PIN supervisor pada tab Settings.

### **Phase 5: Backup & Restore File Lokal (Export / Import)**
- Service `databaseSync.ts` untuk mengekstrak file `.db` aktif ke memori internal HP (`Backup_POS_YYYYMMDD_HHMMSS.db`).
- Fitur Pulihkan Data (Import) dari File Manager HP dengan proteksi PIN dan reload database otomatis.
- Konfigurasi build APK standalone melalui EAS CLI (`eas.json`).

---

## 📄 Lisensi
Hak Cipta © 2026 POS Offline Pro. Dikembangkan untuk solusi kasir UMKM offline mandiri.
