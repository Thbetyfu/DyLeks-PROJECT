# Panduan Struktur Repositori & Cara Penggunaan DyLeks

Dokumen ini menjelaskan arsitektur baru proyek DyLeks yang telah dibagi menjadi **4 repositori Git terpisah** (1 repositori utama dan 3 submodule peran), lengkap dengan tata cara kloning (*cloning*), pembaharuan (*synchronization*), dan cara melakukan penyimpanan (*pushing*).

---

## 📂 1. Arsitektur Repositori

Proyek DyLeks kini terbagi secara fisik menjadi 4 repositori mandiri pada GitHub:

1.  **DyLeks-PROJECT (Repositori Utama / Root)**  
    *   **URL:** `https://github.com/Thbetyfu/DyLeks-PROJECT.git`  
    *   **Peran:** Bertindak sebagai monorepo jangkar yang merangkum semua komponen. Berisi konfigurasi global, database bersama (`shared_db/`), skrip inisialisasi lokal (`Mulai_DyLeks.bat`), dan penunjuk submodule ke masing-masing repositori peran.
2.  **DYLEKS-SISWA (Submodule Siswa)**  
    *   **URL:** `https://github.com/Thbetyfu/DYLEKS-SISWA.git`  
    *   **Isi:** Seluruh berkas kode program backend (FastAPI) dan frontend (Next.js) khusus portal Siswa.
3.  **DYLEKS-GURU (Submodule Guru)**  
    *   **URL:** `https://github.com/Thbetyfu/DYLEKS-GURU.git`  
    *   **Isi:** Seluruh berkas kode program backend (FastAPI) dan frontend (Next.js) khusus portal Guru.
4.  **DYLEKS-PSIKOLOG (Submodule Psikolog)**  
    *   **URL:** `https://github.com/Thbetyfu/DYLEKS-PSIKOLOG.git`  
    *   **Isi:** Seluruh berkas kode program backend (FastAPI) dan frontend (Next.js) khusus portal Psikolog.

---

## 📥 2. Cara Kloning (Cloning) Proyek

Karena proyek ini menggunakan fitur **Git Submodules**, meng-clone repositori utama secara standar hanya akan mengunduh folder kosong untuk sub-proyek (Siswa, Guru, Psikolog). Gunakan salah satu metode berikut untuk meng-clone seluruh proyek secara utuh:

### Metode A: Kloning Sekaligus (Sangat Direkomendasikan)
Gunakan opsi `--recursive` agar Git secara otomatis mengunduh semua kode dari repositori submodule peran:
```bash
git clone --recursive https://github.com/Thbetyfu/DyLeks-PROJECT.git
```

### Metode B: Kloning Bertahap (Jika Sudah Terlanjur Clone Biasa)
Jika Anda terlanjur melakukan clone tanpa opsi recursive:
1.  Buka terminal di dalam folder proyek hasil clone.
2.  Jalankan perintah berikut untuk menginisialisasi dan menarik data submodule:
    ```bash
    git submodule update --init --recursive
    ```

---

## ⚙️ 3. Cara Mengembangkan & Sinkronisasi Harian

Setiap folder peran (`Siswa/`, `Guru/`, `Psikolog/`) bertindak sebagai repositori Git independen yang berada di dalam folder proyek utama. Untuk mempermudah alur kerja Anda, telah disediakan skrip otomatisasi `.bat` di root proyek.

### Alur Memulai Pengembangan (Menarik Perubahan Terbaru)
Sebelum Anda mulai menulis kode baru, selalu pastikan repositori Anda sinkron dengan cabang utama di GitHub.
*   **Cara Cepat:** Klik dua kali berkas **`git_sync_all.bat`** di root proyek. Skrip ini akan menarik update terbaru dari repositori utama dan ketiga submodule secara otomatis.
*   **Cara Manual:**
    ```bash
    git pull origin main
    git submodule update --remote --merge
    ```

### Alur Menyimpan & Mengunggah Kode (Push ke GitHub)
Ketika Anda selesai membuat fitur baru atau memperbaiki bug, perubahan tersebut harus diunggah ke repositori sub-sistem (misal `DYLEKS-SISWA`) dan repositori root (`DyLeks-PROJECT`).
*   **Cara Cepat:** Klik dua kali berkas **`git_push_all.bat`** di root proyek.
    1.  Skrip akan meminta Anda memasukkan pesan commit (*commit message*).
    2.  Skrip otomatis melakukan `add`, `commit`, dan `push` pada submodule **Siswa**, **Guru**, dan **Psikolog**.
    3.  Skrip otomatis melakukan `add`, `commit`, dan `push` pada **repositori utama** untuk memperbarui penunjuk commit submodule di GitHub.
*   **Cara Manual (Contoh pada modul Siswa):**
    1.  Masuk ke direktori Siswa dan dorong perubahan:
        ```bash
        cd Siswa
        git add .
        git commit -m "Pesan perubahan"
        git push origin main
        cd ..
        ```
    2.  Kembali ke root proyek, lalu commit penunjuk submodule yang baru:
        ```bash
        git add Siswa
        git commit -m "Update submodule Siswa ke commit terbaru"
        git push origin main
        ```

---

## 🔒 4. Keamanan Data & Pengabaian Berkas (.gitignore)

Masing-masing repositori submodule telah dilengkapi dengan berkas `.gitignore` mandiri yang secara otomatis mengabaikan berkas-berkas berikut agar tidak terunggah ke GitHub publik:
*   **Folder dependencies:** `node_modules/` (harus diinstal ulang via `npm install` setelah clone baru).
*   **Build cache:** Folder `.next/` dan `.pytest_cache/`.
*   **Database lokal:** Berkas SQLite seperti `*.db`, `*.db-shm`, dan `*.db-wal` diabaikan, sehingga data murid tidak bocor ke internet.
*   **Kredensial:** Berkas `.env` atau berkas rahasia lokal lainnya.

---

## 📶 5. Skema Port Layanan Lokal (Offline 3T)

Proyek ini dirancang agar berjalan penuh secara offline. Peta port yang terdaftar saat ini adalah:
*   **Portal Siswa:** Frontend (Port `3003`) & Backend (Port `3004`)
*   **Portal Guru:** Frontend (Port `3005`) & Backend (Port `3006`)
*   **Portal Psikolog:** Frontend (Port `3007`) & Backend (Port `3008`)
*   **Database Bersama:** Terletak di folder `shared_db/dyleks_shared.db` yang diakses bersama oleh seluruh layanan backend untuk mendukung integrasi instan data pendaftaran siswa (via QR) dan sinkronisasi luring.
