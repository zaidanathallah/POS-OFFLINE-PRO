# Software Requirements Specification (SRS)

## 1. Kebutuhan Sistem (Tech Stack)
- Frontend: Expo (React Native), Tailwind CSS (NativeWind), Zustand.
- Database: Expo SQLite (Pure Local).
- File System: `expo-file-system` dan `expo-document-picker` untuk fitur Export/Import Database.
- Printer Module: Plugin Bluetooth ESC/POS yang mendukung kertas 58mm dan image printing raster (untuk Logo).

## 2. Validasi & Aturan Bisnis
- **Perhitungan HPP & Laba:** Laba Kotor = Total Omset - Total HPP (Modal).
- **Keamanan Penghapusan Data:** Cek state `isPinActive`. Jika `true`, tahan fungsi `DELETE` dan munculkan Modal/Dialog "Masukkan PIN".
- **Backup & Restore:** 
  - Saat Import, aplikasi harus memvalidasi ekstensi file (misal `.db`, `.sql`, atau `.json`) agar tidak terjadi corrupt data.
  - Proses Import akan me-replace (menimpa) database lama di device baru. Berikan dialog konfirmasi/warning sebelum proses import berjalan.
