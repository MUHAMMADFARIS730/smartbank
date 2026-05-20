import { Router } from 'express';
import prisma from '../prismaClient';

const router = Router();

// Helper to get or create system state
async function getSystemState() {
  let state = await prisma.systemState.findUnique({ where: { id: 1 } });
  if (!state) {
    state = await prisma.systemState.create({
      data: {
        id: 1,
        totalSupply: 100000000,
        reserve: 100000000,
        circulating: 0,
        feeAccumulated: 0,
      }
    });
  }
  return state;
}

// Helper to generate IDs
function generateId(prefix: string) {
  return `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
}

router.get('/dashboard', async (req, res) => {
  try {
    const state = await getSystemState();
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json({ systemState: state, transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/distribute', async (req, res) => {
  const { amount, targetEntity } = req.body;
  if (!amount || amount <= 0 || !targetEntity) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const state = await tx.systemState.findUnique({ where: { id: 1 } });
      if (!state || state.reserve < amount) {
        throw new Error('Insufficient reserve funds');
      }

      const updatedState = await tx.systemState.update({
        where: { id: 1 },
        data: {
          reserve: { decrement: amount },
          circulating: { increment: amount }
        }
      });

      const transaction = await tx.transaction.create({
        data: {
          id: generateId('TRX'),
          title: 'Distribusi Dana',
          subtitle: `Ke: ${targetEntity}`,
          type: 'out',
          amount: amount,
          source: 'SmartBank'
        }
      });

      return { state: updatedState, transaction };
    });

    res.json({ message: 'Dana berhasil didistribusikan', data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/fee', async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const state = await tx.systemState.findUnique({ where: { id: 1 } });
      if (!state || state.circulating < amount) {
        throw new Error('Insufficient circulating funds for fee collection');
      }

      const updatedState = await tx.systemState.update({
        where: { id: 1 },
        data: {
          circulating: { decrement: amount },
          feeAccumulated: { increment: amount }
        }
      });

      const transaction = await tx.transaction.create({
        data: {
          id: generateId('TRX'),
          title: 'Tarik Fee Sistem',
          subtitle: 'Penarikan Fee Manual',
          type: 'fee',
          amount: amount,
          source: 'SmartBank'
        }
      });

      return { state: updatedState, transaction };
    });

    res.json({ message: 'Fee berhasil ditarik', data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/loans', async (req, res) => {
  try {
    const loans = await prisma.loan.findMany({
      include: { user: true },
      orderBy: { id: 'desc' }
    });
    res.json(loans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/loans/:id/validate', async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'approve' or 'reject'

  if (action !== 'approve' && action !== 'reject') {
    return res.status(400).json({ error: 'Invalid action' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id }, include: { user: true } });
      if (!loan) throw new Error('Loan not found');
      if (loan.status !== 'pending') throw new Error('Loan is not pending');

      if (action === 'reject') {
        const updatedLoan = await tx.loan.update({
          where: { id },
          data: { status: 'rejected' }
        });
        return { message: 'Pinjaman ditolak', loan: updatedLoan };
      }

      // Approve logic
      const state = await tx.systemState.findUnique({ where: { id: 1 } });
      if (!state || state.reserve < loan.amount) {
        throw new Error('Insufficient reserve to approve loan');
      }

      const updatedState = await tx.systemState.update({
        where: { id: 1 },
        data: {
          reserve: { decrement: loan.amount },
          circulating: { increment: loan.amount }
        }
      });

      const updatedLoan = await tx.loan.update({
        where: { id },
        data: { status: 'approved' }
      });

      await tx.user.update({
        where: { id: loan.userId },
        data: { balance: { increment: loan.amount } }
      });

      const transaction = await tx.transaction.create({
        data: {
          id: generateId('TRX'),
          title: 'Pencairan Pinjaman',
          subtitle: `Nasabah: ${loan.user.name}`,
          type: 'out',
          amount: loan.amount,
          source: 'SmartBank'
        }
      });

      return { message: 'Pinjaman disetujui', loan: updatedLoan, transaction, state: updatedState };
    });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: 'asc' }
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
