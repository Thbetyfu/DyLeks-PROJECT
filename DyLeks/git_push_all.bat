@echo off
set /p commit_msg="Masukkan pesan commit: "
if "%commit_msg%"=="" (
    set commit_msg="Update modular components"
)

echo ==============================================
echo MELAKUKAN PUSH PADA SEMUA REPOSITORI DYLEKS
echo ==============================================

echo [1/3] Memproses submodule Siswa...
cd Siswa
git add .
git commit -m "%commit_msg%"
git push origin main
cd ..

echo [2/3] Memproses submodule Guru...
cd Guru
git add .
git commit -m "%commit_msg%"
git push origin main
cd ..

echo [3/3] Memproses submodule Psikolog...
cd Psikolog
git add .
git commit -m "%commit_msg%"
git push origin main
cd ..

echo Memproses repositori utama (DyLeks-PROJECT)...
git add .
git commit -m "%commit_msg%"
git push origin main

echo Selesai! Semua perubahan berhasil di-push.
pause
