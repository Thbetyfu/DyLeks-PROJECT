import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useTheme } from '../contexts/ThemeContext';
import BatMascot from '../components/BatMascot';
import ButterflyMascot from '../components/ButterflyMascot';
import ThemeToggle from '../components/ThemeToggle';

interface Child {
  id: string;
  name: string;
}

interface QRInfo {
  status: string;
  child_id: string | null;
  child_name: string | null;
  school_name: string;
  teacher_name: string;
  children: Child[];
  is_expired: boolean;
}

export default function Connect() {
  const router = useRouter();
  const { theme } = useTheme();
  
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [qrInfo, setQrInfo] = useState<QRInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Self Registration States
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState<number | ''>('');
  const [regGender, setRegGender] = useState('Laki-laki');
  const [regGrade, setRegGrade] = useState('SD Kelas 1');
  const [regError, setRegError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    // Parse query params dari URL luring secara andal
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    const serverParam = urlParams.get('server');

    if (!tokenParam) {
      setError('Token sambungan tidak ditemukan. Hubungi gurumu untuk mendapatkan QR Code baru.');
      setLoading(false);
      return;
    }

    setToken(tokenParam);
    
    // Tentukan URL server (fallback ke port 3004 lokal jika kosong)
    const activeServer = serverParam || 'http://localhost:3004';
    setServerUrl(activeServer);
    localStorage.setItem('api_base_url', activeServer);

    // Fetch detail token info
    fetch(`${activeServer}/api/v1/auth/qr/info/${tokenParam}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Token QR tidak valid atau telah kedaluwarsa.');
        }
        return res.json();
      })
      .then((data: QRInfo) => {
        setQrInfo(data);
        if (data.is_expired) {
          setError('Sesi QR Code telah kedaluwarsa. Minta guru untuk meregenerasi QR Code baru.');
        } else if (data.status === 'used') {
          setError('Token QR ini sudah digunakan.');
        } else if (data.child_id) {
          // Jika sudah diasosiasikan dengan anak tertentu, langsung sambungkan otomatis
          autoConnect(tokenParam, data.child_id, activeServer);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Gagal terhubung ke laptop server guru. Pastikan Anda berada dalam Wi-Fi kelas yang sama.');
        setLoading(false);
      });
  }, []);

  const autoConnect = async (tokenStr: string, childId: string, server: string) => {
    setConnecting(true);
    try {
      const res = await fetch(`${server}/api/v1/auth/qr/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenStr, child_id: childId }),
      });

      if (!res.ok) {
        throw new Error('Gagal mengaitkan perangkat.');
      }

      const authData = await res.json();
      
      // Simpan autentikasi untuk PWA luring
      sessionStorage.setItem('token', authData.access_token);
      
      // Simpan child profile data untuk halaman Latihan
      const mockResult = {
        recommended_level: 1,
        risk_score: 0,
        risk_level: 'Belum Dianalisis',
        child_id: childId,
        child_name: authData.child_name,
      };
      sessionStorage.setItem('dyslexia_result', JSON.stringify(mockResult));
      sessionStorage.setItem('student_connected_name', authData.child_name);
      sessionStorage.setItem('selected_child_id', childId);

      // Backup di localStorage untuk persistensi luring lintas tab
      localStorage.setItem('student_token', authData.access_token);
      localStorage.setItem('student_dyslexia_result', JSON.stringify(mockResult));
      localStorage.setItem('student_connected_name', authData.child_name);
      localStorage.setItem('selected_child_id', childId);

      setTimeout(() => {
        router.push('/latihan');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Gagal menyambungkan.');
      setConnecting(false);
    }
  };

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !serverUrl) return;

    if (!regName.trim() || !regAge) {
      setRegError('Nama Lengkap dan Usia wajib diisi.');
      return;
    }

    setRegistering(true);
    setRegError(null);

    try {
      const res = await fetch(`${serverUrl}/api/v1/auth/qr/register-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          name: regName,
          age: Number(regAge),
          gender: regGender,
          grade: regGrade
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Registrasi mandiri gagal.');
      }

      const authData = await res.json();

      // Sukses: Simpan autentikasi untuk PWA luring
      sessionStorage.setItem('token', authData.access_token);
      
      const mockResult = {
        recommended_level: 1,
        risk_score: 0,
        risk_level: 'Belum Dianalisis',
        child_id: authData.child_id,
        child_name: authData.child_name,
      };
      
      sessionStorage.setItem('dyslexia_result', JSON.stringify(mockResult));
      sessionStorage.setItem('student_connected_name', authData.child_name);
      sessionStorage.setItem('selected_child_id', authData.child_id);

      // Backup di localStorage untuk persistensi luring lintas tab
      localStorage.setItem('student_token', authData.access_token);
      localStorage.setItem('student_dyslexia_result', JSON.stringify(mockResult));
      localStorage.setItem('student_connected_name', authData.child_name);
      localStorage.setItem('selected_child_id', authData.child_id);

      setConnecting(true);
      setTimeout(() => {
        router.push('/latihan');
      }, 1500);

    } catch (err: any) {
      setRegError(err.message || 'Gagal melakukan pendaftaran mandiri.');
    } finally {
      setRegistering(false);
    }
  };

  const handleSelectChild = (childId: string) => {
    if (token && serverUrl) {
      autoConnect(token, childId, serverUrl);
    }
  };

  return (
    <>
      <div className="background-container">
        <div className="star" style={{ top: '15%', left: '20%', animationDelay: '0.3s' }}></div>
        <div className="star" style={{ top: '65%', left: '75%', animationDelay: '1.2s' }}></div>
      </div>

      <div className={styles.container} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Head>
          <title>DyLeks - Sambungkan Perangkat</title>
        </Head>

        <ThemeToggle />

        <div className={styles.centered} style={{ width: '100%', maxWidth: '480px', padding: '24px', background: 'rgba(255,255,255,0.06)', borderRadius: '24px', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <div className={styles.mascotContainer} style={{ width: '90px', height: '90px', marginBottom: '16px' }}>
            {theme === 'dark' ? <BatMascot /> : <ButterflyMascot />}
          </div>

          {loading && (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div className="loading-spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--primary-accent, #58CC02)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
              <p style={{ color: 'var(--text-secondary, #a0a0a0)' }}>Menghubungkan ke server kelas...</p>
            </div>
          )}

          {error && (
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ color: '#ff4d4d', fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#ff4d4d' }}>Sambungan Gagal</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary, #d0d0d0)', lineHeight: '1.5', marginBottom: '20px' }}>{error}</p>
              <button className={styles.button} onClick={() => window.location.reload()} style={{ padding: '10px 20px', fontSize: '14px' }}>
                Coba Hubungkan Ulang
              </button>
            </div>
          )}

          {connecting && !error && (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ color: '#58CC02', fontSize: '48px', marginBottom: '12px' }}>🎉</div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#58CC02' }}>Koneksi Berhasil!</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary, #d0d0d0)' }}>
                Halo <strong>{sessionStorage.getItem('student_connected_name') || 'Siswa'}</strong>! Mempersiapkan petualangan belajarmu...
              </p>
            </div>
          )}

          {!loading && !error && !connecting && qrInfo && !qrInfo.child_id && (
            <div style={{ width: '100%', textAlign: 'center' }}>
              {!showRegisterForm ? (
                <>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary, #ffffff)', marginBottom: '4px' }}>Pilih Profil Belajarmu</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary, #a0a0a0)', marginBottom: '20px' }}>
                    Terhubung ke <strong>{qrInfo.school_name}</strong> ({qrInfo.teacher_name})
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px', marginBottom: '20px' }}>
                    {qrInfo.children.length === 0 ? (
                      <p style={{ color: '#ff9900', fontSize: '13px' }}>Belum ada profil siswa terdaftar.</p>
                    ) : (
                      qrInfo.children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => handleSelectChild(child.id)}
                          style={{
                            padding: '14px 18px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            color: '#ffffff',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                            e.currentTarget.style.borderColor = '#58CC02';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          }}
                        >
                          <span>{child.name}</span>
                          <span style={{ fontSize: '18px', color: '#58CC02' }}>➔</span>
                        </button>
                      ))
                    )}
                  </div>
                  
                  <button 
                    onClick={() => setShowRegisterForm(true)}
                    style={{
                      width: '100%',
                      padding: '12px 18px',
                      background: 'rgba(88, 204, 2, 0.15)',
                      border: '1.5px dashed #58CC02',
                      borderRadius: '16px',
                      color: '#58CC02',
                      fontSize: '15px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(88, 204, 2, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(88, 204, 2, 0.15)';
                    }}
                  >
                    Daftar Sebagai Siswa Baru ➕
                  </button>
                </>
              ) : (
                <form onSubmit={handleRegisterStudent} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowRegisterForm(false)}
                      style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
                    >
                      ←
                    </button>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary, #ffffff)', margin: 0 }}>Daftar Siswa Baru</h2>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#a0a0a0' }}>Nama Lengkap</label>
                    <input 
                      type="text" 
                      required 
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#ffffff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#a0a0a0' }}>Usia (Tahun)</label>
                      <input 
                        type="number" 
                        required 
                        min="4"
                        max="18"
                        value={regAge}
                        onChange={(e) => setRegAge(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Usia"
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#ffffff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#a0a0a0' }}>Jenis Kelamin</label>
                      <select 
                        value={regGender}
                        onChange={(e) => setRegGender(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: '#ffffff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#a0a0a0' }}>Tingkat / Kelas</label>
                    <input 
                      type="text" 
                      required 
                      value={regGrade}
                      onChange={(e) => setRegGrade(e.target.value)}
                      placeholder="Contoh: SD Kelas 1"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#ffffff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  {regError && <p style={{ color: '#ff4d4d', fontSize: '13px', margin: 0 }}>{regError}</p>}

                  <button 
                    type="submit" 
                    disabled={registering}
                    style={{ width: '100%', minHeight: '48px', background: '#58CC02', color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}
                  >
                    {registering ? 'Mendaftar...' : 'Daftar & Hubungkan'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
