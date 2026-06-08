# Bab 1: Pendahuluan Arsitektur Algoritma SmartBank

## 1.1 Latar Belakang
SmartBank merupakan sebuah ekosistem perbankan modern yang dirancang untuk melayani nasabah secara efisien, mengelola kas di kantor cabang secara presisi, dan menjaga keamanan transaksi dalam skala yang besar. Ekosistem ini dibangun di atas teknologi JavaScript (Node.js pada backend, dan Vanilla JS pada frontend) untuk mendukung arsitektur yang asinkron, real-time, dan tangkas.

Seiring dengan meningkatnya volume transaksi dan kompleksitas layanan yang diberikan oleh SmartBank, pendekatan tradisional dalam mengelola pencarian data, penyortiran transaksi, dan deteksi fraud menjadi tidak lagi efisien. Oleh karena itu, diperlukan penerapan algoritma-algoritma tingkat lanjut (*advanced algorithms*) yang secara spesifik dirancang untuk menangani masalah kompleksitas waktu ($O(n)$) dan ruang penyimpanan secara optimal.

## 1.2 Tujuan Arsitektur Algoritma
Implementasi algoritma pada ekosistem SmartBank bertujuan untuk:
1. **Peningkatan Kinerja Sisi Klien:** Memastikan aplikasi nasabah berjalan ringan dan cepat saat digunakan pada perangkat mobile atau web peramban yang spesifikasinya bervariasi.
2. **Optimalisasi Proses Kantor Cabang:** Mencegah antrean panjang melalui komputasi yang cerdas pada aplikasi teller, khususnya untuk penghitungan kas dan penyusunan urutan dokumen.
3. **Keamanan dan Skalabilitas Skala Penuh:** Memberdayakan sistem *backend* utama dalam mendeteksi ancaman pencucian uang secara prediktif dan menyusun laporan besar dalam waktu minimal.

## 1.3 Pembagian Modul
Untuk mengakomodasi kebutuhan komputasi yang bervariasi dari sisi pengguna yang berbeda, penerapan algoritma dalam proyek SmartBank ini dipisahkan menjadi tiga pilar utama:
1. **Aplikasi Nasabah (Customer App)**
2. **Aplikasi Teller (Teller App)**
3. **Aplikasi Admin/Backend (System Administrator App)**

Detail tentang algoritma spesifik dan cara kerjanya di setiap bagian dijelaskan pada bab-bab berikutnya.
