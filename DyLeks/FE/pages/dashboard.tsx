import { useState, useEffect, useRef } from 'react';
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
  age: number | null;
  gender: string | null;
  grade: string | null;
  current_level: number;
  risk_score: number;
  risk_level: string;
  teacher_notes: string | null;
}

export default function Dashboard() {
  const router = useRouter();
  const { theme } = useTheme();

  // Auth States
  const [teacherToken, setTeacherToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolRegion, setSchoolRegion] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Student Profiles Data States
  const [children, setChildren] = useState<Child[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentAge, setNewStudentAge] = useState('');
  const [newStudentGender, setNewStudentGender] = useState('L');
  const [newStudentGrade, setNewStudentGrade] = useState('Kelas 1 SD');
  const [newStudentNotes, setNewStudentNotes] = useState('');

  // QR & Polling States
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<string>('');
  const [connectedStudentName, setConnectedStudentName] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Edit Note States
  const [editingNotes, setEditingNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('teacher_token');
    if (token) {
      setTeacherToken(token);
      fetchChildren(token);
    }
  }, []);

  // Login Guru
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

  // Register Guru
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

      // Login otomatis
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
    setSelectedChild(null);
    setQrToken(null);
  };

  // Fetch daftar anak
  const fetchChildren = async (token: string) => {
    setLoadingStudents(true);
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
    } finally {
      setLoadingStudents(false);
    }
  };

  // Tambah Profil Siswa Baru
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherToken) return;

    try {
      const apiBase = localStorage.getItem('api_base_url') || 'http://localhost:3002';
      const res = await fetch(`${apiBase}/api/v1/auth/children`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({
          name: newStudentName,
          age: parseInt(newStudentAge) || null,
          gender: newStudentGender,
          grade: newStudentGrade,
          teacher_notes: newStudentNotes || null,
        }),
      });

      if (!res.ok) throw new Error('Gagal menambahkan siswa.');

      // Reset form & reload data
      setNewStudentName('');
      setNewStudentAge('');
      setNewStudentNotes('');
      setShowAddModal(false);
      fetchChildren(teacherToken);
    } catch (err: any) {
      alert(err.message || 'Gagal membuat profil.');
    }
  };

  // Update Catatan Guru (Orton-Gillingham)
  const handleSaveNotes = async () => {
    if (!teacherToken || !selectedChild) return;
    setNotesSaving(true);
    try {
      const apiBase = localStorage.getItem('api_base_url') || 'http://localhost:3002';
      const res = await fetch(`${apiBase}/api/v1/auth/children/${selectedChild.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({
          name: selectedChild.name,
          age: selectedChild.age,
          gender: selectedChild.gender,
          grade: selectedChild.grade,
          teacher_notes: editingNotes,
        }),
      });

      if (!res.ok) throw new Error('Gagal memperbarui catatan.');

      const updated = await res.json();
      setSelectedChild(updated);
      
      // Update data di state list agar ter-sinkron
      setChildren(children.map(c => c.id === updated.id ? updated : c));
      alert('Catatan intervensi pedagogis berhasil disimpan secara aman.');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan catatan.');
    } finally {
      setNotesSaving(false);
    }
  };

  // Hapus Siswa
  const handleDeleteStudent = async (id: string) => {
    if (!teacherToken) return;
    if (!confirm('Apakah Anda yakin ingin menghapus profil siswa ini beserta seluruh riwayat skrining & latihan? Tindakan ini tidak bisa dibatalkan.')) return;

    try {
      const apiBase = localStorage.getItem('api_base_url') || 'http://localhost:3002';
      const res = await fetch(`${apiBase}/api/v1/auth/children/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${teacherToken}` },
      });

      if (!res.ok) throw new Error('Gagal menghapus profil.');

      if (selectedChild?.id === id) {
        setSelectedChild(null);
      }
      fetchChildren(teacherToken);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus.');
    }
  };

  // Generate QR Token
  const triggerQrModal = async (childId: string) => {
    if (!teacherToken) return;
    setQrLoading(true);
    setConnectedStudentName(null);
    setShowQrModal(true);
    try {
      const apiBase = localStorage.getItem('api_base_url') || 'http://localhost:3002';
      const res = await fetch(`${apiBase}/api/v1/auth/qr/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({
          child_id: childId,
        }),
      });

      if (!res.ok) throw new Error('Gagal membuat QR token.');

      const data = await res.json();
      setQrToken(data.token);
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
            playSuccessSound();
            setConnectedStudentName(data.child_name || 'Siswa');
            setQrToken(null); // stop polling
            fetchChildren(teacherToken); // refresh stats

            setTimeout(() => {
              setShowQrModal(false);
              setConnectedStudentName(null);
            }, 3000);
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
      } catch (e) {}
    }
  };

  const getQRUrl = () => {
    if (typeof window === 'undefined') return '';
    const host = window.location.hostname;
    return `http://${host}:3001/connect?token=${qrToken}&server=http://${host}:3002`;
  };

  // Menghitung Metrik Overview Kelas
  const totalStudents = children.length;
  const highRiskCount = children.filter(c => c.risk_level === 'Tinggi').length;
  const mediumRiskCount = children.filter(c => c.risk_level === 'Sedang').length;
  const lowRiskCount = children.filter(c => c.risk_level === 'Rendah').length;

  return (
    <>
      <div className="background-container">
        <div className="star" style={{ top: '10%', left: '15%', animationDelay: '0.2s' }}></div>
        <div className="star" style={{ top: '60%', left: '80%', animationDelay: '1.5s' }}></div>
        <div className="star" style={{ top: '40%', left: '50%', animationDelay: '2.5s' }}></div>
      </div>

      <div className={styles.container} style={{ maxWidth: '1200px', minHeight: '100vh', padding: '40px 20px' }}>
        <Head>
          <title>DyLeks - Dashboard Guru</title>
        </Head>

        <ThemeToggle />

        {!teacherToken ? (
          // ==================== LAYAR AUTH GURU (LOGIN / REGISTER) ====================
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div style={{ background: theme === 'dark' ? '#181b2a' : '#ffffff', color: theme === 'dark' ? '#ffffff' : '#1a202c', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '440px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
              <div className={styles.mascotContainer} style={{ width: '80px', height: '80px', margin: '0 auto 10px' }}>
                {theme === 'dark' ? <BatMascot /> : <ButterflyMascot />}
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>{isRegistering ? 'Daftar Guru Baru' : 'Masuk Dashboard Guru'}</h2>
              <p style={{ fontSize: '13px', color: 'gray', margin: 0 }}>Hubungkan laptop gurumu untuk memantau kemajuan membaca anak luring.</p>

              <form onSubmit={isRegistering ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                {isRegistering && (
                  <>
                    <input type="text" placeholder="Nama Lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.4)', background: 'transparent', color: 'inherit' }} />
                    <input type="text" placeholder="Nama Sekolah" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.4)', background: 'transparent', color: 'inherit' }} />
                    <input type="text" placeholder="Wilayah Sekolah (Contoh: Bandung, Jawa Barat)" value={schoolRegion} onChange={(e) => setSchoolRegion(e.target.value)} required style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.4)', background: 'transparent', color: 'inherit' }} />
                  </>
                )}
                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.4)', background: 'transparent', color: 'inherit' }} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.4)', background: 'transparent', color: 'inherit' }} />
                
                {authError && <p style={{ color: '#ff4d4d', fontSize: '13px', margin: 0 }}>{authError}</p>}
                
                <button type="submit" style={{ padding: '12px', borderRadius: '12px', background: '#58CC02', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '10px' }}>
                  {isRegistering ? 'Daftar & Masuk' : 'Masuk'}
                </button>
              </form>

              <p style={{ fontSize: '13px', margin: 0 }}>
                {isRegistering ? 'Sudah punya akun?' : 'Belum punya akun luring?'} {' '}
                <span onClick={() => { setIsRegistering(!isRegistering); setAuthError(null); }} style={{ color: '#58CC02', cursor: 'pointer', textDecoration: 'underline' }}>
                  {isRegistering ? 'Login di sini' : 'Daftar di sini'}
                </span>
              </p>
            </div>
          </div>
        ) : (
          // ==================== UTAMA: DASHBOARD GURU ====================
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%' }}>
            
            {/* Header Dashboard */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '20px 30px', borderRadius: '20px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--text-primary, #ffffff)', margin: 0 }}>Dashboard Kelas Guru</h1>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary, #a0a0a0)', margin: '4px 0 0 0' }}>Pantau kemantapan kognitif & tremor motorik anak secara luring.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button onClick={() => router.push('/')} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: 'inherit', fontWeight: '600', cursor: 'pointer' }}>Beranda Utama</button>
                <button onClick={handleLogout} style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #e53e3e 0%, #9b2c2c 100%)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Logout</button>
              </div>
            </div>

            {/* Overview Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                <h3 style={{ fontSize: '14px', color: 'gray', margin: '0 0 8px 0' }}>Total Siswa Terdaftar</h3>
                <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#4299e1' }}>{totalStudents}</p>
              </div>
              <div style={{ background: 'rgba(229, 62, 62, 0.08)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(229, 62, 62, 0.2)', textAlign: 'center' }}>
                <h3 style={{ fontSize: '14px', color: '#feb2b2', margin: '0 0 8px 0' }}>Risiko Disleksia TINGGI</h3>
                <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#e53e3e' }}>{highRiskCount}</p>
              </div>
              <div style={{ background: 'rgba(221, 107, 32, 0.08)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(221, 107, 32, 0.2)', textAlign: 'center' }}>
                <h3 style={{ fontSize: '14px', color: '#fbd38d', margin: '0 0 8px 0' }}>Risiko Disleksia SEDANG</h3>
                <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#dd6b20' }}>{mediumRiskCount}</p>
              </div>
              <div style={{ background: 'rgba(72, 187, 120, 0.08)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(72, 187, 120, 0.2)', textAlign: 'center' }}>
                <h3 style={{ fontSize: '14px', color: '#c6f6d5', margin: '0 0 8px 0' }}>Risiko Disleksia RENDAH</h3>
                <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#48bb78' }}>{lowRiskCount}</p>
              </div>
            </div>

            {/* Layout Grid: List Siswa + Panel Detail (Side-by-Side jika ada anak yang dipilih) */}
            <div style={{ display: 'grid', gridTemplateColumns: selectedChild ? '2fr 1.3fr' : '1fr', gap: '30px', transition: 'all 0.3s ease' }}>
              
              {/* Box Daftar Siswa */}
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Profil & Status Siswa</h2>
                  <button onClick={() => setShowAddModal(true)} style={{ padding: '10px 18px', background: '#58CC02', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>+</span> Tambah Profil Siswa
                  </button>
                </div>

                {loadingStudents ? (
                  <p style={{ color: 'gray', textAlign: 'center', padding: '40px' }}>Memuat daftar siswa...</p>
                ) : children.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'gray' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📂</div>
                    <p style={{ margin: 0 }}>Belum ada profil siswa di bawah pengelolaan Anda.</p>
                    <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>Klik tombol "Tambah Profil Siswa" di kanan atas untuk memulai.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'gray', fontSize: '13px' }}>
                          <th style={{ padding: '12px' }}>Nama</th>
                          <th style={{ padding: '12px' }}>Kelas</th>
                          <th style={{ padding: '12px' }}>Level Saat Ini</th>
                          <th style={{ padding: '12px' }}>Skor Risiko</th>
                          <th style={{ padding: '12px' }}>Tingkat Risiko</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Tindakan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {children.map((child) => (
                          <tr
                            key={child.id}
                            style={{
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              cursor: 'pointer',
                              background: selectedChild?.id === child.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                            }}
                            onClick={() => {
                              setSelectedChild(child);
                              setEditingNotes(child.teacher_notes || '');
                            }}
                          >
                            <td style={{ padding: '16px 12px', fontWeight: 'bold' }}>{child.name}</td>
                            <td style={{ padding: '16px 12px' }}>{child.grade || '-'}</td>
                            <td style={{ padding: '16px 12px' }}>
                              <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '8px', fontSize: '12px' }}>Level {child.current_level}</span>
                            </td>
                            <td style={{ padding: '16px 12px' }}>{child.risk_score.toFixed(1)}%</td>
                            <td style={{ padding: '16px 12px' }}>
                              <span
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  background:
                                    child.risk_level === 'Tinggi'
                                      ? 'rgba(229,62,62,0.15)'
                                      : child.risk_level === 'Sedang'
                                      ? 'rgba(221,107,32,0.15)'
                                      : 'rgba(72,187,120,0.15)',
                                  color:
                                    child.risk_level === 'Tinggi'
                                      ? '#fc8181'
                                      : child.risk_level === 'Sedang'
                                      ? '#fbd38d'
                                      : '#68d391',
                                }}
                              >
                                {child.risk_level}
                              </span>
                            </td>
                            <td style={{ padding: '16px 12px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => triggerQrModal(child.id)}
                                  style={{ padding: '6px 12px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                  Hubungkan (QR)
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(child.id)}
                                  style={{ padding: '6px 12px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Panel Detail & Catatan Guru (Muncul jika ada siswa yang diklik) */}
              {selectedChild && (
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
                  <button onClick={() => setSelectedChild(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', fontSize: '18px', color: 'gray', cursor: 'pointer' }}>✕</button>

                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>Detail Siswa</h2>
                  
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'gray' }}>Nama Lengkap</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{selectedChild.name}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'gray' }}>Usia</p>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{selectedChild.age || '-'} Tahun</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'gray' }}>Jenis Kelamin</p>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{selectedChild.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                    </div>
                  </div>

                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'gray' }}>Skor Risiko Disleksia Akhir</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                      <span style={{ fontSize: '22px', fontWeight: 'bold', color: selectedChild.risk_level === 'Tinggi' ? '#fc8181' : selectedChild.risk_level === 'Sedang' ? '#fbd38d' : '#68d391' }}>
                        {selectedChild.risk_score.toFixed(1)}%
                      </span>
                      <span style={{ fontSize: '12px', color: 'gray' }}>({selectedChild.risk_level})</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#feb2b2' }}>Catatan Intervensi Pedagogis Guru (Orton-Gillingham):</label>
                    <textarea
                      value={editingNotes}
                      onChange={(e) => setEditingNotes(e.target.value)}
                      placeholder="Masukkan catatan pengajaran khusus, misalnya: 'Siswa sering membalik huruf b dan d. Rekomendasi intervensi taktil menulis di atas pasir kelas luring.'"
                      rows={5}
                      style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.4)', background: 'rgba(0,0,0,0.2)', color: 'inherit', fontSize: '13px', lineHeight: '1.5', resize: 'vertical' }}
                    />
                    <button
                      onClick={handleSaveNotes}
                      disabled={notesSaving}
                      style={{ padding: '10px', background: '#58CC02', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}
                    >
                      {notesSaving ? 'Menyimpan...' : 'Simpan Catatan Aman'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Modal: Tambah Profil Siswa */}
        {showAddModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ background: theme === 'dark' ? '#181b2a' : '#ffffff', color: theme === 'dark' ? '#ffffff' : '#1a202c', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '440px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
              <button onClick={() => setShowAddModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', fontSize: '20px', color: 'gray', cursor: 'pointer' }}>✕</button>

              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Tambah Siswa Baru</h2>
              <form onSubmit={handleCreateStudent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" placeholder="Nama Lengkap Anak" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} required style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.4)', background: 'transparent', color: 'inherit' }} />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input type="number" placeholder="Usia (Tahun)" value={newStudentAge} onChange={(e) => setNewStudentAge(e.target.value)} style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.4)', background: 'transparent', color: 'inherit' }} />
                  <select
                    value={newStudentGender}
                    onChange={(e) => setNewStudentGender(e.target.value)}
                    style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.4)', background: theme === 'dark' ? '#181b2a' : '#ffffff', color: 'inherit' }}
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <select
                  value={newStudentGrade}
                  onChange={(e) => setNewStudentGrade(e.target.value)}
                  style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.4)', background: theme === 'dark' ? '#181b2a' : '#ffffff', color: 'inherit' }}
                >
                  <option value="Kelas 1 SD">Kelas 1 SD</option>
                  <option value="Kelas 2 SD">Kelas 2 SD</option>
                  <option value="Kelas 3 SD">Kelas 3 SD</option>
                  <option value="Kelas 4 SD">Kelas 4 SD</option>
                  <option value="Kelas 5 SD">Kelas 5 SD</option>
                  <option value="Kelas 6 SD">Kelas 6 SD</option>
                </select>

                <textarea placeholder="Catatan Awal (opsional)" value={newStudentNotes} onChange={(e) => setNewStudentNotes(e.target.value)} rows={3} style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(128,128,128,0.4)', background: 'transparent', color: 'inherit', resize: 'vertical' }} />

                <button type="submit" style={{ padding: '12px', borderRadius: '12px', background: '#58CC02', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '10px' }}>
                  Simpan Profil Siswa
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: QR Code Connection Polling */}
        {showQrModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ background: theme === 'dark' ? '#181b2a' : '#ffffff', color: theme === 'dark' ? '#ffffff' : '#1a202c', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center', position: 'relative' }}>
              
              <button onClick={() => setShowQrModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', fontSize: '20px', color: 'gray', cursor: 'pointer' }}>✕</button>

              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Hubungkan Perangkat Siswa</h2>
              <p style={{ fontSize: '12px', color: 'gray', margin: 0 }}>Scan QR Code di bawah menggunakan smartphone siswa untuk menyambungkan profil belajar.</p>

              {qrLoading ? (
                <div style={{ padding: '40px' }}>Membuat token koneksi luring...</div>
              ) : qrToken ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '12px', background: 'white', borderRadius: '16px', border: '4px solid #58CC02' }}>
                    <QRCodeSVG value={getQRUrl()} size={180} />
                  </div>
                  <p style={{ fontSize: '11px', color: 'gray', wordBreak: 'break-all', margin: 0 }}>
                    Alamat luring kelas:<br/>
                    <code style={{ color: '#58CC02' }}>{getQRUrl()}</code>
                  </p>
                </div>
              ) : null}

              {connectedStudentName && (
                <div style={{ padding: '10px 20px', background: 'rgba(88,204,2,0.1)', color: '#58CC02', border: '1px solid rgba(88,204,2,0.2)', borderRadius: '12px', fontWeight: 'bold', width: '100%' }}>
                  🎉 Siswa "{connectedStudentName}" Terhubung!
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
