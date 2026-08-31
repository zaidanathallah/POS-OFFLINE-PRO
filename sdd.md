# System Design Document (SDD)

## 1. Arsitektur Database (SQLite Schema Updates)
Aplikasi menggunakan murni **Local-First (Offline-First)** tanpa server eksternal:

- **`products`**: `id`, `name`, `harga_jual`, `modal_hpp`, `stock`, `barcode`, `image_uri`.
- **`settings`**: `key`, `value` (Simpan logo URI, PIN, dan status keamanan).
- **`transactions`**: `id`, `omset`, `total_hpp`, `laba_kotor`, `created_at`.
- **`transaction_details`**: `id`, `transaction_id`, `product_id`, `qty`, `subtotal`.

## 2. API & Service Layer Internal
- **`PrintService`**: Fungsi cetak thermal 58mm (Logo -> Header -> Item -> Total).
- **`ReportService`**: Query aggregasi SQLite untuk menghitung `Jam Sibuk` dan `Hari Sibuk`.

## 3. Strategi Backup & Restore (Export / Import File)
Karena tidak menggunakan database luar (MySQL idwebhost dihapus dari arsitektur), sistem backup 100% mengandalkan pemindahan file lokal:
- **Export (Backup):** Menggunakan `expo-file-system` untuk menyalin file `SQLite (.db)` dari internal app storage ke directory yang bisa diakses user (seperti folder *Documents* atau *Downloads* di HP).
- **Import (Restore):** Menggunakan `expo-document-picker` untuk memilih file backup dari HP. File yang dipilih akan disalin dan menimpa (overwrite) file database SQLite aplikasi yang sedang berjalan. Setelah di-replace, aplikasi akan me-reload koneksi database.
