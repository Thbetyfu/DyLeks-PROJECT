@echo off
:: =========================================================================
:: DyLeks Auto-Start Service Configuration (Windows Task Scheduler Setup)
:: Dikelola Oleh: Tim Pengembang DyLeks (TELULANG)
::
:: Alasan Desain ('Why'):
::   1. Menghindari penutupan jendela cmd secara tidak sengaja oleh guru saat kelas berlangsung.
::   2. Menjalankan Next.js (port 3003) dan FastAPI (port 3004) secara otomatis
::      begitu guru login ke sistem operasi Windows.
::   3. Tanpa dependensi tools eksternal (menggunakan Task Scheduler bawaan Windows).
:: =========================================================================

title DyLeks Service Manager

:: 1. Auto-Elevation: Meminta Hak Akses Administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :start_menu
) else (
    echo [System] Meminta hak akses administrator untuk mendaftarkan layanan Windows...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

:start_menu
cls
echo =========================================================
echo       DyLeks Edge Server - Auto-Start Service Manager
echo =========================================================
echo.
echo [1] Pasang Layanan Auto-Start (Windows Task Scheduler)
echo [2] Hapus Layanan Auto-Start (Uninstall Services)
echo [3] Keluar
echo.
set /p pilihan="Pilih menu [1-3]: "

if "%pilihan%"=="1" goto :install_services
if "%pilihan%"=="2" goto :uninstall_services
if "%pilihan%"=="3" exit
goto :start_menu

:install_services
cls
echo [System] Memulai instalasi layanan latar belakang DyLeks...
echo.

:: Mengambil direktori absolut dari skrip ini
set "ROOT_DIR=%~dp0"
set "SISWA_BE=%ROOT_DIR%Siswa\BE"
set "SISWA_FE=%ROOT_DIR%Siswa\FE"
set "GURU_BE=%ROOT_DIR%Guru\BE"
set "GURU_FE=%ROOT_DIR%Guru\FE"
set "PSI_BE=%ROOT_DIR%Psikolog\BE"
set "PSI_FE=%ROOT_DIR%Psikolog\FE"

:: 1. Portal Siswa (3003, 3004)
echo [1/6] Mendaftarkan DyLeks Siswa Backend API (Port 3004)...
schtasks /create /tn "DyLeks_Siswa_Backend" /tr "cmd.exe /c cd /d \"%SISWA_BE%\" && python -m uvicorn app.main:app --host 0.0.0.0 --port 3004" /sc onlogon /rl HIGHEST /f
echo [2/6] Mendaftarkan DyLeks Siswa Frontend PWA (Port 3003)...
schtasks /create /tn "DyLeks_Siswa_Frontend" /tr "cmd.exe /c cd /d \"%SISWA_FE%\" && npm run dev" /sc onlogon /rl HIGHEST /f

:: 2. Portal Guru (3005, 3006)
echo [3/6] Mendaftarkan DyLeks Guru Backend API (Port 3006)...
schtasks /create /tn "DyLeks_Guru_Backend" /tr "cmd.exe /c cd /d \"%GURU_BE%\" && python -m uvicorn app.main:app --host 0.0.0.0 --port 3006" /sc onlogon /rl HIGHEST /f
echo [4/6] Mendaftarkan DyLeks Guru Frontend Dashboard (Port 3005)...
schtasks /create /tn "DyLeks_Guru_Frontend" /tr "cmd.exe /c cd /d \"%GURU_FE%\" && npm run dev" /sc onlogon /rl HIGHEST /f

:: 3. Portal Psikolog (3007, 3008)
echo [5/6] Mendaftarkan DyLeks Psikolog Backend API (Port 3008)...
schtasks /create /tn "DyLeks_Psikolog_Backend" /tr "cmd.exe /c cd /d \"%PSI_BE%\" && python -m uvicorn app.main:app --host 0.0.0.0 --port 3008" /sc onlogon /rl HIGHEST /f
echo [6/6] Mendaftarkan DyLeks Psikolog Frontend (Port 3007)...
schtasks /create /tn "DyLeks_Psikolog_Frontend" /tr "cmd.exe /c cd /d \"%PSI_FE%\" && npm run dev" /sc onlogon /rl HIGHEST /f

echo.
echo =========================================================
echo Seluruh 6 layanan auto-start DyLeks berhasil dikonfigurasi!
echo Server akan otomatis berjalan di background saat komputer dinyalakan/login.
echo Anda dapat memantau/menghentikan proses ini melalui Task Manager.
echo =========================================================
pause
goto :start_menu

:uninstall_services
cls
echo [System] Menghapus layanan latar belakang DyLeks...
echo.

:: Menghapus Siswa Tasks
schtasks /delete /tn "DyLeks_Siswa_Backend" /f >nul 2>&1
schtasks /delete /tn "DyLeks_Siswa_Frontend" /f >nul 2>&1

:: Menghapus Guru Tasks
schtasks /delete /tn "DyLeks_Guru_Backend" /f >nul 2>&1
schtasks /delete /tn "DyLeks_Guru_Frontend" /f >nul 2>&1

:: Menghapus Psikolog Tasks
schtasks /delete /tn "DyLeks_Psikolog_Backend" /f >nul 2>&1
schtasks /delete /tn "DyLeks_Psikolog_Frontend" /f >nul 2>&1

echo.
echo =========================================================
echo Seluruh layanan latar belakang DyLeks berhasil dihapus!
echo =========================================================
pause
goto :start_menu
