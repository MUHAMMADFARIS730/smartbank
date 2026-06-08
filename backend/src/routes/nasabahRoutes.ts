import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'smartbank_secret';

// Middleware for auth
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Tidak ada token' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token tidak valid' });
  }
};

// 1. REGISTER
router.post('/register', async (req, res) => {
  const { name, password, initialBalance = 0 } = req.body;
  if (!name || !password) return res.status(400).json({ error: 'Nama dan password wajib diisi' });

  try {
    // Generate new ID (e.g. USR-XXXX)
    const id = 'USR-' + Math.floor(1000 + Math.random() * 9000);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        id,
        name,
        password: hashedPassword,
        type: 'Nasabah',
        balance: initialBalance
      }
    });

    res.json({ message: 'Registrasi berhasil', data: { id: user.id, name: user.name } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  const { id, password } = req.body;
  if (!id || !password) return res.status(400).json({ error: 'ID dan password wajib diisi' });

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || !user.password) return res.status(401).json({ error: 'ID atau password salah' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'ID atau password salah' });

    const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ message: 'Login berhasil', token, data: { id: user.id, name: user.name } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET DASHBOARD
router.get('/dashboard', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Nasabah tidak ditemukan' });

    // Find recent transactions where user is either sender or receiver
    // Actually, in SmartBank, transactions might not have explicit sender/receiver fields,
    // so we assume "subtitle" contains their name or it's mapped.
    // For now, let's just get the top 5 global transactions that contain their ID or Name in subtitle/title, or just top 5 general txs.
    // Wait, let's just fetch all out and in. Our Transaction model doesn't strictly link to userId yet!
    // We will do a generic search.
    const recentTxs = await prisma.transaction.findMany({
      where: {
        OR: [
          { subtitle: { contains: user.name } },
          { title: { contains: user.name } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const mappedRecentTxs = recentTxs.map(tx => {
      let mappedType = tx.type;
      if (tx.subtitle && tx.subtitle.includes(`ke ${user.name}`)) {
        mappedType = 'in';
      }
      return { ...tx, type: mappedType };
    });

    res.json({
      balance: user.balance,
      name: user.name,
      recentTransactions: mappedRecentTxs
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET TRANSACTIONS
router.get('/transactions', authenticate, async (req: any, res: any) => {
  try {
    const user = req.user;
    const txs = await prisma.transaction.findMany({
      where: {
        OR: [
          { subtitle: { contains: user.name } },
          { title: { contains: user.name } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    const mappedTxs = txs.map(tx => {
      let mappedType = tx.type;
      if (tx.subtitle && tx.subtitle.includes(`ke ${user.name}`)) {
        mappedType = 'in';
      }
      return { ...tx, type: mappedType };
    });
    res.json(mappedTxs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. POST TRANSFER
router.post('/transfer', authenticate, async (req: any, res: any) => {
  const senderId = req.user.id;
  const { receiverId, amount } = req.body;
  const transferAmount = Number(amount);

  if (!receiverId || transferAmount <= 0) return res.status(400).json({ error: 'Input tidak valid' });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sender = await tx.user.findUnique({ where: { id: senderId } });
      const receiver = await tx.user.findUnique({ where: { id: receiverId } });

      if (!sender || !receiver) throw new Error('Pengguna tidak ditemukan');

      const bankFee = transferAmount * 0.01;
      const systemTax = transferAmount * 0.02;
      const totalDeduction = transferAmount + bankFee + systemTax;

      if (sender.balance < totalDeduction) {
        throw new Error(`Saldo tidak cukup. Total yang dibutuhkan: ${totalDeduction} (termasuk fee 1% dan pajak 2%)`);
      }

      // Potong saldo pengirim
      await tx.user.update({
        where: { id: senderId },
        data: { balance: { decrement: totalDeduction } }
      });

      // Tambah saldo penerima
      await tx.user.update({
        where: { id: receiverId },
        data: { balance: { increment: transferAmount } }
      });

      // Update System State
      const state = await tx.systemState.findUnique({ where: { id: 1 } });
      if (state) {
        await tx.systemState.update({
          where: { id: 1 },
          data: {
            feeAccumulated: { increment: bankFee },
            reserve: { increment: systemTax },
            circulating: { decrement: systemTax } // Pajak kembali ke reserve, mengurangi circulating
          }
        });
      }

      // Catat transaksi transfer utama
      await tx.transaction.create({
        data: {
          id: 'TRX-' + Date.now() + Math.floor(Math.random() * 1000),
          title: 'Transfer Dana',
          subtitle: `Dari ${sender.name} ke ${receiver.name}`,
          type: 'out',
          amount: transferAmount,
          source: 'Nasabah App',
          status: 'success'
        }
      });

      // Catat fee & tax
      await tx.transaction.create({
        data: {
          id: 'TRX-FEE-' + Date.now(),
          title: 'Fee & Pajak Transfer',
          subtitle: `Pajak sistem dan Fee Bank dari ${sender.name}`,
          type: 'fee',
          amount: bankFee + systemTax,
          source: 'SmartBank Core',
          status: 'success'
        }
      });

      return { transferAmount, totalDeduction };
    });

    res.json({ message: 'Transfer berhasil', data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. POST LOAN
router.post('/loan', authenticate, async (req: any, res: any) => {
  const userId = req.user.id;
  const { amount } = req.body;
  const loanAmount = Number(amount);

  if (loanAmount <= 0) return res.status(400).json({ error: 'Jumlah tidak valid' });

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Hitung total pinjaman user saat ini (yang aktif/pending)
      const activeLoans = await tx.loan.findMany({
        where: {
          userId,
          status: { in: ['pending', 'approved'] }
        }
      });

      const totalCurrentLoan = activeLoans.reduce((sum, loan) => sum + loan.amount, 0);

      if (totalCurrentLoan + loanAmount > 100000) {
        throw new Error('Gagal: Melebihi limit pinjaman maksimal Rp 100.000 per nasabah.');
      }

      const interest = loanAmount * 0.10; // Bunga 10%
      const totalWithInterest = loanAmount + interest;

      const newLoan = await tx.loan.create({
        data: {
          id: 'LOAN-' + Date.now() + Math.floor(Math.random() * 1000),
          userId,
          amount: loanAmount,
          totalWithInterest,
          status: 'pending'
        }
      });

      return newLoan;
    });

    res.json({ message: 'Pengajuan pinjaman berhasil dibuat (menunggu persetujuan Admin)', data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
