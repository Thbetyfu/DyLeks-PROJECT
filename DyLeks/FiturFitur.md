# 🚀 Dokumentasi Fitur Ekosistem DyLeks Berbasis Peran (Roles)

DyLeks adalah ekosistem **Edge-AI Offline** yang dirancang khusus untuk memfasilitasi skrining dini dan pembelajaran adaptif bagi anak-anak disleksia di daerah **3T (Tertinggal, Terdepan, dan Terluar)**. Dengan arsitektur *Microservices* yang terbagi menjadi tiga modul utama (**Siswa**, **Guru**, dan **Psikolog**), sistem ini berjalan secara **100% offline** menggunakan jaringan Wi-Fi lokal (*Local Hotspot*).

Berikut adalah detail fitur lengkap untuk masing-masing peran beserta alur logikanya:

---

## 🧒 1. Modul Siswa (Student & Learning Portal)
Modul ini didedikasikan sebagai aplikasi utama yang ramah anak disleksia, berfokus pada stimulasi sensorik, pembelajaran adaptif, dan skrining mandiri.

### A. Kurikulum Orton-Gillingham 5-Level (STEM-Infused)
*   **Fokus:** Membantu perkembangan membaca anak disleksia secara berjenjang dari yang paling dasar hingga tingkat lanjut.
*   **Struktur Level:**
    *   **Level 1 (Huruf Vokal Tunggal):** Pengenalan bunyi dan tulisan vokal dasar (`A`, `I`, `U`, `E`, `O`).
    *   **Level 2 (Suku Kata Dasar KV):** Kombinasi Konsonan-Vokal mudah (`BU-KU`, `MA-MA`, `BO-LA`).
    *   **Level 3 (Suku Kata Kompleks KVK):** Konsonan-Vokal-Konsonan (`BAN`, `MO-BIL`, `RU-MAH`).
    *   **Level 4 (Fonem Digraf & Diftong):** Kombinasi fonem gabungan (`PI-SANG`, `NYA-NYI`, `PAN-TAI`).
    *   **Level 5 (Kata Morfologi STEM):** Kosakata bertema sains, teknologi, rekayasa, dan matematika (`ME-NU-LIS`, `E-NER-GI`, `MAG-NET`).

### B. Gamifikasi "Cari Pasangan Kata" (`Siswa/FE/pages/game.tsx`)
*   **Mekanisme:** Permainan mencocokkan kartu memori berbasis level kurikulum aktif anak.
*   **Audio Multisensori:** Setiap kali kartu diklik, sistem memutar suara pelafalan kata secara lokal menggunakan Text-to-Speech (TTS) Bahasa Indonesia untuk membantu memori pendengaran.
*   **Sistem Reward:** Anak mendapatkan skor, bintang emas (reward modal), dan opsi berlanjut ke level berikutnya secara otomatis setelah menyelesaikan permainan.

### C. Mode Latihan Multisensori (`Siswa/FE/pages/latihan.tsx`)
*   **Alur Soal:** Terdiri dari 10 soal interaktif (8 soal Pilihan Ganda Dengar-Pilih + 2 soal Tulis-Kamera).
*   **Audio Scaffolding:** Suara pemandu luring membantu membacakan instruksi dan petunjuk kata.
*   **Penyederhanaan Cerdas:** Jika anak melakukan kesalahan berulang-ulang, sistem akan memberikan bantuan untuk menjaga kepercayaan diri anak.

### D. Adaptive Dynamic Difficulty Scaling (DDS) & Telemetri Sensor
*   **Pemantauan Real-time:** Backend secara dinamis membaca data sensor penulisan (kecepatan respon, tremor tangan, tingkat ragu-ragu/tekanan).
*   **Status Indikator Grip:** Widget visual di layar latihan yang menampilkan status tremor anak. Lampu status akan berdenyut merah (Danger) jika tremor motorik halus anak tidak stabil (> 0.6) dan kembali hijau jika normal.
*   **Aksi Scaffolding Otomatis:**
    *   `reduce_options`: Mengurangi pilihan ganda dari 4 menjadi 2 pilihan (jawaban benar + 1 pengecoh) disertai banner penyemangat oranye.
    *   `play_audio_hint`: Otomatis memutar audio pelafalan bantuan jika terdeteksi tremor/kelelahan pada genggaman anak disertai banner biru.

### E. Skrining Tulisan Tangan & Dual-Engine AI (`Siswa/FE/pages/screening.tsx`)
*   **Mekanisme:** Anak menulis kata di kertas fisik (menjaga motorik halus) lalu memfotonya menggunakan kamera HP.
*   **Pemrosesan Edge-AI Offline:** Foto dikirim ke laptop server guru lokal, diproses oleh **Ollama Vision (LLaVA/Moondream)** sebagai engine utama, dengan fallback otomatis ke **TrOCR (ONNX Runtime)** jika spesifikasi RAM server terbatas.
*   **Visualisasi Hasil:** SVG bar chart interaktif (`result.tsx` & `summary.tsx`) mendeteksi persentase pola kesalahan disleksia anak seperti:
    *   *Inversion* (Reversal huruf b/d, p/q).
    *   *Transposition* (Urutan huruf tertukar).
    *   *Omission/Insertion* (Huruf hilang/berlebih).

### F. Tracer Kinestetik / Papan Tulis Digital (`Siswa/FE/pages/tracer.tsx`)
*   **Mekanisme:** Latihan menulis/menggambar dengan jari di atas kanvas interaktif (HTML5 Canvas) mengikuti bentuk outline huruf mirip (`b`, `d`, `p`, `q`).
*   **Deteksi Checkpoint & Arah:** Sistem melacak urutan dan arah sentuhan anak pada rute titik checkpoint. Anak wajib menyelesaikan lengkungan lingkaran terlebih dahulu sebelum menarik tiang garis (atau sebaliknya sesuai huruf target).
*   **Haptic Vibration Feedback:** Jika terdeteksi *reversal* atau salah alur coretan, sistem segera menggetarkan perangkat murid (`window.navigator.vibrate([100])`) dan border kanvas berubah merah disertai visual panah bantu warna cyan yang memberi tahu arah coretan yang benar.

### G. Speech AI / Evaluasi Fonologis (`Siswa/FE/pages/speech.tsx` & `Siswa/BE/app/api/v1/speech.py`)
*   **Hybrid Offline Recognition:** PWA menggunakan **Web Speech API** (`webkitSpeechRecognition`) bawaan browser secara luring di perangkat HP siswa untuk mengubah ucapan lisan anak menjadi teks tanpa server overhead.
*   **Evaluasi Fonetik Backend:** Teks dikirim ke backend FastAPI lokal untuk dianalisis kemiripan bunyinya menggunakan algoritma pencocokan fonetik **RapidFuzz** & **Levenshtein editops**.
*   **Klasifikasi Pola Error:** Backend mengukur skor akurasi ucapan dan mengklasifikasikan pola kesulitan disleksia auditori seperti penggantian bunyi konsonan mirip (*substitution*), bunyi hilang (*omission*), sisipan suara (*insertion*), atau suara tertukar (*transposition*).

---

## 👩‍🏫 2. Modul Guru (Teacher Dashboard & AI Copilot)
Modul ini berjalan di laptop utama guru, berfungsi sebagai pusat kendali kelas, database utama, dan asisten pengajaran bertenaga AI.

### A. Dashboard Pemantauan Kelas (`Guru/FE/pages/index.tsx`)
*   **Manajemen Siswa (CRUD):** Guru dapat menambah, menyunting, atau menghapus profil murid di kelas.
*   **Monitor Skrining:** Grafik visual ringkasan status risiko kelas (Tinggi, Sedang, Rendah) untuk memetakan anak yang butuh perhatian khusus.
*   **Riwayat & Log DDS:** Menyimpan skor permainan, data telemetri tremor, serta riwayat hasil tes AI tulisan tangan masing-masing murid.

### B. Proactive AI Orton-Gillingham (OG) Plan Generator
*   **Fitur:** Menghasilkan draf Rencana Pelaksanaan Pembelajaran (RPP) individual berbasis metode Orton-Gillingham sekali klik menggunakan model bahasa kecil (SLM) Ollama secara offline.
*   **Output:** Rekomendasi materi, durasi latihan, dan stimulus sensorik yang cocok berdasarkan pola kesalahan unik siswa yang bersangkutan.

### C. Offline AI Copilot Chat (`Guru/FE/pages/copilot.tsx`)
*   **Fitur:** Chatbot konsultasi inklusi bertenaga AI lokal.
*   **Fungsi:** Membantu guru berkonsultasi mengenai strategi menangani kesulitan belajar murid tertentu tanpa perlu koneksi internet.

### D. Integrasi Catatan Medis Psikolog
*   **Alur:** Setiap kali guru membuka detail siswa di dashboard, sistem melakukan pemanggilan API ke backend untuk mengambil data rekomendasi yang ditulis oleh psikolog mitra.
*   **Visual:** Ditampilkan dalam panel khusus berwarna biru klinis di drawer informasi siswa, berisi diagnosis formal, terapi yang disarankan, dan tanda tangan medis psikolog.

### E. Keamanan Data AES-256 (Windows MachineGuid)
*   Data murid dienkripsi secara transparan menggunakan **AES-256** di database lokal. Kunci dekripsi diturunkan secara unik berdasarkan ID perangkat keras laptop guru, sehingga berkas database (`dyslexiai_local.db`) aman dan tidak bisa dibuka dari komputer luar.

---

## 🩺 3. Modul Psikolog (Clinical & Medical Portal)
Modul khusus yang menjembatani pakar medis/psikolog anak dengan sekolah-sekolah di pelosok 3T guna memberikan rujukan klinis yang tepat.

### A. Autentikasi Keanggotaan STR
*   **Fitur:** Psikolog masuk menggunakan autentikasi akun resmi dan validasi nomor Surat Tanda Registrasi (STR) untuk menjamin validitas rekam medis.

### B. Riwayat Kasus & Telemetri Murid (`Psikolog/FE/pages/index.tsx`)
*   **Fungsi:** Psikolog dapat melihat data mentah hasil pengerjaan game, grafik error tulisan tangan anak, serta log deteksi tremor DDS untuk menilai tingkat kesulitan kognitif anak secara mendalam.

### C. Form Rujukan & Rekomendasi Terapi Klinis
*   **Fitur:** Formulir input formal untuk menuliskan diagnosis klinis, observasi khusus, dan instruksi terapi intervensi.
*   **Sinkronisasi:** Hasil rekomendasi dikirim (`POST /api/v1/psychologist/recommendations`) ke shared database, dan langsung tersinkronisasi ke dashboard guru di kelas untuk ditindaklanjuti.

---

## 📶 Fitur Konektivitas & Jaringan Luring
*   **Dynamic QR Auto-Connect (`Siswa/FE/pages/connect.tsx`):** Murid menyambungkan perangkat HP ke server lokal guru dengan memindai QR Code dinamis yang berubah otomatis setiap 3 detik setelah koneksi berhasil.
*   **Captive Portal Mocking:** Backend FastAPI menyimulasikan respon koneksi Apple (`hotspot-detect`), Google (`generate_204`), dan Windows (`connecttest.txt`) agar HP siswa tidak secara otomatis memutuskan koneksi Wi-Fi luring kelas meskipun tidak ada jaringan internet aktif.
*   **PWA Background Sync:** Data jawaban/foto tulisan tangan murid disimpan sementara di `IndexedDB` browser HP jika sinyal Wi-Fi lokal drop, dan otomatis dikirim saat jaringan terhubung kembali.
