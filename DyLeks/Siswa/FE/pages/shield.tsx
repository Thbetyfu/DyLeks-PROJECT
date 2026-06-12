import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import styles from '../styles/Shield.module.css';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

interface ShieldRound {
  target: string;
  options: string[]; // Meteor ejaans
  warning: string;
}

const SHIELD_ROUNDS: ShieldRound[] = [
  { target: 'RUMAH', options: ['RUMAH', 'RUMHA', 'RUMA', 'RUAMH'], warning: 'Kata "RUMHA" mengalami penukaran urutan huruf (transposisi) di belakang!' },
  { target: 'PISANG', options: ['PISANG', 'PISAG', 'PIASNG', 'PISANGG'], warning: 'Kata "PISAG" mengalami penghilangan huruf n (omisi)!' },
  { target: 'BUKU', options: ['BUKU', 'BUUKU', 'DUKU', 'BUK'], warning: 'Kata "DUKU" mengalami substitusi huruf d dengan b!' },
  { target: 'MAGNET', options: ['MAGNET', 'MAGENT', 'MANET', 'MAGNEET'], warning: 'Kata "MAGENT" mengalami transposisi huruf n dan e!' }
];

interface MeteorState {
  id: number;
  val: string;
  x: number;
  y: number;
  speed: number;
}

export default function SightWordShield() {
  const router = useRouter();
  const { theme } = useTheme();

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [shieldHealth, setShieldHealth] = useState(100);
  const [status, setStatus] = useState<'idle' | 'playing' | 'success' | 'gameover'>('idle');
  const [message, setMessage] = useState('');

  const [meteors, setMeteors] = useState<MeteorState[]>([]);
  const animationRef = useRef<number | null>(null);

  const activeRound = SHIELD_ROUNDS[round];

  useEffect(() => {
    initializeRound();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [round]);

  const initializeRound = () => {
    setStatus('playing');
    setMessage(`Tembak meteor bertuliskan kata yang benar: "${activeRound.target}"`);

    // Spawn meteors at different lanes
    const spawned = activeRound.options.map((val, idx) => ({
      id: idx,
      val,
      x: 10 + idx * 110, // Lanes: 10, 120, 230, 340
      y: -50 - Math.random() * 80, // Staggered drop
      speed: 0.5 + Math.random() * 0.4
    }));
    setMeteors(spawned);
    playTargetAudio(activeRound.target);
  };

  // Game loop to drop meteors
  useEffect(() => {
    if (status !== 'playing') return;

    const dropMeteors = () => {
      setMeteors(prev => {
        let damaged = false;
        const updated = prev.map(m => {
          const nextY = m.y + m.speed;
          
          // Collision check: if meteor hits shield at bottom (y >= 300)
          if (nextY >= 310) {
            damaged = true;
            return null; // Remove meteor
          }
          return { ...m, y: nextY };
        }).filter(Boolean) as MeteorState[];

        if (damaged) {
          triggerHaptic(200);
          setShieldHealth(h => {
            const nextH = Math.max(0, h - 25);
            if (nextH <= 0) {
              setStatus('gameover');
              playSpeechSound("Perisai hancur. Coba lagi.");
            }
            return nextH;
          });
        }

        // If all options are gone but correct wasn't shot, respawn
        if (updated.length === 0 && shieldHealth > 0) {
          initializeRound();
        }

        return updated;
      });

      animationRef.current = requestAnimationFrame(dropMeteors);
    };

    animationRef.current = requestAnimationFrame(dropMeteors);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [status, shieldHealth]);

  const playTargetAudio = (word: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Tembak kata ${word.toLowerCase()}`);
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

  const handleMeteorClick = (val: string, id: number) => {
    if (status !== 'playing') return;

    if (val === activeRound.target) {
      // Correct shooting
      setStatus('success');
      setScore(prev => prev + 10);
      triggerHaptic([60, 40, 60]);
      playSpeechSound("Meteor hancur!");
      setMessage(`Sempurna! Kamu menyelamatkan perisai dengan kata "${activeRound.target}".`);
    } else {
      // Wrong shooting
      triggerHaptic(150);
      setScore(prev => Math.max(0, prev - 5));
      setMessage(activeRound.warning);
      playSpeechSound("Salah sasaran!");
      
      // Remove wrong meteor
      setMeteors(prev => prev.filter(m => m.id !== id));
    }
  };

  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const handleNextRound = () => {
    setRound(prev => (prev + 1) % SHIELD_ROUNDS.length);
  };

  const resetGame = () => {
    setShieldHealth(100);
    setScore(0);
    setRound(0);
    setStatus('playing');
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Penyelamat Kata - DyLeks</title>
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
            <span>Tembak Ejaan Benar (Sight Recognition)</span>
          </div>
          <h1 className={styles.title}>Sight Word Shield</h1>
          <p className={styles.subtitle}>
            Tembak batu meteor dengan kata ejaan yang benar untuk melindungi maskot.
          </p>
        </header>

        <div className={styles.gameBoard}>
          <div className={styles.targetDisplay}>
            <span className={styles.targetLabel}>Target Kata</span>
            <span className={styles.targetWord}>{activeRound.target}</span>
          </div>

          {meteors.map(m => (
            <div
              key={m.id}
              className={styles.meteor}
              style={{
                left: `${m.x}px`,
                top: `${m.y}px`
              }}
              onClick={() => handleMeteorClick(m.val, m.id)}
            >
              {m.val}
            </div>
          ))}

          <div className={styles.shieldBar}>
            <div className={styles.shieldFill} style={{ width: `${shieldHealth}%` }} />
            <span className={styles.shieldText}>Kekuatan Perisai: {shieldHealth}%</span>
          </div>
        </div>

        <div className={styles.hintBanner} style={{ border: status === 'gameover' ? '1px solid #ef4444' : '' }}>
          <span>{message}</span>
        </div>

        <div className={styles.scoreRow}>
          <div className={styles.scoreCard}>
            <span className={styles.scoreLabel}>Total Poin</span>
            <span className={styles.scoreVal}>{score}</span>
          </div>
        </div>
      </div>

      {status === 'success' && (
        <div className={styles.rewardModal}>
          <div className={styles.modalContent}>
            <span style={{ fontSize: '48px' }}>🚀✨</span>
            <h2 className={styles.modalTitle}>Tembakan Jitu!</h2>
            <p className={styles.modalText}>
              Kamu berhasil menembak meteor ejaan yang benar dan menyelamatkan benteng pertahanan!
            </p>
            <button className={styles.modalBtn} onClick={handleNextRound}>
              Tantangan Selanjutnya
            </button>
          </div>
        </div>
      )}

      {status === 'gameover' && (
        <div className={styles.rewardModal}>
          <div className={styles.modalContent}>
            <span style={{ fontSize: '48px' }}>💥💥</span>
            <h2 className={styles.modalTitle} style={{ color: '#ef4444' }}>Perisai Hancur!</h2>
            <p className={styles.modalText}>
              Sayang sekali perisai hancur terkena meteor kata pengecoh. Jangan menyerah, mari coba lagi!
            </p>
            <button className={styles.modalBtn} onClick={resetGame}>
              Coba Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
