@echo off
:: =========================================================================
 Peluncur Satu-Klik Ekosistem DyLeks Luring (Laptop Server Guru)
 Dikelola Oleh: Tim Pengembang DyLeks (TELULANG)
::
 Alasan ('Why'):
   Guru di sekolah 3T tidak perlu mengetik perintah terminal. 
   Cukup klik ganda berkas ini, semua server luring (FastAPI & Next.js) 
   akan menyala di background, browser guru otomatis terbuka ke Dashboard, 
   dan sistem akan menutup port secara otomatis saat selesai.
:: =========================================================================

title Peluncur Server DyLeks Luring
mode con cols=80 lines=25
color 0b

echo =======================================================================
echo              PELUNCUR SERVER LURING DYLEKS (GURU DASHBOARD)
echo =======================================================================
echo.
echo  [System] Menyiapkan server lokal...
echo.

:: Mengambil lokasi folder absolut
set "ROOT_DIR=%~dp0"
set "BE_DIR=%ROOT_DIR%BE"
set "FE_DIR=%ROOT_DIR%FE"

:: 1. Membersihkan proses zombie di port 3003 & 3004 sebelum memulai
echo  [1/4] Membersihkan port 3003 (Frontend) dan 3004 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3003') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3004') do taskkill /F /PID %%a >nul 2>&1
echo       Port berhasil dibersihkan!
echo.

:: 2. Menjalankan Backend FastAPI di latar belakang
echo  [2/4] Menjalankan Backend API (FastAPI) di latar belakang...
start /b cmd /c "cd /d "%BE_DIR%" && python -m uvicorn app.main:app --host 0.0.0.0 --port 3004" >nul 2>&1
echo       Backend berhasil dijalankan!
echo.

:: 3. Menjalankan Frontend Next.js di latar belakang
echo  [3/4] Menjalankan Frontend PWA (Next.js) di latar belakang...
start /b cmd /c "cd /d "%FE_DIR%" && npx next dev -p 3003" >nul 2>&1
echo       Frontend berhasil dijalankan!
echo.

:: 4. Jeda untuk memastikan server up, lalu buka browser otomatis
echo  [4/4] Menunggu server siap dan membuka Dashboard Guru...
timeout /t 5 /nobreak >nul
start http://localhost:3003/dashboard
echo.

cls
echo =======================================================================
echo                  SERVER LURING DYLEKS TELAH AKTIF!
echo =======================================================================
echo.
echo  Status Server:
echo   - Frontend PWA: http://localhost:3003 (Port 3003)
echo   - Backend API : http://localhost:3004 (Port 3004)
echo.
echo  Petunjuk Kelas:
echo   1. Biarkan jendela ini tetap terbuka selama kelas berlangsung.
echo   2. Mintalah siswa menghubungkan HP mereka ke Wi-Fi lokal kelas.
echo   3. Mintalah siswa memindai QR Code dari Dashboard Guru.
echo.
echo =======================================================================
echo  TEKAN TOMBOL APA SAJA PADA JENDELA INI UNTUK MEMATIKAN SERVER DYLEKS
echo =======================================================================
echo.

pause >nul

echo.
echo  [System] Mematikan seluruh server DyLeks secara aman...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3003') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3004') do taskkill /F /PID %%a >nul 2>&1
echo  [System] Selesai. Sampai jumpa di kelas berikutnya!
timeout /t 2 /nobreak >nul
exit
