@echo off
:: =========================================================================
:: DyLeks Auto-Start Service Configuration (Windows Task Scheduler Setup)
:: Dikelola Oleh: Tim Pengembang DyLeks (TELULANG)
::
:: Alasan Desain ('Why'):
::   1. Menghindari penutupan jendela cmd secara tidak sengaja oleh guru saat kelas berlangsung.
::   2. Menjalankan Next.js (port 3001) dan FastAPI (port 3002) secara otomatis
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
set "BE_DIR=%ROOT_DIR%BE"
set "FE_DIR=%ROOT_DIR%FE"

:: Mendaftarkan Task Backend FastAPI (Port 3002)
echo [1/2] Mendaftarkan DyLeks Backend API...
schtasks /create /tn "DyLeks_Backend" /tr "cmd.exe /c cd /d \"%BE_DIR%\" && python -m uvicorn app.main:app --host 0.0.0.0 --port 3002" /sc onlogon /rl HIGHEST /f
if %errorLevel% == 0 (
    echo ^> DyLeks Backend berhasil didaftarkan.
) else (
    echo ^> GAGAL mendaftarkan Backend. Pastikan Python terdaftar di PATH.
)
echo.

:: Mendaftarkan Task Frontend Next.js PWA (Port 3001)
echo [2/2] Mendaftarkan DyLeks Frontend PWA...
schtasks /create /tn "DyLeks_Frontend" /tr "cmd.exe /c cd /d \"%FE_DIR%\" && npm run dev" /sc onlogon /rl HIGHEST /f
if %errorLevel% == 0 (
    echo ^> DyLeks Frontend berhasil didaftarkan.
) else (
    echo ^> GAGAL mendaftarkan Frontend. Pastikan Node/NPM terdaftar di PATH.
)
echo.

echo =========================================================
echo Layanan berhasil dikonfigurasi!
echo Server akan otomatis berjalan di background saat komputer dinyalakan/login.
echo Anda dapat mematikan proses ini kapan saja melalui Task Manager.
echo =========================================================
pause
goto :start_menu

:uninstall_services
cls
echo [System] Menghapus layanan latar belakang DyLeks...
echo.

:: Menghapus Backend Task
schtasks /delete /tn "DyLeks_Backend" /f >nul 2>&1
if %errorLevel% == 0 (
    echo ^> DyLeks Backend berhasil dihapus.
) else (
    echo ^> Layanan DyLeks Backend memang tidak terdaftar.
)

:: Menghapus Frontend Task
schtasks /delete /tn "DyLeks_Frontend" /f >nul 2>&1
if %errorLevel% == 0 (
    echo ^> DyLeks Frontend berhasil dihapus.
) else (
    echo ^> Layanan DyLeks Frontend memang tidak terdaftar.
)
echo.

echo =========================================================
echo Seluruh layanan auto-start DyLeks berhasil dihapus!
echo =========================================================
pause
goto :start_menu
