import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useTheme } from '../contexts/ThemeContext';
import BatMascot from '../components/BatMascot';
import ButterflyMascot from '../components/ButterflyMascot';
import ThemeToggle from '../components/ThemeToggle';

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();

  const handleStart = () => {
    router.push('/screening');
  };

  return (
    <>
      <div className="background-container">
        <div className="star" style={{ top: '20%', left: '30%', animationDelay: '0s' }}></div>
        <div className="star" style={{ top: '70%', left: '80%', animationDelay: '1s' }}></div>
        <div className="star" style={{ top: '40%', left: '60%', animationDelay: '2s' }}></div>
      </div>

      <div className={styles.container}>
        <Head>
          <title>DyLeks - Deteksi Dini & Belajar Adaptif</title>
          <meta name="description" content="Platform skrining dini dan belajar adaptif multisensori ramah anak disleksia." />
        </Head>

        <ThemeToggle />

        <div className={styles.centered}>
          <div className={styles.mascotContainer}>
            {theme === 'dark' ? <BatMascot /> : <ButterflyMascot />}
          </div>
          <h1 className={styles.title}>DyLeks <span className={styles.highlight}>{theme === 'dark' ? 'Night' : 'Day'}</span></h1>
          <p className={styles.subtitle}>
            {theme === 'dark' 
              ? 'Membaca menjadi petualangan menembus malam.'
              : 'Terbang bersama kupu-kupu belajar membaca!'}
          </p>
        </div>

        <button className={styles.button} onClick={handleStart} id="btn-mulai-screening">
          <span className={styles.btnText}>Mulai Petualangan</span>
          <svg className={styles.iconRight} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button className={styles.copilotButton} onClick={() => router.push('/copilot')} id="btn-guru-copilot" style={{ margin: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor" />
            </svg>
            <span>AI Copilot Guru</span>
          </button>

          <button className={styles.copilotButton} onClick={() => router.push('/dashboard')} id="btn-hubungkan-qr" style={{ margin: 0, background: 'linear-gradient(135deg, #2b6cb0 0%, #1a365d 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Dashboard Guru (QR)</span>
          </button>
        </div>
      </div>
    </>
  );
}
