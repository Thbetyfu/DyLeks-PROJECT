@echo off
echo ==============================================
echo SINKRONISASI SEMUA REPOSITORI DYLEKS
echo ==============================================

echo [1/4] Menarik update proyek utama (DyLeks-PROJECT)...
git pull origin main

echo [2/4] Sinkronisasi Submodule Siswa (DYLEKS-SISWA)...
cd Siswa
git pull origin main
cd ..

echo [3/4] Sinkronisasi Submodule Guru (DYLEKS-GURU)...
cd Guru
git pull origin main
cd ..

echo [4/4] Sinkronisasi Submodule Psikolog (DYLEKS-PSIKOLOG)...
cd Psikolog
git pull origin main
cd ..

echo Memperbarui penunjuk submodule di repositori utama...
git submodule update --init --recursive --remote
echo Selesai! Semua repositori telah ter-update dengan cabang main terbaru.
pause
