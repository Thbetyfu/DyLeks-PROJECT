import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useTheme } from '../contexts/ThemeContext';
import BatMascot from '../components/BatMascot';
import ButterflyMascot from '../components/ButterflyMascot';
import ThemeToggle from '../components/ThemeToggle';
import { QRCodeSVG } from 'qrcode.react';

interface Child {
  id: string;
  name: string;
}

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();

  // Modal & Connection States
  const [showModal, setShowModal] = useState(false);
  const [teacherToken, setTeacherToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolRegion, setSchoolRegion] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // QR Generation & Polling States
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrExpiredAt, setQrExpiredAt] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<string>('');
  const [connectedStudent, setConnectedStudent] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('teacher_token');
    if (token) {
      setTeacherToken(token);
    }
  }, []);

  const handleStart = () => {
    router.push('/screening');
  };

  // Auth: Login Guru
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const apiBase = localStorage.getItem('api_base_url') || 'http://localhost:3002';
      const res = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        throw new Error('Username atau password salah.');
      }

      const data = await res.json();
      localStorage.setItem('teacher_token', data.access_token);
      setTeacherToken(data.access_token);
      fetchChildren(data.access_token);
    } catch (err: any) {
      setAuthError(err.message || 'Gagal login.');
    }
  };

  // Auth: Register Guru
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const apiBase = localStorage.getItem('api_base_url') || 'http://localhost:3002';
      const res = await fetch(`${apiBase}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          full_name: fullName,
          school_name: schoolName,
          school_region: schoolRegion,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal mendaftar. Username mungkin sudah digunakan.');
      }

      // Langsung login setelah register sukses
      const loginRes = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await loginRes.json();
      localStorage.setItem('teacher_token', data.access_token);
      setTeacherToken(data.access_token);
      fetchChildren(data.access_token);
    } catch (err: any) {
      setAuthError(err.message || 'Gagal registrasi.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('teacher_token');
    setTeacherToken(null);
    setChildren([]);
    setQrToken(null);
  };

  // Fetch daftar anak milik guru
  const fetchChildren = async (token: string) => {
    try {
      const apiBase = localStorage.getItem('api_base_url') || 'http://localhost:3002';
      const res = await fetch(`${apiBase}/api/v1/auth/children`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChildren(data);
      }
    } catch (err) {
      console.error('Gagal mengambil daftar anak:', err);
    }
  };

  // Trigger fetch daftar anak saat modal dibuka
  useEffect(() => {
    if (showModal && teacherToken) {
      fetchChildren(teacherToken);
    }
  }, [showModal, teacherToken]);

  // Generate QR Token
  const generateQR = async () => {
    if (!teacherToken) return;
    setQrLoading(true);
    setConnectedStudent(null);
    try {
      const apiBase = localStorage.getItem('api_base_url') || 'http://localhost:3002';
      const res = await fetch(`${apiBase}/api/v1/auth/qr/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({
          child_id: selectedChildId || null,
        }),
      });

      if (!res.ok) throw new Error('Gagal membuat QR token.');

      const data = await res.json();
      setQrToken(data.token);
      setQrExpiredAt(data.expired_at);
      setQrStatus(data.status);
    } catch (err) {
      console.error(err);
    } finally {
      setQrLoading(false);
    }
  };

  // Polling Status QR Token
  useEffect(() => {
    if (!qrToken || !teacherToken || qrStatus !== 'pending') return;

    const apiBase = localStorage.getItem('api_base_url') || 'http://localhost:3002';
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${apiBase}/api/v1/auth/qr/status/${qrToken}`, {
          headers: { Authorization: `Bearer ${teacherToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          setQrStatus(data.status);

          if (data.status === 'used') {
            // Mainkan audio sukses secara luring
            playSuccessSound();
            setConnectedStudent(data.child_name || 'Siswa');
            setQrToken(null); // Stop polling

            // Auto-generate QR baru setelah 3 detik untuk siswa berikutnya
            setTimeout(() => {
              generateQR();
            }, 3000);
          } else if (data.status === 'expired') {
            setQrToken(null);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [qrToken, teacherToken, qrStatus]);

  const playSuccessSound = () => {
    if (typeof window !== 'undefined') {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Sine wave ganda untuk nada "ting-ting" sukses
        const playTone = (freq: number, start: number, duration: number) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.3, start + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.start(start);
          osc.stop(start + duration);
        };
        
        const now = audioContext.currentTime;
        playTone(523.25, now, 0.2); // C5
        playTone(659.25, now + 0.12, 0.4); // E5
      } catch (e) {
        console.error('Audio play error:', e);
      }
    }
  };

  // Dapatkan URL scan lengkap untuk QR Code
  const getQRUrl = () => {
    if (typeof window === 'undefined') return '';
    const host = window.location.hostname;
    // URL menunjuk ke halaman connect.tsx client dengan server param menunjuk ke backend
    return `http://${host}:3001/connect?token=${qrToken}&server=http://${host}:3002`;
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

          <button className={styles.copilotButton} onClick={() => setShowModal(true)} id="btn-hubungkan-qr" style={{ margin: 0, background: 'linear-gradient(135deg, #2b6cb0 0%, #1a365d 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Hubungkan Siswa (QR)</span>
          </button>
        </div>

        {/* Modal QR / Login */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ background: theme === 'dark' ? '#181b2a' : '#ffffff', color: theme === 'dark' ? '#ffffff' : '#1a202c', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
              
              <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', fontSize: '20px', color: 'gray', cursor: 'pointer' }}>✕</button>

              {!teacherToken ? (
                // Form Login/Register Guru jika belum login
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '6px' }}>{isRegistering ? 'Daftar Guru Baru' : 'Login Dashboard Guru'}</h2>
                  <p style={{ fontSize: '13px', color: 'gray', marginBottom: '20px' }}>Autentikasi diperlukan untuk mengelola data siswa lokal.</p>

                  <form onSubmit={isRegistering ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {isRegistering && (
                      <>
                        <input type="text" placeholder="Nama Lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.4)', background: 'transparent', color: 'inherit' }} />
                        <input type="text" placeholder="Nama Sekolah" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.4)', background: 'transparent', color: 'inherit' }} />
                        <input type="text" placeholder="Wilayah Sekolah (Contoh: Bandung, Jawa Barat)" value={schoolRegion} onChange={(e) => setSchoolRegion(e.target.value)} required style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.4)', background: 'transparent', color: 'inherit' }} />
                      </>
                    )}
                    <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.4)', background: 'transparent', color: 'inherit' }} />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.4)', background: 'transparent', color: 'inherit' }} />
                    
                    {authError && <p style={{ color: '#ff4d4d', fontSize: '13px' }}>{authError}</p>}
                    
                    <button type="submit" style={{ padding: '12px', borderRadius: '12px', background: '#58CC02', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '10px' }}>
                      {isRegistering ? 'Daftar & Masuk' : 'Masuk'}
                    </button>
                  </form>

                  <p style={{ fontSize: '13px', textAlign: 'center', marginTop: '16px' }}>
                    {isRegistering ? 'Sudah punya akun?' : 'Belum punya akun luring?'} {' '}
                    <span onClick={() => { setIsRegistering(!isRegistering); setAuthError(null); }} style={{ color: '#58CC02', cursor: 'pointer', textDecoration: 'underline' }}>
                      {isRegistering ? 'Login di sini' : 'Daftar di sini'}
                    </span>
                  </p>
                </div>
              ) : (
                // Generator QR Token jika sudah login
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Hubungkan Siswa luring</h2>
                    <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid rgba(128,128,128,0.4)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: 'inherit' }}>Logout Guru</button>
                  </div>

                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'gray' }}>Pilih Siswa (Kosongkan untuk Generik):</label>
                    <select
                      value={selectedChildId}
                      onChange={(e) => setSelectedChildId(e.target.value)}
                      style={{ padding: '10px', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.4)', background: theme === 'dark' ? '#1f2438' : '#ffffff', color: 'inherit', fontSize: '14px' }}
                    >
                      <option value="">-- Mode Generik (Siswa Memilih Nama di HP) --</option>
                      {children.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={generateQR}
                    disabled={qrLoading}
                    style={{ padding: '12px 24px', background: '#58CC02', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer', width: '100%' }}
                  >
                    {qrLoading ? 'Membuat Token...' : 'Tampilkan QR Code Sambungan'}
                  </button>

                  {qrToken && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '10px', background: 'rgba(255,255,255,0.04)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <p style={{ fontSize: '12px', color: '#ffac33', fontWeight: 'bold' }}>Scan menggunakan HP Siswa (Masa berlaku 5 Menit):</p>
                      
                      <div style={{ padding: '12px', background: 'white', borderRadius: '16px' }}>
                        <QRCodeSVG value={getQRUrl()} size={180} />
                      </div>
                      
                      <p style={{ fontSize: '11px', color: 'gray', wordBreak: 'break-all' }}>
                        Atau akses URL luring berikut:<br/>
                        <code style={{ color: '#58CC02' }}>{getQRUrl()}</code>
                      </p>
                    </div>
                  )}

                  {connectedStudent && (
                    <div style={{ padding: '12px 24px', background: 'rgba(88,204,2,0.1)', color: '#58CC02', border: '1px solid rgba(88,204,2,0.2)', borderRadius: '12px', fontWeight: 'bold', width: '100%' }}>
                      🎉 Siswa "{connectedStudent}" Berhasil Terhubung!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
