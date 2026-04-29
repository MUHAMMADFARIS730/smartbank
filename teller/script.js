// Navigation Logic
function switchView(viewId, element) {
    // Update active state in sidebar
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    // Hide all views
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.remove('active');
    });

    // Show target view
    document.getElementById('view-' + viewId).classList.add('active');

    // Update Header Title based on view
    const titleMap = {
        'dashboard': 'Teller Workspace',
        'nasabah': 'Layanan Nasabah (Setor & Tarik)',
        'transfer': 'Transfer Dana Nasabah',
        'riwayat': 'Riwayat Teller'
    };
    document.getElementById('page-title').innerText = titleMap[viewId];
}

// Mock Search Customer
function searchCustomer() {
    const input = document.getElementById('quickSearchInput').value;
    if(input.trim() === '') {
        alert('Masukkan ID User atau Nomor Rekening!');
        return;
    }

    // Switch to Layanan Nasabah view
    switchView('nasabah', document.querySelectorAll('.nav-item')[1]);
    
    // Show customer info, hide empty state
    document.getElementById('customer-empty').style.display = 'none';
    document.getElementById('customer-info').style.display = 'block';
    
    // If they searched a different ID, we could dynamically update the UI here.
    // For now, it shows the mocked Budi Santoso data.
}

// Mock Form Handlers
function handleDeposit(e) {
    e.preventDefault();
    alert('Transaksi Setor Tunai Berhasil Diproses!');
    e.target.reset();
}

function handleWithdraw(e) {
    e.preventDefault();
    alert('Transaksi Tarik Tunai Berhasil Diproses!');
    e.target.reset();
}

function handleTransfer(e) {
    e.preventDefault();
    alert('Transfer Dana Nasabah Berhasil Diproses!');
    e.target.reset();
}
