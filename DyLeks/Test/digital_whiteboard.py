import tkinter as tk
from tkinter import filedialog, messagebox
import cv2
import numpy as np
from PIL import Image, ImageDraw
import os
from test_ocr import OCRTester
import threading
from datetime import datetime

class DigitalWhiteboard:
    def __init__(self, root):
        self.root = root
        self.root.title("Digital Whiteboard with OCR Testing")
        self.root.geometry("1400x800")
        
        self.canvas_width = 700
        self.canvas_height = 700
        self.last_x = 0
        self.last_y = 0
        self.drawing = False
        
        self.ocr_tester = OCRTester(input_dir="temp_input", output_dir="output")
        if not os.path.exists("temp_input"):
            os.makedirs("temp_input")
        
        self.image = Image.new('RGB', (self.canvas_width, self.canvas_height), 'white')
        self.draw = ImageDraw.Draw(self.image)
        
        self._setup_ui()
        self.latest_ocr_result = "Belum ada hasil"
    
    def _setup_ui(self):
        main_frame = tk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        left_frame = tk.Frame(main_frame)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        canvas_label = tk.Label(left_frame, text="✏️ Papan Tulis Digital", 
                               font=("Arial", 14, "bold"))
        canvas_label.pack()
        
        self.canvas = tk.Canvas(
            left_frame, 
            width=self.canvas_width, 
            height=self.canvas_height,
            bg='white',
            cursor='cross',
            relief=tk.SUNKEN,
            bd=2
        )
        self.canvas.pack(padx=5, pady=5)
        
        self.canvas.bind('<Button-1>', self._on_button_press)
        self.canvas.bind('<B1-Motion>', self._on_mouse_drag)
        self.canvas.bind('<ButtonRelease-1>', self._on_button_release)
        
        button_frame = tk.Frame(left_frame)
        button_frame.pack(pady=10, fill=tk.X)
        
        self.clear_btn = tk.Button(
            button_frame, 
            text="Clear", 
            command=self._clear_canvas,
            width=15,
            bg="#ff6b6b",
            fg="white",
            font=("Arial", 10, "bold")
        )
        self.clear_btn.pack(side=tk.LEFT, padx=5)
        
        self.analyze_btn = tk.Button(
            button_frame,
            text="Analisis",
            command=self._analyze_drawing,
            width=20,
            bg="#4ecdc4",
            fg="white",
            font=("Arial", 10, "bold")
        )
        self.analyze_btn.pack(side=tk.LEFT, padx=5)
        
        self.save_btn = tk.Button(
            button_frame,
            text="Save",
            command=self._save_drawing,
            width=15,
            bg="#45b7d1",
            fg="white",
            font=("Arial", 10, "bold")
        )
        self.save_btn.pack(side=tk.LEFT, padx=5)
        
        # Right side - OCR Results
        right_frame = tk.Frame(main_frame, relief=tk.SUNKEN, bd=2, bg="#f8f9fa")
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=10)
        
        # Results title
        results_label = tk.Label(
            right_frame, 
            text="Hasil OCR", 
            font=("Arial", 14, "bold"),
            bg="#f8f9fa"
        )
        results_label.pack(pady=10)
        
        self.status_label = tk.Label(
            right_frame,
            text="Status: Siap",
            font=("Arial", 10),
            bg="#f8f9fa",
            fg="#4ecdc4"
        )
        self.status_label.pack(pady=5)
        
        results_scroll_frame = tk.Frame(right_frame, bg="white")
        results_scroll_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        scrollbar = tk.Scrollbar(results_scroll_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.results_text = tk.Text(
            results_scroll_frame,
            font=("Courier", 10),
            yscrollcommand=scrollbar.set,
            bg="white",
            wrap=tk.WORD
        )
        self.results_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.config(command=self.results_text.yview)
        
        self.results_text.insert(tk.END, "📌 Instruksi:\n")
        self.results_text.insert(tk.END, "1. Tulis huruf/angka di papan tulis\n")
        self.results_text.insert(tk.END, "2. Klik 'Analisis dengan OCR'\n")
        self.results_text.insert(tk.END, "3. Lihat hasil pengenalan AI\n\n")
        self.results_text.insert(tk.END, "=" * 35 + "\n\n")
        self.results_text.config(state=tk.DISABLED)
    
    def _on_button_press(self, event):
        self.drawing = True
        self.last_x = event.x
        self.last_y = event.y
    
    def _on_mouse_drag(self, event):
        if self.drawing:
            self.canvas.create_line(
                self.last_x, self.last_y, 
                event.x, event.y,
                fill='black', 
                width=3,
                capstyle=tk.ROUND,
                smooth=tk.TRUE
            )
            
            self.draw.line(
                [self.last_x, self.last_y, event.x, event.y],
                fill='black',
                width=3
            )
            
            self.last_x = event.x
            self.last_y = event.y
    
    def _on_button_release(self, event):
        self.drawing = False
    
    def _clear_canvas(self):
        self.canvas.delete('all')
        self.image = Image.new('RGB', (self.canvas_width, self.canvas_height), 'white')
        self.draw = ImageDraw.Draw(self.image)
        self.status_label.config(text="Status: Canvas dibersihkan ✓", fg="#4ecdc4")
    
    def _analyze_drawing(self):
        self.status_label.config(text="Status: Processing...", fg="#ff9500")
        self.root.update()
        
        thread = threading.Thread(target=self._run_ocr_analysis)
        thread.daemon = True
        thread.start()
    
    def _run_ocr_analysis(self):
        try:
            temp_path = "temp_input/temp_drawing.png"
            self.image.save(temp_path)
            
            output = self.ocr_tester.process_image(temp_path)
            self._update_results(output, temp_path)
            
            self.status_label.config(
                text="Status: Analisis selesai ✓", 
                fg="#51cf66"
            )
            
        except Exception as e:
            self.status_label.config(
                text=f"Status: Error - {str(e)}", 
                fg="#ff6b6b"
            )
            self._append_results(f"Error: {str(e)}")
        
        self.root.update()
    
    def _update_results(self, output, image_path):
        self.results_text.config(state=tk.NORMAL)
        self.results_text.delete('1.0', tk.END)
        
        self.results_text.insert(tk.END, "📊 HASIL OCR ANALYSIS\n")
        self.results_text.insert(tk.END, "=" * 35 + "\n\n")
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.results_text.insert(tk.END, f"⏰ Waktu: {timestamp}\n\n")
        
        if output is None or len(output) == 0:
            self.results_text.insert(tk.END, "⚠️  Tidak ada hasil OCR\n\n")
            self.results_text.insert(tk.END, "Pastikan Anda sudah menulis teks di papan tulis.")
        else:
            for i, res in enumerate(output, 1):
                self.results_text.insert(tk.END, f"📝 Result {i}:\n")
                self.results_text.insert(tk.END, "-" * 35 + "\n")
                
                try:
                    # print dari hasil detail
                    if hasattr(res, 'tables'):
                        for table_idx, table in enumerate(res.tables, 1):
                            self.results_text.insert(tk.END, f"\n  Table {table_idx}:\n")
                            if hasattr(table, 'text'):
                                self.results_text.insert(tk.END, f"  Text: {table.text}\n")
                            if hasattr(table, 'structure'):
                                self.results_text.insert(tk.END, f"  Structure: {table.structure}\n")
                    
                    # kalau ada cells
                    if hasattr(res, 'cells'):
                        self.results_text.insert(tk.END, f"\n  Cells detected: {len(res.cells)}\n")
                        for cell_idx, cell in enumerate(res.cells[:5], 1):  # Show first 5
                            if hasattr(cell, 'text'):
                                self.results_text.insert(tk.END, f"    Cell {cell_idx}: {cell.text}\n")
                    
                except Exception as e:
                    self.results_text.insert(tk.END, f"  Info: {str(res)}\n")
                
                self.results_text.insert(tk.END, "\n")
        
        self.results_text.insert(tk.END, "=" * 35 + "\n")
        self.results_text.insert(tk.END, "Tip: Tulis lebih jelas untuk hasil lebih akurat")
        self.results_text.config(state=tk.DISABLED)
    
    def _append_results(self, text):
        self.results_text.config(state=tk.NORMAL)
        self.results_text.insert(tk.END, text + "\n")
        self.results_text.config(state=tk.DISABLED)
    
    def _save_drawing(self):
        try:
            file_path = filedialog.asksaveasfilename(
                defaultextension=".png",
                filetypes=[("PNG files", "*.png"), ("JPEG files", "*.jpg"), ("All files", "*.*")],
                initialdir="output"
            )
            
            if file_path:
                self.image.save(file_path)
                messagebox.showinfo("Success", f"Gambar disimpan ke:\n{file_path}")
                self.status_label.config(text="Status: Disimpan ✓", fg="#51cf66")
        
        except Exception as e:
            messagebox.showerror("Error", f"Gagal menyimpan: {str(e)}")


def main():
    root = tk.Tk()
    app = DigitalWhiteboard(root)
    root.mainloop()


if __name__ == "__main__":
    main()
