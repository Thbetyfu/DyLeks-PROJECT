import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';

interface Student {
  id: string;
  name: string;
  age: number | null;
  grade: string | null;
  current_level: number;
  risk_score: number;
  risk_level: string;
  has_medical_recommendation: boolean;
  teacher_name: string | null;
}

interface ScreeningRecord {
  id: string;
  risk_score: number;
  risk_level: string;
  recommended_level: number;
  feedback: string;
  created_at: string;
}

interface Recommendation {
  id: string;
  clinical_notes: string;
  medical_recommendations: string;
  created_at: string;
  psychologist_name: string;
}

interface StudentDetails {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  grade: string | null;
  current_level: number;
  risk_score: number;
  risk_level: string;
  teacher_notes: string | null;
  teacher_name: string | null;
  school_name: string | null;
  screening_history: ScreeningRecord[];
  recommendation_history: Recommendation[];
}

const WarningIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#FF5630' }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const SuccessIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#36B37E' }}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export default function PsychologistPortal() {
  const router = useRouter();
  const { theme } = useTheme();
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [token, setToken] = useState<string | null>(null);
  const [psyName, setPsyName] = useState('');
  
  // Form input state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [strInput, setStrInput] = useState('');
  const [clinicInput, setClinicInput] = useState('');

  // Dashboard state
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submittingRec, setSubmittingRec] = useState(false);

  // Recommendations Form Input
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');

  // Status message
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getApiBaseUrl = (): string => {
    if (typeof window === 'undefined') return 'http://localhost:3008';
    return `${window.location.protocol}//${window.location.hostname}:3008`;
  };

  useEffect(() => {
    const savedToken = sessionStorage.getItem('psy_token');
    const savedName = sessionStorage.getItem('psy_name');
    if (savedToken && savedName) {
      setToken(savedToken);
      setPsyName(savedName);
      setIsLoggedIn(true);
      fetchStudents(savedToken);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/psychologist/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Kredensial salah.');
      }

      const data = await res.json();
      sessionStorage.setItem('psy_token', data.access_token);
      sessionStorage.setItem('psy_name', data.user.full_name);
      setToken(data.access_token);
      setPsyName(data.user.full_name);
      setIsLoggedIn(true);
      fetchStudents(data.access_token);
      
      // Clear forms
      setUsernameInput('');
      setPasswordInput('');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/psychologist/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullNameInput,
          username: usernameInput,
          password: passwordInput,
          license_number: strInput,
          clinic_name: clinicInput || null
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Registrasi gagal.');
      }

      setSuccessMsg('Pendaftaran berhasil! Silakan masuk menggunakan akun Anda.');
      setAuthMode('login');
      
      // Clear register inputs
      setFullNameInput('');
      setStrInput('');
      setClinicInput('');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('psy_token');
    sessionStorage.removeItem('psy_name');
    setIsLoggedIn(false);
    setToken(null);
    setPsyName('');
    setStudents([]);
    setSelectedStudent(null);
  };

  const fetchStudents = async (accessToken: string) => {
    setLoadingList(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/psychologist/students`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchStudentDetails = async (studentId: string) => {
    if (!token) return;
    setLoadingDetails(true);
    setSelectedStudent(null);
    setErrorMsg(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/psychologist/students/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedStudent(data);
      }
    } catch (err) {
      console.error('Failed to fetch student details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubmitRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedStudent) return;
    setSubmittingRec(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/psychologist/students/${selectedStudent.id}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clinical_notes: clinicalNotes,
          medical_recommendations: treatmentPlan
        })
      });

      if (!res.ok) {
        throw new Error('Gagal mengirimkan catatan medis.');
      }

      setSuccessMsg('Rekomendasi medis berhasil disimpan dan dibagikan ke Guru.');
      setClinicalNotes('');
      setTreatmentPlan('');
      
      // Refresh details to show new recommendation in history
      fetchStudentDetails(selectedStudent.id);
      fetchStudents(token);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingRec(false);
    }
  };

  return (
    <>
      <div className="background-container">
        <div className="star" style={{ top: '10%', left: '15%' }}></div>
        <div className="star" style={{ top: '80%', left: '85%' }}></div>
      </div>

      <Head>
        <title>DyLeks - Portal Psikolog Medis</title>
      </Head>

      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Navigation Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: 'var(--surface)', borderBottom: '1px solid var(--glass-border)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
              <ShieldIcon />
            </div>
            <span style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '0.02em', color: 'var(--text-heading)' }}>
              DyLeks <span style={{ color: 'var(--primary)' }}>Klinis</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <ThemeToggle />
            {isLoggedIn && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>
                  Halo, {psyName}
                </span>
                <button 
                  onClick={handleLogout}
                  style={{ minHeight: '38px', padding: '0 16px', background: 'transparent', border: '1.5px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' }}
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px 40px', maxWidth: '1440px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          
          {/* Status Banners */}
          {errorMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', background: 'var(--error-light)', borderLeft: '4px solid var(--color-danger)', borderRadius: '12px', color: 'var(--text-main)', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>
              <WarningIcon />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', background: 'var(--success-light)', borderLeft: '4px solid var(--color-success)', borderRadius: '12px', color: 'var(--text-main)', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>
              <SuccessIcon />
              <span>{successMsg}</span>
            </div>
          )}

          {!isLoggedIn ? (
            /* Authentication Section */
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '40px 0' }}>
              <div style={{ width: '100%', maxWidth: '440px', background: 'var(--surface)', border: '1px solid var(--glass-border)', padding: '36px 30px', borderRadius: '28px', boxShadow: 'var(--glass-shadow)' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', textAlign: 'center', color: 'var(--text-heading)' }}>
                  {authMode === 'login' ? 'Portal Psikolog' : 'Daftar Akun Medis'}
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 28px 0', textAlign: 'center' }}>
                  {authMode === 'login' ? 'Masuk untuk memberikan diagnosis dan rujukan VAKT luring.' : 'Registrasi menggunakan nomor STR psikologi klinis Anda.'}
                </p>

                {authMode === 'login' ? (
                  <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>Username</label>
                      <input 
                        type="text" 
                        required 
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>Password</label>
                      <input 
                        type="password" 
                        required 
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                    <button type="submit" style={{ width: '100%', minHeight: '52px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: 'bold', marginTop: '10px' }}>
                      Masuk Ke Portal
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '14px' }}>
                      Belum memiliki akun medis?{' '}
                      <span onClick={() => { setAuthMode('register'); setErrorMsg(null); setSuccessMsg(null); }} style={{ color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>Daftar STR</span>
                    </p>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>Nama Lengkap & Gelar</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Dr. Sarah Sp.Psi"
                        value={fullNameInput}
                        onChange={(e) => setFullNameInput(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>Username</label>
                      <input 
                        type="text" 
                        required 
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>Password</label>
                      <input 
                        type="password" 
                        required 
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>Nomor STR / Izin Praktik</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="STR-XXXXX-XXXXX"
                        value={strInput}
                        onChange={(e) => setStrInput(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>Instansi Klinik / RS (Opsional)</label>
                      <input 
                        type="text" 
                        placeholder="RS Mitra Keluarga / Klinik Tumbuh Kembang"
                        value={clinicInput}
                        onChange={(e) => setClinicInput(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                    <button type="submit" style={{ width: '100%', minHeight: '52px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: 'bold', marginTop: '10px' }}>
                      Daftar STR Medis
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '14px' }}>
                      Sudah punya akun?{' '}
                      <span onClick={() => { setAuthMode('login'); setErrorMsg(null); setSuccessMsg(null); }} style={{ color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>Masuk</span>
                    </p>
                  </form>
                )}
              </div>
            </div>
          ) : (
            /* Dashboard Section */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '30px', flex: 1, alignItems: 'start' }}>
              
              {/* Left Column: Student List */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--glass-shadow)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--text-heading)' }}>Berkas Siswa Terdaftar</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Klik nama siswa untuk melihat telemetri kesalahan menulis dan catatan medis.</p>
                </div>

                {loadingList ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Memuat berkas...</div>
                ) : students.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Belum ada siswa yang mendaftar di sistem kelas.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '600px', overflowY: 'auto' }}>
                    {students.map((student) => {
                      const isHighRisk = student.risk_level === 'Tinggi';
                      const isMedRisk = student.risk_level === 'Sedang';
                      const badgeColor = isHighRisk ? 'var(--color-danger)' : isMedRisk ? 'var(--color-warning)' : 'var(--color-success)';
                      const badgeBg = isHighRisk ? 'var(--error-light)' : isMedRisk ? 'var(--warning-light)' : 'var(--success-light)';
                      
                      return (
                        <div
                          key={student.id}
                          onClick={() => fetchStudentDetails(student.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 18px',
                            borderRadius: '16px',
                            background: selectedStudent?.id === student.id ? 'var(--primary-light)' : 'var(--bg-card)',
                            border: `1.5px solid ${selectedStudent?.id === student.id ? 'var(--primary)' : 'var(--glass-border)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>{student.name}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {student.grade || 'SD'} | Guru: {student.teacher_name || 'Lokal'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '20px', background: badgeBg, color: badgeColor, fontSize: '11px', fontWeight: 'bold' }}>
                              Risiko: {student.risk_level}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: student.has_medical_recommendation ? 'var(--color-success)' : 'var(--text-light)' }}>
                              {student.has_medical_recommendation ? 'Saran Medis Aktif' : 'Butuh Tinjauan'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Student Details & Recommendations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {loadingDetails && (
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '60px 24px', boxShadow: 'var(--glass-shadow)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Memuat telemetri rekam medis siswa...
                  </div>
                )}

                {!loadingDetails && !selectedStudent && (
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '60px 24px', boxShadow: 'var(--glass-shadow)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Silakan pilih siswa di sebelah kiri untuk meninjau status medis dan telemetri klinis.
                  </div>
                )}

                {!loadingDetails && selectedStudent && (
                  <>
                    {/* Student Clinical Header */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--glass-shadow)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px 0', color: 'var(--text-heading)' }}>
                            {selectedStudent.name}
                          </h2>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                            {selectedStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}, {selectedStudent.age || '--'} Tahun | {selectedStudent.grade || '--'}
                          </p>
                        </div>
                        <span style={{ padding: '6px 14px', borderRadius: '999px', background: selectedStudent.risk_level === 'Tinggi' ? 'var(--error-light)' : 'var(--success-light)', color: selectedStudent.risk_level === 'Tinggi' ? 'var(--color-danger)' : 'var(--color-success)', fontSize: '13px', fontWeight: 'bold' }}>
                          Skor Risiko: {selectedStudent.risk_score}%
                        </span>
                      </div>

                      <div style={{ gridTemplateColumns: '1fr 1fr', display: 'grid', gap: '16px', background: 'var(--bg-card)', padding: '16px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Sekolah</span>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{selectedStudent.school_name || 'Lokal'}</span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Guru Pengampu</span>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{selectedStudent.teacher_name || 'Lokal'}</span>
                        </div>
                      </div>

                      {selectedStudent.teacher_notes && (
                        <div style={{ padding: '14px', background: 'var(--primary-light)', borderLeft: '4px solid var(--primary)', borderRadius: '12px' }}>
                          <span style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '4px' }}>Catatan Observasi Guru</span>
                          <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0, lineHeight: '1.6' }}>{selectedStudent.teacher_notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Telemetry Writing Error Analysis */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--glass-shadow)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'var(--text-heading)' }}>
                        Telemetri Analisis Kesalahan Tulisan Tangan (TrOCR)
                      </h3>

                      {selectedStudent.screening_history.length === 0 ? (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0' }}>Belum ada riwayat skrining AI untuk anak ini.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {selectedStudent.screening_history.map((sh) => (
                            <div key={sh.id} style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                                  Tanggal Pemeriksaan: {new Date(sh.created_at).toLocaleDateString('id-ID')}
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: sh.risk_level === 'Tinggi' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                  Skor Sesi: {sh.risk_score}% ({sh.risk_level})
                                </span>
                              </div>
                              <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0, lineHeight: '1.6' }}>
                                <strong>Feedback Analisis Kesalahan:</strong> {sh.feedback}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Form: Submit New Medical Recommendation */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--glass-shadow)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', color: 'var(--text-heading)' }}>
                          Beri Diagnosis & Rekomendasi Terapi Medis
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                          Catatan ini akan langsung tersinkronisasi dan terbaca di kolom medis pada Dashboard Guru.
                        </p>
                      </div>

                      <form onSubmit={handleSubmitRecommendation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>
                            1. Diagnosis Klinis (Gejala / Pola Kesalahan yang Diamati)
                          </label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Contoh: Siswa menunjukkan dominasi kesalahan pembalikan spasial (reversal) pada huruf b dan d secara terus-menerus. Koordinasi motorik halus masih belum matang."
                            value={clinicalNotes}
                            onChange={(e) => setClinicalNotes(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: '1.5', resize: 'vertical' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>
                            2. Program Terapi / Rekomendasi Medis (VAKT Luring Kelas)
                          </label>
                          <textarea
                            required
                            rows={4}
                            placeholder="Contoh: 1. Berikan latihan taktil melukis huruf b/d di atas pasir/tekstur kasar. 2. Rekomendasikan perujukan ke terapi wicara/okupasi luring. 3. Hindari tekanan waktu saat membaca."
                            value={treatmentPlan}
                            onChange={(e) => setTreatmentPlan(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: '1.5', resize: 'vertical' }}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submittingRec}
                          style={{ minHeight: '52px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                        >
                          {submittingRec ? 'Mengirimkan saran medis...' : 'Kirim & Terapkan Rekomendasi'}
                        </button>
                      </form>
                    </div>

                    {/* Recommendation History */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--glass-shadow)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'var(--text-heading)' }}>
                        Riwayat Rekomendasi Medis Profesional
                      </h3>

                      {selectedStudent.recommendation_history.length === 0 ? (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0' }}>Belum ada rekomendasi medis yang diajukan sebelumnya.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {selectedStudent.recommendation_history.map((rec) => (
                            <div key={rec.id} style={{ borderBottom: '1px dashed var(--glass-border)', paddingBottom: '14px', lastChild: { borderBottom: 'none' } }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)' }}>
                                  Oleh: {rec.psychologist_name}
                                </span>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                  {new Date(rec.created_at).toLocaleDateString('id-ID')}
                                </span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', lineHeight: '1.6' }}>
                                <p style={{ margin: 0 }}><strong>Diagnosis:</strong> {rec.clinical_notes}</p>
                                <p style={{ margin: 0 }}><strong>Saran Medis/Terapi:</strong> {rec.medical_recommendations}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        .background-container {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          z-index: -2;
          background: var(--bg-gradient);
          overflow: hidden;
        }
        .star {
          position: absolute;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--primary-light);
          opacity: 0.12;
          pointer-events: none;
        }
      `}</style>
    </>
  );
}
