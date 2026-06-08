const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    console.log("Fetching transactions...");
    const txs = await prisma.transaction.findMany({
        where: {
            title: 'Pelunasan Pinjaman'
        }
    });

    for (const tx of txs) {
        if (!tx.subtitle.includes('dari')) {
            // It looks like "Cicilan untuk pinjaman LOAN-123..."
            const match = tx.subtitle.match(/LOAN-\d+/);
            if (match) {
                const loanId = match[0];
                const loan = await prisma.loan.findUnique({
                    where: { id: loanId },
                    include: { user: true }
                });
                
                if (loan && loan.user) {
                    const newSubtitle = `Cicilan dari ${loan.user.name} untuk pinjaman ${loanId}`;
                    await prisma.transaction.update({
                        where: { id: tx.id },
                        data: { subtitle: newSubtitle }
                    });
                    console.log(`Updated TX ${tx.id} to: ${newSubtitle}`);
                }
            }
        }
    }
    console.log("Done");
}

fix().catch(console.error).finally(() => prisma.$disconnect());
