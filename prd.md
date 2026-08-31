# Product Requirements Document (PRD) - POS Offline Pro

## 1. Tujuan Produk (Product Objective)
Membangun aplikasi Point of Sales (POS) multi-platform yang 100% offline tanpa biaya langganan. Memudahkan kasir mencatat transaksi dan owner memantau laporan detail secara real-time.

## 2. Target User
- **Kasir:** Membutuhkan antarmuka cepat untuk mencetak struk (kertas 58mm) dan memproses pembayaran.
- **Owner Toko:** Membutuhkan rekapitulasi komprehensif (Omset, Modal/HPP, Laba, Jam Sibuk) dan perlindungan data via PIN.
- **Admin/Supervisor:** Mengelola master produk (termasuk input HPP/Modal per produk) dan pengaturan toko (Upload Logo).

## 3. Problem Statement
Pencatatan manual menyulitkan perhitungan Laba Kotor dan Margin yang akurat. Selain itu, data rentan terhapus tanpa sengaja oleh pegawai, dan brand awareness kurang karena struk kasir polos tanpa logo. UMKM juga membutuhkan cara mudah memindahkan data ke device baru tanpa harus bergantung pada server cloud atau internet.

## 4. Main Features (Fitur Utama)
- **Dashboard & Laporan Detail:** Menampilkan Omset, Total Transaksi, Rata-rata/Hari, Modal (HPP), Laba Kotor, Margin (%), Produk Terlaris, Jam Sibuk, dan Hari Sibuk.
- **Transaksi & POS:** Grid produk, scan barcode, varian produk.
- **Manajemen Produk:** Input Harga Jual dan Modal (HPP) secara spesifik di masing-masing produk.
- **Struk Printer Thermal (58mm):** Dukungan cetak struk Bluetooth ukuran 58mm dengan fitur *Upload Logo Brand* toko masing-masing.
- **Keamanan PIN (Data Protection):** Fitur mengaktifkan PIN pelindung data untuk mencegah penghapusan riwayat secara tidak sengaja.
- **Backup & Restore Lokal (Export/Import):** Export data menjadi file (DB/SQL/JSON) yang tersimpan di memori HP. File ini bisa dikirim via WA/Email dan di-import di device baru untuk memulihkan seluruh data toko tanpa butuh database luar/cloud.

## 5. User Flow (Alur Pengguna Tambahan)
- **Pindah Device / Backup:** Owner masuk ke Pengaturan -> Backup Data -> Aplikasi menghasilkan file backup -> Owner menyimpan file tersebut di HP.
- **Restore di Device Baru:** Install aplikasi di HP baru -> Buka Pengaturan -> Import Data -> Pilih file backup dari HP -> Data produk, riwayat, dan pengaturan otomatis kembali seperti semula.
