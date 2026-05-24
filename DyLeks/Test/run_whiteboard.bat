@echo off
REM Script untuk menjalankan Digital Whiteboard dengan OCR Testing

echo.
echo ========================================
echo Digital Whiteboard OCR Testing
echo ========================================
echo.

REM Cek apakah Python terinstall
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python tidak terinstall atau tidak di PATH
    pause
    exit /b 1
)

echo Mengecek dependencies...
pip list | findstr /i "paddleocr" >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing dependencies...
    pip install -r requirements.txt
)

echo.
echo Menjalankan Digital Whiteboard...
echo.
python digital_whiteboard.py

pause
