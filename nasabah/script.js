const API_URL = 'http://localhost:3000/api/nasabah';
let currentUser = null;
let currentToken = null;

// Check saved session before doing anything
window.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('smartbank_token');
    const savedUser = localStorage.getItem('smartbank_user');
    
    if (!savedToken || !savedUser) {
        window.location.href = 'login.html'; // Redirect to login
        return;
    }

    currentToken = savedToken;
    currentUser = JSON.parse(savedUser);
    initApp();
});

// Logout
document.querySelector('.logout-btn').addEventListener('click', () => {
    localStorage.removeItem('smartbank_token');
    localStorage.removeItem('smartbank_user');
    window.location.href = 'login.html';
});

// Navigation Logic
const navItems = document.querySelectorAll('.nav-item');
const viewSections = document.querySelectorAll('.view-section');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = item.getAttribute('data-target');
        
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        viewSections.forEach(section => {
            section.classList.remove('active');
            if(section.id === targetId) {
                section.classList.add('active');
            }
        });

        if (targetId === 'dashboard') loadDashboard();
        if (targetId === 'history') loadHistory();
    });
});

document.querySelectorAll('.action-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = trigger.getAttribute('data-target');
        const targetNav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
        if(targetNav) targetNav.click();
    });
});

// App Initialization
async function initApp() {
    // Show main app container (if it was hidden)
    const mainApp = document.getElementById('main-app');
    if (mainApp) mainApp.style.display = 'block';

    // Set profile info
    document.querySelector('.profile-info .name').innerText = currentUser.name;
    document.querySelector('.user-profile img').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=3B82F6&color=fff`;
    
    // Load dashboard
    await loadDashboard();
}

// Fetch Dashboard Data
async function loadDashboard() {
    try {
        const res = await fetch(`${API_URL}/dashboard`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (!res.ok) throw new Error('Sesi kedaluwarsa');
        
        const data = await res.json();
        
        // Update balance
        document.querySelector('.balance-card .amount').innerText = `Rp ${data.balance.toLocaleString('id-ID')}`;
        
        // Update recent transactions
        const txContainer = document.querySelector('.transaction-list');
        txContainer.innerHTML = '';
        
        if (data.recentTransactions.length === 0) {
            txContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding: 20px;">Belum ada transaksi</p>';
        } else {
            data.recentTransactions.forEach(tx => {
                const isOut = tx.type === 'out' || tx.type === 'fee';
                const iconClass = isOut ? 'transfer-out' : 'transfer-in';
                const iconFa = isOut ? 'fa-arrow-right' : 'fa-arrow-left';
                const amountClass = isOut ? 'negative' : 'positive';
                const amountPrefix = isOut ? '-' : '+';
                const dateStr = new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' });

                txContainer.innerHTML += `
                    <div class="transaction-item">
                        <div class="tx-info">
                            <div class="tx-icon ${iconClass}"><i class="fas ${iconFa}"></i></div>
                            <div>
                                <h4>${tx.title}</h4>
                                <span class="date">${dateStr}</span>
                            </div>
                        </div>
                        <div class="tx-amount ${amountClass}">${amountPrefix} Rp ${tx.amount.toLocaleString('id-ID')}</div>
                    </div>
                `;
            });
        }
    } catch (err) {
        console.error(err);
        if(err.message === 'Sesi kedaluwarsa') {
            alert('Sesi kedaluwarsa, silakan login kembali.');
            document.querySelector('.logout-btn').click();
        }
    }
}

// Fetch Full History
async function loadHistory() {
    try {
        const res = await fetch(`${API_URL}/transactions`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const transactions = await res.json();
        
        const historySection = document.getElementById('history');
        
        let html = `
            <div class="page-header">
                <h1>Riwayat Transaksi</h1>
                <p>Semua mutasi rekening Anda ada di sini.</p>
            </div>
            <div class="glass-panel">
        `;
        
        if (transactions.length === 0) {
            html += `<p style="text-align:center; padding:40px; color:var(--text-muted);">Belum ada riwayat transaksi.</p>`;
        } else {
            transactions.forEach(tx => {
                const isOut = tx.type === 'out' || tx.type === 'fee';
                const iconClass = isOut ? 'transfer-out' : 'transfer-in';
                const iconFa = isOut ? 'fa-arrow-right' : 'fa-arrow-left';
                const amountClass = isOut ? 'negative' : 'positive';
                const amountPrefix = isOut ? '-' : '+';
                const dateStr = new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });

                html += `
                    <div class="transaction-item" style="padding: 15px; border-bottom: 1px solid var(--glass-border);">
                        <div class="tx-info">
                            <div class="tx-icon ${iconClass}"><i class="fas ${iconFa}"></i></div>
                            <div>
                                <h4>${tx.title}</h4>
                                <span class="date">${tx.subtitle || ''} | ${dateStr}</span>
                            </div>
                        </div>
                        <div class="tx-amount ${amountClass}" style="font-weight:600;">${amountPrefix} Rp ${tx.amount.toLocaleString('id-ID')}</div>
                    </div>
                `;
            });
        }
        
        html += `</div>`;
        historySection.innerHTML = html;
        
    } catch (err) {
        console.error(err);
    }
}

// Transfer Form
document.querySelector('#transfer form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputs = e.target.querySelectorAll('input');
    const receiverId = inputs[0].value.trim();
    const amount = inputs[1].value;

    if (!receiverId || !amount) return alert('Data tidak lengkap');

    const confirmMsg = `Anda akan mentransfer Rp ${Number(amount).toLocaleString('id-ID')} ke ${receiverId}.\nTotal dipotong dari saldo Anda adalah Rp ${(Number(amount) * 1.03).toLocaleString('id-ID')} (termasuk 1% Fee Bank dan 2% Pajak Sistem).\nLanjutkan?`;
    
    if(!confirm(confirmMsg)) return;

    try {
        const res = await fetch(`${API_URL}/transfer`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ receiverId, amount })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        
        alert('Transfer berhasil diproses!');
        e.target.reset();
        document.querySelector('.nav-item[data-target="dashboard"]').click();
    } catch (err) {
        alert('Transfer Gagal: ' + err.message);
    }
});

// Loan Calculation Preview
const loanAmountInput = document.getElementById('loan-amount');
if (loanAmountInput) {
    loanAmountInput.addEventListener('input', (e) => {
        const val = Number(e.target.value) || 0;
        const total = val + (val * 0.10); // +10% Bunga
        document.getElementById('loan-total').innerText = `Rp ${total.toLocaleString('id-ID')}`;
    });
}

// Loan Form
const loanForm = document.querySelector('#loan-form');
if (loanForm) {
    loanForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = document.getElementById('loan-amount').value;

        try {
            const res = await fetch(`${API_URL}/loan`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ amount })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error);
            
            alert(data.message);
            e.target.reset();
            document.getElementById('loan-total').innerText = 'Rp 0';
        } catch (err) {
            alert('Pengajuan Pinjaman Ditolak: ' + err.message);
        }
    });
}
