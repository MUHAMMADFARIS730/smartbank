# Bab 2: Aplikasi Nasabah (Customer App)

Aplikasi ini berjalan di sisi klien (*mobile/web front-end*) yang menuntut eksekusi cepat dengan konsumsi memori yang efisien. Pada ekosistem SmartBank, aplikasi ini dibangun menggunakan standar JavaScript yang dijalankan langsung oleh mesin peramban pengguna.

## 2.1 Algoritma Knuth-Morris-Pratt (KMP)

### A. Konteks Sistem
* **Fitur Sistem:** *Search Bar* Riwayat Mutasi Rekening dan Filter Transaksi.
* **Maksud & Tujuan:** Melakukan pencocokan string (*string matching*) secara instan ketika nasabah mengetik kata kunci (*keyword*) tertentu (seperti nama toko, nominal, atau jenis transaksi) pada jutaan baris riwayat transaksi lama.

### B. Justifikasi Teknis
Berbeda dengan pencarian linear (*Brute Force*) yang mengulang pencocokan dari karakter awal saat terjadi kegagalan, KMP memanfaatkan tabel prefiks (*Failure Function* atau tabel LPS - *Longest Prefix Suffix*) untuk melompati pergeseran karakter yang sia-sia, mencapai kompleksitas waktu linear $O(n + m)$. Ini sangat krusial di JavaScript sisi klien agar UI tidak *freeze* (*blocking main thread*) ketika nasabah mencari riwayat transaksi dalam jangka waktu bertahun-tahun.

### C. Referensi Literatur
* *Implementasi Algoritma Knuth Morris Pratt untuk Pencarian Data pada Sistem Informasi Finansial* (Jurnal Komputasi Nasional).
* *Abstract Keyword Searching with Knuth Morris Pratt Algorithm* (International Journal of Computer Science).

### D. Implementasi Kode (JavaScript)
Berikut adalah gambaran implementasi fungsi algoritma KMP di JavaScript:

```javascript
/**
 * Membuat tabel Longest Prefix Suffix (LPS) untuk algoritma KMP.
 * @param {string} pattern - Kata kunci yang dicari
 * @returns {number[]} Array LPS
 */
function buildLPSTable(pattern) {
    const lps = new Array(pattern.length).fill(0);
    let length = 0; // panjang prefix suffix sebelumnya
    let i = 1;

    while (i < pattern.length) {
        if (pattern[i] === pattern[length]) {
            length++;
            lps[i] = length;
            i++;
        } else {
            if (length !== 0) {
                length = lps[length - 1];
            } else {
                lps[i] = 0;
                i++;
            }
        }
    }
    return lps;
}

/**
 * Mencari substring menggunakan algoritma Knuth-Morris-Pratt.
 * @param {string} text - Teks riwayat transaksi
 * @param {string} pattern - Kata kunci pencarian
 * @returns {number} Indeks kemunculan pertama, atau -1 jika tidak ditemukan
 */
function searchKMP(text, pattern) {
    if (pattern.length === 0) return 0;
    
    // Konversi ke huruf kecil untuk pencarian case-insensitive
    text = text.toLowerCase();
    pattern = pattern.toLowerCase();

    const lps = buildLPSTable(pattern);
    let i = 0; // index untuk text
    let j = 0; // index untuk pattern

    while (i < text.length) {
        if (pattern[j] === text[i]) {
            i++;
            j++;
        }

        if (j === pattern.length) {
            return i - j; // Mengembalikan index awal kecocokan
            // Jika ingin mencari semua kecocokan: j = lps[j - 1];
        } else if (i < text.length && pattern[j] !== text[i]) {
            if (j !== 0) {
                j = lps[j - 1];
            } else {
                i++;
            }
        }
    }
    return -1; // Tidak ditemukan
}

// Contoh Penggunaan:
// const deskripsiTransaksi = "Transfer ke Toko Maju Jaya Sejahtera via BCA";
// const keyword = "Maju Jaya";
// const isMatch = searchKMP(deskripsiTransaksi, keyword) !== -1;
```
