const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createDummyTransactions() {
    console.log("Generating dummy transactions for report testing...");
    
    // Simulate high volume transactions to test BFS graph analysis
    const users = ['USR-1334', 'USR-1547', 'USR-4952'];
    
    for (let i = 0; i < 15; i++) {
        const amount = Math.floor(Math.random() * 50000) + 10000;
        const sender = users[Math.floor(Math.random() * users.length)];
        let receiver = users[Math.floor(Math.random() * users.length)];
        
        while (receiver === sender) {
            receiver = users[Math.floor(Math.random() * users.length)];
        }

        const senderData = await prisma.user.findUnique({where: {id: sender}});
        const receiverData = await prisma.user.findUnique({where: {id: receiver}});

        await prisma.transaction.create({
            data: {
                id: 'TRX-SIM-' + Date.now() + i,
                title: 'Transfer Dana',
                subtitle: `Dari ${senderData.name} ke ${receiverData.name}`,
                type: 'out',
                amount: amount,
                source: 'Nasabah App',
                status: 'success'
            }
        });
        
        // Add a small delay so timestamp varies
        await new Promise(r => setTimeout(r, 100));
    }
    
    console.log("Successfully generated 15 dummy transactions.");
}

createDummyTransactions()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
