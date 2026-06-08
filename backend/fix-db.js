const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    console.log("Fixing Pelunasan Pinjaman types to 'in'...");
    await prisma.transaction.updateMany({
        where: { title: 'Pelunasan Pinjaman' },
        data: { type: 'in' }
    });

    console.log("Fixing Pencairan Pinjaman subtitles...");
    const pencairanTxs = await prisma.transaction.findMany({
        where: { title: 'Pencairan Pinjaman', subtitle: { startsWith: 'Nasabah: ' } }
    });

    for (const tx of pencairanTxs) {
        const newSubtitle = tx.subtitle.replace('Nasabah: ', 'Pencairan ke ');
        await prisma.transaction.update({
            where: { id: tx.id },
            data: { subtitle: newSubtitle }
        });
        console.log(`Updated ${tx.id} subtitle to ${newSubtitle}`);
    }

    console.log("Done");
}

fix().catch(console.error).finally(() => prisma.$disconnect());
