/**
 * SmartBank Teller Algorithms Test Script
 * ----------------------------------------------------
 * Mahasiswa: Mohammad Isa Widianto (NPM: 714240013)
 * Kelas: 2A D4 Teknik Informatika
 * 
 * File ini mengimplementasikan dan menguji dua algoritma utama
 * yang digunakan dalam modul Teller SmartBank:
 * 1. Algoritma Greedy (Pecahan Denominasi Uang Tunai)
 * 2. Algoritma Merge Sort (Pengurutan Kronologis Riwayat Transaksi)
 */

// ==========================================
// 1. IMPLEMENTASI ALGORITMA GREEDY
// ==========================================
/**
 * Menghitung pecahan uang fisik terkecil/paling sedikit yang harus diserahkan
 * kepada nasabah saat melakukan tarik tunai (Walk-in).
 * 
 * @param {number} amount - Jumlah nominal penarikan
 * @returns {Object} Rincian pecahan uang yang dikeluarkan beserta sisa koin
 */
function calculateDenominations(amount) {
    const denominations = [100000, 50000, 20000, 10000, 5000, 2000, 1000];
    const result = {};
    let tempAmount = amount;

    console.log(`[GREEDY] Memproses penarikan tunai sebesar: Rp ${amount.toLocaleString('id-ID')}`);
    
    for (let coin of denominations) {
        if (tempAmount >= coin) {
            const count = Math.floor(tempAmount / coin);
            result[coin] = count;
            console.log(`  -> Memakai pecahan Rp ${coin.toLocaleString('id-ID')}: ${count} lembar (Sisa nominal: Rp ${(tempAmount % coin).toLocaleString('id-ID')})`);
            tempAmount = tempAmount % coin;
        }
    }
    
    if (tempAmount > 0) {
        result['sisa'] = tempAmount;
        console.log(`  -> Sisa koin/logam tidak dapat dipecah: Rp ${tempAmount.toLocaleString('id-ID')}`);
    }
    
    return result;
}


// ==========================================
// 2. IMPLEMENTASI ALGORITMA MERGE SORT
// ==========================================
/**
 * Mengurutkan array transaksi secara descending berdasarkan stempel waktu (createdAt)
 * menggunakan metode Divide & Conquer (Merge Sort) yang stabil.
 * 
 * @param {Array} arr - Daftar objek transaksi
 * @returns {Array} Daftar transaksi terurut
 */
function mergeSortTransactions(arr) {
    if (arr.length <= 1) return arr;

    const mid = Math.floor(arr.length / 2);
    const left = arr.slice(0, mid);
    const right = arr.slice(mid);

    return merge(mergeSortTransactions(left), mergeSortTransactions(right));
}

/**
 * Menggabungkan dua sub-array terurut menjadi satu array terurut (descending).
 */
function merge(left, right) {
    let resultArray = [], leftIndex = 0, rightIndex = 0;

    while (leftIndex < left.length && rightIndex < right.length) {
        const leftDate = new Date(left[leftIndex].createdAt).getTime();
        const rightDate = new Date(right[rightIndex].createdAt).getTime();

        // Mengurutkan dari terbaru ke terlama (Descending)
        if (leftDate >= rightDate) {
            resultArray.push(left[leftIndex]);
            leftIndex++;
        } else {
            resultArray.push(right[rightIndex]);
            rightIndex++;
        }
    }

    return resultArray
        .concat(left.slice(leftIndex))
        .concat(right.slice(rightIndex));
}


// ==========================================
// 3. RUNNER PENGUJIAN (TEST SUITE)
// ==========================================
function runTests() {
    console.log("==================================================================");
    console.log("SMARTBANK TELLER ALGORITHMS TEST SUITE");
    console.log("==================================================================\n");

    // --- Pengujian 1: Algoritma Greedy (Penarikan Tunai) ---
    console.log("--- TEST CASE 1: PENARIKAN TUNAI (GREEDY ALGORITHM) ---");
    const withdrawAmount = 378000;
    const resultGreedy = calculateDenominations(withdrawAmount);
    console.log("\nHasil Akhir Denominasi Pecahan:");
    for (let key in resultGreedy) {
        if (key === 'sisa') {
            console.log(`  - Sisa Koin Logam: Rp ${resultGreedy[key].toLocaleString('id-ID')}`);
        } else {
            console.log(`  - Pecahan Rp ${Number(key).toLocaleString('id-ID')}: ${resultGreedy[key]} lembar`);
        }
    }
    console.log("\n------------------------------------------------------------------\n");

    // --- Pengujian 2: Algoritma Merge Sort (Pengurutan Riwayat) ---
    console.log("--- TEST CASE 2: PENGURUTAN RIWAYAT TRANSAKSI (MERGE SORT) ---");
    const dummyTransactions = [
        { id: "TRX-001", title: "Setor Tunai", amount: 50000, createdAt: "2026-06-22T08:00:00.000Z" },
        { id: "TRX-002", title: "Tarik Tunai", amount: 100000, createdAt: "2026-06-22T08:15:00.000Z" },
        { id: "TRX-003", title: "Transfer Dana", amount: 25000, createdAt: "2026-06-22T08:05:00.000Z" },
        { id: "TRX-004", title: "Setor Tunai", amount: 200000, createdAt: "2026-06-22T08:30:00.000Z" },
        { id: "TRX-005", title: "Transfer Dana", amount: 75000, createdAt: "2026-06-22T07:45:00.000Z" }
    ];

    console.log("Data Awal (Sebelum Diurutkan):");
    dummyTransactions.forEach(t => console.log(`  [${t.id}] ${t.title} - Rp ${t.amount.toLocaleString('id-ID')} | Waktu: ${t.createdAt}`));

    console.log("\nProses Pengurutan Merge Sort...");
    const sortedTransactions = mergeSortTransactions(dummyTransactions);

    console.log("\nData Hasil Pengurutan (Descending - Terbaru ke Terlama):");
    sortedTransactions.forEach((t, i) => {
        console.log(`  ${i + 1}. [${t.id}] ${t.title} - Rp ${t.amount.toLocaleString('id-ID')} | Waktu: ${t.createdAt}`);
    });
    console.log("\n==================================================================");
}

// Jalankan Test Suite jika dipanggil via CLI
runTests();
