# SmartBank Core System

SmartBank adalah inti sistem ekonomi yang menjadi satu-satunya otoritas (Single Source of Truth) untuk seluruh transaksi keuangan dalam ekosistem. Aplikasi ini mengelola saldo, transfer, pembayaran, pajak/fee, pinjaman, dan pencatatan buku besar (ledger).

## 🌟 Fitur Utama Ekosistem

Ekosistem SmartBank terdiri dari tiga antarmuka utama:

### 1. 🏢 Admin Dashboard (`/admin`)
Pusat kontrol untuk mengelola regulasi dan perputaran uang (Money Supply).
- **Dashboard**: Monitoring Total Supply, Reserve, Uang Beredar (Circulating), dan Fee Terkumpul.
- **Buku Besar (Ledger)**: Pencatatan seluruh transaksi secara real-time dan transparan.
- **Distribusi Dana**: Transfer manual dari Bank Reserve ke institusi atau pengguna.
- **Validasi Pinjaman**: Persetujuan atau penolakan pengajuan pinjaman dari nasabah.
- **Manajemen Pengguna**: Melihat daftar nasabah dan entitas lain (Marketplace, Logistik, dll).

### 2. 👨‍💼 Teller Workspace (`/teller`)
Layanan operasional untuk membantu nasabah secara langsung di cabang bank.
- **Pencarian Nasabah**: Mencari data nasabah berdasarkan ID atau Nomor Rekening.
- **Setor Tunai (Deposit)**: Memasukkan dana fisik ke dalam rekening nasabah.
- **Tarik Tunai (Withdraw)**: Mengeluarkan dana dari rekening nasabah.
- **Transfer Dana**: Membantu nasabah melakukan transfer ke rekening lain.
- **Riwayat Transaksi**: Memantau riwayat aktivitas transaksi teller.

### 3. 📱 Nasabah App (`/nasabah`)
Aplikasi mobile-first untuk nasabah ritel melakukan transaksi sehari-hari.
- **Informasi Saldo**: Melihat saldo utama nasabah.
- **Transfer**: Mengirim dana ke sesama nasabah atau rekening bank lain.
- **Top-up E-Wallet**: Mengisi saldo dompet digital (GoPay, OVO, Dana, LinkAja).
- **Riwayat Transaksi**: Melihat mutasi rekening (uang masuk & keluar).

## 🚀 Teknologi yang Digunakan

- **Frontend**: HTML5, CSS3 (Vanilla / Custom CSS), JavaScript (Vanilla)
- **Desain**: Modern UI dengan efek Glassmorphism, Font Awesome Icons, Chart.js (untuk visualisasi data).
- **Penyimpanan Data (Mock)**: `localStorage` digunakan sebagai simulasi database backend pada Admin Dashboard untuk menyimpan state sistem, transaksi, pinjaman, dan data user.

## 📂 Struktur Direktori

```text
smartbank/
├── admin/         # Antarmuka Admin (Core System & Single Source of Truth)
├── teller/        # Antarmuka Teller Workspace
├── nasabah/       # Antarmuka Aplikasi Nasabah (Mobile UI)
├── README.md      # Informasi Repositori (File ini)
└── DOKUMENTASI.md # Dokumentasi Teknis & Alur Kerja Database
```

## ⚙️ Cara Menjalankan

1. Clone repositori ini ke komputer Anda.
2. Buka folder `admin`, `teller`, atau `nasabah`.
3. Buka file `index.html` menggunakan browser modern (Chrome, Firefox, Edge, atau Safari).
4. *(Opsional)* Sangat disarankan untuk menggunakan ekstensi seperti **Live Server** di VS Code agar aset (seperti ikon dan font) termuat dengan sempurna.

## 📝 Catatan Penting
Sistem pada Admin Dashboard saat ini menggunakan `localStorage` untuk simulasi backend dan aliran data. Untuk mereset seluruh data ke kondisi awal (default), Anda dapat menggunakan tombol **"Reset Database"** pada menu Pengaturan di Admin Dashboard.

---
Silakan lihat file [`DOKUMENTASI.md`](DOKUMENTASI.md) untuk informasi teknis lebih mendalam terkait struktur database simulasi dan alur kerja aplikasi.
