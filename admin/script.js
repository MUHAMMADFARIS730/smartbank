// ------------------------------------------------------------------
// DATABASE MOCK (LOCAL STORAGE)
// ------------------------------------------------------------------
function initDB() {
    if(!localStorage.getItem('sb_system')) {
        const systemData = {
            totalSupply: 1000000000, // 1 Miliar
            reserve: 980000000,
            circulating: 15000000,
            feeAccumulated: 5000000
        };
        localStorage.setItem('sb_system', JSON.stringify(systemData));
    }
    if(!localStorage.getItem('sb_transactions')) {
        const txs = [
            { id: "TRX-101", title: "Pembayaran Checkout", subtitle: "User: USR-092", type: "in", date: new Date(Date.now() - 3600000).toLocaleString(), source: "Marketplace", status: "success", amountVal: 150000 },
            { id: "TRX-102", title: "Potongan Fee Marketplace", subtitle: "Tax/Fee (2%)", type: "fee", date: new Date(Date.now() - 3500000).toLocaleString(), source: "SmartBank", status: "success", amountVal: 3000 },
            { id: "TRX-103", title: "Pengajuan Pinjaman", subtitle: "User: USR-105", type: "out", date: new Date(Date.now() - 86400000).toLocaleString(), source: "Nasabah App", status: "pending", amountVal: 5000000 }
        ];
        localStorage.setItem('sb_transactions', JSON.stringify(txs));
    }
    if(!localStorage.getItem('sb_loans')) {
        const loans = [
            { id: "LOAN-" + Date.now(), userId: "USR-105", amount: 5000000, totalWithInterest: 5500000, status: "pending" },
            { id: "LOAN-" + (Date.now()+1), userId: "USR-202", amount: 15000000, totalWithInterest: 16500000, status: "over_limit" }
        ];
        localStorage.setItem('sb_loans', JSON.stringify(loans));
    }
    if(!localStorage.getItem('sb_users')) {
        const users = [
            { id: "USR-092", name: "Toko Sinar Jaya", type: "Marketplace", balance: 12500000, status: "active" },
            { id: "USR-105", name: "Budi Santoso", type: "Nasabah", balance: 500000, status: "active" },
            { id: "USR-202", name: "Andi Logistik", type: "Logistics", balance: 2000000, status: "active" }
        ];
        localStorage.setItem('sb_users', JSON.stringify(users));
    }
}

initDB();

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

function renderDashboard() {
    const sys = JSON.parse(localStorage.getItem('sb_system'));
    document.getElementById('sys-reserve').textContent = formatRp(sys.reserve);
    document.getElementById('sys-supply').textContent = formatRp(sys.totalSupply);
    document.getElementById('sys-circulating').textContent = formatRp(sys.circulating);
    document.getElementById('sys-fee').textContent = formatRp(sys.feeAccumulated);
    
    const percentage = ((sys.reserve / sys.totalSupply) * 100).toFixed(1);
    document.getElementById('reserve-percentage').innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> ${percentage}% dari Total Supply`;
    
    const circPercentage = ((sys.circulating / sys.totalSupply) * 100).toFixed(1);
    document.getElementById('circulating-percentage').textContent = `${circPercentage}% dari Supply`;
    
    updateDistributionChart(sys);
    renderLedgerMini();
}

// Ledger on Dashboard (Mini)
function renderLedgerMini() {
    const txs = JSON.parse(localStorage.getItem('sb_transactions'));
    const displayTxs = [...txs].reverse().slice(0, 5); // Hanya 5 terbaru
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
            <td style="color: var(--text-muted); font-size: 0.9rem;">${tx.date}</td>
            <td>
                <span style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; font-size: 0.85rem;">
                    ${tx.source}
                </span>
            </td>
            <td>${getStatusLabel(tx.status)}</td>
            <td class="${getAmountClass(tx.type)}">${sign} ${formatRp(tx.amountVal)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Ledger Full Page
function renderLedgerFull() {
    const txs = JSON.parse(localStorage.getItem('sb_transactions'));
    const displayTxs = [...txs].reverse();
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
            <td style="color: var(--text-muted); font-size: 0.9rem;">${tx.date}</td>
            <td>
                <span style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; font-size: 0.85rem;">
                    ${tx.source}
                </span>
            </td>
            <td>${getStatusLabel(tx.status)}</td>
            <td class="${getAmountClass(tx.type)}">${sign} ${formatRp(tx.amountVal)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderLoans() {
    const loans = JSON.parse(localStorage.getItem('sb_loans'));
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

        tr.innerHTML = `
            <td style="padding: 0.75rem;">${loan.userId}</td>
            <td style="padding: 0.75rem; color: var(--text-main); font-weight: 500;">${formatRp(loan.amount)}</td>
            <td style="padding: 0.75rem; color: var(--danger);">${formatRp(loan.totalWithInterest)}</td>
            <td style="padding: 0.75rem;">${actionHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderUsers() {
    const users = JSON.parse(localStorage.getItem('sb_users'));
    const tbody = document.getElementById('users-body');
    if(!tbody) return;

    tbody.innerHTML = '';
    if(users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Belum ada data nasabah</td></tr>';
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
}

function renderSettings() {
    const sys = JSON.parse(localStorage.getItem('sb_system'));
    const inputLimit = document.getElementById('set-supply-limit');
    if(inputLimit) inputLimit.value = sys.totalSupply;
}

// ------------------------------------------------------------------
// ACTIONS (INTEGRASI LOGIC)
// ------------------------------------------------------------------

window.tarikFeeManual = function() {
    if(confirm("Tarik fee admin dari sirkulasi (Simulasi penambahan fee sebesar Rp 50.000)?")) {
        const sys = JSON.parse(localStorage.getItem('sb_system'));
        const txs = JSON.parse(localStorage.getItem('sb_transactions'));
        
        const feeAmount = 50000;
        
        if(sys.circulating < feeAmount) {
            alert("Uang beredar tidak cukup untuk ditarik sebagai fee!");
            return;
        }

        sys.circulating -= feeAmount;
        sys.feeAccumulated += feeAmount;
        
        txs.push({
            id: "TRX-FEE-" + Date.now(),
            title: "Penarikan Fee Sistem",
            subtitle: "Manual by Admin",
            type: "fee",
            date: new Date().toLocaleString(),
            source: "SmartBank",
            status: "success",
            amountVal: feeAmount
        });

        localStorage.setItem('sb_system', JSON.stringify(sys));
        localStorage.setItem('sb_transactions', JSON.stringify(txs));
        
        renderDashboard();
    }
}

window.approveLoan = function(id) {
    const loans = JSON.parse(localStorage.getItem('sb_loans'));
    const sys = JSON.parse(localStorage.getItem('sb_system'));
    const txs = JSON.parse(localStorage.getItem('sb_transactions'));
    
    const loanIndex = loans.findIndex(l => l.id === id);
    if(loanIndex > -1) {
        const loan = loans[loanIndex];
        
        if(sys.reserve < loan.amount) {
            alert("Reserve Bank tidak mencukupi untuk pinjaman ini!");
            return;
        }

        loan.status = 'approved';
        
        sys.reserve -= loan.amount;
        sys.circulating += loan.amount;
        
        const txIndex = txs.findIndex(t => t.title === "Pengajuan Pinjaman" && t.subtitle === "User: " + loan.userId && t.status === "pending");
        if (txIndex > -1) {
            txs[txIndex].status = "success";
        } else {
            txs.push({
                id: "TRX-LOAN-" + Date.now(),
                title: "Pencairan Pinjaman",
                subtitle: "User: " + loan.userId,
                type: "out",
                date: new Date().toLocaleString(),
                source: "SmartBank",
                status: "success",
                amountVal: loan.amount
            });
        }
        
        localStorage.setItem('sb_loans', JSON.stringify(loans));
        localStorage.setItem('sb_system', JSON.stringify(sys));
        localStorage.setItem('sb_transactions', JSON.stringify(txs));
        
        renderLoans();
        alert("Pinjaman disetujui! Dana telah didistribusikan ke circulating.");
    }
};

window.rejectLoan = function(id) {
    if(!confirm("Yakin ingin menolak pinjaman ini?")) return;
    
    const loans = JSON.parse(localStorage.getItem('sb_loans'));
    const txs = JSON.parse(localStorage.getItem('sb_transactions'));
    
    const loanIndex = loans.findIndex(l => l.id === id);
    if(loanIndex > -1) {
        loans[loanIndex].status = 'rejected';
        
        const txIndex = txs.findIndex(t => t.title === "Pengajuan Pinjaman" && t.subtitle === "User: " + loans[loanIndex].userId && t.status === "pending");
        if (txIndex > -1) {
            txs[txIndex].status = "rejected";
        }
        
        localStorage.setItem('sb_loans', JSON.stringify(loans));
        localStorage.setItem('sb_transactions', JSON.stringify(txs));
        renderLoans();
    }
};

window.updateSupplyLimit = function(e) {
    e.preventDefault();
    const newLimit = parseInt(document.getElementById('set-supply-limit').value);
    const sys = JSON.parse(localStorage.getItem('sb_system'));
    
    if(newLimit < sys.circulating) {
        alert("Limit tidak bisa lebih kecil dari uang yang sedang beredar!");
        return;
    }
    
    sys.totalSupply = newLimit;
    sys.reserve = newLimit - sys.circulating - sys.feeAccumulated; // adjust reserve
    
    localStorage.setItem('sb_system', JSON.stringify(sys));
    alert("Total Supply Limit berhasil diperbarui!");
    renderSettings();
};

window.resetDatabase = function() {
    if(confirm("PERINGATAN! Ini akan menghapus semua data (Transaksi, User, Pinjaman) dan me-reset sistem ke default. Lanjutkan?")) {
        localStorage.removeItem('sb_system');
        localStorage.removeItem('sb_transactions');
        localStorage.removeItem('sb_loans');
        localStorage.removeItem('sb_users');
        initDB();
        alert("Database telah di-reset!");
        window.location.reload();
    }
};

// Transfer Form Submit
if(document.getElementById('transferForm')) {
    document.getElementById('transferForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const targetApp = document.getElementById('tf-app').value;
        const targetId = document.getElementById('tf-id').value;
        const amount = parseInt(document.getElementById('tf-amount').value);
        const ref = document.getElementById('tf-ref').value;

        const sys = JSON.parse(localStorage.getItem('sb_system'));
        const txs = JSON.parse(localStorage.getItem('sb_transactions'));
        
        if(sys.reserve < amount) {
            alert("Dana Reserve tidak mencukupi!");
            return;
        }

        sys.reserve -= amount;
        sys.circulating += amount;

        txs.push({
            id: "TRX-TF-" + Date.now(),
            title: "Distribusi Dana",
            subtitle: `Ke: ${targetId} (${targetApp}) - ${ref}`,
            type: "out",
            date: new Date().toLocaleString(),
            source: "SmartBank",
            status: "success",
            amountVal: amount
        });

        localStorage.setItem('sb_system', JSON.stringify(sys));
        localStorage.setItem('sb_transactions', JSON.stringify(txs));
        
        document.getElementById('modalTransfer').classList.remove('active');
        this.reset();
        
        if(document.getElementById('view-dashboard').classList.contains('active')) renderDashboard();
        if(document.getElementById('view-ledger').classList.contains('active')) renderLedgerFull();
        
        alert("Dana berhasil didistribusikan dari Reserve ke Circulating!");
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
        if(!targetId) return; // Ignore links without data-target
        
        e.preventDefault();
        
        // Update active class on nav
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        
        // Hide all views
        document.querySelectorAll('.page-view').forEach(view => view.classList.remove('active'));
        
        // Show target view
        const targetView = document.getElementById(targetId);
        if(targetView) {
            targetView.classList.add('active');
        }

        // Render appropriate data
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
    // Chart Arus Uang (Money Velocity)
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

    // Initialize Distribution Chart
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
    if(distributionChartInstance) {
        distributionChartInstance.data.datasets[0].data = [
            sys.reserve, 
            sys.circulating, 
            sys.feeAccumulated
        ];
        distributionChartInstance.update();
    }
}

// Run On Load
window.addEventListener('DOMContentLoaded', () => {
    initCharts();
    renderDashboard(); // default view
});
