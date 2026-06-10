# 🚀 Panduan Kesiapan Produksi & Roadmap Komersialisasi Massal DyLeks

Dokumen ini menganalisis langkah strategis dan pekerjaan teknis yang wajib dilakukan sebelum DyLeks dilepas ke pasar sebagai produk massal (*production-ready*). Evaluasi ini didasarkan pada karakteristik lapangan daerah 3T (*Zero-Internet, Low-End Devices, Zero-Config Requirement*).

---

## 🛡️ 1. Peningkatan Stabilitas Arsitektur (Edge Server) (SUDAH DIKERJAKAN)

### A. Auto-Start & Process Manager

* **Masalah**: Menjalankan FastAPI (`uvicorn`) dan Next.js (`npm run dev`/`start`) via terminal manual sangat rentan tertutup tidak sengaja oleh guru.
* **Solusi**:
  * Bungkus server backend dan frontend sebagai **Windows Service** (menggunakan NSSM - *Non-Sucking Service Manager*) atau daemon **PM2** yang berjalan otomatis di background begitu laptop server guru menyala.
* **Task**: Buat script installer `.bat` / `.sh` untuk mengonfigurasi startup services secara otomatis.

### B. Captive Portal & DNS Lokal (Zero-IP Config)

* **Masalah**: Guru/orang tua kesulitan mengakses PWA jika harus mengetik alamat IP secara manual (misal: `http://192.168.43.15:3001`).
* **Solusi**:
  * Integrasikan server DNS lokal ringan (seperti *Dnsmasq* atau *CoreDNS*) pada laptop server.
  * Konfigurasikan agar router Wi-Fi lokal merujuk ke laptop server sebagai DNS utama, sehingga pengguna cukup mengetik **`dyleks.id`** atau **`dyleks.local`** pada browser untuk mengakses aplikasi.
* **Task**: Integrasikan konfigurasi DNS lokal ke panduan setup router bawaan paket penjualan.

### C. Optimasi Database SQLite (WAL Mode & Concurrency)

* **Masalah**: SQLite standar mengunci seluruh database saat penulisan (`Write-Lock`), yang dapat menyebabkan *database locked error* jika banyak client PWA mensinkronkan data secara bersamaan.
* **Solusi**:
  * Aktifkan mode **WAL (Write-Ahead Logging)** pada SQLite via SQLAlchemy (`PRAGMA journal_mode=WAL;`). Mode ini mengizinkan pembacaan (*read*) berjalan beriringan dengan penulisan (*write*) tanpa konflik lock.
* **Task**: Tambahkan event listener SQLAlchemy pada `BE/app/core/database.py` untuk mengaktifkan mode WAL saat koneksi diinisialisasi.

---

## 🤖 2. Optimalisasi AI Engine & Portabilitas [SUDAH DIKERJAKAN]

### A. Desktop Launcher & Single-Click Installer

* **Masalah**: Proses instalasi backend Python, dependensi `requirements.txt`, Node.js, dan model Ollama terlalu rumit untuk pengguna awam.
* **Solusi**:
  * Bungkus seluruh aplikasi (Next.js build, FastAPI, SQLite DB, Portable Python, dan ONNX Runtime) dalam satu berkas installer desktop tunggal menggunakan **Electron** atau **Inno Setup**.
  * Gunakan model *embeddable Python* agar dependensi berjalan terisolasi tanpa merusak konfigurasi sistem laptop guru.
* **Task**: Setup konfigurasi packaging Electron/Inno Setup untuk Windows.

### B. Auto-Diagnostics Hardware & Model Fallback

* **Masalah**: Kemampuan perangkat keras laptop guru di daerah 3T sangat bervariasi. Menjalankan model Vision LLaVA pada laptop RAM 4GB tanpa GPU akan menyebabkan *hang*.
* **Solusi**:
  * Buat modul diagnostik saat startup backend untuk mendeteksi kapasitas RAM, keberadaan GPU (CUDA/DirectML), dan kecepatan CPU.
  * Secara dinamis memilih engine: RAM >= 8GB + GPU -> Ollama LLaVA/Phi-3; RAM < 8GB -> ONNX TrOCR + Qwen 1.8B; RAM < 4GB -> Fallback static OCR berbasis CPU ringan.
* **Task**: Buat file `BE/app/services/hardware_diagnostic.py` untuk penentuan model adaptif.

---

## 🔒 3. Keamanan Data & Privasi Siswa

### A. Enkripsi Database SQLite (SQLCipher)

* **Masalah**: SQLite adalah file database mentah yang mudah dibuka oleh siapa saja jika laptop guru hilang atau diakses murid secara sengaja.
* **Solusi**:
  * Migrasi dari SQLite standar ke **SQLCipher** guna mengenkripsi seluruh berkas database lokal (`dyslexiai_local.db`) secara transparan di sisi server.
* **Task**: Pasang modul `pysqlcipher3` dan konfigurasikan *master key* enkripsi acak yang terikat pada ID unik perangkat keras laptop.

### B. Proteksi Jalur Akses API (CORS & IP Pinning)

* **Masalah**: Pengaturan CORS `"Origins": ["*"]` saat ini mengizinkan request dari mana saja. Di lingkungan sekolah, siswa yang jahil dapat memanipulasi API.
* **Solusi**:
  * Batasi CORS hanya pada subnet jaringan lokal kelas (misal: `192.168.x.x`).
  * Tambahkan *rate-limiting* lokal untuk mencegah spamming request foto ke backend.
* **Task**: Konfigurasikan middleware rate-limiting pada FastAPI.

---

## 📱 4. Keandalan PWA & Offline Sync Klien

### A. Migrasi dari LocalStorage ke IndexedDB

* **Masalah**: *LocalStorage* hanya berkapasitas ~5MB. Sesi luring yang menampung banyak foto base64 berisiko memicu *QuotaExceededError*.
* **Solusi**:
  * Gunakan **IndexedDB** (menggunakan library pembungkus seperti `localForage` atau `idb`) yang dapat menampung penyimpanan hingga puluhan persen dari kapasitas penyimpanan disk telepon klien.
* **Task**: Refaktor utilitas `FE/lib/sync_service.ts` untuk menggunakan IndexedDB.

### B. Manajemen Konflik Sinkronisasi (Conflict Resolution)

* **Masalah**: Dua perangkat klien luring melakukan perubahan data siswa yang sama secara bersamaan, menyebabkan konflik data saat disinkronkan.
* **Solusi**:
  * Terapkan strategi sinkronisasi berbasis timestamp dengan skema *Last-Write-Wins (LWW)* atau buat antrean rekonsiliasi manual bagi guru untuk memilih data terbaru.
* **Task**: Tambahkan kolom `client_updated_at` pada profil siswa untuk deteksi konflik sinkronisasi.

---

## 📦 5. Distribusi Offline & Pemeliharaan (Maintenance)

### A. APK Wrapper untuk Android (TWA/Bubblewrap)

* **Masalah**: Di daerah 3T, mengarahkan guru memasang aplikasi via browser chrome ("Add to Home Screen") sering membingungkan secara operasional.
* **Solusi**:
  * Bungkus PWA menjadi paket installer Android (`.apk` asli) menggunakan **Bubblewrap** (Trusted Web Activity). APK dapat disebarkan secara luring lewat Bluetooth atau aplikasi kirim file lokal (ShareIt).
* **Task**: Konfigurasikan build pipeline Bubblewrap untuk memproduksi file APK.

### B. Offline Diagnostics Log Export

* **Masalah**: Ketika terjadi error di lapangan, tim pengembang tidak bisa mengakses log server secara remote karena tiadanya internet.
* **Solusi**:
  * Buat fitur ekspor berkas log terenkripsi di dasbor guru. Guru dapat menyalin log tersebut ke USB flashdisk untuk dikirim saat mendapatkan sinyal seluler di luar area sekolah.
* **Task**: Tambahkan endpoint `GET /api/v1/system/export-logs` yang membungkus error log menjadi zip terenkripsi.
