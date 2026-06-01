# DyLeks Development Roadmap

**Ekosistem Edge-AI Offline & PWA Multi-Device untuk Skrining Dini serta Pembelajaran Adaptif Multisensori bagi Anak Disleksia di Daerah 3T**

---

## 📋 Ringkasan Eksekutif

Roadmap pengembangan DyLeks dirancang dalam **4 fase utama** dengan durasi kuartal per fase, mencakup infrastruktur backend, frontend PWA, pipeline ML, dan integrasi end-to-end. Target akhir adalah sistem siap implementasi di sekolah-sekolah pedalaman 3T.

---

## 🎯 Fase 1: Foundation & Core Infrastructure (Q1 - Januari hingga Maret 2026)

### Tujuan Fase
Membangun fondasi teknis yang kokoh untuk komunikasi multi-device lokal dan database management.

### KPI Keberhasilan Fase 1
- Backend FastAPI dapat dijalankan stabil di laptop server lokal tanpa error startup.
- Database SQLite berhasil diinisialisasi dan bisa menyimpan serta membaca data dasar.
- Endpoint screening v1 merespons request dengan format output yang konsisten.
- Minimal 1 perangkat client berhasil register ke server lokal dan lolos health check.

### Syarat Lanjut ke Fase 2
- Struktur backend inti sudah selesai dan bisa dipakai untuk alur data dasar.
- Skema database final sudah tervalidasi dan terdokumentasi.
- Endpoint utama untuk screening dan device registration sudah berjalan.
- Tidak ada error kritis pada alur start server, koneksi lokal, dan penyimpanan data.

### Deliverables

#### 1.1 Backend FastAPI Server Setup
- **File Target:** `BE/app/main.py`, `BE/app/core/config.py`
- **Task Detail:**
  - Inisialisasi project FastAPI dengan struktur modular
  - Konfigurasi CORS untuk request lintas device lokal
  - Setup environment variables (DB path, port, server mode)
  - Implementasi error handling dan logging global
- **Dependencies:** FastAPI, Uvicorn, Python 3.9+
- **Status:** 🔄 Development
- **Owner:** Backend Team

#### 1.2 SQLite Local Database Schema
- **File Target:** `BE/app/models/`, `docs/db_schema.sql`
- **Task Detail:**
  - Desain skema database ORM (User, ChildProfile, ScreeningSession, ExerciseProgress)
  - Implementasi migration scripts untuk inisialisasi DB
  - Setup indexing untuk performa query anak/sesi
  - Dokumentasi relasi tabel di `docs/db_schema.sql`
- **Tables Required:**
  - `users` (guru/admin)
  - `child_profiles` (data anak)
  - `screening_sessions` (hasil skrining)
  - `exercise_progress` (tracking belajar)
  - `risk_assessments` (analisis risiko)
- **Status:** 🔄 Development
- **Owner:** Database Team

#### 1.3 API Endpoints Screening v1
- **File Target:** `BE/app/api/v1/screening.py`
- **Task Detail:**
  - **POST /api/v1/screening/start** - Mulai sesi skrining baru
    - Input: `child_id`, `level` (1-5)
    - Output: `session_id`, `prompt_text`, `image_url`
  - **POST /api/v1/screening/submit** - Submit jawaban tulis tangan anak
    - Input: `session_id`, `image_base64`
    - Output: `ocr_result`, `accuracy_score`
  - **GET /api/v1/screening/summary/{child_id}** - Ringkasan hasil skrining
    - Output: `risk_score`, `error_patterns`, `next_level_recommendation`
- **Status:** 🎯 Planning
- **Owner:** Backend Team

#### 1.4 Network Discovery & Device Registration
- **File Target:** `BE/app/services/network_service.py`
- **Task Detail:**
  - Implementasi endpoint `/api/v1/devices/register` untuk client PWA self-register ke server lokal
  - Tracking perangkat aktif yang terhubung ke server
  - Setup health check endpoint untuk verifikasi koneksi
- **Status:** 🎯 Planning
- **Owner:** Backend Team

---

## 📱 Fase 2: Frontend PWA & User Interfaces (Q2 - April hingga Juni 2026)

### Tujuan Fase
Membangun aplikasi frontend responsif sebagai PWA dengan antarmuka ramah pengguna (anak disleksia dan guru).

### KPI Keberhasilan Fase 2
- PWA dapat di-install dan dibuka dari browser mobile tanpa ketergantungan internet.
- Seluruh halaman inti tampil dengan layout responsif di laptop dan smartphone.
- Alur screening, listen card, tracer, dashboard, dan summary dapat diakses tanpa error UI kritis.
- Caching offline berjalan untuk aset inti dan halaman yang sering dipakai.

### Syarat Lanjut ke Fase 3
- Semua antarmuka utama sudah selesai dan bisa dipakai end-to-end.
- Integrasi frontend ke backend berjalan di jaringan lokal.
- Tidak ada bug blocker pada navigasi, input, audio playback, dan tampilan hasil.
- PWA sudah lolos uji dasar installability dan offline behavior.

### Deliverables

#### 2.1 Next.js PWA Core Setup
- **File Target:** `FE/next.config.js`, `FE/public/manifest.json`
- **Task Detail:**
  - Konfigurasi Next.js 14 dengan TypeScript support
  - Setup PWA plugin (next-pwa) untuk offline functionality
  - Implementasi service worker untuk caching strategi
  - Konfigurasi manifest.json untuk install prompt
- **Status:** 🎯 Planning
- **Owner:** Frontend Team

#### 2.2 Screening Interface (`FE/pages/screening.tsx`)
- **File Target:** `FE/pages/screening.tsx`, `FE/components/PhotoCapture.tsx`
- **Task Detail:**
  - Halaman ambil foto tulisan tangan anak (menggunakan camera input)
  - Camera preview dengan guidance visual
  - Button untuk capture + submit
  - Loading state saat OCR diproses
  - Display hasil OCR dengan confidence score
- **UI Features:**
  - Glassmorphic design ramah anak disleksia
  - Font dyslexia-friendly (OpenDyslexic)
  - Color contrast WCAG AA compliant
- **Status:** 🎯 Planning
- **Owner:** Frontend Team

#### 2.3 Listen Card Interface (`FE/pages/latihan.tsx`)
- **File Target:** `FE/pages/latihan.tsx`, `FE/components/ListenCard.tsx`
- **Task Detail:**
  - Audio playback dengan visual timing indicator
  - Card flip animation saat audio dimulai
  - Textbox input untuk siswa mengetik ulang apa yang didengar
  - Realtime feedback (benar/salah)
  - Progression tracker (Level 1-5)
- **Audio Integration:**
  - Fetch audio dari server backend (`gen_audio.py`)
  - Local caching untuk offline play
- **Status:** 🎯 Planning
- **Owner:** Frontend Team

#### 2.4 Kinesthetic Tracer Digital Whiteboard (`FE/pages/tracer.tsx`)
- **File Target:** `FE/pages/tracer.tsx`, `FE/components/Canvas.tsx`
- **Task Detail:**
  - HTML5 Canvas untuk stroke tracking
  - Implementasi Pointer Events API untuk capture koordinat + pressure
  - Display target huruf dengan outline tipis
  - Real-time stroke direction visualization
  - Feedback interaktif untuk arah stroke salah
- **Technical:**
  - Canvas drawing library (Fabric.js atau Konva.js)
  - Pressure sensitivity detection
  - Stroke data serialization ke JSON untuk backend analysis
- **Status:** 🎯 Planning
- **Owner:** Frontend Team

#### 2.5 Teacher Dashboard (`FE/pages/index.tsx`)
- **File Target:** `FE/pages/index.tsx`, `FE/components/Dashboard.tsx`
- **Task Detail:**
  - Real-time monitoring list siswa yang sedang tes
  - Progress bar per siswa (% soal selesai)
  - Risk score card per anak (Rendah/Sedang/Tinggi)
  - Quick stats (total anak, sedang tes, sudah selesai)
  - Live feed error patterns detected
- **Status:** 🎯 Planning
- **Owner:** Frontend Team

#### 2.6 Summary & Result Page (`FE/pages/summary.tsx`)
- **File Target:** `FE/pages/summary.tsx`, `FE/components/RiskAnalysis.tsx`
- **Task Detail:**
  - Visualisasi hasil skrining (chart, bar graph)
  - Error pattern breakdown (reversal, omission, dll)
  - Rekomendasi next level
  - Print-friendly report untuk orang tua/kepala sekolah
- **Charts:**
  - Accuracy per level (Chart.js atau Recharts)
  - Error type frequency distribution
- **Status:** 🎯 Planning
- **Owner:** Frontend Team

#### 2.7 Gamification & Reward System (`FE/pages/game.tsx`)
- **File Target:** `FE/pages/game.tsx`, `FE/components/GameBoard.tsx`
- **Task Detail:**
  - Mini game berbasis level untuk memperkuat latihan membaca, menulis, dan tracing
  - Reward system berupa poin, badge, dan progress star setelah menyelesaikan tugas
  - Mode tantangan ringan untuk menjaga motivasi anak tanpa membuat beban kognitif berlebihan
  - Feedback visual dan audio yang positif saat jawaban benar atau sesi selesai
  - Dashboard progres sederhana untuk guru agar bisa melihat motivasi dan partisipasi anak
- **Game Modes:**
  - Matching huruf atau suku kata
  - Tebak kata dari audio
  - Trace the letter challenge
  - Streak challenge harian
- **Status:** 🎯 Planning
- **Owner:** Frontend Team

---

## 🤖 Fase 3: AI Services & Model Integration (Q3 - Juli hingga September 2026)

### Tujuan Fase
Integrasi model AI lokal untuk OCR, text matching, dan pedagogical recommendations.

### KPI Keberhasilan Fase 3
- Model TrOCR berhasil diekspor ke ONNX dan dapat di-load oleh service lokal.
- OCR menghasilkan prediksi yang stabil dengan target CER sesuai batas yang ditetapkan.
- Proses inferensi berjalan cukup ringan untuk perangkat low-spec yang menjadi target.
- Fuzzy matching, risk assessment, dan copilot Ollama menghasilkan output yang konsisten dan relevan.

### Syarat Lanjut ke Fase 4
- Seluruh service AI inti sudah terintegrasi ke backend.
- Output OCR, matching, dan risk scoring sudah dapat dipakai oleh frontend.
- Model dan service berjalan stabil dalam skenario offline lokal.
- Minimal ada uji sampel yang membuktikan hasil AI layak dipakai untuk testing integrasi.

### Deliverables

#### 3.1 TrOCR Model ONNX Export Pipeline
- **File Target:** `ML_Pipeline/src/export_onnx.py`, `ML_Pipeline/notebooks/02_train_model.ipynb`
- **Task Detail:**
  - Fine-tune Microsoft TrOCR model dengan dataset tulisan tangan anak Indonesia
  - Konversi model PyTorch ke format ONNX (.onnx)
  - Kuantisasi model untuk mengurangi ukuran & latency
  - Testing akurasi pada test set tulisan anak disleksia
- **Model Specs:**
  - Base: `microsoft/trocr-base-printed` atau `microsoft/trocr-base-handwritten`
  - Input: 384x384 image
  - Output: Text string + confidence scores per character
  - Target file size: < 100MB untuk run lokal
- **Metrics Target:**
  - Character Error Rate (CER) < 15% pada dataset Indonesia
  - Inference time < 500ms per image (low-spec laptop)
- **Status:** 🎯 Planning
- **Owner:** ML Team

#### 3.2 OCR Service Implementation
- **File Target:** `BE/app/services/trocr_service.py`
- **Task Detail:**
  - Wrapper ONNX Runtime untuk load & infer model TrOCR
  - Implementasi batch processing untuk multiple images
  - Error handling untuk deteksi image tidak valid
  - Output: `{text: string, confidence: float, char_confidences: [...]}`
- **Dependencies:** onnxruntime, opencv-python, numpy
- **Status:** 🎯 Planning
- **Owner:** Backend Team

#### 3.3 Image Preprocessing Pipeline
- **File Target:** `BE/app/services/image_processor.py`
- **Task Detail:**
  - Deskew detection (jika foto tulisan tangan miring)
  - Grayscale conversion
  - Contrast enhancement untuk tulisan tipis
  - Resize ke 384x384 (input size TrOCR)
  - Noise reduction filter
- **Status:** 🎯 Planning
- **Owner:** Backend Team

#### 3.4 Fuzzy Matching & Error Detection
- **File Target:** `BE/app/services/fuzzy_matching.py`
- **Task Detail:**
  - Implementasi RapidFuzz untuk soft string matching
  - Deteksi jenis error: reversal (b↔d), omission (hilang huruf), insertion (tambah huruf)
  - Scoring yang sensitive terhadap error pattern disleksia
  - Output: `{expected_text, ocr_text, match_score, error_type, error_location}`
- **Error Types:**
  - `reversal`: Huruf tertukar (b/d, p/q, 6/9)
  - `omission`: Huruf hilang (kata "buku" jadi "bu")
  - `insertion`: Huruf tambah (kata "buku" jadi "bukuu")
  - `substitution`: Huruf salah (kata "buku" jadi "buku" → "duku")
- **Status:** 🎯 Planning
- **Owner:** Backend Team

#### 3.5 Audio Generation Service
- **File Target:** `BE/gen_audio.py`
- **Task Detail:**
  - Script untuk generate audio instruksi dari text (using TTS offline)
  - Generate audio prompt per level & kata yang akan diuji
  - Output: .mp3 files tersimpan di `FE/public/assets/audio/`
  - Implementasi gTTS atau pyttsx3 untuk Python TTS lokal
- **Audio Specs:**
  - Format: MP3 128kbps
  - Sample rate: 44.1kHz
  - Speaker: Female voice (lebih menenangkan untuk anak)
  - Tempo: Slow & clear untuk anak disleksia
- **Status:** 🎯 Planning
- **Owner:** Backend Team

#### 3.6 Ollama Integration for Teacher's Copilot
- **File Target:** `BE/app/services/ollama_service.py`
- **Task Detail:**
  - Wrapper untuk HTTP requests ke local Ollama instance
  - Model selection: Phi-3 Mini (2B) atau Qwen 1.5 (1.8B) untuk fast inference
  - Prompt engineering untuk pedagogical recommendations
  - Example prompts:
    - "Anak di Level 3 sering balik huruf b/d, latihan apa yang cocok?"
    - "Pola error omission pada kata berlenggang, apa strategi intervensi?"
  - Output: Text recommendations berdasarkan pattern anak
- **Status:** 🎯 Planning
- **Owner:** Backend Team

#### 3.7 Risk Assessment Engine
- **File Target:** `BE/app/services/risk_assessment.py`
- **Task Detail:**
  - Algoritma scoring untuk menghitung risk level disleksia
  - Input metrics:
    - Accuracy per level (character accuracy)
    - Error pattern frequency (reversal%, omission%)
    - Response time per soal
    - Consistency across attempts
  - Output: `{risk_level: "Rendah|Sedang|Tinggi", risk_score: 0-100, confidence: float}`
  - Risk thresholds:
    - Rendah: 0-30
    - Sedang: 31-70
    - Tinggi: 71-100
- **Status:** 🎯 Planning
- **Owner:** Backend Team

---

## 🔗 Fase 4: Integration, Testing & Deployment (Q4 - Oktober hingga Desember 2026)

### Tujuan Fase
Full integration end-to-end, comprehensive testing, dan siap deploy ke lapangan.

### KPI Keberhasilan Fase 4
- Alur end-to-end dari kamera sampai hasil risiko berjalan tanpa putus pada pengujian.
- Sistem tetap stabil saat dipakai beberapa device secara bersamaan di jaringan lokal.
- Offline sync tidak menyebabkan kehilangan data pada skenario putus-sambung jaringan.
- Dokumentasi, deployment script, dan security baseline sudah siap dipakai sekolah pilot.

### Syarat Rilis / Go-Live
- Semua test kritis lulus dan bug blocker sudah ditutup.
- Performa minimal memenuhi target yang sudah didefinisikan di bagian Success Metrics.
- Paket instalasi dan panduan penggunaan sudah final.
- Pilot testing menunjukkan sistem layak dipakai di lingkungan sekolah 3T.

### Deliverables

#### 4.1 End-to-End Integration Testing
- **File Target:** `Test/test_ocr.py`, `Test/advanced_ocr_testing.py`, `Test/digital_whiteboard.py`
- **Test Scenarios:**
  - Test flow: Camera capture → Image submit → OCR → Matching → Risk calculation
  - Test kinesthetic tracer: Stroke input → Real-time feedback → Stroke analysis
  - Test listen card: Audio play → Text input → Fuzzy match
  - Test offline functionality: Disable WiFi → Verify cached data accessed
  - Test multi-device: 5 students + 1 teacher laptop simultaneously
- **Status:** 🎯 Planning
- **Owner:** QA Team

#### 4.2 Performance Optimization
- **Task Detail:**
  - Optimize TrOCR inference time (target < 500ms)
  - Optimize image loading & caching on mobile
  - Database query optimization (add indexes)
  - Frontend bundle size optimization (code splitting)
  - Test pada laptop low-spec (RAM 2GB, Processor i3)
- **Tools:** Lighthouse, Profiler, APM monitoring
- **Status:** 🎯 Planning
- **Owner:** Backend & Frontend Team

#### 4.3 Offline-First Data Sync
- **File Target:** `FE/lib/sync_service.ts`, `BE/app/api/v1/sync.py`
- **Task Detail:**
  - Implement queue untuk pending submissions (ketika offline)
  - Auto-sync ketika connection kembali
  - Conflict resolution (if teacher upload changes)
  - Local storage optimization
- **Status:** 🎯 Planning
- **Owner:** Backend & Frontend Team

#### 4.4 Security & Data Privacy
- **Task Detail:**
  - Encryption SQLite database (untuk proteksi data anak)
  - HTTPS setup untuk local server (self-signed cert)
  - Authentication untuk teacher login
  - Access control per child (teacher hanya bisa lihat siswa mereka)
  - GDPR-compliant data handling (clear data retention policy)
- **Status:** 🎯 Planning
- **Owner:** Backend Team

#### 4.5 Comprehensive Documentation
- **File Target:** `docs/` folder
  - `docs/api_spec.yaml` - OpenAPI spec
  - `docs/architecture.md` - System architecture
  - `docs/deployment_guide.md` - Panduan deploy ke sekolah
  - `docs/teacher_manual.pdf` - Panduan pengguna guru
  - `docs/maintenance_guide.md` - Panduan maintenance
- **Status:** 🎯 Planning
- **Owner:** Documentation Team

#### 4.6 Deployment Package & Installation Scripts
- **File Target:** `scripts/setup_server.sh`, `scripts/install_dependencies.sh`, `deploy/docker-compose.yml`
- **Task Detail:**
  - Dockerize backend FastAPI app
  - Dockerize frontend Next.js app (optional, dapat juga static build)
  - Create docker-compose untuk easy setup
  - Bundled Ollama image setup
  - One-click installation script untuk sekolah
- **Deployment Targets:**
  - Laptop Windows (via BAT script)
  - Laptop Linux/Mac (via Bash script)
  - Docker container (untuk IT-savvy schools)
- **Status:** 🎯 Planning
- **Owner:** DevOps Team

#### 4.7 User Testing & Feedback Loop
- **Task Detail:**
  - Beta testing dengan 2-3 sekolah pilot di daerah 3T
  - Collect teacher & student feedback
  - Usability testing dengan anak disleksia
  - Iterate berdasarkan feedback
  - Fix bugs & UX issues
- **Status:** 🎯 Planning
- **Owner:** Product & QA Team

#### 4.8 Launch & Release Management
- **Task Detail:**
  - Create release notes
  - Version management (v1.0.0)
  - GitHub releases & documentation
  - Training materials untuk teachers
  - Support channel setup (Discord/Email)
- **Status:** 🎯 Planning
- **Owner:** Product & DevOps Team

---

## 📊 Timeline Gantt Chart

```
Fase 1: Q1 (Jan-Mar 2026)
├─ Backend Infrastructure       [========]
├─ Database Schema             [========]
├─ API Endpoints v1            [========]
└─ Network Setup               [====]

Fase 2: Q2 (Apr-Jun 2026)
├─ PWA Setup                   [========]
├─ Screening UI                [========]
├─ Listen Card UI              [========]
├─ Tracer UI                   [========]
├─ Dashboard                   [========]
└─ Summary Page                [====]

Fase 3: Q3 (Jul-Sep 2026)
├─ TrOCR Model Tuning          [========]
├─ OCR Service                 [========]
├─ Image Processing            [====]
├─ Fuzzy Matching              [========]
├─ Audio Generation            [====]
├─ Ollama Integration          [========]
└─ Risk Assessment             [====]

Fase 4: Q4 (Oct-Dec 2026)
├─ End-to-End Testing          [========]
├─ Performance Optimization    [========]
├─ Offline Sync                [====]
├─ Security & Privacy          [====]
├─ Documentation               [====]
├─ Deployment Scripts          [========]
├─ User Testing                [========]
└─ Launch v1.0                 [====]
```

---

## 👥 Tim & Tanggung Jawab

| Role | Count | Responsibilities |
|------|-------|-----------------|
| **Backend Developer** | 2 | FastAPI server, DB, OCR service, AI integration |
| **Frontend Developer** | 2 | Next.js PWA, UI components, responsive design |
| **ML Engineer** | 1 | Model training, ONNX export, model optimization |
| **DevOps/Infrastructure** | 1 | Docker setup, deployment scripts, server management |
| **QA/Tester** | 1 | Test automation, performance testing, user testing |
| **Product Manager** | 1 | Feature prioritization, roadmap management, user feedback |
| **Documentation** | 1 | API docs, guides, training materials |

---

## 🎯 Key Milestones

### Milestone 1: MVP (Ende Maret 2026)
- ✅ Backend server running
- ✅ Database initialized
- ✅ Basic API endpoints working
- ✅ PWA responsive
- ✅ Screenshot & OCR E2E tested

### Milestone 2: Core Features (Ende Juni 2026)
- ✅ All 4 main UI interfaces completed
- ✅ Teacher dashboard live
- ✅ Audio integration working
- ✅ Offline functionality verified

### Milestone 3: AI Integration (Ende September 2026)
- ✅ TrOCR model integrated
- ✅ Fuzzy matching working
- ✅ Risk assessment calculated
- ✅ Ollama copilot responsive

### Milestone 4: Production Ready (Ende Desember 2026)
- ✅ All security checks passed
- ✅ Performance benchmarks met
- ✅ Documentation complete
- ✅ Pilot testing successful
- ✅ v1.0 launched

---

## 📈 Success Metrics

| Metric | Target | Measurement |
|--------|--------|------------|
| **System Uptime** | 99.5% | Server availability in pilot schools |
| **Average Response Time** | < 800ms | API latency (camera to result) |
| **OCR Accuracy** | > 85% | Character Error Rate on test data |
| **Device Compatibility** | 90%+ | % Android phones work without issue |
| **User Satisfaction** | > 4.0/5.0 | Teacher feedback score |
| **Data Sync Reliability** | 100% | Zero data loss during offline-online transitions |
| **Offline Functionality** | 100% | System works without internet |
| **Student Engagement** | > 80% | % students complete all 5 levels |
| **Gamification Engagement** | > 70% | % siswa aktif menyelesaikan game/reward loop |

---

## 🚀 Catatan Pengembangan & Constraints

### Technical Constraints
- **Minimum Device Specs:**
  - Laptop: Intel i3, RAM 2GB, Storage 500MB
  - Smartphone: Android 6.0+, RAM 1GB, Storage 100MB
- **Network:**
  - Berjalan pada Wi-Fi 2.4GHz (banyak dipakai di sekolah pelosok)
  - Support USB hotspot tethering dari smartphone
- **Model Size:**
  - TrOCR ONNX < 100MB untuk fit di storage terbatas

### Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **TrOCR accuracy rendah pada handwriting anak Indonesia** | High | Early fine-tuning dengan dataset lokal, fallback ke manual correction |
| **Ollama memory overhead di low-spec laptop** | Medium | Pre-select smallest model (Phi-3 2B), implement memory optimization |
| **Network latency dalam jaringan Wi-Fi lokal** | Low | Optimize API payload, implement caching |
| **User adoption dari guru yang tech-phobic** | High | Extensive training, simplified UI, support channel |

---

## 📝 Rencana Kerja Prioritas & Langkah Strategis (Sprint Checklist)

Untuk memastikan kelancaran pengembangan ekosistem **DyLeks** luring, rencana kerja dibagi menjadi Sprints terarah dengan fokus pada perbaikan bug kritis (*pre-requisites*) sebelum masuk ke implementasi fitur baru. Pengembangan perangkat keras IoT diposisikan pada fase akhir karena keterbatasan ketersediaan fisik alat.

### 🛑 Sprint 0: Critical Bug Fixes & Port Alignment (Selesai ✅)
*Target: Menstabilkan fondasi backend SQLite dan menyelaraskan konfigurasi port luring.*

*   **Backend Database Restructuring:**
    *   [x] Hapus redundansi dan perbaiki berkas `BE/app/models/screening_session.py` agar mengimplementasikan model database SQLAlchemy (`Base`), bukan Pydantic `BaseModel`.
    *   [x] Hubungkan model `ScreeningSession` dengan relasi kunci asing (*Foreign Key*) ke tabel `child_profiles`.
    *   [x] Pastikan `Base.metadata.create_all(bind=engine)` di `BE/app/main.py` berhasil dieksekusi secara otomatis dan membuat seluruh tabel luring di berkas `dyslexiai_local.db`.
*   **Port Setup & API Address Alignment (Solusi Mixed Content):**
    *   [x] Konfigurasi port dev server Next.js di `FE/package.json` dan `FE/next.config.js` untuk berjalan di **port 3001** (HTTP).
    *   [x] Konfigurasi port FastAPI di `BE/app/main.py` atau `wsgi.py` agar berjalan di **port 3002** (HTTP).
    *   [x] Perbarui alamat pemanggilan Fetch API di `FE/pages/screening.tsx` dan `FE/pages/latihan.tsx` dari port `8000` (atau `127.0.0.1:8000`) ke `http://localhost:3002/api/v1/...` (atau menggunakan port `3002` dinamis jaringan lokal).

### ⚙️ Sprint 1: Core Offline Services Development (Selesai ✅)
*Target: Mengisi berkas skeleton/kosong di backend dengan algoritma adaptif luring berbasis visual.*

*   **Adaptive Engine (Orton-Gillingham Principles):**
    *   [x] Tulis logika di `BE/app/services/adaptive_engine.py` untuk mengelola pengacakan soal (*Spaced Repetition*) dengan menyisipkan 15–20% materi lama.
    *   [x] Hubungkan backend API router `learning.py` dengan `adaptive_engine.py` untuk pengambilan soal dinamis.
*   **Scoring & Visual Risk Assessment:**
    *   [x] Tulis logika penilaian di `BE/app/services/scoring_service.py` untuk mengolah metrik skor risiko berbasis data visual hasil OCR TrOCR dan prapemrosesan gambar.

### 🤖 Sprint 2: AI OCR & Local LLM Optimization (Selesai ✅)
*Target: Optimalisasi performa inferensi luring pada perangkat sekolah berspesifikasi rendah.*

*   **TrOCR ONNX Runtime Web Integration:**
    *   [x] Selesaikan skrip `ML_Pipeline/src/export_onnx.py` untuk mengonversi model `microsoft/trocr-base-handwritten` ke ONNX dengan kuantisasi data (INT8) agar ukurannya di bawah 100MB.
    *   [x] Optimasi pipeline preprocessing gambar (OTSU thresholding dan deskewing) di `image_processor.py` agar waktu pemrosesan di bawah 500ms di laptop Core i3.
*   **Ollama SLM Configuration:**
    *   [x] Buat dokumentasi panduan konfigurasi model bahasa kecil (seperti Qwen 1.5-1.8B atau Phi-3 Mini) di laptop guru untuk fitur asisten konsultasi *Teacher's Copilot* luring.

### 📱 Sprint 3: Gamification & Local Mesh Dashboard (Selesai ✅)
*Target: Melengkapi visualisasi frontend dan interaksi ramah anak.*

*   **UI/UX Refinement:**
    *   [x] Rancang halaman `FE/pages/game.tsx` untuk sistem reward (poin, badge, streak) guna menstimulasi motivasi belajar anak disleksia.
    *   [x] Sempurnakan halaman `FE/pages/result.tsx` agar menampilkan grafik distribusi pola kesalahan secara intuitif (glassmorphic styling).

### 🔌 Sprint 4: IoT Smart Writing Grip & Telemetry Integration (Fase Akhir)
*Target: Integrasi siber-fisik telemetri sensor grip pensil setelah perangkat keras siap.*

*   **Firmware & MQTT Broker Setup:**
    *   [ ] Rancang firmware ESP32 untuk membaca data mentah 6-axis IMU MPU6050 (akselerasi dan rotasi).
    *   [ ] Setup Mosquitto MQTT Broker lokal di laptop server guru untuk menangkap data stream sensor.
    *   [ ] Buat handler MQTT asinkron di `BE/app/services/mqtt_handler.py`.
*   **Bio-Kinesthetic Data Analysis:**
    *   [ ] Selesaikan modul `BE/app/services/kinesthetic_analyzer.py` untuk ekstraksi fitur tremor kognitif, jeda penulisan (*hesitation*), dan pembalikan sapuan tangan (*stroke inversion*).
    *   [ ] Integrasikan metrik kinematik ini ke dalam `scoring_service.py` untuk analisis risiko multivariat gabungan (Visual + Kinestetik).

---

**Terakhir Diperbarui:** 1 Juni 2026  
**Versi Dokumen:** 1.2 (Revisi Penjadwalan IoT Terakhir)  
**Dikelola Oleh:** Tim Pengembang DyLeks (TELULANG)
