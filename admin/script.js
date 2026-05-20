// ------------------------------------------------------------------
// API BASE URL
// ------------------------------------------------------------------
const API_URL = 'http://localhost:3000/api/admin';

// ------------------------------------------------------------------
// UTILS
// ------------------------------------------------------------------
const formatRp = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

function getIconClass(type) {
    if(type === 'in') return '<div class="tx-icon tx-in"><i class="fa-solid fa-arrow-down"></i></div>';
    if(type === 'out') return '<div class="tx-icon tx-out"><i class="fa-solid fa-arrow-up"></i></div>';
    return '<div class="tx-icon tx-fee"><i class="fa-solid fa-percent"></i></div>';
}

function getAmountClass(type) {
    if(type === 'in') return 'amount-in';
    return 'amount-out';
}

function getStatusLabel(status) {
    if(status === 'success' || status === 'active') return '<span class="status success">Berhasil</span>';
    if(status === 'approved') return '<span class="status success">Disetujui</span>';
    if(status === 'rejected') return '<span class="status danger">Ditolak</span>';
    if(status === 'over_limit') return '<span class="status danger">Over Limit</span>';
    return '<span class="status pending">Tertunda</span>';
}

// ------------------------------------------------------------------
// RENDER FUNCTIONS
// ------------------------------------------------------------------
let distributionChartInstance = null;
let moneyFlowChartInstance = null;

async function renderDashboard() {
    try {
        const res = await fetch(`${API_URL}/dashboard`);
        const data = await res.json();
        const sys = data.systemState;
        const txs = data.transactions;

        document.getElementById('sys-reserve').textContent = formatRp(sys.reserve);
        document.getElementById('sys-supply').textContent = formatRp(sys.totalSupply);
        document.getElementById('sys-circulating').textContent = formatRp(sys.circulating);
        document.getElementById('sys-fee').textContent = formatRp(sys.feeAccumulated);
        
        const percentage = ((sys.reserve / sys.totalSupply) * 100).toFixed(1);
        document.getElementById('reserve-percentage').innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> ${percentage}% dari Total Supply`;
        
        const circPercentage = ((sys.circulating / sys.totalSupply) * 100).toFixed(1);
        document.getElementById('circulating-percentage').textContent = `${circPercentage}% dari Supply`;
        
        updateDistributionChart(sys);
        renderLedgerMini(txs);
    } catch (e) {
        console.error("Error fetching dashboard:", e);
    }
}

// Ledger on Dashboard (Mini)
function renderLedgerMini(txs) {
    const displayTxs = txs.slice(0, 5); // Hanya 5 terbaru
    const tbody = document.getElementById('ledger-body-mini');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    if(displayTxs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Belum ada transaksi</td></tr>';
        return;
    }

    displayTxs.forEach(tx => {
        const tr = document.createElement('tr');
        const sign = (tx.type === 'out' || tx.type === 'fee') ? '-' : '+';
        tr.innerHTML = `
            <td>
                <div class="tx-details">
                    ${getIconClass(tx.type)}
                    <div>
                        <div class="tx-title">${tx.title}</div>
                        <div class="tx-subtitle">${tx.id} • ${tx.subtitle}</div>
                    </div>
                </div>
            </td>
            <td style="color: var(--text-muted); font-size: 0.9rem;">${new Date(tx.createdAt).toLocaleString('id-ID')}</td>
            <td>
                <span style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; font-size: 0.85rem;">
                    ${tx.source}
                </span>
            </td>
            <td>${getStatusLabel(tx.status)}</td>
            <td class="${getAmountClass(tx.type)}">${sign} ${formatRp(tx.amount)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Ledger Full Page
async function renderLedgerFull() {
    try {
        const res = await fetch(`${API_URL}/dashboard`);
        const data = await res.json();
        const displayTxs = data.transactions;
        const tbody = document.getElementById('ledger-body-full');
        if(!tbody) return;

        tbody.innerHTML = '';
        if(displayTxs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Belum ada transaksi</td></tr>';
            return;
        }

        displayTxs.forEach(tx => {
            const tr = document.createElement('tr');
            const sign = (tx.type === 'out' || tx.type === 'fee') ? '-' : '+';
            tr.innerHTML = `
                <td>
                    <div class="tx-details">
                        ${getIconClass(tx.type)}
                        <div>
                            <div class="tx-title">${tx.title}</div>
                            <div class="tx-subtitle">${tx.id} • ${tx.subtitle}</div>
                        </div>
                    </div>
                </td>
                <td style="color: var(--text-muted); font-size: 0.9rem;">${new Date(tx.createdAt).toLocaleString('id-ID')}</td>
                <td>
                    <span style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; font-size: 0.85rem;">
                        ${tx.source}
                    </span>
                </td>
                <td>${getStatusLabel(tx.status)}</td>
                <td class="${getAmountClass(tx.type)}">${sign} ${formatRp(tx.amount)}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Error fetching ledger:", e);
    }
}

async function renderLoans() {
    try {
        const res = await fetch(`${API_URL}/loans`);
        const loans = await res.json();
        const tbody = document.getElementById('loan-body-full');
        if(!tbody) return;

        tbody.innerHTML = '';
        if(loans.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Belum ada pengajuan pinjaman</td></tr>';
            return;
        }

        loans.forEach(loan => {
            const tr = document.createElement('tr');
            let actionHtml = '';
            
            if(loan.status === 'pending') {
                actionHtml = `
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="approveLoan('${loan.id}')" title="Setujui" style="background: var(--success); color: #fff; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-weight: 600;"><i class="fa-solid fa-check"></i></button>
                        <button onclick="rejectLoan('${loan.id}')" title="Tolak" style="background: rgba(239, 68, 68, 0.2); color: var(--danger); border: 1px solid var(--danger); padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                `;
            } else {
                actionHtml = getStatusLabel(loan.status);
            }

            const userName = loan.user ? loan.user.name : loan.userId;

            tr.innerHTML = `
                <td style="padding: 0.75rem;">${userName} (${loan.userId})</td>
                <td style="padding: 0.75rem; color: var(--text-main); font-weight: 500;">${formatRp(loan.amount)}</td>
                <td style="padding: 0.75rem; color: var(--danger);">${formatRp(loan.totalWithInterest)}</td>
                <td style="padding: 0.75rem;">${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Error fetching loans:", e);
    }
}

async function renderUsers() {
    try {
        const res = await fetch(`${API_URL}/users`);
        const users = await res.json();
        const tbody = document.getElementById('users-body');
        if(!tbody) return;

        tbody.innerHTML = '';
        if(users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Belum ada data nasabah</td></tr>';
            return;
        }

        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${user.id}</strong></td>
                <td>${user.name}</td>
                <td><span style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; font-size: 0.85rem;">${user.type}</span></td>
                <td style="color: var(--primary); font-weight: 600;">${formatRp(user.balance)}</td>
                <td>${getStatusLabel(user.status)}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Error fetching users:", e);
    }
}

async function renderSettings() {
    try {
        const res = await fetch(`${API_URL}/dashboard`);
        const data = await res.json();
        const sys = data.systemState;
        const inputLimit = document.getElementById('set-supply-limit');
        if(inputLimit) inputLimit.value = sys.totalSupply;
    } catch (e) {
        console.error(e);
    }
}

// ------------------------------------------------------------------
// ACTIONS (INTEGRASI LOGIC)
// ------------------------------------------------------------------

window.tarikFeeManual = async function() {
    if(confirm("Tarik fee admin dari sirkulasi (Simulasi penambahan fee sebesar Rp 50.000)?")) {
        const feeAmount = 50000;
        try {
            const res = await fetch(`${API_URL}/fee`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: feeAmount })
            });
            const data = await res.json();
            if(res.ok) {
                alert(data.message);
                renderDashboard();
            } else {
                alert("Error: " + data.error);
            }
        } catch(e) {
            alert("Terjadi kesalahan pada server");
        }
    }
}

window.approveLoan = async function(id) {
    if(!confirm("Setujui pinjaman ini?")) return;
    
    try {
        const res = await fetch(`${API_URL}/loans/${id}/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'approve' })
        });
        const data = await res.json();
        if(res.ok) {
            alert("Pinjaman disetujui! Dana telah didistribusikan ke circulating.");
            renderLoans();
        } else {
            alert("Error: " + data.error);
        }
    } catch (e) {
        alert("Terjadi kesalahan pada server");
    }
};

window.rejectLoan = async function(id) {
    if(!confirm("Yakin ingin menolak pinjaman ini?")) return;
    
    try {
        const res = await fetch(`${API_URL}/loans/${id}/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reject' })
        });
        const data = await res.json();
        if(res.ok) {
            renderLoans();
        } else {
            alert("Error: " + data.error);
        }
    } catch (e) {
        alert("Terjadi kesalahan pada server");
    }
};

window.updateSupplyLimit = function(e) {
    e.preventDefault();
    alert("Maaf, update supply limit belum diimplementasikan di versi Backend ini.");
};

window.resetDatabase = function() {
    alert("Reset database tidak lagi didukung di UI (harus via console DB atau script seeder).");
};

// Transfer Form Submit
if(document.getElementById('transferForm')) {
    document.getElementById('transferForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const targetApp = document.getElementById('tf-app').value;
        const targetId = document.getElementById('tf-id').value;
        const amount = parseInt(document.getElementById('tf-amount').value);
        const ref = document.getElementById('tf-ref').value;

        try {
            const res = await fetch(`${API_URL}/distribute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    amount: amount, 
                    targetEntity: `${targetId} (${targetApp}) - ${ref}` 
                })
            });
            const data = await res.json();
            
            if (res.ok) {
                alert("Dana berhasil didistribusikan dari Reserve ke Circulating!");
                document.getElementById('modalTransfer').classList.remove('active');
                this.reset();
                
                if(document.getElementById('view-dashboard').classList.contains('active')) renderDashboard();
                if(document.getElementById('view-ledger').classList.contains('active')) renderLedgerFull();
            } else {
                alert("Error: " + data.error);
            }
        } catch(e) {
            alert("Terjadi kesalahan pada server");
        }
    });
}


// ------------------------------------------------------------------
// EVENT LISTENERS & SPA NAVIGATION
// ------------------------------------------------------------------

const modalTransfer = document.getElementById('modalTransfer');
const btnKirimDana = document.getElementById('btn-kirim-dana');
const closeModalBtn = document.getElementById('closeModalBtn');

if(btnKirimDana) btnKirimDana.addEventListener('click', () => modalTransfer.classList.add('active'));
if(closeModalBtn) closeModalBtn.addEventListener('click', () => modalTransfer.classList.remove('active'));

document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if(e.target === modal) modal.classList.remove('active');
    });
});

// SPA NAVIGATION LOGIC
document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', function(e) {
        const targetId = this.getAttribute('data-target');
        if(!targetId) return;
        
        e.preventDefault();
        
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        
        document.querySelectorAll('.page-view').forEach(view => view.classList.remove('active'));
        
        const targetView = document.getElementById(targetId);
        if(targetView) {
            targetView.classList.add('active');
        }

        if(targetId === 'view-dashboard') renderDashboard();
        if(targetId === 'view-ledger') renderLedgerFull();
        if(targetId === 'view-loan') renderLoans();
        if(targetId === 'view-users') renderUsers();
        if(targetId === 'view-settings') renderSettings();
    });
});

// ------------------------------------------------------------------
// CHARTS INIT
// ------------------------------------------------------------------
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Outfit', sans-serif";

function initCharts() {
    const ctxFlowElem = document.getElementById('moneyFlowChart');
    if(ctxFlowElem) {
        const ctxFlow = ctxFlowElem.getContext('2d');
        moneyFlowChartInstance = new Chart(ctxFlow, {
            type: 'line',
            data: {
                labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
                datasets: [{
                    label: 'Volume Transaksi (Juta Rp)',
                    data: [120, 190, 150, 220, 180, 280, 250],
                    borderColor: '#00f2fe',
                    backgroundColor: 'rgba(0, 242, 254, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#0a0e17',
                    pointBorderColor: '#00f2fe',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false } },
                    x: { grid: { display: false, drawBorder: false } }
                }
            }
        });
    }

    const ctxDistElem = document.getElementById('distributionChart');
    if(ctxDistElem) {
        const ctxDist = ctxDistElem.getContext('2d');
        distributionChartInstance = new Chart(ctxDist, {
            type: 'doughnut',
            data: {
                labels: ['Bank Reserve', 'Beredar (User)', 'Fee Terkumpul'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#4facfe', '#10b981', '#f59e0b'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true, pointStyle: 'circle' } }
                }
            }
        });
    }
}

function updateDistributionChart(sys) {
    if(distributionChartInstance && sys) {
        distributionChartInstance.data.datasets[0].data = [
            sys.reserve, 
            sys.circulating, 
            sys.feeAccumulated
        ];
        distributionChartInstance.update();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    initCharts();
    renderDashboard();
});
