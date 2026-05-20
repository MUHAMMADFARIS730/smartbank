# Product Requirements Document (PRD) - SmartBank

## 1. Pendahuluan
### 1.1. Visi Produk
SmartBank adalah inti sistem ekonomi (Core Banking System) yang bertindak sebagai satu-satunya otoritas (*Single Source of Truth*) untuk seluruh transaksi keuangan dalam ekosistem. Sistem ini dirancang untuk memastikan aliran dana yang transparan, aman, dan terkendali.

### 1.2. Tujuan
Mengelola pasokan uang (*money supply*), menyediakan layanan pencatatan transaksi terpusat (*ledger*), serta memfasilitasi kebutuhan perbankan dari sisi manajemen (Admin), operasional cabang (Teller), hingga pengguna ritel (Nasabah).

## 2. Target Pengguna (User Personas)
Sistem ini membagi penggunanya ke dalam tiga peran utama:
1. **Admin Bank (Core System)**: Bertugas mengawasi makroekonomi, melakukan validasi pinjaman, menarik *fee* transaksi, dan mendistribusikan dana.
2. **Teller Bank**: Petugas operasional di cabang bank yang melayani nasabah secara fisik untuk penyetoran/penarikan tunai dan bantuan transfer.
3. **Nasabah Ritel**: Pengguna akhir yang menggunakan layanan aplikasi mobile untuk bertransaksi harian.

## 3. Ruang Lingkup (Scope)
- **Manajemen Saldo dan Buku Besar (*Ledger*)**: Pencatatan mutasi masuk, keluar, dan fee secara terpusat.
- **Transaksi Inti**: Transfer antar user, setor tunai, tarik tunai, dan pembayaran eksternal.
- **Sistem Kredit/Pinjaman**: Pengajuan oleh nasabah dan validasi persetujuan oleh Admin.
- **Pengelolaan Makro**: Monitoring pasokan uang (*Reserve*, *Circulating*, dan *Fee Accumulated*).

*Batasan (Out of Scope):*
- Sistem ini tidak mengelola produk e-commerce, pengiriman logistik, atau layanan mitra secara detail. SmartBank murni memproses aliran uang dari dan ke layanan tersebut via API.

## 4. Kebutuhan Fungsional (Functional Requirements)

Berikut adalah fitur utama yang diwajibkan untuk ekosistem SmartBank:

| ID  | Fitur | Deskripsi | Peran (Role) |
| --- | --- | --- | --- |
| F-01 | **Manajemen Saldo** | Menampilkan saldo terkini dan riwayat transaksi (mutasi rekening). | Nasabah, Admin |
| F-02 | **Transfer Antar User** | Pemindahan dana antar pengguna dalam satu jaringan SmartBank. | Nasabah, Teller |
| F-03 | **Pembayaran Transaksi** | Memproses permintaan pembayaran API dari aplikasi mitra (Marketplace, dll). | Sistem Inti |
| F-04 | **Sistem Pinjaman** | Nasabah dapat mengajukan pinjaman; Admin dapat melihat dan melakukan Approve/Reject. | Nasabah, Admin |
| F-05 | **Setor & Tarik Tunai** | Pencatatan penerimaan/pengeluaran dana fisik di cabang oleh Teller ke/dari akun nasabah. | Teller |
| F-06 | **Distribusi Dana** | Admin dapat mentransfer dana Cadangan (*Reserve*) ke institusi/nasabah (menjadi *Circulating*). | Admin |
| F-07 | **Tarik Biaya Layanan**| Penarikan secara otomatis maupun manual untuk memotong fee/pajak transaksi menjadi pendapatan bank. | Admin, Sistem Inti |
| F-08 | **Buku Besar (Ledger)** | Pencatatan seluruh transaksi sistemik secara permanen dan transparan. | Semua Role |

## 5. Kebutuhan Non-Fungsional (Non-Functional Requirements)
- **Keamanan (Security)**: Endpoint harus tervalidasi. Autentikasi dan Otorisasi menggunakan **JWT (JSON Web Token)** dan *Role-Based Access Control* (RBAC).
- **Integritas Data (Data Integrity)**: Menggunakan paradigma *Single Source of Truth*. Saldo tidak boleh diubah oleh aplikasi lain. Catatan *Ledger* bersifat *immutable* (tidak bisa dihapus/diubah) dan wajib memenuhi standar ACID (*Atomicity, Consistency, Isolation, Durability*).
- **Arsitektur & Tech Stack**: 
  - **Backend**: Node.js (Express) dengan TypeScript untuk *high concurrency* dan *type safety*.
  - **Database**: PostgreSQL (RDBMS) sebagai penyimpan data utama.
  - **Frontend**: Migrasi bertahap dari Vanilla JS menuju arsitektur modern (seperti Vite + React.js).
- **Algoritma Sistem**:
  - *Double-Entry Bookkeeping* untuk menjamin akurasi mutasi buku besar.
  - *Optimistic Locking* untuk mencegah *Race Condition* (transaksi berbarengan).
  - *Credit Scoring* otomatis untuk validasi kelayakan pinjaman.
  - *Fraud Detection* untuk mendeteksi transaksi anomali.

## 6. Diagram Alur Kerja (Workflow)
Diagram interaksi teknis antar pengguna (Nasabah, Teller, Admin) dan *Single Source of Truth* dapat dilihat pada file: **[`role.md`](role.md)**.

## 7. Panduan Antarmuka (UI/UX Guidelines)
- **Mobile-first** untuk aplikasi Nasabah App (ukuran *viewport* handphone).
- **Dashboard layout** untuk Admin dan Teller Workspace (menampilkan banyak data dan tabel).
- **Visualisasi**: Menggunakan efek *Glassmorphism*, warna kontras (Modern UI), dan integrasi pustaka *Chart.js* untuk grafik analitik keuangan.

## 8. Milestone & Tahapan Rilis
- **Fase 1 (Purwarupa/Mockup)**: Frontend HTML/CSS/JS menggunakan `localStorage` sebagai simulasi penyimpanan. Tujuannya adalah memvalidasi User Experience (UX) dan alur *state*. *(Status: Berjalan)*
- **Fase 2 (Integrasi Backend & API)**: Pembuatan API menggunakan bahasa backend sungguhan, basis data relasional (RDBMS), serta penerapan sistem *login*.
- **Fase 3 (Go-Live Ekosistem)**: Menyatukan SmartBank API dengan aplikasi mitra (Marketplace, Logistik) dalam satu ekosistem penuh.
