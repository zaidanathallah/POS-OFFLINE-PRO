# Agentic Instructions (For AI Antigravity IDE)

Gunakan prompt berikut untuk menginstruksikan AI:

## Prompt: Setup Database
`Buatkan setup database lokal murni menggunakan expo-sqlite di folder /db. Buat tabel 'products' (dengan kolom modal_hpp), 'transactions' (total_hpp, laba_kotor), 'transaction_details', dan 'settings'.`

## Prompt: Backup & Restore Service (Export/Import Local DB)
`Buatkan service di util/databaseSync.ts menggunakan 'expo-file-system' dan 'expo-document-picker' untuk fitur Export dan Import Database. 
Untuk Export: Copy file SQLite database yang aktif (bisa diakses via SQLite.defaultDatabaseDirectory) ke folder dokumen user (expo-file-system.StorageAccessFramework) agar bisa disimpan sebagai file lokal (misal backup_pos.db). 
Untuk Import: Gunakan document-picker untuk memilih file backup dari HP, lalu copy dan replace file database SQLite aplikasi yang lama, kemudian re-initialize koneksi database. Tidak ada koneksi internet atau cloud, murni file lokal.`

## Prompt: Layar Laporan
`Buatkan komponen app/(tabs)/reports.tsx dengan Shadcn UI. Buat Card 'Ringkasan' (Omset, Modal, Laba Kotor, Margin) dan Card 'Jam Sibuk' (bar chart).`

## Prompt: Cetak Struk 58mm
`Buatkan service util/printerService.ts untuk printer thermal Bluetooth (kertas 58mm). Cek 'store_logo_uri' dari tabel settings; jika ada, jadikan monochrome bitmap di header (align center). Lebar maksimal 32 karakter.`
