import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import styles from '../styles/Bubble.module.css';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

interface TargetWord {
  word: string;
  syllables: string[];
  pool: string[]; // Options that will float
}

const BUBBLE_ROUNDS: TargetWord[] = [
  { word: 'BOLA', syllables: ['BO', 'LA'], pool: ['BO', 'LA', 'PA', 'MA', 'KA'] },
  { word: 'BUKU', syllables: ['BU', 'KU'], pool: ['BU', 'KU', 'DU', 'PU', 'LA'] },
  { word: 'PISANG', syllables: ['PI', 'SANG'], pool: ['PI', 'SANG', 'PA', 'SING', 'MA'] },
  { word: 'MAGNET', syllables: ['MAG', 'NET'], pool: ['MAG', 'NET', 'MAN', 'MET', 'NEG'] }
];

interface BubbleState {
  id: number;
  val: string;
  x: number;
  y: number;
  speed: number;
  popped: boolean;
}

export default function BubblePopper() {
  const router = useRouter();
  const { theme } = useTheme();

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [currentPartIdx, setCurrentPartIdx] = useState(0);
  const [status, setStatus] = useState<'idle' | 'playing' | 'success'>('idle');

  const [bubbles, setBubbles] = useState<BubbleState[]>([]);
  const animationRef = useRef<number | null>(null);

  const activeRound = BUBBLE_ROUNDS[round];

  // Initialize bubbles
  useEffect(() => {
    initializeRound();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [round]);

  const initializeRound = () => {
    setCurrentPartIdx(0);
    setStatus('playing');

    // Generate bubbles with random initial positions below screen
    const initialBubbles = activeRound.pool.map((val, idx) => ({
      id: idx,
      val,
      x: 30 + Math.random() * 320, // canvas width fits 400px
      y: 360 + idx * 70 + Math.random() * 50, // Staggered starting points below board
      speed: 0.8 + Math.random() * 0.7,
      popped: false
    }));
    setBubbles(initialBubbles);
    playWordAudio(activeRound.word);
  };

  // Game loop to float bubbles
  useEffect(() => {
    if (status !== 'playing') return;

    const updatePositions = () => {
      setBubbles(prev =>
        prev.map(b => {
          if (b.popped) return b;
          
          let nextY = b.y - b.speed;
          // Loop back to bottom if bubble goes off top screen
          if (nextY < -80) {
            nextY = 380;
            return {
              ...b,
              y: nextY,
              x: 30 + Math.random() * 320,
              speed: 0.8 + Math.random() * 0.7
            };
          }
          return { ...b, y: nextY };
        })
      );
      animationRef.current = requestAnimationFrame(updatePositions);
    };

    animationRef.current = requestAnimationFrame(updatePositions);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [status]);

  const playWordAudio = (word: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Letuskan gelembung untuk kata: ${word.toLowerCase()}`);
      utterance.lang = 'id-ID';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const playSyllableAudio = (syllable: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(syllable.toLowerCase());
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const playCorrectSound = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance("Tepat!");
      utterance.lang = 'id-ID';
      window.speechSynthesis.speak(utterance);
    }
  };

  const playIncorrectSound = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance("Salah urutan.");
      utterance.lang = 'id-ID';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleBubbleClick = (id: number, val: string) => {
    if (status !== 'playing') return;

    const targetSyllable = activeRound.syllables[currentPartIdx];

    if (val === targetSyllable) {
      // Correct pop
      playSyllableAudio(val);
      triggerHaptic(40);
      
      setBubbles(prev => prev.map(b => b.id === id ? { ...b, popped: true } : b));

      const nextIdx = currentPartIdx + 1;
      setCurrentPartIdx(nextIdx);

      if (nextIdx === activeRound.syllables.length) {
        // Round Complete
        setStatus('success');
        setScore(prev => prev + 10);
        triggerHaptic([80, 50, 80]);
        playCorrectSound();
      }
    } else {
      // Wrong pop (Resets round sequence, respawns popped ones)
      playIncorrectSound();
      triggerHaptic(150);
      setErrors(prev => prev + 1);
      
      // Reset sequence
      setCurrentPartIdx(0);
      // Restore all bubbles to unpopped state at the bottom
      setBubbles(prev =>
        prev.map((b, index) => ({
          ...b,
          popped: false,
          y: 360 + index * 60 + Math.random() * 40,
          x: 30 + Math.random() * 320
        }))
      );
    }
  };

  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const handleNextRound = () => {
    setRound(prev => (prev + 1) % BUBBLE_ROUNDS.length);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Letuskan Suku Kata - DyLeks</title>
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
            <span>Balon Suku Kata (Phonological Blending)</span>
          </div>
          <h1 className={styles.title}>Bubble Popper</h1>
          <p className={styles.subtitle}>
            Letuskan balon suku kata berurutan untuk membentuk kata target.
          </p>
        </header>

        <div className={styles.gameBoard}>
          <div className={styles.targetCard}>
            <span className={styles.targetLabel}>Bentuk Kata</span>
            <span className={styles.targetWord}>{activeRound.word}</span>
          </div>

          {bubbles.map(
            b =>
              !b.popped && (
                <div
                  key={b.id}
                  className={styles.bubble}
                  style={{
                    left: `${b.x}px`,
                    top: `${b.y}px`,
                    width: '70px',
                    height: '70px'
                  }}
                  onClick={() => handleBubbleClick(b.id, b.val)}
                >
                  {b.val}
                </div>
              )
          )}
        </div>

        <div className={styles.sequenceGuide}>
          {activeRound.syllables.map((syl, idx) => {
            let itemStyle = styles.seqPart;
            if (idx < currentPartIdx) {
              itemStyle = `${styles.seqPart} ${styles.seqPartDone}`;
            } else if (idx === currentPartIdx) {
              itemStyle = `${styles.seqPart} ${styles.seqPartActive}`;
            }
            return (
              <span key={idx} className={itemStyle}>
                {syl}
              </span>
            );
          })}
        </div>

        <div className={styles.scoreRow}>
          <div className={styles.scoreCard}>
            <span className={styles.scoreLabel}>Total Poin</span>
            <span className={styles.scoreVal}>{score}</span>
          </div>
          <div className={styles.scoreCard}>
            <span className={styles.scoreLabel}>Salah Pencet</span>
            <span className={styles.scoreVal} style={{ color: '#ef4444' }}>{errors}</span>
          </div>
        </div>
      </div>

      {status === 'success' && (
        <div className={styles.rewardModal}>
          <div className={styles.modalContent}>
            <span style={{ fontSize: '48px' }}>🎈🎈</span>
            <h2 className={styles.modalTitle}>Sempurna!</h2>
            <p className={styles.modalText}>
              Kamu berhasil mengeja kata <strong>"{activeRound.word}"</strong> dengan urutan suku kata yang tepat!
            </p>
            <button className={styles.modalBtn} onClick={handleNextRound}>
              Kata Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
