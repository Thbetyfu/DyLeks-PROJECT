import { useRouter } from 'next/router';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import { useTheme } from '../contexts/ThemeContext';
import BatMascot from '../components/BatMascot';
import ButterflyMascot from '../components/ButterflyMascot';
import ThemeToggle from '../components/ThemeToggle';

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const [hasAccount, setHasAccount] = useState(false);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('student_token');
      const name = localStorage.getItem('student_connected_name');
      if (token && name) {
        setHasAccount(true);
        setStudentName(name);
      }
    }
  }, []);

  const handleStart = () => {
    if (hasAccount) {
      router.push('/latihan');
    }
  };

  const handleLogout = () => {
    if (confirm('Apakah kamu yakin ingin keluar dari akun belajarmu?')) {
      localStorage.clear();
      sessionStorage.clear();
      setHasAccount(false);
      setStudentName('');
    }
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
          
          {hasAccount ? (
            <>
              <p className={styles.subtitle}>
                Halo <strong>{studentName}</strong>! Kupu-kupu/kelelawar siap menemanimu belajar membaca hari ini.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '280px', margin: '20px auto 0' }}>
                <button className={styles.button} onClick={handleStart} id="btn-mulai-screening">
                  <span className={styles.btnText}>Mulai Petualangan</span>
                  <svg className={styles.iconRight} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
                <button 
                  onClick={handleLogout}
                  style={{
                    background: 'rgba(229, 62, 62, 0.15)',
                    border: '1px solid rgba(229, 62, 62, 0.3)',
                    color: '#e53e3e',
                    padding: '12px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                >
                  Keluar Akun Luring
                </button>
              </div>
            </>
          ) : (
            <>
              <p className={styles.subtitle}>
                Petualangan Belajar Membaca Luring Sekolah
              </p>
              
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '20px',
                width: '100%',
                maxWidth: '320px',
                margin: '20px auto 0',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#58CC02' }}>Cara Masuk Kelas:</span>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary, #d0d0d0)', lineHeight: '1.6' }}>
                  1. Hubungkan HP ke Wi-Fi kelas Guru.<br/>
                  2. Scan QR Code pendaftaran di laptop Guru.<br/>
                  3. Masukkan namamu untuk membuat akun belajarmu.<br/>
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: '#ff9900', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '8px',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  ⚠️ Kamu harus terdaftar agar progres belajarmu terpantau Guru.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

