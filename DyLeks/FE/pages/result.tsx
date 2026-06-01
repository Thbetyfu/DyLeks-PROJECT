import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Result.module.css';
import Head from 'next/head';

interface WordResult {
  letter: string;
  result: {
    risk_score: number;
    detected_errors: string[];
    feedback: string;
  };
}

export default function Result() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [screeningHistory, setScreeningHistory] = useState<WordResult[]>([]);
  const [stats, setStats] = useState({
    inversiBD: 0,
    terbalik: 0,
    hilangTambah: 0,
    inversiPQ: 0
  });

  useEffect(() => {
    setMounted(true);
    
    const exerciseData = sessionStorage.getItem('exercise_analytics');
    const screeningData = sessionStorage.getItem('dyslexia_screening_results');
    
    let history: any[] = [];
    if (exerciseData) {
      const raw = JSON.parse(exerciseData);
      history = raw.map((item: any) => ({
        letter: item.target,
        result: {
          risk_score: item.isCorrect ? 0 : 100,
          detected_errors: item.isCorrect ? [] : [`Salah pilih: ${item.attempt}`],
          feedback: item.isCorrect ? "Jawaban Benar" : "Terjadi kesalahan"
        }
      }));
    } else if (screeningData) {
      history = JSON.parse(screeningData);
    }
    
    setScreeningHistory(history);

    let bdCount = 0;
    let revCount = 0;
    let missCount = 0;
    let pqCount = 0;

    history.forEach(item => {
      const target = item.letter.toLowerCase();
      
      if (item.result.risk_score > 0) {
        const attempt = (item.result.detected_errors[0] || '').toLowerCase();
        
        if ((target.includes('b') && attempt.includes('d')) || (target.includes('d') && attempt.includes('b'))) bdCount++;
        if (attempt.includes('terbalik') || attempt.includes('reversal')) revCount++;
        if (attempt.includes('hilang') || attempt.includes('tambah')) missCount++;
        if ((target.includes('p') && attempt.includes('q')) || (target.includes('q') && attempt.includes('p'))) pqCount++;
      }
    });

    const errorTotal = history.filter(item => item.result.risk_score > 0).length || 1;
    const hasErrors = history.some(item => item.result.risk_score > 0);

    setStats({
      inversiBD: hasErrors ? Math.round((bdCount / errorTotal) * 100) : 0,
      terbalik: hasErrors ? Math.round((revCount / errorTotal) * 100) : 0,
      hilangTambah: hasErrors ? Math.round((missCount / errorTotal) * 100) : 0,
      inversiPQ: hasErrors ? Math.round((pqCount / errorTotal) * 100) : 0
    });
  }, []);

  if (!mounted) return null;

  const getStatLabel = (val: number) => {
    if (val === 0) return 'Tidak ada';
    if (val < 30) return 'Jarang';
    if (val < 60) return 'Kadang';
    return 'Sering';
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Ringkasan Hasil Tes - Arcana</title>
      </Head>

      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => router.back()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className={styles.headerTitle}>Ringkasan Hasil Tes</h1>
      </div>

      <div className={styles.statSection}>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Inversi b/d</span>
          <span className={styles.statValue}>{stats.inversiBD}% {getStatLabel(stats.inversiBD)}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Urutan huruf terbalik</span>
          <span className={styles.statValue}>{stats.terbalik}% {getStatLabel(stats.terbalik)}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Huruf hilang/tambah</span>
          <span className={styles.statValue}>{stats.hilangTambah}% {getStatLabel(stats.hilangTambah)}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Inversi p/q</span>
          <span className={styles.statValue} style={{ color: stats.inversiPQ === 0 ? '#A0A0A0' : '#7D57C1' }}>
            {stats.inversiPQ}% {getStatLabel(stats.inversiPQ)}
          </span>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Grafik Pola Kesalahan</h2>
      <div style={{
        background: 'rgba(255, 255, 255, 0.45)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        borderRadius: '24px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 8px 32px 0 rgba(120, 119, 198, 0.08)'
      }}>
        <svg width="100%" height="160" viewBox="0 0 400 160">
          <line x1="100" y1="20" x2="380" y2="20" stroke="#e9ecef" strokeDasharray="4 4" />
          <line x1="100" y1="50" x2="380" y2="50" stroke="#e9ecef" strokeDasharray="4 4" />
          <line x1="100" y1="80" x2="380" y2="80" stroke="#e9ecef" strokeDasharray="4 4" />
          <line x1="100" y1="110" x2="380" y2="110" stroke="#e9ecef" strokeDasharray="4 4" />

          <text x="10" y="32" fill="#5d3eb3" fontSize="12" fontWeight="700">Inversi b/d</text>
          <rect x="100" y="20" width={Math.max(10, (stats.inversiBD / 100) * 260)} height="16" rx="8" fill="url(#purpleGrad)" />
          <text x={110 + (stats.inversiBD / 100) * 260} y="32" fill="#333" fontSize="10" fontWeight="700">{stats.inversiBD}%</text>

          <text x="10" y="62" fill="#5d3eb3" fontSize="12" fontWeight="700">Terbalik</text>
          <rect x="100" y="50" width={Math.max(10, (stats.terbalik / 100) * 260)} height="16" rx="8" fill="url(#purpleGrad)" />
          <text x={110 + (stats.terbalik / 100) * 260} y="62" fill="#333" fontSize="10" fontWeight="700">{stats.terbalik}%</text>

          <text x="10" y="92" fill="#5d3eb3" fontSize="12" fontWeight="700">Hilang/Tambah</text>
          <rect x="100" y="80" width={Math.max(10, (stats.hilangTambah / 100) * 260)} height="16" rx="8" fill="url(#purpleGrad)" />
          <text x={110 + (stats.hilangTambah / 100) * 260} y="92" fill="#333" fontSize="10" fontWeight="700">{stats.hilangTambah}%</text>

          <text x="10" y="122" fill="#5d3eb3" fontSize="12" fontWeight="700">Inversi p/q</text>
          <rect x="100" y="110" width={Math.max(10, (stats.inversiPQ / 100) * 260)} height="16" rx="8" fill="url(#purpleGrad)" />
          <text x={110 + (stats.inversiPQ / 100) * 260} y="122" fill="#333" fontSize="10" fontWeight="700">{stats.inversiPQ}%</text>

          <defs>
            <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9c7cf4" />
              <stop offset="100%" stopColor="#5d3eb3" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <h2 className={styles.sectionTitle}>Detail Hasil per Kata</h2>
      <div className={styles.detailSection}>
        {screeningHistory.map((item, idx) => (
          <div key={idx} className={styles.detailCard}>
            <div className={styles.iconCircle} style={{ background: item.result.risk_score <= 40 ? '#E8F5E9' : '#FFEBEE' }}>
              {item.result.risk_score <= 40 ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="#F44336" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div className={styles.wordInfo}>
              <span className={styles.wordTarget}>{item.letter}</span>
              <span className={styles.wordAttempt}>
                {item.result.risk_score <= 40 ? `Ditulis ${item.letter.toLowerCase()}` : (item.result.detected_errors[0] || 'Terdapat kesalahan penulisan')}
              </span>
            </div>
          </div>
        ))}
      </div>

      <h2 className={styles.sectionTitle}>Indikasi Awal Berdasarkan Pola Error</h2>
      <div className={styles.indicationBox}>
        <p className={styles.indicationText}>
          {stats.inversiBD > 50 || stats.terbalik > 30 
            ? "Pola kesalahan konsisten dengan gejala disleksia fonologis dan visual, khususnya kesulitan membedakan huruf yang mirip secara spasial (b/d) dan mempertahankan urutan huruf dalam kata. Pola ini bukan karena kurang belajar atau tidak teliti, melainkan cara otak memproses simbol tertulis yang berbeda."
            : "Hasil menunjukkan beberapa kesalahan penulisan namun belum menunjukkan pola disleksia yang konsisten. Tetap disarankan melakukan latihan dasar untuk memperkuat kemampuan literasi."}
        </p>
      </div>

      <h2 className={styles.sectionTitle}>Rekomendasi Tindak Lanjut</h2>
      <div className={styles.recommendationList}>
        <div className={styles.recommendationCard}>
          Lanjutkan latihan harian di Leksa level {sessionStorage.getItem('dyslexia_result') ? JSON.parse(sessionStorage.getItem('dyslexia_result')!).recommended_level : 1} pengenalan huruf dasar
        </div>
        <div className={styles.recommendationCard}>
          Konsultasikan ke psikolog atau dokter anak tumbuh kembang
        </div>
        <div className={styles.recommendationCard}>
          Informasikan ke guru kelas
        </div>
      </div>

      <div className={styles.disclaimerBox}>
        <p className={styles.disclaimerText}>
          ⚠️ Disclaimer penting: Laporan ini adalah hasil skrining awal berbasis pola tulisan tangan menggunakan computer vision — BUKAN diagnosis klinis. Leksa bukan pengganti psikolog atau dokter. Jika pola error ini konsisten selama 2+ minggu, sangat disarankan konsultasi ke profesional untuk assessment formal. Hasil laporan ini dapat dicetak atau dikirim sebagai bahan diskusi dengan tenaga ahli.
        </p>
      </div>

      <button className={styles.closeButton} onClick={() => router.push('/latihan')}>
        Tutup
      </button>
    </div>
  );
}
