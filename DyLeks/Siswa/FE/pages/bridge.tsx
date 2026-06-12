import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import styles from '../styles/Bridge.module.css';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

interface BridgeRound {
  target: string;
  parts: string[]; // Correct sequence, e.g. ['ME-', 'TULIS']
  pool: string[]; // Shuffled parts + distractors
  warning: string;
}

const BRIDGE_ROUNDS: BridgeRound[] = [
  { target: 'MENULIS', parts: ['ME-', 'TULIS'], pool: ['TULIS', 'ME-', '-KAN', 'BER-'], warning: 'Untuk imbuhan me- + tulis, awalan "ME-" bergabung menjadi "MENU-" di depan kata "TULIS".' },
  { target: 'MEMBACA', parts: ['MEM-', 'BACA'], pool: ['MEM-', 'BACA', '-NYA', 'TER-'], warning: 'Untuk kata membacakan, awalan "MEM-" disandingkan di depan kata dasar "BACA".' },
  { target: 'BERMAIN', parts: ['BER-', 'MAIN'], pool: ['BER-', 'MAIN', '-AN', 'ME-'], warning: 'Kata dasar "MAIN" diberikan awalan "BER-" di sebelah kiri.' },
  { target: 'PENGGARIS', parts: ['PENG-', 'GARIS'], pool: ['PENG-', 'GARIS', '-AN', 'SE-'], warning: 'Alat tulis "PENGGARIS" dibentuk dari awalan "PENG-" diikuti kata "GARIS".' }
];

export default function MorphemeBridge() {
  const router = useRouter();
  const { theme } = useTheme();

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [status, setStatus] = useState<'idle' | 'playing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Drop zone (placed blocks) and Pool (available blocks)
  const [placed, setPlaced] = useState<string[]>([]);
  const [pool, setPool] = useState<string[]>([]);

  const activeRound = BRIDGE_ROUNDS[round];

  useEffect(() => {
    initializeRound();
  }, [round]);

  const initializeRound = () => {
    setStatus('playing');
    setPlaced([]);
    setPool([...activeRound.pool].sort(() => Math.random() - 0.5));
    setMessage(`Susun kepingan balok imbuhan dan kata untuk menyambung jembatan menjadi: "${activeRound.target}"`);
    playTargetAudio(activeRound.target);
  };

  const playTargetAudio = (word: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Susun kata ${word.toLowerCase()}`);
      utterance.lang = 'id-ID';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const playSpeechSound = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      window.speechSynthesis.speak(utterance);
    }
  };

  const addBlock = (val: string) => {
    if (status !== 'playing') return;
    setPlaced(prev => [...prev, val]);
    setPool(prev => prev.filter(x => x !== val));
    triggerHaptic(30);
  };

  const removeBlock = (val: string) => {
    if (status !== 'playing') return;
    setPool(prev => [...prev, val]);
    setPlaced(prev => prev.filter(x => x !== val));
    triggerHaptic(20);
  };

  const checkBridge = () => {
    // Check if placed sequence matches correct parts
    const isCorrect = placed.length === activeRound.parts.length && 
                      placed.every((val, idx) => val === activeRound.parts[idx]);

    if (isCorrect) {
      setStatus('success');
      setScore(prev => prev + 10);
      triggerHaptic([60, 40, 60]);
      playSpeechSound("Jembatan terhubung!");
      setMessage(`Sempurna! Jembatan tersambung membentuk kata "${activeRound.target}".`);
    } else {
      setStatus('error');
      setErrors(prev => prev + 1);
      triggerHaptic(200);
      playSpeechSound("Salah urutan.");
      setMessage(activeRound.warning);
    }
  };

  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const handleNextRound = () => {
    setStatus('idle');
    setRound(prev => (prev + 1) % BRIDGE_ROUNDS.length);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Penyusun Jembatan Kata - DyLeks</title>
      </Head>

      <button className={styles.backBtn} onClick={() => router.push('/latihan')} aria-label="Kembali">
        ←
      </button>

      <div className={styles.centeredWrapper}>
        <div className={styles.themeToggleWrapper}>
          <ThemeToggle />
        </div>

        <header className={styles.header}>
          <div className={styles.badge}>
            <span>Morfologi Kata (Morpheme Structure)</span>
          </div>
          <h1 className={styles.title}>Morpheme Bridge</h1>
          <p className={styles.subtitle}>
            Klik potongan kata di bawah untuk menyusun jembatan kata dasar dan imbuhannya.
          </p>
        </header>

        <div className={styles.gameBoard}>
          <div className={styles.targetDisplay}>
            <span className={styles.targetLabel}>Target Jembatan</span>
            <span className={styles.targetWord}>{activeRound.target}</span>
          </div>

          <span className={styles.targetLabel} style={{ marginBottom: '8px' }}>Jembatan Kata</span>
          <div className={styles.dropZone}>
            {placed.length === 0 ? (
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Ketuk kepingan di bawah untuk mengisi jembatan</span>
            ) : (
              placed.map((val, idx) => (
                <button key={idx} className={styles.block} onClick={() => removeBlock(val)}>
                  {val}
                </button>
              ))
            )}
          </div>

          <span className={styles.targetLabel} style={{ marginBottom: '8px' }}>Pilihan Kepingan</span>
          <div className={styles.blocksGrid}>
            {pool.map((val, idx) => (
              <button key={idx} className={styles.block} onClick={() => addBlock(val)} style={{ background: '#1e293b' }}>
                {val}
              </button>
            ))}
          </div>

          {placed.length > 0 && status === 'playing' && (
            <button className={styles.modalBtn} onClick={checkBridge} style={{ marginTop: '16px' }}>
              Hubungkan Jembatan 🌉
            </button>
          )}
        </div>

        <div className={styles.hintBanner} style={{ border: status === 'error' ? '1px solid #ef4444' : '' }}>
          <span>{message}</span>
        </div>

        <div className={styles.scoreRow}>
          <div className={styles.scoreCard}>
            <span className={styles.scoreLabel}>Total Poin</span>
            <span className={styles.scoreVal}>{score}</span>
          </div>
          <div className={styles.scoreCard}>
            <span className={styles.scoreLabel}>Salah Hubung</span>
            <span className={styles.scoreVal} style={{ color: '#ef4444' }}>{errors}</span>
          </div>
        </div>
      </div>

      {status === 'success' && (
        <div className={styles.rewardModal}>
          <div className={styles.modalContent}>
            <span style={{ fontSize: '48px' }}>🌉✨</span>
            <h2 className={styles.modalTitle}>Jembatan Tersambung!</h2>
            <p className={styles.modalText}>
              Luar biasa! Kamu berhasil menyusun struktur morfologi imbuhan kata dasar dengan urutan yang tepat!
            </p>
            <button className={styles.modalBtn} onClick={handleNextRound}>
              Tantangan Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
