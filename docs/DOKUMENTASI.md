# Dokumentasi Teknis SmartBank

Dokumen ini menjelaskan struktur data, alur kerja, dan konsep arsitektur dari purwarupa aplikasi SmartBank.

## 1. Konsep Single Source of Truth
SmartBank berfungsi sebagai **Single Source of Truth** untuk seluruh ekosistem ekonomi. Artinya:
- Semua mutasi saldo, pembayaran antar aplikasi (contoh: Marketplace, Logistik), dan pencatatan riwayat transaksi **harus** melalui sistem SmartBank.
- Tidak ada aplikasi lain yang boleh mengubah saldo secara mandiri.
- SmartBank mengontrol *Total Supply* (Total Uang) yang dibagi menjadi *Reserve* (Cadangan Bank), *Circulating* (Uang Beredar), dan *Fee* (Pajak/Biaya yang dikumpulkan).

## 2. Struktur Database (Simulasi `localStorage`)

Karena aplikasi ini masih dalam tahap purwarupa frontend, backend dan database disimulasikan menggunakan `localStorage` browser. Data diinisialisasi otomatis saat `admin/script.js` dijalankan pertama kali.

### A. `sb_system`
Menyimpan state ekonomi bank secara global.
- `totalSupply`: Total keseluruhan uang dalam sistem.
- `reserve`: Cadangan bank (dana yang belum beredar).
- `circulating`: Uang yang sedang beredar di tangan pengguna/institusi.
- `feeAccumulated`: Total pendapatan bank dari potongan fee transaksi.

### B. `sb_transactions`
Menyimpan riwayat buku besar (Ledger) seluruh ekosistem.
- `id`: ID unik transaksi (contoh: TRX-101).
- `title`: Judul/Nama transaksi.
- `subtitle`: Deskripsi tambahan atau informasi pengguna terkait.
- `type`: Jenis transaksi (`in`, `out`, `fee`).
- `date`: Tanggal dan waktu transaksi.
- `source`: Sumber platform transaksi (SmartBank, Marketplace, Nasabah App).
- `status`: Status transaksi (`success`, `pending`, `rejected`).
- `amountVal`: Nilai nominal transaksi.

### C. `sb_loans`
Menyimpan pengajuan pinjaman dari pengguna.
- `id`: ID unik pinjaman.
- `userId`: ID peminjam.
- `amount`: Nominal pokok pinjaman.
- `totalWithInterest`: Total pengembalian beserta bunga.
- `status`: Status pinjaman (`pending`, `approved`, `rejected`, `over_limit`).

### D. `sb_users`
Menyimpan daftar nasabah dan entitas sistem.
- `id`: ID unik pengguna (contoh: USR-092).
- `name`: Nama pengguna atau instansi.
- `type`: Jenis akun (Nasabah, Marketplace, Logistics, dll).
- `balance`: Saldo saat ini.
- `status`: Status akun (`active`, `blocked`).

## 3. Alur Kerja (Workflows) Utama

### A. Persetujuan Pinjaman (Loan Approval)
1. Nasabah mengajukan pinjaman (dicatat di `sb_loans` sebagai `pending`).
2. Admin melihat pengajuan di menu **Pinjaman** (Admin Dashboard).
3. Jika disetujui (Approve):
   - Dana `reserve` bank akan dikurangi.
   - Dana `circulating` (Uang Beredar) akan ditambahkan sesuai nominal.
   - Transaksi baru dicatat di `sb_transactions`.
   - Status pinjaman menjadi `approved`.
4. Jika ditolak (Reject):
   - Status pinjaman menjadi `rejected`.
   - Tidak ada perubahan pada sirkulasi dana.

### B. Penarikan Fee Manual
1. Admin menekan tombol "Tarik Fee" di menu Pengaturan.
2. Sistem memotong uang `circulating` (simulasi ditarik dari peredaran).
3. Dana yang dipotong masuk ke `feeAccumulated`.
4. Transaksi dicatat di `sb_transactions` dengan tipe `fee`.

### C. Distribusi Dana (Transfer Manual)
1. Admin mentransfer modal dari bank ke entitas (misal: Logistik atau Nasabah) via form Distribusi Dana.
2. `reserve` bank berkurang sesuai jumlah transfer.
3. `circulating` bank bertambah (dana turun ke pengguna/ekosistem).
4. Transaksi dicatat sebagai pengeluaran (`out`) di `sb_transactions`.

## 4. Arsitektur Teknis Lanjutan & Algoritma (Tahap Migrasi)

Sistem akan dimigrasikan dari purwarupa `localStorage` menuju arsitektur *Client-Server* siap produksi dengan spesifikasi berikut:

### A. Tech Stack
- **Backend API**: Node.js (Express.js) + TypeScript untuk memproses *request* secara asinkron dengan tingkat keamanan *type-safety*.
- **Database Utama**: PostgreSQL (RDBMS). Sangat krusial untuk menjaga kepatuhan ACID (*Atomicity, Consistency, Isolation, Durability*) dalam sistem core banking.
- **Autentikasi**: JSON Web Token (JWT) + Manajemen sesi RBAC (Role-Based Access Control) untuk memisahkan domain Admin, Teller, dan Nasabah.

### B. Implementasi Algoritma Inti
1. **Algoritma Double-Entry Bookkeeping**: 
   - Setiap pemindahan saldo wajib dieksekusi dalam satu *Database Transaction Block*. Transaksi selalu menyeimbangkan sisi Debit (pengurang saldo) dan Kredit (penambah saldo). Jika salah satu sisi gagal, seluruh proses di-*rollback*.
2. **Algoritma Optimistic Locking (Concurrency Control)**:
   - Digunakan pada tabel saldo (Balance) pengguna untuk mencegah *race condition* (misal: menekan tombol transfer secara cepat 2x di saat saldo hanya cukup 1x). Algoritma ini akan memverifikasi *versioning* baris data sebelum melakukan *update*.
3. **Algoritma Credit Scoring**:
   - Untuk memvalidasi persetujuan di tabel `sb_loans`. Sistem akan memberikan rekomendasi (skor) kelayakan peminjam berdasarkan pembobotan histori saldo harian dan rutinitas mutasi nasabah.
4. **Algoritma Fraud & Anomaly Detection**:
   - Pendeteksian *rule-based* otomatis untuk mendeteksi transaksi lonjakan yang melebihi batas kewajaran profil nasabah (secara nominal dan frekuensi), untuk kemudian di-*flag* atau ditahan masuk ke antrean persetujuan Admin.
