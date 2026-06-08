# Bab 3: Aplikasi Teller (Teller App)

Aplikasi ini memprioritaskan akurasi tinggi karena menangani kas fisik dan manajemen antrean di kantor cabang. Kesalahan kalkulasi dalam lingkungan Teller dapat langsung mengakibatkan kerugian material dan panjangnya antrean nasabah.

## 3.1 Algoritma Greedy

### A. Konteks Sistem
* **Fitur Sistem:** *Smart Cash Calculator* / Modul Denominasi Penarikan Tunai.
* **Maksud & Tujuan:** Membantu Teller menghitung kombinasi lembaran uang fisik (Rp100.000, Rp50.000, Rp20.000, dst) secara otomatis saat nasabah melakukan penarikan tunai, dengan tujuan meminimalkan jumlah lembaran yang dikeluarkan.

### B. Justifikasi Teknis
Penyelesaian kasus *Coin Change Problem* dengan prinsip *Greedy* bekerja dengan mengambil pecahan terbesar yang tersedia terlebih dahulu pada setiap tahap. Proses ini berjalan dalam kompleksitas waktu $O(n)$ yang sangat cepat, meminimalkan waktu tunggu di meja Teller, sekaligus menjaga stok lembaran uang kecil tetap aman untuk pecahan yang lebih rumit.

### C. Referensi Literatur
* *Modifikasi Keluaran Pecahan Mata Uang untuk Mesin ATM/Teller* (Jurnal Sistem Informasi Nasional).
* *The Greedy Coin Change Problem and Its Optimality in Currency Systems* (arXiv Cornell University / FinTech Optimization).

### D. Implementasi Kode (JavaScript)
```javascript
/**
 * Menghitung pecahan uang yang perlu dikeluarkan menggunakan algoritma Greedy.
 * @param {number} amount - Total nominal uang tunai yang ditarik
 * @returns {Object} Rincian pecahan uang yang dikeluarkan
 */
function calculateDenominations(amount) {
    // Array pecahan mata uang Rupiah dari yang terbesar
    const denominations = [100000, 50000, 20000, 10000, 5000, 2000, 1000];
    const result = {};

    for (let coin of denominations) {
        if (amount >= coin) {
            const count = Math.floor(amount / coin);
            result[coin] = count;
            amount = amount % coin;
        }
    }

    if (amount > 0) {
        console.warn("Terdapat sisa Rp" + amount + " yang tidak dapat dipecah dengan koin standar.");
    }

    return result;
}

// Contoh Penggunaan:
// const penarikan = 375000;
// const hasil = calculateDenominations(penarikan);
// Output: { '100000': 3, '50000': 1, '20000': 1, '5000': 1 }
```

---

## 3.2 Algoritma Divide & Conquer (Merge Sort)

### A. Konteks Sistem
* **Fitur Sistem:** Manajemen Prioritas Antrean dan Cetak Buku Tabungan.
* **Maksud & Tujuan:** Menyusun urutan transaksi nasabah secara kronologis sebelum dicetak ke buku tabungan fisik, serta mengurutkan prioritas antrean harian secara dinamis berdasarkan parameter kompleks seperti waktu tiba dan status nasabah prioritas.

### B. Justifikasi Teknis
*Merge Sort* dipilih karena sifatnya yang stabil (*stable sort*). Jika ada dua transaksi atau dua tiket antrean yang masuk pada milidetik yang persis sama, urutan asli mereka tidak akan tertukar setelah proses pengurutan. Menggunakan V8 Engine (Node.js/Chrome), kompleksitas waktunya konstan pada $O(n \log n)$ dalam kondisi terbaik maupun terburuk, memastikan aplikasi tidak pernah melambat saat mengurutkan ratusan baris data buku tabungan.

### C. Referensi Literatur
* *Dasar Logika Algoritma: Pemrosesan Array Besar menggunakan Divide and Conquer* (Poliban Press).
* *Halstead's Complexity Measure of a Merge Sort and Modified Merge Sort Algorithms* (Jambura Journal of Informatics).

### D. Implementasi Kode (JavaScript)
```javascript
/**
 * Mengurutkan array transaksi menggunakan Merge Sort.
 * @param {Array} arr - Array objek transaksi
 * @returns {Array} Array yang sudah terurut berdasarkan timestamp
 */
function mergeSortTransactions(arr) {
    if (arr.length <= 1) {
        return arr;
    }

    const mid = Math.floor(arr.length / 2);
    const left = arr.slice(0, mid);
    const right = arr.slice(mid);

    return merge(mergeSortTransactions(left), mergeSortTransactions(right));
}

function merge(left, right) {
    let resultArray = [], leftIndex = 0, rightIndex = 0;

    // Gabungkan array sambil membandingkan timestamp transaksi
    while (leftIndex < left.length && rightIndex < right.length) {
        if (left[leftIndex].timestamp <= right[rightIndex].timestamp) {
            resultArray.push(left[leftIndex]);
            leftIndex++;
        } else {
            resultArray.push(right[rightIndex]);
            rightIndex++;
        }
    }

    // Gabungkan sisa elemen jika ada
    return resultArray
            .concat(left.slice(leftIndex))
            .concat(right.slice(rightIndex));
}

// Contoh Penggunaan:
// const transactions = [{ id: 2, timestamp: 1620000500 }, { id: 1, timestamp: 1620000000 }];
// const sorted = mergeSortTransactions(transactions);
```
