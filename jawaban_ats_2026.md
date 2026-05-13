# Jawaban Assesment Software Engineering 2 (TI41254)

**Identitas Mahasiswa**
- **NPM** : 714240013
- **Nama** : Mohammad Isa Widianto
- **Kelas** : 2A

---

## 1. Nama Aplikasi dan Deskripsi
**Nama Aplikasi**: SmartBank (Core Banking System)

**Deskripsi Aplikasi**: 
SmartBank adalah purwarupa aplikasi sistem perbankan terpusat yang berfungsi sebagai *Single Source of Truth* (SSOT) untuk seluruh ekosistem ekonomi UMKM digital. Sebagai otoritas tunggal (regulator & payment processor), semua perubahan saldo hanya boleh terjadi di sistem ini dan tidak mengelola katalog produk/pengiriman. Sistem ini bertugas mencatat dan memvalidasi semua mutasi saldo, pembayaran antar aplikasi (seperti Marketplace, LogistiKita, dan SupplierHub), serta mengelola riwayat transaksi (Buku Besar/Ledger). 

Selain transaksi, SmartBank juga mengontrol kondisi makro ekonomi sistem dengan mengatur *Total Supply* (maksimal 1.000.000.000) uang yang dibagi menjadi *Reserve* (Cadangan Bank ≥ 98%), *Circulating* (Uang Beredar ≤ 2% awal), dan *Fee* (Pajak/Biaya transaksi seperti Fee Bank 1%). Aplikasi ini memfasilitasi tiga peran utama: **Admin** untuk mengatur kontrol moneter dan menyetujui pinjaman, **Teller** untuk pelayanan transaksi tunai, dan **Nasabah App** sebagai interface pengguna akhir untuk mentransfer dana dan mengajukan pinjaman.

---

## 2. Analisis Proses Transaksi End-to-End (Aplikasi SmartBank)
Sebagai developer utama aplikasi SmartBank, posisi aplikasi kami adalah sentral. Berikut adalah proses transaksi *end-to-end* ketika terjadi aktivitas ekonomi utama (contoh: Nasabah melakukan pembayaran *checkout* di Marketplace yang melibatkan SupplierHub dan LogistiKita):

1) **Input utama yang diterima aplikasi Anda**:
   SmartBank menerima instruksi/request mutasi (pembayaran) yang diteruskan dari API Gateway. Input utamanya berupa `payment request` yang mencakup `from_app`, `from_user`, `to_user/service`, `amount`, dan `metadata`, serta request `loan`. Selain itu, parameter unik seperti *Idempotency Key* juga dilampirkan untuk mencegah duplikasi.

2) **API apa saja yang perlu dipanggil ke sistem lain**:
   Sebagai sentral (SSOT), SmartBank lebih pasif dan mengekspos endpoint seperti `/smartbank/pembayaran_transaksi` dan `/smartbank/transfer_antar_user` untuk dipanggil aplikasi lain. Namun, secara *event-driven*, SmartBank dapat memanggil API berupa *Webhook* atau *Callback* ke API Gateway atau langsung ke Marketplace/LogistiKita untuk memberi tahu bahwa proses mutasi (pemotongan/penambahan saldo) telah berstatus `success` atau `failed`.

3) **Data apa yang dikirim dan diterima**:
   - **Data Diterima**: Token JWT Otorisasi, Detail instruksi pembayaran (ID Pengirim, Penerima, Nominal), ID Transaksi dari aplikasi sumber.
   - **Data Dikirim**: Status pembayaran (`pending`, `success`, `failed`), referensi ID Transaksi SmartBank (misal: `TRX-101`), waktu transaksi, dan (opsional) sisa saldo terbaru dari pihak yang melakukan query.

4) **Mekanisme validasi JWT/token**:
   Saat API Gateway meneruskan request ke SmartBank, SmartBank akan memvalidasi token JWT pada header. Validasi mencakup verifikasi *signature* JWT menggunakan *public key/secret key*, mengecek kedaluwarsa token (`exp`), serta memastikan bahwa entitas yang melakukan request (berdasarkan `role`/`sub` claim) memiliki izin untuk memotong saldo dari rekening Nasabah terkait.

5) **Risiko inkonsistensi data yang mungkin terjadi**:
   Inkonsistensi data (seperti *race condition*) dapat terjadi saat dua request penarikan saldo secara bersamaan (misal pembayaran Marketplace dan tagihan Logistik) masuk ke SmartBank di detik yang sama, yang berpotensi menyebabkan saldo *minus* jika tidak di-lock. Risiko lainnya adalah *timeout network*, di mana SmartBank telah memotong saldo, tetapi gagal mengirimkan *callback* `success` ke Marketplace, sehingga Marketplace menganggap transaksi batal.

6) **Dampak jika salah satu aplikasi lain mengalami kegagalan**:
   Karena SmartBank merupakan SSOT, jika Marketplace, LogistiKita, atau SupplierHub *down*, SmartBank secara internal akan tetap stabil dan tidak terpengaruh secara langsung. Namun, jika sebaliknya (SmartBank yang *down*), seluruh aktivitas ekonomi di ekosistem (checkout, bayar ongkir, bayar supplier) akan gagal dan terhenti sama sekali (menjadi *bottleneck*).

7) **Strategi agar sistem tetap robust**:
   - Menerapkan **Idempotency Key** di setiap request API. Jika ada instruksi pembayaran yang dikirim berulang karena koneksi *timeout* dari API Gateway, SmartBank tidak akan memotong saldo Nasabah dua kali, melainkan hanya me-return respons sukses dari riwayat yang sudah ada.
   - Menggunakan mekanisme **Database Transaction (ACID)** sehingga jika terjadi kegagalan di tengah-tengah proses pemindahan buku (*ledger*), saldo pengirim dan penerima akan di-*rollback* sepenuhnya.

---

## 3. Analisis dan Respons Terhadap Lonjakan Transaksi Ekosistem
Sebagai developer dari SmartBank yang sedang mengalami *delay* validasi pembayaran, respons sistem untuk mengatasi kondisi ekosistem agar tidak kolaps adalah:

**Respons Aplikasi agar kondisi terjaga:**
1) **Transaksi ekonomi tetap konsisten**: 
   SmartBank akan memproses transaksi secara *Asynchronous* (menggunakan sistem *Message Queue* seperti Kafka/RabbitMQ). Permintaan pembayaran yang masuk dari Marketplace akan langsung dimasukkan ke dalam antrean dan direspons dengan status `pending` atau `processing`.
2) **Tidak terjadi double transaction**: 
   Validasi ganda menggunakan *Idempotency Key* dan relasional database constraint (`UNIQUE constraint`) pada ID referensi transaksi dari Marketplace, mencegah SmartBank memotong saldo berkali-kali jika Marketplace yang *nge-bug* dan mengirim *checkout* ganda.
3) **Tidak terjadi pengurangan stok palsu**: 
   Menerapkan **Saga Pattern** dengan koreografi *event-driven*. Jika setelah SmartBank memotong saldo ternyata SupplierHub merespons "Stok habis", SmartBank otomatis mengeksekusi fungsi kompensasi (mengembalikan saldo/*refund* ke nasabah) sehingga tidak ada pihak yang dirugikan secara nominal.
4) **Sistem tetap scalable**: 
   Melakukan *Horizontal Pod Autoscaling* khusus pada *service/worker* transaksi mutasi di SmartBank. Dengan memisahkan beban (misalnya, fitur laporan Admin dipisah servernya dengan fitur eksekusi mutasi), *core service* perbankan bisa fokus memproses lonjakan antrean.
5) **User tetap mendapatkan feedback yang jelas**: 
   API SmartBank akan segera me-return status `pending` ke API Gateway, sehingga UI di Nasabah App atau Marketplace bisa menampilkan loading indikator (seperti: "Pembayaran sedang diverifikasi Bank"). Pembaruan final dikirimkan menggunakan *WebSockets* atau *polling*.
6) **Ekosistem tidak mengalami "cascade failure"**: 
   SmartBank mengaktifkan mekanisme **Rate Limiting** untuk API non-kritis dan pola **Circuit Breaker**. Secara bisnis (mengacu pada Aturan Keuangan ekosistem), SmartBank menerapkan **Cooldown Transaksi (10–30 detik)** dan **Batas Maksimal 10 Transaksi Harian** per user. Aturan ini bertindak sebagai *rate limiter* alami yang mengontrol *velocity of money* dan mencegah server *overload*. Jika antrean penuh, SmartBank me-reject request (*fast-fail*) sehingga API Gateway dapat langsung merespons error tanpa *timeout* berantai.

**Penjelasan Komponen dan Prinsip Sistem:**
1) **Komponen apa yang paling kritis dalam aplikasi Anda**:
   Komponen *Transaction Execution Engine* dan *Database Ledger* (`sb_transactions` dan `sb_system`). Di sinilah validasi perhitungan limit *reserve* bank dan kalkulasi saldo nasabah (SSOT) dieksekusi secara ketat.
2) **Endpoint/API mana yang harus diprioritaskan**:
   Sesuai desain Fungsional SmartBank, endpoint yang menjadi prioritas mutlak adalah `/smartbank/pembayaran_transaksi` (untuk memproses pembayaran masuk/keluar) dan `/smartbank/ledger_transaksi` (untuk mencatat riwayat buku besar SSOT).
3) **Log apa saja yang wajib dicatat**:
   Log audit (*Audit Trail*) yang persisten berisi: Waktu Transaksi, *Request Header/Idempotency ID*, Payload Input, Saldo Sebelum Mutasi, Saldo Setelah Mutasi, dan Pesan Kesalahan (jika transaksi *failed/rolled back*).
4) **Prinsip Clean Architecture / SOLID**:
   - **Single Responsibility Principle (SRP)**: Logic mutasi saldo sepenuhnya dipisah dari logic pengajuan pinjaman (Loan) atau perhitungan biaya *fee* Admin. Jika terjadi lonjakan pada transaksi mutasi jual-beli, modul pinjaman dan UI tidak ikut *down*.
   - **Dependency Inversion Principle (DIP)**: Logika *core banking* (*use cases*) mengandalkan *interface* ke database, bukan pada implementasi *query* langsung (seperti MySQL/PostgreSQL driver). Hal ini memudahkan jika SmartBank harus mengimplementasikan lapisan *Cache* (misal Redis) untuk validasi saldo secara instan saat kondisi *high traffic*, tanpa mengubah baris kode *business logic* utama sama sekali.
