/**
 * SmartBank Teller Algorithms Library
 * ----------------------------------------------------
 * Mahasiswa: Mohammad Isa Widianto (NPM: 714240013)
 * Kelas: 2A D4 Teknik Informatika
 * 
 * Modul ini berisi algoritma terpisah yang digunakan dalam Teller Workspace:
 * 1. Algoritma Greedy (Pecahan Denominasi Uang Tunai)
 * 2. Algoritma Merge Sort (Pengurutan Riwayat Transaksi Descending)
 */

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

    for (let coin of denominations) {
        if (amount >= coin) {
            const count = Math.floor(amount / coin);
            result[coin] = count;
            amount = amount % coin;
        }
    }
    if (amount > 0) result['sisa'] = amount;
    return result;
}

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
