@echo off
:: =========================================================================
:: Peluncur Satu-Klik Ekosistem DyLeks Luring (Laptop Server Guru)
:: Dikelola Oleh: Tim Pengembang DyLeks (TELULANG)
::
:: Alasan Desain ('Why'):
::   1. Memisahkan layanan peran (Siswa, Guru, Psikolog) sesuai port masing-masing.
::   2. Menyediakan menu pilihan bagi guru/psikolog agar tidak kebingungan.
::   3. Otomatis membersihkan port-port jika terdeteksi zombie process.
:: =========================================================================

title Peluncur Ekosistem DyLeks Luring
mode con cols=90 lines=30
color 0b

set "ROOT_DIR=%~dp0"

:menu
cls
echo =====================================================================================
:: SVG logo description or ASCII Art representation
echo                       EKOSISTEM DYLEKS - DETEKSI DINI LURING
echo =====================================================================================
echo.
echo  Pilih Layanan Yang Ingin Dijalankan:
echo.
echo   [1] Jalankan SEMUA Layanan (Siswa, Guru, Psikolog)
echo   [2] Jalankan Portal Siswa Saja (FE: 3003, BE: 3004)
echo   [3] Jalankan Portal Guru Saja (FE: 3005, BE: 3006)
echo   [4] Jalankan Portal Psikolog Saja (FE: 3007, BE: 3008)
echo   [5] Bersihkan Seluruh Port Zombie (3003-3008)
echo   [6] Keluar
echo.
echo =====================================================================================
set /p pilihan="Masukkan pilihan Anda [1-6]: "

if "%pilihan%"=="1" goto :run_all
if "%pilihan%"=="2" goto :run_siswa
if "%pilihan%"=="3" goto :run_guru
if "%pilihan%"=="4" goto :run_psikolog
if "%pilihan%"=="5" goto :clean_ports
if "%pilihan%"=="6" exit
goto :menu

:clean_ports
cls
echo  [System] Membersihkan port zombie (3003 - 3008)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3003') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3004') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3005') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3006') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3007') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3008') do taskkill /F /PID %%a >nul 2>&1
echo  Status: Port berhasil dibersihkan!
echo.
pause
goto :menu

:run_siswa
cls
echo  [System] Menjalankan Portal Siswa...
:: Clean Siswa Ports
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3003') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3004') do taskkill /F /PID %%a >nul 2>&1

:: Run Siswa BE & FE
start /b cmd /c "cd /d "%ROOT_DIR%Siswa\BE" && python -m uvicorn app.main:app --host 0.0.0.0 --port 3004" >nul 2>&1
start /b cmd /c "cd /d "%ROOT_DIR%Siswa\FE" && npx next dev -p 3003" >nul 2>&1

echo.
echo  Portal Siswa Telah Aktif:
echo   - Frontend PWA Siswa: http://localhost:3003
echo   - Backend API Siswa : http://localhost:3004
echo.
echo  Menunggu server siap...
timeout /t 5 /nobreak >nul
start http://localhost:3003
pause
goto :menu

:run_guru
cls
echo  [System] Menjalankan Portal Guru...
:: Clean Guru Ports
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3005') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3006') do taskkill /F /PID %%a >nul 2>&1

:: Run Guru BE & FE
start /b cmd /c "cd /d "%ROOT_DIR%Guru\BE" && python -m uvicorn app.main:app --host 0.0.0.0 --port 3006" >nul 2>&1
start /b cmd /c "cd /d "%ROOT_DIR%Guru\FE" && npx next dev -p 3005" >nul 2>&1

echo.
echo  Portal Guru Telah Aktif:
echo   - Frontend Dashboard Guru: http://localhost:3005
echo   - Backend API Guru       : http://localhost:3006
echo.
echo  Menunggu server siap...
timeout /t 5 /nobreak >nul
start http://localhost:3005
pause
goto :menu

:run_psikolog
cls
echo  [System] Menjalankan Portal Psikolog...
:: Clean Psikolog Ports
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3007') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3008') do taskkill /F /PID %%a >nul 2>&1

:: Run Psikolog BE & FE
start /b cmd /c "cd /d "%ROOT_DIR%Psikolog\BE" && python -m uvicorn app.main:app --host 0.0.0.0 --port 3008" >nul 2>&1
start /b cmd /c "cd /d "%ROOT_DIR%Psikolog\FE" && npx next dev -p 3007" >nul 2>&1

echo.
echo  Portal Psikolog Telah Aktif:
echo   - Frontend Portal Psikolog: http://localhost:3007
echo   - Backend API Psikolog    : http://localhost:3008
echo.
echo  Menunggu server siap...
timeout /t 5 /nobreak >nul
start http://localhost:3007
pause
goto :menu

:run_all
cls
echo  [System] Menjalankan Seluruh Layanan Ekosistem DyLeks...
:: Clean All Ports
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3003') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3004') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3005') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3006') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3007') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3008') do taskkill /F /PID %%a >nul 2>&1

:: Run All BE & FE
start /b cmd /c "cd /d "%ROOT_DIR%Siswa\BE" && python -m uvicorn app.main:app --host 0.0.0.0 --port 3004" >nul 2>&1
start /b cmd /c "cd /d "%ROOT_DIR%Siswa\FE" && npx next dev -p 3003" >nul 2>&1
start /b cmd /c "cd /d "%ROOT_DIR%Guru\BE" && python -m uvicorn app.main:app --host 0.0.0.0 --port 3006" >nul 2>&1
start /b cmd /c "cd /d "%ROOT_DIR%Guru\FE" && npx next dev -p 3005" >nul 2>&1
start /b cmd /c "cd /d "%ROOT_DIR%Psikolog\BE" && python -m uvicorn app.main:app --host 0.0.0.0 --port 3008" >nul 2>&1
start /b cmd /c "cd /d "%ROOT_DIR%Psikolog\FE" && npx next dev -p 3007" >nul 2>&1

echo.
echo  Seluruh Layanan Berhasil Dijalankan!
echo   - Portal Siswa: http://localhost:3003 (API: 3004)
echo   - Portal Guru : http://localhost:3005 (API: 3006)
echo   - Portal Psikolog: http://localhost:3007 (API: 3008)
echo.
echo  Menunggu server siap...
timeout /t 6 /nobreak >nul
start http://localhost:3003
start http://localhost:3005
start http://localhost:3007
echo.
echo  Tekan tombol apa saja untuk kembali ke Menu Utama (Server tetap berjalan di latar belakang).
pause >nul
goto :menu
