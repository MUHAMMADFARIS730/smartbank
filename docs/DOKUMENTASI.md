# Dokumentasi Teknis SmartBank (Versi Produksi)

Dokumen ini menjelaskan struktur data, arsitektur teknis, logika algoritma, dan aturan finansial yang menggerakkan ekosistem aplikasi SmartBank.

---

## 1. Konsep Single Source of Truth
SmartBank berfungsi sebagai **Single Source of Truth** untuk seluruh ekosistem ekonomi virtual.
- Semua mutasi saldo, transaksi tarik/setor tunai, dan pergerakan uang pencatatan riwayatnya (Buku Besar/Ledger) dikontrol dan dicatat secara terpusat.
- Tidak ada entitas atau aplikasi yang dapat mengubah saldo di luar API resmi yang dijaga ketat oleh sistem SmartBank.
- Uang dalam ekosistem ini merupakan **Closed-Loop System**, di mana tidak ada uang yang "hilang" atau "tercipta secara gaib" selain yang diizinkan oleh otoritas Admin.

---

## 2. Arsitektur Teknis & Arsitektur Lanjutan
Sistem ini menggunakan arsitektur *Client-Server* modern.

### A. Tech Stack Utama
- **Backend API**: Node.js (Express.js) + TypeScript untuk memproses *request* secara asinkron dengan tingkat keamanan *type-safety*.
- **Database**: MySQL dengan Prisma ORM untuk memastikan *Type-Safety* dan keutuhan referensial. Sangat krusial untuk menjaga kepatuhan ACID dalam sistem core banking.
- **Frontend**: Dibangun menggunakan pendekatan *Single Page Application* (SPA) dengan Vanilla JavaScript yang ringan dan reaktif (Nasabah, Teller, Admin).
- **Keamanan**: JSON Web Token (JWT) untuk autentikasi Nasabah dan otorisasi API, serta *Hashing* Kata Sandi menggunakan Bcrypt.

### B. Konsep Arsitektur Lanjutan (Core Banking)
1. **Algoritma Double-Entry Bookkeeping**: 
   - Seluruh operasi yang memindahkan dana menggunakan fitur pembungkus transaksi (`$transaction`) dari Prisma untuk mematuhi kaidah **ACID** (*Atomicity, Consistency, Isolation, Durability*). Setiap pemindahan saldo mengeksekusi sisi Debit (pengurang saldo) dan Kredit (penambah saldo) dalam satu blok. Jika salah satu sisi gagal, seluruh proses otomatis di-*rollback*.
2. **Algoritma Optimistic Locking (Concurrency Control)**:
   - Digunakan (atau direkomendasikan pada tahap skalasi lanjut) pada tabel saldo (*Balance*) pengguna untuk mencegah *race condition* (misal: menekan tombol transfer secara cepat 2x di saat saldo hanya cukup 1x).
3. **Algoritma Credit Scoring**:
   - Untuk memvalidasi persetujuan pinjaman. Sistem akan memberikan rekomendasi kelayakan peminjam berdasarkan pembobotan histori saldo harian dan rutinitas mutasi nasabah sebelum disetujui Admin.
4. **Algoritma Fraud & Anomaly Detection**:
   - Pendeteksian *rule-based* otomatis untuk mendeteksi transaksi lonjakan yang melebihi batas kewajaran profil nasabah (secara nominal dan frekuensi), untuk kemudian di-*flag* atau ditahan.

---

## 3. Struktur Database (Prisma Schema)

Data persisten disimpan dalam database relasional (MySQL).

### A. `SystemState` (`system_state`)
Menyimpan state ekonomi bank secara global (hanya ada 1 baris/ID).
- `totalSupply`: Total keseluruhan batas uang dalam sistem.
- `reserve`: Cadangan bank (dana yang belum beredar).
- `circulating`: Uang yang sedang beredar di tangan pengguna/institusi.
- `feeAccumulated`: Total pendapatan bank dari potongan fee transaksi.

### B. `Transaction` (`transactions`)
Menyimpan riwayat buku besar (Ledger) seluruh ekosistem.
- `id`: ID unik transaksi (contoh: TRX-101).
- `title`: Judul/Nama transaksi.
- `subtitle`: Deskripsi tambahan terkait transaksi.
- `type`: Jenis transaksi (`in`, `out`, `fee`).
- `amount`: Nilai nominal transaksi.
- `source`: Sumber platform transaksi (SmartBank, Teller Pusat, dll).
- `status`: Status eksekusi transaksi (`success`, `pending`, `rejected`).
- `createdAt`: Tanggal dan waktu transaksi (stempel waktu absolut).

### C. `Loan` (`loans`)
Menyimpan pengajuan pinjaman dari pengguna.
- `id`: ID unik pinjaman.
- `userId`: ID peminjam (Relasi ke tabel User).
- `amount`: Nominal pokok pinjaman.
- `totalWithInterest`: Total pengembalian beserta bunga (contoh: +5%).
- `status`: Status pinjaman (`pending`, `approved`, `rejected`, `paid`).

### D. `User` (`users`)
Menyimpan daftar nasabah dan entitas sistem.
- `id`: ID unik pengguna (contoh: USR-092).
- `name`: Nama pengguna atau instansi.
- `password`: *Hash* kata sandi terenkripsi.
- `type`: Jenis akun (Nasabah, Marketplace, Logistics, dll).
- `balance`: Saldo uang *Circulating* saat ini.
- `status`: Status akun (`active`, `blocked`).

---

## 4. Konfigurasi Moneter & Aturan Keuangan
Ekonomi SmartBank dikendalikan oleh sistem state moneter yang mencakup 4 indikator utama seperti yang tertera di `SystemState`.

**Persamaan Absolut (Hukum Keseimbangan):**  
`totalSupply = reserve + circulating + feeAccumulated`

### A. Validasi Keras Reserve 98% (Anti-Inflasi)
Sistem memiliki pengaman tingkat tinggi di mana nilai *Reserve* bank **tidak boleh jatuh di bawah 98% dari Total Supply**. 
- Fitur ini melarang pencetakan dan peredaran uang digital (*Circulating*) lebih dari 2% ukuran bank.
- Jika Teller menerima setor tunai raksasa, atau Admin menyetujui pinjaman super besar, sistem secara otomatis akan membatalkan transaksi dan melemparkan *Error 400* demi mencegah kelebihan suplai (*Hyperinflation*).

### B. Biaya Layanan (Fee Transaksi 1%)
Sebagai pendapatan bank, setiap transaksi perpindahan buku dari satu nasabah ke nasabah lainnya akan dikenakan pajak otomatis sebesar **1%** dari nilai transfer. Nilai 1% ini dipotong langsung dari saldo pengirim dan dimasukkan ke indikator `feeAccumulated`.

---

## 5. Implementasi Algoritma Inti

Sistem SmartBank mengadopsi struktur data dan algoritma fundamental Ilmu Komputer untuk memecahkan berbagai masalah logika di masing-masing modul:

### 1. KMP (Knuth-Morris-Pratt) Algorithm
- **Lokasi**: Aplikasi Admin (Modul Ledger)
- **Tujuan**: Pencarian *(Pattern Matching)* Buku Besar secara *Ultra-Fast*.
- **Cara Kerja**: Admin dapat mencari riwayat transaksi spesifik dari puluhan ribu tumpukan data. KMP memproses teks dengan menciptakan tabel LPS (*Longest Prefix Suffix*) agar sistem tidak perlu melakukan pengecekan ulang pada karakter teks yang sudah dilewati. Ini menghasilkan kompleksitas waktu linear O(n+m) tanpa membebani memori peramban.

### 2. Divide and Conquer (Merge Sort)
- **Lokasi**: Aplikasi Teller (Modul Dasbor Riwayat)
- **Tujuan**: Pengurutan Stabil Transaksi secara Descending.
- **Cara Kerja**: Data transaksi dari *database* seringkali digabung dari berbagai tabel atau tidak sepenuhnya berurutan. *Merge Sort* membelah (*divide*) himpunan antrean menjadi dua bagian berulang kali, dan menyatukannya (*conquer*) sambil membandingkan nilai stempel waktu (`createdAt`). Ini menjamin Teller selalu melihat riwayat paling baru di baris teratas secara mulus O(n log n).

### 3. BFS (Breadth-First Search) Algorithm
- **Lokasi**: Aplikasi Admin (Modul *Anti-Money Laundering / AML Tracking*)
- **Tujuan**: Pelacakan aliran dana berantai untuk mendeteksi pencucian uang.
- **Cara Kerja**: Seluruh aktivitas transfer divisualisasikan sebagai Graf *(Graph)* di mana Node adalah *User* dan Edge adalah *Transaksi*. Dengan algoritma BFS, Admin dapat memasukkan sebuah ID target, lalu sistem akan menyusuri aliran uang dari target tersebut ke "lingkaran pertama", lalu ke "lingkaran kedua", dan seterusnya secara melebar. BFS sangat ideal untuk mencari rute uang terpendek dari sumber ke tujuan.

### 4. Greedy Algorithm
- **Lokasi**: Aplikasi Teller (Modul Tarik Tunai)
- **Tujuan**: Penukaran Nominal Tunai *(Denomination Breakdown)*.
- **Cara Kerja**: Ketika nasabah menarik dana dari aplikasi menjadi uang kertas fisik, Teller membutuhkan rincian pecahan lembaran kertas. Algoritma Greedy selalu mengambil keputusan "terbaik saat itu" dengan memberikan pecahan terbesar (misal: 100.000) sebanyak mungkin sebelum beralih ke pecahan lebih kecil (50.000, 20.000, dst). Ini menghasilkan total lembaran uang kertas paling sedikit secara instan bagi nasabah.

---

## 6. Alur Kerja (Workflows) Utama

### A. Persetujuan Pinjaman (Loan Approval)
1. Nasabah mengajukan pinjaman (dicatat di `loans` sebagai `pending`).
2. Admin melihat pengajuan di menu **Pinjaman** (Admin Dashboard).
3. Jika disetujui (Approve) & Lolos Validasi Keras 98%:
   - Dana `reserve` bank akan dikurangi.
   - Dana `circulating` (Uang Beredar) akan ditambahkan sesuai nominal (masuk ke saldo Nasabah).
   - Transaksi pencairan dicatat di `transactions`.
   - Status pinjaman menjadi `approved`.
4. Jika ditolak (Reject):
   - Status pinjaman menjadi `rejected`.
   - Tidak ada perubahan pada sirkulasi dana bank.
5. Saat Nasabah Melunasi (Pay):
   - Saldo nasabah dipotong, uang kembali disetor dari `circulating` menjadi `reserve` utuh.
   - Status pinjaman menjadi `paid` (Lunas).

### B. Penarikan Fee Manual
1. Admin menekan tombol "Tarik Fee Sistem" di menu Pengaturan.
2. Sistem memotong uang dari area `circulating` yang sebelumnya tak terikat, dan memindahkannya secara paksa ke brankas bank.
3. Dana yang dipotong diakumulasikan secara resmi ke `feeAccumulated`.
4. Transaksi dicatat di `transactions` dengan tipe `fee`.

### C. Distribusi Dana Reserve (Manual)
1. Admin mentransfer modal dari bank ke entitas luar (misal: Logistik, Suntikan Modal, Bantuan) via form Distribusi Dana.
2. Selama masih mematuhi Validasi Keras 98%, `reserve` bank berkurang sesuai jumlah transfer.
3. `circulating` bertambah (dana turun ke ekosistem secara agregat).
4. Transaksi dicatat sebagai pengeluaran modal (`out`) di buku besar.

---

## 7. Fitur Fungsionalitas Aplikasi

### 📱 Aplikasi Nasabah
1. **Manajemen Akun:** Registrasi, Login berbasis JWT (menyimpan sesi token secara aman di memori lokal).
2. **Dasbor Finansial:** Mengecek ID akun, Saldo *(Balance)*, dan riwayat mutasi terbaru.
3. **Transfer Ekosistem:** Mengirimkan uang ke ID pengguna lain secara *real-time* dengan transparansi potongan *Fee* 1%.
4. **Layanan Kredit & Pinjaman:** Peminjaman uang dan fitur "Lunasi Pinjaman" mandiri dari dompet.

### 👨‍💼 Aplikasi Teller
1. **Layanan Walk-In:** Workspace ringan pencarian identitas nasabah secara instan.
2. **Setor Tunai (Deposit):** Teller menyuntikkan saldo digital yang ditarik dari *Reserve* ke dalam dompet nasabah. Tunduk pada validasi batas 98%.
3. **Tarik Tunai (Withdraw):** Teller menghancurkan saldo digital nasabah (dikembalikan ke *Reserve*). Teller dibantu algoritma Greedy untuk mengeluarkan uang fisik kertas.
4. **Bantu Transfer:** Layanan pindah buku untuk nasabah yang *offline*, tetap dengan pungutan *fee* 1%.

### 🏢 Aplikasi Admin (Core Dashboard)
1. **Monetary Configuration:** Memantau 4 pilar pasokan (*Reserve, Circulating, Fee, Total Supply*). Termasuk form khusus untuk meng-*update* limit *Total Supply* secara dinamis.
2. **Data Visualisation:** Menggunakan *Chart.js* untuk memproyeksikan grafik distribus uang dan agregasi aliran kas.
3. **Validasi Pinjaman:** Admin adalah pemegang otoritas tunggal untuk menyetujui/menolak pinjaman.
4. **SmartBank Ledger & AML:** Buku besar transparan dengan kapabilitas lacak rute uang dan pencarian KMP secara langsung di *browser*. 
