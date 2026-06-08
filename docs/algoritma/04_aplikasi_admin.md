# Bab 4: Aplikasi Admin (Backend & System Administrator App)

Aplikasi inti yang berjalan di lingkungan *server-side* (Node.js/TypeScript) berkinerja tinggi untuk kebutuhan pengawasan bisnis dan keamanan data. Aplikasi ini harus mampu menangani komputasi asinkron (*non-blocking*) secara efisien.

## 4.1 Traversal Graf: Breadth-First Search (BFS) & Depth-First Search (DFS)

### A. Konteks Sistem
* **Fitur Sistem:** Modul Anti-Pencucian Uang (*Anti-Money Laundering*) & *Fraud Detection*.
* **Maksud & Tujuan:** Melacak aliran dana mencurigakan. Dalam *database* perbankan, rekening nasabah bertindak sebagai simpul (*Node*) dan transaksi transfer bertindak sebagai garis berarah (*Edge*). 

### B. Justifikasi Teknis
* BFS digunakan untuk melacak sebaran dana keluar lapis demi lapis (Koneksi Tingkat 1, Tingkat 2, dst) guna memetakan seluruh rekening penampung. Algoritma ini menjamin kita menemukan jalur terpendek menuju jaringan penipu.
* DFS digunakan untuk menelusuri satu jalur transaksi gelap terdalam hingga ke ujung aliran dana akhir untuk kebutuhan pembekuan rekening secara otomatis.
Penggunaan struktur data *Adjacency List* di JavaScript memungkinkan traversal berjalan dalam kompleksitas $O(V + E)$ di mana V adalah jumlah rekening dan E adalah jumlah transaksi.

### C. Referensi Literatur
* *Detecting Financial Fraud through Hybrid AI Models Leveraging Graph Networks and Transactional Behavior* (International Journal of Computer Science & Network Security).
* *An Exploratory Survey on the Use of Graph Algorithms in Analysis of Networks and Fraud* (IEEE Transactions).

### D. Implementasi Kode (TypeScript/JavaScript)
```typescript
class BankGraph {
    private adjacencyList: Map<string, string[]>;

    constructor() {
        this.adjacencyList = new Map();
    }

    addTransaction(fromAccount: string, toAccount: string) {
        if (!this.adjacencyList.has(fromAccount)) {
            this.adjacencyList.set(fromAccount, []);
        }
        if (!this.adjacencyList.has(toAccount)) {
            this.adjacencyList.set(toAccount, []);
        }
        this.adjacencyList.get(fromAccount)?.push(toAccount);
    }

    /**
     * Melacak sebaran aliran dana lapis demi lapis (BFS).
     */
    trackMoneyLaunderingBFS(startAccount: string, depthLimit: number) {
        let visited = new Set<string>();
        let queue: { account: string, depth: number }[] = [];

        queue.push({ account: startAccount, depth: 0 });
        visited.add(startAccount);

        const suspiciousNetwork = [];

        while (queue.length > 0) {
            let { account, depth } = queue.shift()!;
            suspiciousNetwork.push({ account, depth });

            if (depth < depthLimit) {
                let destinations = this.adjacencyList.get(account) || [];
                for (let dest of destinations) {
                    if (!visited.has(dest)) {
                        visited.add(dest);
                        queue.push({ account: dest, depth: depth + 1 });
                    }
                }
            }
        }
        return suspiciousNetwork;
    }
}
```

---

## 4.2 Algoritma Divide & Conquer (Parallel Processes)

### A. Konteks Sistem
* **Fitur Sistem:** Pemrosesan Laporan Konsolidasi Keuangan Akhir Bulan (*Closing Report*).
* **Maksud & Tujuan:** Menyortir dan mengagregasi ratusan juta baris data transaksi dari seluruh kantor cabang di Indonesia untuk menghasilkan laporan neraca keuangan bank tanpa membebani memori server utama.

### B. Justifikasi Teknis
Strategi *Divide & Conquer* menguraikan data laporan berukuran terabyte menjadi sub-blok data kecil (*Divide*), memproses dan mengurutkannya secara paralel menggunakan *Worker Threads* di Node.js (*Conquer*), lalu menggabungkannya kembali menjadi satu laporan utuh (*Combine*) tanpa risiko *memory overflow*. Node.js sangat cocok untuk I/O *bound task* semacam ini jika dipadukan dengan modul `worker_threads`.

### C. Referensi Literatur
* *Divide-and-Conquer Methods for Big Data Analysis* (arXiv Cornell University).
* *Optimization Implementation and Performance Analysis of Divide-and-Conquer Algorithm in Big Data Sorting and Retrieval* (ResearchGate / ACM).

### D. Konsep Implementasi (Node.js Worker Threads)
```javascript
// Konsep dasar pemrosesan paralel pada Backend
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
    // Membagi data besar menjadi chunk-chunk kecil
    function processReportInParallel(dataChunks) {
        return new Promise((resolve, reject) => {
            let completedWorkers = 0;
            let combinedResults = [];

            dataChunks.forEach(chunk => {
                const worker = new Worker(__filename, { workerData: chunk });
                worker.on('message', result => {
                    combinedResults.push(result);
                    completedWorkers++;
                    if (completedWorkers === dataChunks.length) {
                        // Menggabungkan hasil (Combine)
                        resolve(combinedResults.flat());
                    }
                });
                worker.on('error', reject);
            });
        });
    }
} else {
    // Sub-proses di Worker Thread (Conquer)
    const chunkToProcess = workerData;
    // ... proses agregasi data ...
    const result = chunkToProcess.map(row => ({ ...row, processed: true }));
    parentPort.postMessage(result);
}
```

---

## 4.3 Algoritma Knuth-Morris-Pratt (KMP)

### A. Konteks Sistem
* **Fitur Sistem:** *Search Bar* pada Halaman *Ledger* (Buku Besar) Transaksi.
* **Maksud & Tujuan:** Memfasilitasi Administrator untuk mencari data dari tumpukan ratusan ribu riwayat transaksi gabungan seluruh pengguna (berdasarkan *keyword* ID, nama, referensi, atau deskripsi) secara instan.

### B. Justifikasi Teknis
Aplikasi Admin merender gabungan seluruh mutasi transaksi sistem pada halaman Ledger. Pencarian *substring* menggunakan metode biasa (*Brute Force*) pada himpunan data raksasa dapat memicu *UI thread blocking* di peramban Admin. Algoritma KMP mencatat tabel kecocokan *prefix* (*Failure Function*) untuk menghindari perulangan evaluasi karakter yang sama. Ini menghasilkan kompleksitas $O(n + m)$ yang ideal untuk pencarian berbasis teks cepat di sisi klien (Admin Dashboard).

### C. Referensi Literatur
* *Implementasi Algoritma Knuth Morris Pratt untuk Pencarian Data pada Sistem Informasi Finansial* (Jurnal Komputasi Nasional).
* *Abstract Keyword Searching with Knuth Morris Pratt Algorithm* (International Journal of Computer Science).

### D. Konsep Implementasi (JavaScript)
Secara prinsip, algoritma ini sama dengan yang ada di aplikasi nasabah, namun diterapkan pada *array* kumpulan seluruh transaksi sistem (*system-wide transactions*).

```javascript
// Konsep penerapan KMP pada array Ledger Admin
function searchLedgerKMP(transactionsArray, keyword) {
    if (!keyword) return transactionsArray;
    
    // (Fungsi buildLPSTable sama dengan di aplikasi nasabah)
    const lps = buildLPSTable(keyword.toLowerCase());
    
    return transactionsArray.filter(tx => {
        // Menggabungkan beberapa field menjadi satu string target pencarian
        const text = (tx.id + " " + tx.title + " " + tx.subtitle + " " + tx.source).toLowerCase();
        let i = 0, j = 0;
        
        while (i < text.length) {
            if (keyword[j] === text[i]) {
                i++; 
                j++;
            }
            if (j === keyword.length) {
                return true; // Keyword ditemukan pada baris transaksi ini
            } else if (i < text.length && keyword[j] !== text[i]) {
                if (j !== 0) {
                    j = lps[j - 1];
                } else {
                    i++;
                }
            }
        }
        return false;
    });
}
```
