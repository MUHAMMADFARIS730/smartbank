# Bab 5: Kesimpulan

Penerapan algoritma strategis yang terstruktur di dalam ekosistem **SmartBank** memastikan kesiapan bank dalam menghadapi tantangan industri finansial modern. Pendekatan pemisahan beban kerja komputasi pada arsitektur perangkat lunak sangatlah penting:

1. **Sisi Nasabah (Customer App)** difokuskan pada efisiensi string matching menggunakan algoritma **Knuth-Morris-Pratt (KMP)**. Ini memberikan pengalaman UX pencarian yang instan dan mulus pada perangkat klien tanpa membebani thread utama.
2. **Sisi Teller (Teller App)** difokuskan pada stabilitas dan optimalisasi numerik melalui perpaduan **Greedy Algorithm** untuk akurasi denominasi pecahan uang secara dinamis, dan **Merge Sort** untuk stabilitas pengurutan antrean fisik.
3. **Sisi Admin & Server** difokuskan pada pemrosesan volume data masif (Big Data) dan keamanan graf data. Penggunaan **BFS & DFS** pada pemetaan jaringan penipuan serta pendekatan **Divide & Conquer Parallel** di Node.js mengamankan bank dari risiko sistem overload dan risiko *fraud* yang tersembunyi.

Secara keseluruhan, integrasi erat dari teknologi JavaScript terspesialisasi mulai dari frontend hingga backend ini menjadikan sistem *SmartBank* sangat kokoh, skalabel, efisien, dan aman untuk beroperasi di bawah pengawasan regulasi finansial yang ketat.
