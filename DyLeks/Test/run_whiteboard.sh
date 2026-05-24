#!/bin/bash
# Script untuk menjalankan Digital Whiteboard dengan OCR Testing

echo "========================================="
echo "Digital Whiteboard OCR Testing"
echo "========================================="
echo ""

# Cek apakah Python terinstall
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 tidak terinstall"
    exit 1
fi

echo "Mengecek dependencies..."
pip3 list | grep paddleocr > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Installing dependencies..."
    pip3 install -r requirements.txt
fi

echo ""
echo "Menjalankan Digital Whiteboard..."
echo ""
python3 digital_whiteboard.py
