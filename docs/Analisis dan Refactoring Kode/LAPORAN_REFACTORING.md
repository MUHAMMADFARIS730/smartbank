# Bagian 7: Daftar Temuan Masalah Kode

Tabel di bawah ini memuat 5 temuan masalah arsitektur dan desain kode yang ditemukan secara nyata pada kode aplikasi SmartBank, khususnya pada *backend routing*.

| File/Method | Masalah Kode | Prinsip Terkait | Dampak Negatif |
| --- | --- | --- | --- |
| `adminRoutes.ts`<br>`router.post('/loans/:id/validate')` | **Fat Controller**: Logika bisnis utama (validasi transaksi, pengecekan *reserve* bank, update saldo) dieksekusi langsung di dalam rute HTTP. | *Single Responsibility Principle (SRP)*, *Separation of Concerns (SoC)* | Menyulitkan unit testing (harus via HTTP *mock*), memicu duplikasi kode, dan membuat file route sangat membengkak (*God Class*). |
| `adminRoutes.ts`<br>`class BankGraph` & `trackMoneyLaunderingBFS` | **Logika Domain Bocor ke Infrastruktur**: Struktur data (Graph) dan algoritma pencarian (BFS) diletakkan langsung di dalam file *routing* *admin*. | *High Cohesion*, *Single Responsibility Principle (SRP)* | Mengurangi tingkat kohesi; logika algoritma pencucian uang (AML) tidak dapat di-*reuse* oleh *service* atau sistem lain (misalnya *Cron Job* harian) tanpa memanggil *route*. |
| `adminRoutes.ts`<br>`router.post('/distribute')` | **Duplikasi Aturan Bisnis**: Aturan validasi keras `reserve >= 98% totalSupply` diduplikasi sama persis pada endpoint *distribute*, persetujuan *loan*, dan *supply*. | *Don't Repeat Yourself (DRY)* | Rawan inkonsistensi. Jika kebijakan minimum cadangan bank berubah menjadi 95%, *developer* berisiko lupa mengubah satu di antara tiga *endpoint* yang ada, yang berakibat fatal pada integritas data. |
| `nasabahRoutes.ts`<br>`router.post('/transfer')` | **Tight Coupling ORM & Controller**: Rute HTTP memanggil secara langsung `prisma.$transaction` beserta logika perpajakan sistem (1% *fee*, 2% *tax*). | *Dependency Inversion Principle (DIP)*, *Low Coupling* | Route HTTP terikat kuat dengan struktur *database* Prisma. Perubahan tabel database akan langsung merusak *layer* presentasi (API), dan tidak modular. |
| `nasabahRoutes.ts`<br>`router.get('/dashboard')` | **Duplikasi Pemetaan (*Mapping*)**: Logika *mapping* jenis transaksi (*in/out*) berdasarkan format string *subtitle* diduplikasi pada rute `/dashboard` dan `/transactions`. | *Don't Repeat Yourself (DRY)*, *Separation of Concerns* | Apabila ada format deskripsi transaksi baru, pembaruan harus dilakukan di beberapa *method* *array mapping* secara paralel. |
| `tellerRoutes.ts`<br>`router.get('/dashboard')` | **Agregasi Data di Memori (In-Memory Processing)**: Menarik seluruh baris transaksi dari *database* ke memori Node.js hanya untuk di-sum (*reduce*). | *Performance / Clean Code* | Jika data mencapai jutaan baris, server Node.js akan mengalami *Out Of Memory (OOM)*. Seharusnya menggunakan fungsi agregasi SQL/Prisma (`aggregate`/`groupBy`). |
| `tellerRoutes.ts`<br>`router.post('/transfer')` | **Fragmentasi Logika Bisnis (Transfer)**: Logika pengurangan saldo diduplikasi dari rute `nasabahRoutes`, tetapi tanpa potongan *fee/tax*. | *Don't Repeat Yourself (DRY)* | Menyebabkan cacat arsitektur dan inkonsistensi. Fitur transfer gagal dirangkum dalam satu *Service* khusus yang membawahi aturan pusat. |

---

# Bagian 8: Analisis Before-After Refactoring

Berikut adalah analisis teknis mendalam untuk setiap temuan beserta rancangan *before-after refactoring* yang memisahkan tanggung jawab (layer).

## Temuan 1: *Fat Controller* pada Validasi Pinjaman

- **Lokasi Kode**: `backend/src/routes/adminRoutes.ts` method `router.post('/loans/:id/validate')`
- **Kode Sebelum Refactoring**:
```typescript
router.post('/loans/:id/validate', async (req, res) => {
  const { action } = req.body;
  // Validasi input...
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Logic bisnis berat: Cek status, Cek Reserve, Update State...
      const state = await tx.systemState.findUnique({ where: { id: 1 } });
      const minReserve = state.totalSupply * 0.98;
      if (state.reserve - loan.amount < minReserve) {
        throw new Error('Validasi Keras Gagal...');
      }
      // ... update loan, user balance, dan insert transaction
    });
    res.json(result);
  } catch (error) { ... }
});
```
- **Masalah yang Ditemukan**: HTTP API *controller* merangkap tugas sebagai *Service Layer* dan *Data Access Layer*. Semua kueri `prisma` dan logika perbankan ditempatkan di dalam *closure* *route*.
- **Prinsip yang Dilanggar**: *Single Responsibility Principle (SRP)* dan *Separation of Concerns*.
- **Strategi Refactoring**: Pindahkan seluruh `prisma.$transaction` dan validasi logika bisnis ke dalam abstraksi baru, yaitu `LoanService`. *Route* hanya boleh menerima HTTP Request, memanggil *service*, dan membalikkan HTTP Response.
- **Kode Sesudah Refactoring**:
```typescript
// --- File: backend/src/services/LoanService.ts ---
export class LoanService {
  static async validateLoan(loanId: string, action: 'approve' | 'reject') {
    return await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id: loanId }, include: { user: true } });
      if (!loan || loan.status !== 'pending') throw new Error('Invalid loan state');
      
      if (action === 'reject') {
         return await tx.loan.update({ where: { id: loanId }, data: { status: 'rejected' } });
      }
      
      const state = await tx.systemState.findUnique({ where: { id: 1 } });
      SystemStateValidator.checkReserveLimit(state.totalSupply, state.reserve, loan.amount);
      
      // Lanjutkan eksekusi persetujuan... (potong saldo, dsb)
      return { message: 'Pinjaman disetujui', loan };
    });
  }
}

// --- File: backend/src/routes/adminRoutes.ts ---
import { LoanService } from '../services/LoanService';

router.post('/loans/:id/validate', async (req, res) => {
  try {
    const { action } = req.body;
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Invalid' });
    
    // Controller menjadi bersih (Thin Controller)
    const result = await LoanService.validateLoan(req.params.id, action);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
```
- **Dampak Perbaikan**: *Controller* sekarang hanya memuat 10 baris kode dibandingkan 70 baris sebelumnya (*Thin Controller*). *Method* `validateLoan` sekarang bisa dites tanpa melakukan _mocking_ pada objek HTTP Express secara utuh.

---

## Temuan 2: Logika Domain Algoritmik Bocor ke Infrastruktur

- **Lokasi Kode**: `backend/src/routes/adminRoutes.ts` deklarasi `class BankGraph`
- **Kode Sebelum Refactoring**:
```typescript
import { Router } from 'express';
import prisma from '../prismaClient';

const router = Router();

// --- Bank Graph for AML Tracking (BFS) ---
class BankGraph {
    private adjacencyList: Map<string, string[]>;
    // ... algoritma BFS (trackMoneyLaunderingBFS)
}

router.get('/aml-tracking/:id', async (req, res) => { ... })
```
- **Masalah yang Ditemukan**: Algoritma struktur data dan operasi *Breadth-First Search (BFS)* yang merupakan logika domain (Anti-Pencucian Uang) disisipkan pada _file layer infrastructure_ (routes HTTP).
- **Prinsip yang Dilanggar**: *High Cohesion*. Logika tentang *Graph* dan pergerakan dana tidak ada hubungannya dengan konfigurasi `express.Router()`.
- **Strategi Refactoring**: Mengekstrak *Class* `BankGraph` ke modul fungsional atau layanan sendiri, seperti di dalam folder `src/utils` atau `src/services/aml`.
- **Kode Sesudah Refactoring**:
```typescript
// --- File: backend/src/services/aml/BankGraphService.ts ---
export class BankGraphService {
    private adjacencyList: Map<string, string[]> = new Map();

    buildGraph(transactions: any[]) { /* Ekstraksi logic dari route ke sini */ }
    trackMoneyLaunderingBFS(startAccount: string, depthLimit: number) { /* Logic BFS */ }
}

// --- File: backend/src/routes/adminRoutes.ts ---
import { BankGraphService } from '../services/aml/BankGraphService';

router.get('/aml-tracking/:id', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany(); // Seharusnya via Repository
    const graphService = new BankGraphService();
    graphService.buildGraph(transactions);
    
    // ... panggil method
    const network = graphService.trackMoneyLaunderingBFS(user.name, 3);
    res.json({ network });
  } catch(error) { ... }
});
```
- **Dampak Perbaikan**: Memperbaiki *Cohesion* sehingga komponen `BankGraphService` memusatkan dirinya pada pelacakan transaksi, mudah dikelola (*maintainable*), dan dipisahkan secara murni dari kebergantungan Express JS.

---

## Temuan 3: Duplikasi Aturan Bisnis (Validasi Keras Reserve 98%)

- **Lokasi Kode**: `backend/src/routes/adminRoutes.ts` (Pada _route_ `/distribute`, `/loans/:id/validate`, dan `/settings/supply`)
- **Kode Sebelum Refactoring**:
```typescript
// Route /distribute (Baris 142)
const minReserve = state.totalSupply * 0.98;
if (state.reserve - amount < minReserve) {
   throw new Error('Validasi Keras Gagal: ... di bawah 98%');
}

// Route /settings/supply (Baris 396)
const minReserve = Number(newSupply) * 0.98;
if (proposedReserve < minReserve) {
   throw new Error('Validasi Keras Gagal: ... di bawah 98%');
}
```
- **Masalah yang Ditemukan**: Logika validasi dan angka "ajaib" `0.98` ditulis eksplisit pada rute-rute transaksi. 
- **Prinsip yang Dilanggar**: *Don't Repeat Yourself (DRY)*.
- **Strategi Refactoring**: Menyediakan sentralisasi aturan ini menggunakan pendekatan *Domain Model* atau *Helper Method* sehingga aturan cadangan bank terenkapsulasi dengan baik.
- **Kode Sesudah Refactoring**:
```typescript
// --- File: backend/src/domain/BankPolicy.ts ---
export class BankPolicy {
    private static readonly RESERVE_THRESHOLD_PERCENTAGE = 0.98;

    static validateMinimumReserve(totalSupply: number, currentReserve: number, deductionAmount: number): void {
        const minReserve = totalSupply * this.RESERVE_THRESHOLD_PERCENTAGE;
        if ((currentReserve - deductionAmount) < minReserve) {
            throw new Error(`Validasi Gagal: Reserve tidak boleh di bawah ${(this.RESERVE_THRESHOLD_PERCENTAGE * 100)}% dari Total Supply.`);
        }
    }
}

// --- File: backend/src/routes/adminRoutes.ts (Implementasi di berbagai route) ---
router.post('/distribute', async (req, res) => {
    // ...
    BankPolicy.validateMinimumReserve(state.totalSupply, state.reserve, amount);
    // ...
});
```
- **Dampak Perbaikan**: Aturan bisnis bank yang sentral terbebas dari duplikasi (*DRY fulfilled*). Mengubah *threshold* menjadi 95% hanya butuh mengedit di *constant* `RESERVE_THRESHOLD_PERCENTAGE`, mencegah cacat *software* secara sistematis.

---

## Temuan 4: *Tight Coupling* Antara Prisma ORM & Skrip *Controller*

- **Lokasi Kode**: `backend/src/routes/nasabahRoutes.ts` method `router.post('/transfer')`
- **Kode Sebelum Refactoring**:
```typescript
router.post('/transfer', authenticate, async (req: any, res: any) => {
  // ...
  const result = await prisma.$transaction(async (tx) => {
     // ... validasi user manual ...
     const bankFee = transferAmount * 0.01;
     const systemTax = transferAmount * 0.02;
     // ... tx.user.update (sender & receiver) ...
     // ... tx.systemState.update ...
     // ... tx.transaction.create (2 insert) ...
  });
});
```
- **Masalah yang Ditemukan**: Selain logika yang tebal, HTTP layer memanggil secara langsung `prisma.$transaction`. Lapisan abstraksi data (*data access/persistence*) bocor langsung ke antarmuka aplikasi eksternal (API HTTP).
- **Prinsip yang Dilanggar**: *Dependency Inversion Principle (DIP)* dan konsep abstraksi arsitektural (*Low Coupling*).
- **Strategi Refactoring**: Pemisahan eksekusi database menjadi *Repository Pattern* (opsional, disederhanakan) dan logika perpajakan diangkat ke dalam *TransactionService*.
- **Kode Sesudah Refactoring**:
```typescript
// --- File: backend/src/services/TransactionService.ts ---
import { PrismaClient } from '@prisma/client'; // dependency service ke DB
const prisma = new PrismaClient();

export class TransactionService {
   static async processTransfer(senderId: string, receiverId: string, transferAmount: number) {
      const bankFee = transferAmount * 0.01;
      const systemTax = transferAmount * 0.02;
      
      // Eksekusi DB dibungkus dalam service terpisah
      return await prisma.$transaction(async (tx) => {
         // Lakukan update user, state, dan record mutasi.
         // Return hasil akhir transfer.
      });
   }
}

// --- File: backend/src/routes/nasabahRoutes.ts ---
router.post('/transfer', authenticate, async (req: any, res: any) => {
  try {
     const result = await TransactionService.processTransfer(req.user.id, req.body.receiverId, Number(req.body.amount));
     res.json({ message: 'Transfer berhasil', data: result });
  } catch (err: any) {
     res.status(400).json({ error: err.message });
  }
});
```
- **Dampak Perbaikan**: API *endpoint* tidak lagi tahu tentang Prisma `tx` atau cara memperbarui saldo. API hanya menerima input pengguna, melempar input itu ke servis transaksi, dan mengembalikan HTTP status (*Low Coupling* terhadap ORM tercapai).

---

## Temuan 5: Duplikasi *Array Mapping* untuk Data Transaksi Dasbor

- **Lokasi Kode**: `backend/src/routes/nasabahRoutes.ts` (Pada endpoint `/dashboard` dan `/transactions`)
- **Kode Sebelum Refactoring**:
```typescript
// Diduplikasi dua kali di /dashboard (baris 93-102) dan /transactions (baris 129-138)
const mappedTxs = txs.map(tx => {
  let mappedType = tx.type;
  if (tx.subtitle && tx.subtitle.includes(`ke ${user.name}`)) {
    mappedType = 'in';
  }
  if (tx.subtitle && tx.subtitle.includes(`dari ${user.name}`)) {
    mappedType = 'out';
  }
  return { ...tx, type: mappedType };
});
```
- **Masalah yang Ditemukan**: Karena desain skema *database* belum sempurna (transaksi tidak mengikat *userId* referensi secara langsung, tapi mem-*parsing* string teks), maka ada _workaround mapping type_. Namun buruknya, blok kode perulangan yang sama disalin mentah-mentah ke *method* lain.
- **Prinsip yang Dilanggar**: *Don't Repeat Yourself (DRY)*.
- **Strategi Refactoring**: Pembuatan *Transformer/Mapper Class* terpusat yang bisa digunakan oleh kedua rute di Nasabah untuk menerjemahkan model data dasar menjadi _Data Transfer Object_ (DTO) spesifik pengguna.
- **Kode Sesudah Refactoring**:
```typescript
// --- File: backend/src/utils/TransactionMapper.ts ---
export class TransactionMapper {
  static mapForNasabahPerspective(txs: any[], username: string) {
    return txs.map(tx => {
      let mappedType = tx.type;
      if (tx.subtitle?.includes(`ke ${username}`)) {
        mappedType = 'in';
      }
      if (tx.subtitle?.includes(`dari ${username}`)) {
        mappedType = 'out';
      }
      return { ...tx, type: mappedType };
    });
  }
}

// --- File: backend/src/routes/nasabahRoutes.ts ---
router.get('/dashboard', authenticate, async (req: any, res: any) => {
   // ... fetch txs
   const mappedRecentTxs = TransactionMapper.mapForNasabahPerspective(recentTxs, user.name);
   // ... send res
});

router.get('/transactions', authenticate, async (req: any, res: any) => {
   // ... fetch txs
   const mappedTxs = TransactionMapper.mapForNasabahPerspective(txs, user.name);
   // ... send res
});
```
- **Dampak Perbaikan**: Logika pemrosesan *array/data massaging* disatukan. Route membaca lebih deskriptif (deklaratif) tanpa harus melihat detail _if/else string manipulations_ pada level pemanggilan. Keunggulan pada sentralisasi pemeliharaan kode meningkat drastis.

---

## Temuan 6: Agregasi Data di Memori (*In-Memory Processing*)

- **Lokasi Kode**: `backend/src/routes/tellerRoutes.ts` method `router.get('/dashboard')`
- **Kode Sebelum Refactoring**:
```typescript
router.get('/dashboard', async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { source: 'Teller Pusat' },
    orderBy: { createdAt: 'desc' }
  });

  const shiftCount = transactions.length;
  // Reduce manual di memori JS
  const totalIn = transactions.filter((t: any) => t.type === 'in').reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalOut = transactions.filter((t: any) => t.type === 'out').reduce((sum: number, t: any) => sum + t.amount, 0);
  // ...
});
```
- **Masalah yang Ditemukan**: Alih-alih mendelegasikan perhitungan ke _Database Engine_ (PostgreSQL/MySQL), sistem menarik seluruh baris (yang bisa bernilai ratusan ribu *row*) ke RAM server Node.js hanya untuk di-*sum*.
- **Prinsip yang Dilanggar**: *Clean Code / Performance Best Practices*. Tidak memanfaatkan kemampuan abstraksi agregasi *database*.
- **Strategi Refactoring**: Menggunakan fungsionalitas `prisma.transaction.aggregate` atau `.groupBy` sehingga server hanya menerima nilai total (angka), tanpa *array* raksasa.
- **Kode Sesudah Refactoring**:
```typescript
// --- File: backend/src/routes/tellerRoutes.ts ---
router.get('/dashboard', async (req, res) => {
  // Hitung jumlah baris langsung di DB
  const shiftCount = await prisma.transaction.count({
    where: { source: 'Teller Pusat' }
  });

  // Agregasi jumlah nilai (SUM) langsung di DB
  const aggregateIn = await prisma.transaction.aggregate({
    where: { source: 'Teller Pusat', type: 'in' },
    _sum: { amount: true }
  });
  
  const aggregateOut = await prisma.transaction.aggregate({
    where: { source: 'Teller Pusat', type: 'out' },
    _sum: { amount: true }
  });

  const totalIn = aggregateIn._sum.amount || 0;
  const totalOut = aggregateOut._sum.amount || 0;
  
  // Mengambil sebagian antrean (take 10) bukan meload semuanya
  const recentQueue = await prisma.transaction.findMany({
    where: { source: 'Teller Pusat' },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  res.json({
    stats: { totalTransactions: shiftCount, totalIn, totalOut },
    recentQueue
  });
});
```
- **Dampak Perbaikan**: Pemakaian memori Node.js (*Heap Memory*) akan tetap stabil di angka kecil meskipun data transaksi *teller* mencapai jutaan baris. Tidak ada risiko *Out Of Memory*.

---

## Temuan 7: Fragmentasi Logika Bisnis pada Fitur Transfer

- **Lokasi Kode**: `backend/src/routes/tellerRoutes.ts` method `router.post('/transfer')` vs `nasabahRoutes.ts`
- **Kode Sebelum Refactoring**:
```typescript
// tellerRoutes.ts - router.post('/transfer')
await tx.user.update({ where: { id: senderId }, data: { balance: { decrement: transferAmount } } });
await tx.user.update({ where: { id: receiverId }, data: { balance: { increment: transferAmount } } });

// Di nasabahRoutes.ts, hal yang sama juga dilakukan, tetapi ada potongan fee:
// bankFee = transferAmount * 0.01; 
// totalDeduction = transferAmount + bankFee + systemTax;
```
- **Masalah yang Ditemukan**: Logika fundamental yaitu perpindahan uang disalin-tempel, namun aturan di *teller* sengaja tidak memuat kalkulasi pajak sistem. Tidak ada sentralisasi definisi fungsi "Transfer".
- **Prinsip yang Dilanggar**: *Don't Repeat Yourself (DRY)*.
- **Strategi Refactoring**: Mengekstraksi fungsionalitas mutasi antar dua entitas ke dalam modul fungsional bersama (`TransferService`), yang mana tipe transaksinya bisa menerima argumen apakah ini transfer *nasabah* (dikenakan biaya) atau *teller* (gratis).
- **Kode Sesudah Refactoring**:
```typescript
// --- File: backend/src/services/TransferService.ts ---
export class TransferService {
   static async execute(senderId: string, receiverId: string, amount: number, isTeller: boolean = false) {
      // Hitung fee jika bukan dari teller
      const bankFee = isTeller ? 0 : amount * 0.01;
      const systemTax = isTeller ? 0 : amount * 0.02;
      const totalDeduction = amount + bankFee + systemTax;

      // Eksekusi pemindahan saldo di satu tempat
      return await prisma.$transaction(async (tx) => {
         await tx.user.update({ where: { id: senderId }, data: { balance: { decrement: totalDeduction } } });
         await tx.user.update({ where: { id: receiverId }, data: { balance: { increment: amount } } });
         // ... record fee jika bankFee > 0 ...
      });
   }
}

// --- File: backend/src/routes/tellerRoutes.ts ---
router.post('/transfer', async (req, res) => {
  try {
     // Gunakan parameter isTeller = true
     await TransferService.execute(req.body.senderId, req.body.receiverId, Number(req.body.amount), true);
     res.json({ message: 'Transfer via Teller berhasil' });
  } catch (error) { ... }
});
```
- **Dampak Perbaikan**: Inkonsistensi berhasil dicegah. Pemindahan dana diatur oleh satu pintu utama. Jika suatu saat bank memberlakukan biaya transfer melalui *teller*, cukup mengubah *flag* atau logika di `TransferService` tanpa menyentuh *Controller*.
