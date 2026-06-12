import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Summary.module.css';
import Head from 'next/head';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import BatMascot from '../components/BatMascot';
import ButterflyMascot from '../components/ButterflyMascot';
import { SyncService } from '../lib/sync_service';

export default function Summary() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasUnsynced, setHasUnsynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const exerciseData = sessionStorage.getItem('exercise_analytics');
    const screeningData = sessionStorage.getItem('dyslexia_screening_results');

    if (exerciseData) {
      const parsed = JSON.parse(exerciseData);
      setTotalCount(parsed.length);
      setCorrectCount(parsed.filter((p: any) => p.isCorrect).length);
    } else if (screeningData) {
      const parsed = JSON.parse(screeningData);
      setTotalCount(parsed.length);
      
      const screeningResultRaw = sessionStorage.getItem('dyslexia_result');
      const isLuring = screeningResultRaw && JSON.parse(screeningResultRaw).risk_level === 'Luring';
      
      if (isLuring) {
        setCorrectCount(0); // Menunggu sinkronisasi
      } else {
        setCorrectCount(parsed.filter((p: any) => p.result && p.result.risk_score <= 40).length);
      }
    }

    setHasUnsynced(SyncService.hasUnsynced());
  }, []);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    const res = await SyncService.syncQueue();
    setIsSyncing(false);
    
    if (res.success && res.syncedCount > 0) {
      alert(`Sinkronisasi berhasil! ${res.syncedCount} sesi disinkronkan ke laptop server.`);
      setHasUnsynced(false);
      
      const queue = SyncService.getQueue();
      const currentSessionId = sessionStorage.getItem('dyslexia_result') 
        ? JSON.parse(sessionStorage.getItem('dyslexia_result')!).offline_session_id 
        : null;
      
      if (currentSessionId) {
        const matched = queue.find(s => s.id === currentSessionId);
        if (matched && matched.synced && matched.result) {
          sessionStorage.setItem('dyslexia_result', JSON.stringify({
            risk_score: matched.result.risk_score,
            risk_level: matched.result.risk_level,
            recommended_level: matched.result.recommended_level,
            detected_errors: [],
          }));
        }
      }
      
      router.replace(router.asPath);
    } else if (res.success) {
      alert("Tidak ada sesi baru yang memerlukan sinkronisasi.");
      setHasUnsynced(false);
    } else {
      alert("Gagal sinkronisasi. Pastikan laptop server guru aktif dan terhubung ke Wi-Fi yang sama.");
    }
  };

  if (!mounted) return null;

  return (
    <>
      <div className="background-container">
        <div className="star" style={{ top: '15%', left: '25%', animationDelay: '0s' }}></div>
        <div className="star" style={{ top: '65%', left: '75%', animationDelay: '1s' }}></div>
        <div className="star" style={{ top: '35%', left: '55%', animationDelay: '2s' }}></div>
      </div>

      <div className={styles.container}>
        <Head>
          <title>Selesai Screening - DyLeks</title>
        </Head>

        <ThemeToggle />

        <h1 className={styles.headline}>
          Kamu hebat sekali!
        </h1>
        <p className={styles.subheadline}>
          {hasUnsynced ? 'Skrining disimpan secara luring (menunggu sinkronisasi)' : `Tepat ${correctCount} dari ${totalCount} kata`}
        </p>

        <div className={styles.mascotContainer}>
          {theme === 'dark' ? <BatMascot className={styles.duck} /> : <ButterflyMascot className={styles.duck} />}
        </div>

        {hasUnsynced ? (
          <div style={{
            background: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
            backdropFilter: 'blur(16px)',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: '24px',
            padding: '24px',
            marginBottom: '32px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: 'var(--glass-shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center'
          }}>
            <p style={{
              color: 'var(--text-main)',
              fontSize: '1rem',
              fontWeight: 600,
              margin: 0,
              lineHeight: 1.6
            }}>
              📡 Sambungan ke laptop server guru luring. Data hasil gambar tulisan tangan disimpan dengan aman di smartphone Anda.
            </p>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              style={{
                background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '12px 24px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(245, 124, 0, 0.2)',
                transition: 'all 0.2s ease',
                width: '100%',
                maxWidth: '280px'
              }}
            >
              {isSyncing ? 'Sedang Sinkronisasi...' : 'Sinkronkan Sekarang'}
            </button>
          </div>
        ) : (
          <p className={styles.subheadline}>
            Kita lihat hasil latihan yang cocok untukmu ya!
          </p>
        )}

        <div className={styles.footer}>
          <button className={styles.button} onClick={() => router.push('/result')}>
            Lihat Hasil
          </button>
        </div>
      </div>
    </>
  );
}
