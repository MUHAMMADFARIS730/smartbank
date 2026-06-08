const API_URL = 'http://localhost:3000/api/teller';
let currentUserId = null;

// Navigation Logic
function switchView(viewId, element) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');

    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.remove('active');
    });

    document.getElementById('view-' + viewId).classList.add('active');

    const titleMap = {
        'dashboard': 'Teller Workspace',
        'nasabah': 'Layanan Nasabah (Setor & Tarik)',
        'transfer': 'Transfer Dana Nasabah',
        'riwayat': 'Riwayat Teller'
    };
    document.getElementById('page-title').innerText = titleMap[viewId];

    if (viewId === 'riwayat' || viewId === 'dashboard') {
        loadTransactions();
    }
}

// --- Algoritma Greedy ---
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

// --- Algoritma Merge Sort ---
function mergeSortTransactions(arr) {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const left = arr.slice(0, mid);
    const right = arr.slice(mid);
    return merge(mergeSortTransactions(left), mergeSortTransactions(right));
}

function merge(left, right) {
    let resultArray = [], leftIndex = 0, rightIndex = 0;
    while (leftIndex < left.length && rightIndex < right.length) {
        // Sort descending by timestamp/createdAt
        if (new Date(left[leftIndex].createdAt).getTime() >= new Date(right[rightIndex].createdAt).getTime()) {
            resultArray.push(left[leftIndex]);
            leftIndex++;
        } else {
            resultArray.push(right[rightIndex]);
            rightIndex++;
        }
    }
    return resultArray.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}
// ------------------------------------------

// Search Customer
async function searchCustomer() {
    const input = document.getElementById('quickSearchInput').value;
    if(input.trim() === '') {
        alert('Masukkan ID User atau Nomor Rekening!');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/${input}`);
        if (!response.ok) {
            alert('Nasabah tidak ditemukan');
            return;
        }

        const user = await response.json();
        currentUserId = user.id;

        // Switch to Layanan Nasabah view
        switchView('nasabah', document.querySelectorAll('.nav-item')[1]);
        
        // Show customer info
        document.getElementById('customer-empty').style.display = 'none';
        document.getElementById('customer-info').style.display = 'block';
        
        // Update DOM
        document.getElementById('cName').innerText = user.name;
        document.getElementById('cId').innerText = user.id;
        document.querySelector('.customer-balance .amount').innerText = `Rp ${user.balance.toLocaleString('id-ID')}`;
    } catch (error) {
        console.error('Error fetching user:', error);
        alert('Terjadi kesalahan sistem');
    }
}

// Form Handlers
async function handleDeposit(e) {
    e.preventDefault();
    if (!currentUserId) return alert('Cari nasabah terlebih dahulu!');
    
    const amount = e.target.querySelector('input[type="number"]').value;
    try {
        const response = await fetch(`${API_URL}/deposit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId, amount })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        alert('Transaksi Setor Tunai Berhasil Diproses!');
        e.target.reset();
        
        // Refresh balance
        document.querySelector('.customer-balance .amount').innerText = `Rp ${data.data.user.balance.toLocaleString('id-ID')}`;
    } catch (error) {
        alert(`Gagal: ${error.message}`);
    }
}

async function handleWithdraw(e) {
    e.preventDefault();
    if (!currentUserId) return alert('Cari nasabah terlebih dahulu!');
    
    const amount = e.target.querySelector('input[type="number"]').value;
    try {
        const response = await fetch(`${API_URL}/withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId, amount })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        // --- Eksekusi Algoritma Greedy ---
        const tarikNominal = Number(amount);
        const pecahan = calculateDenominations(tarikNominal);
        
        let pecahanHtml = '<ul style="list-style: none; padding: 0;">';
        for (let key in pecahan) {
            if (key === 'sisa') {
                pecahanHtml += `<li style="padding: 10px; background: rgba(239, 68, 68, 0.1); color: var(--danger); border-radius: 8px; margin-bottom: 8px; font-weight: 500;">
                                    Sisa Koin/Uang Logam: Rp ${pecahan[key].toLocaleString('id-ID')}
                                </li>`;
            } else {
                pecahanHtml += `<li style="padding: 10px; background: rgba(59, 130, 246, 0.1); color: var(--text-main); border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between;">
                                    <span>Pecahan <strong>Rp ${Number(key).toLocaleString('id-ID')}</strong></span>
                                    <span style="font-weight: 600;">${pecahan[key]} Lembar</span>
                                </li>`;
            }
        }
        pecahanHtml += '</ul>';
        
        document.getElementById('greedyResult').innerHTML = pecahanHtml;
        const modal = document.getElementById('greedyModal');
        const content = document.getElementById('greedyModalContent');
        
        modal.style.display = 'flex';
        // Trigger reflow for transition
        void modal.offsetWidth;
        modal.style.opacity = '1';
        if(content) content.style.transform = 'translateY(0)';
        // -----------------------------------

        alert('Transaksi Tarik Tunai Berhasil Diproses!');
        e.target.reset();
        
        // Refresh balance
        document.querySelector('.customer-balance .amount').innerText = `Rp ${data.data.user.balance.toLocaleString('id-ID')}`;
    } catch (error) {
        alert(`Gagal: ${error.message}`);
    }
}

async function handleTransfer(e) {
    e.preventDefault();
    const inputs = e.target.querySelectorAll('input');
    const senderId = inputs[0].value;
    const receiverId = inputs[1].value;
    const amount = inputs[2].value;

    try {
        const response = await fetch(`${API_URL}/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId, receiverId, amount })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        alert('Transfer Dana Nasabah Berhasil Diproses!');
        e.target.reset();
    } catch (error) {
        alert(`Gagal: ${error.message}`);
    }
}

async function loadTransactions() {
    try {
        const response = await fetch(`${API_URL}/transactions`);
        let transactions = await response.json();
        
        // --- Eksekusi Merge Sort (Descending) ---
        transactions = mergeSortTransactions(transactions);
        // ----------------------------------------
        
        let html = '';
        transactions.forEach(trx => {
            const date = new Date(trx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
            let amountHtml = '';
            
            if (trx.type === 'in') {
                amountHtml = `<td style="color: var(--success);">Rp ${trx.amount.toLocaleString('id-ID')}</td><td>-</td>`;
            } else {
                amountHtml = `<td>-</td><td style="color: var(--danger);">Rp ${trx.amount.toLocaleString('id-ID')}</td>`;
            }

            html += `
                <tr>
                    <td>${date}</td>
                    <td>${trx.id.substring(0, 8)}</td>
                    <td>${trx.subtitle || 'System'}</td>
                    <td>${trx.title}</td>
                    ${amountHtml}
                    <td><span class="status success">Sukses</span></td>
                </tr>
            `;
        });
        
        const tableBody = document.querySelector('#view-riwayat tbody');
        if (tableBody) tableBody.innerHTML = html;
        
    } catch (error) {
        console.error('Error fetching transactions:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
});
