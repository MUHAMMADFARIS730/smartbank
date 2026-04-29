# Visualisasi Workflow Role SmartBank

Berikut adalah kode Graphviz (`.dot`) untuk memvisualisasikan alur kerja dan interaksi antara **Admin**, **Teller**, dan **Nasabah** dengan sistem sentral (Single Source of Truth) dalam ekosistem SmartBank.

Anda dapat memvisualisasikan kode ini dengan cara:
1. Meng-copy kode di bawah ini dan mem-paste nya di [Graphviz Online](https://dreampuf.github.io/GraphvizOnline/).
2. Menggunakan ekstensi VS Code seperti **Graphviz Interactive Preview** atau **PlantUML**.

```dot
digraph SmartBankRoles {
    rankdir=LR;
    node [shape=box, style="filled,rounded", fontname="Arial", margin=0.2];
    edge [fontname="Arial", fontsize=10, color="#666666"];

    // Data Store (Single Source of Truth)
    Database [shape=cylinder, label="SmartBank Ledger\n(Single Source of Truth)", fillcolor="#e2e8f0", color="#475569", penwidth=2];

    subgraph cluster_nasabah {
        label="📱 Nasabah App";
        style=filled;
        color="#fef3c7";
        fontname="Arial bold";
        
        N_CekSaldo [label="Cek Saldo", fillcolor="#fde68a"];
        N_Transfer [label="Transfer & Top-up", fillcolor="#fde68a"];
        N_LoanReq [label="Ajukan Pinjaman", fillcolor="#fde68a"];
    }

    subgraph cluster_teller {
        label="👨‍💼 Teller Workspace";
        style=filled;
        color="#d1fae5";
        fontname="Arial bold";
        
        T_Search [label="Cari Nasabah", fillcolor="#a7f3d0"];
        T_SetorTarik [label="Setor & Tarik Tunai", fillcolor="#a7f3d0"];
        T_Transfer [label="Bantu Transfer Dana", fillcolor="#a7f3d0"];
    }

    subgraph cluster_admin {
        label="🏢 Admin Dashboard (Core)";
        style=filled;
        color="#e0f2fe";
        fontname="Arial bold";
        
        A_Dashboard [label="Monitor Money Supply\n(Reserve, Circulating, Fee)", fillcolor="#bae6fd"];
        A_LoanVal [label="Validasi Pinjaman", fillcolor="#bae6fd"];
        A_Distribute [label="Distribusi Dana (Manual)", fillcolor="#bae6fd"];
        A_Fee [label="Tarik Fee Transaksi", fillcolor="#bae6fd"];
    }

    // Interaksi Nasabah
    N_Transfer -> Database [label=" Catat Mutasi & Update Saldo"];
    N_CekSaldo -> Database [label=" Baca Saldo Terkini", style=dashed, dir=back];
    
    // Interaksi Nasabah Fisik dengan Teller
    NasabahFisik [shape=ellipse, label="Nasabah\n(Cabang Bank)", fillcolor="#f3f4f6"];
    NasabahFisik -> T_Search [label=" ID/Rekening"];
    NasabahFisik -> T_SetorTarik [label=" Serahkan/Ambil Tunai"];
    
    // Interaksi Teller
    T_Search -> Database [label=" Query Data Nasabah", style=dashed];
    T_SetorTarik -> Database [label=" Update Saldo Tunai & Ledger"];
    T_Transfer -> Database [label=" Proses Pindah Buku"];

    // Interaksi Admin & Alur Kompleks
    N_LoanReq -> A_LoanVal [label=" Masuk Antrean (Pending)"];
    A_LoanVal -> Database [label=" Jika Approve: Reserve turun,\nCirculating naik, Catat Ledger"];
    A_Distribute -> Database [label=" Reserve -> Entitas Luar/Nasabah"];
    A_Fee -> Database [label=" Circulating -> Fee Bank"];
    
    // Tarik data untuk dashboard
    Database -> A_Dashboard [label=" Agregasi Data", style=dashed];
}
```

## Penjelasan Singkat Alur
1. **Single Source of Truth**: Semua perubahan mutasi (Tarik, Setor, Transfer) baik dari **Nasabah App** maupun **Teller Workspace** bermuara langsung pada satu *database* (buku besar).
2. **Validasi Admin**: Pengajuan pinjaman dari Nasabah tidak langsung mengubah saldo, tetapi mengantre ke **Admin Dashboard** untuk divalidasi. Jika disetujui, dana *Reserve* bank berkurang dan disalurkan menjadi *Circulating* (uang beredar).
3. **Pengelolaan Makro**: Admin bertindak layaknya bank sentral; mengatur supply uang, mengumpulkan fee transaksi, serta mengawasi kelancaran sistem dari dashboard terpadu.
