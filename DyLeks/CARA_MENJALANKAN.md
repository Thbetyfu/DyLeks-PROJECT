# CARA MENJALANKAN PROJECT DYLEKS

> Panduan ini ditujukan untuk **developer/kontributor** yang ingin menjalankan DyLeks
> di lingkungan lokal (laptop/PC). Bukan untuk guru — guru cukup klik `Mulai_DyLeks.bat`.

---

## PRASYARAT (Wajib Dipenuhi Sekali Saja)

Sebelum mulai, pastikan semua software berikut sudah terinstall di laptop:

| Software | Versi Minimum | Link Download |
|---|---|---|
| Python | 3.10+ | https://www.python.org/downloads |
| Node.js | 18+ | https://nodejs.org |
| Git | Terbaru | https://git-scm.com |

Cek apakah sudah terinstall dengan buka **Command Prompt / PowerShell** lalu ketik:

```powershell
python --version
node --version
npm --version
```

---

## LANGKAH 1 — CLONE / BUKA PROJECT

Jika belum punya file project, clone dari repository:

```powershell
git clone <URL_REPOSITORY>
cd DyLeks
```

Jika sudah punya foldernya, cukup buka folder `DyLeks` di terminal.

---

## LANGKAH 2 — SETUP BACKEND (Python / FastAPI)

### 2a. Masuk ke folder Backend

```powershell
cd BE
```

### 2b. Buat Virtual Environment (Opsional tapi Direkomendasikan)

```powershell
python -m venv venv
venv\Scripts\activate
```

> Setelah aktif, di terminal akan muncul prefix `(venv)` di depan cursor.

### 2c. Install semua dependensi Python

```powershell
pip install -r requirements.txt
```

> Proses ini membutuhkan koneksi internet dan mungkin memakan waktu 2-5 menit.

### 2d. Buat file konfigurasi `.env`

```powershell
copy .env.example .env
```

Buka file `.env` dengan teks editor, lalu sesuaikan jika perlu.
Untuk penggunaan dasar (offline/lokal), nilai default sudah cukup.

### 2e. Jalankan Backend Server

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 3004 --reload
```

Backend berhasil berjalan jika muncul pesan:
```
INFO:     Uvicorn running on http://0.0.0.0:3004 (Press CTRL+C to quit)
```

> Terminal ini JANGAN ditutup. Biarkan tetap berjalan.

---

## LANGKAH 3 — SETUP FRONTEND (Next.js)

Buka **terminal baru** (jangan tutup terminal backend), lalu:

### 3a. Masuk ke folder Frontend

```powershell
cd FE
```

> Pastikan posisi sudah di folder `DyLeks/FE`, bukan masih di `DyLeks/BE`.

### 3b. Install dependensi Node.js

```powershell
npm install
```

> Proses ini membutuhkan koneksi internet dan mungkin memakan waktu 1-3 menit.
> Cukup dilakukan sekali, atau jika ada perubahan di `package.json`.

### 3c. Jalankan Frontend (Development Mode)

```powershell
npm run dev
```

Frontend berhasil berjalan jika muncul pesan:
```
- ready started server on 0.0.0.0:3003, url: http://localhost:3003
```

---

## LANGKAH 4 — BUKA APLIKASI DI BROWSER

Buka browser (Chrome/Edge) lalu akses:

```
http://localhost:3003
```

Aplikasi DyLeks sudah siap digunakan.

---

## RINGKASAN PERINTAH (Cheat Sheet)

Jika sudah pernah setup sebelumnya, cukup jalankan ini setiap kali mau buka project:

**Terminal A — Backend:**
```powershell
cd DyLeks\BE
venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 3004 --reload
```

**Terminal B — Frontend:**
```powershell
cd DyLeks\FE
npm run dev
```

**Lalu buka:** `http://localhost:3003`

---

## PORT YANG DIGUNAKAN

| Service | Port | URL |
|---|---|---|
| Backend API (FastAPI) | 3004 | http://localhost:3004 |
| Frontend (Next.js) | 3003 | http://localhost:3003 |
| API Docs (Swagger) | 3004 | http://localhost:3004/docs |

---

## MENJALANKAN UNIT TEST

Untuk memverifikasi semua fungsi backend berjalan normal:

```powershell
cd BE
python -m pytest -v
```

Hasil yang diharapkan: **19 passed, 0 failed**

---

## CARA MENGHENTIKAN SERVER

Tekan `CTRL + C` di masing-masing terminal (Backend dan Frontend) untuk menghentikan server.

---

## KHUSUS GURU — CARA LEBIH MUDAH

Guru tidak perlu mengikuti langkah-langkah di atas. Cukup:

1. Double-klik file **`Mulai_DyLeks.bat`** yang ada di folder utama `DyLeks`
2. Tunggu hingga browser terbuka otomatis
3. Aplikasi siap digunakan

---

## TROUBLESHOOTING

### Error: `python` tidak dikenali
- Pastikan Python sudah terinstall dan sudah ditambahkan ke PATH saat instalasi.
- Coba gunakan `python3` atau `py` sebagai pengganti.

### Error: `npm` tidak dikenali
- Pastikan Node.js sudah terinstall dari https://nodejs.org.
- Restart terminal setelah instalasi.

### Port 3003 atau 3004 sudah dipakai
Matikan proses yang memakai port tersebut:
```powershell
# Cari proses di port 3003
netstat -ano | findstr :3003

# Matikan proses dengan PID yang ditemukan (contoh PID = 12345)
taskkill /PID 12345 /F
```

### Backend error saat start (module not found)
Pastikan virtual environment sudah aktif dan `pip install -r requirements.txt` sudah dijalankan.

### Frontend error `Cannot find module`
Jalankan ulang `npm install` di folder `FE`.

---

## STRUKTUR FOLDER PENTING

```
DyLeks/
├── BE/                     # Backend (Python/FastAPI)
│   ├── app/               # Source code utama
│   ├── tests/             # Unit test
│   ├── requirements.txt   # Dependensi Python
│   └── .env.example       # Template konfigurasi
│
├── FE/                     # Frontend (Next.js)
│   ├── pages/             # Halaman aplikasi
│   ├── components/        # Komponen UI
│   └── package.json       # Dependensi Node.js
│
├── Mulai_DyLeks.bat        # Launcher otomatis (untuk guru)
├── CARA_MENJALANKAN.md     # File ini
└── README.md               # Dokumentasi lengkap project
```

---

*Dibuat untuk project DyLeks — Sistem Deteksi & Intervensi Disleksia Berbasis AI Lokal*
