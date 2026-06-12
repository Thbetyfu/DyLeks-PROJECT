import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import styles from '../styles/Maze.module.css';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

interface Gate {
  letter: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const ROUNDS = [
  { target: 'd', gates: [{ letter: 'b', x: 40 }, { letter: 'd', x: 120 }, { letter: 'p', x: 200 }], warning: 'Ingat! Huruf d memiliki tiang tegak di sebelah KANAN.' },
  { target: 'b', gates: [{ letter: 'd', x: 40 }, { letter: 'b', x: 120 }, { letter: 'q', x: 200 }], warning: 'Ingat! Huruf b memiliki tiang tegak di sebelah KIRI.' },
  { target: 'p', gates: [{ letter: 'q', x: 40 }, { letter: 'b', x: 120 }, { letter: 'p', x: 200 }], warning: 'Ingat! Huruf p memiliki kepala di KANAN ATAS dan tiang ke bawah.' },
  { target: 'q', gates: [{ letter: 'p', x: 40 }, { letter: 'q', x: 120 }, { letter: 'd', x: 200 }], warning: 'Ingat! Huruf q memiliki kepala di KIRI ATAS dan tiang ke bawah.' }
];

export default function Maze() {
  const router = useRouter();
  const { theme } = useTheme();
  
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [status, setStatus] = useState<'idle' | 'moving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Player position (canvas coordinates: 280x280)
  const [player, setPlayer] = useState({ x: 140, y: 220 });

  const activeRound = ROUNDS[round];

  // Draw loop
  useEffect(() => {
    drawGame();
  }, [player, round, status, theme]);

  // Play audio target on start
  useEffect(() => {
    setMessage(`Cari jalan keluar menuju huruf: "${activeRound.target.toUpperCase()}"`);
    playTargetSound(activeRound.target);
  }, [round]);

  const playTargetSound = (letter: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Cari huruf ${letter.toLowerCase()}`);
      utterance.lang = 'id-ID';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid lines (cyber style for dark mode, clean for light mode)
    ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // Draw Maze Walls (faint path lines indicating player can go left, right, up)
    // We have a T-shaped road: central vertical path, and top horizontal corridor
    ctx.fillStyle = theme === 'dark' ? '#1f2042' : '#e2e8f0';
    
    // Vertical corridor (center)
    ctx.fillRect(115, 60, 50, 180);
    // Horizontal corridor (top)
    ctx.fillRect(20, 60, 240, 50);

    // Draw Gates at the end of the top corridor
    activeRound.gates.forEach(gate => {
      ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(gate.x - 15, 60, 40, 50);

      // Label letter inside gate
      ctx.fillStyle = theme === 'dark' ? '#00f0ff' : '#623cea';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(gate.letter, gate.x + 5, 85);
    });

    // Draw helper guide line if in error state
    if (status === 'error') {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.setLineDash([4, 4]);
      // Draw path pointing to correct gate
      const correctGate = activeRound.gates.find(g => g.letter === activeRound.target);
      if (correctGate) {
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(140, 120);
        ctx.lineTo(correctGate.x + 5, 120);
        ctx.lineTo(correctGate.x + 5, 85);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw Player (Cute circular mascot with glowing eyes)
    ctx.beginPath();
    ctx.arc(player.x, player.y, 14, 0, 2 * Math.PI);
    ctx.fillStyle = '#623cea';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = status === 'success' ? 15 : 2;
    ctx.fill();
    ctx.shadowBlur = 0; // Reset

    // Draw cute eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x - 5, player.y - 3, 3, 0, 2 * Math.PI);
    ctx.arc(player.x + 5, player.y - 3, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(player.x - 5, player.y - 3, 1, 0, 2 * Math.PI);
    ctx.arc(player.x + 5, player.y - 3, 1, 0, 2 * Math.PI);
    ctx.fill();
  };

  const movePlayer = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (status === 'success' || status === 'error') return;

    let newX = player.x;
    let newY = player.y;
    const step = 20;

    if (direction === 'up') newY -= step;
    if (direction === 'down') newY += step;
    if (direction === 'left') newX -= step;
    if (direction === 'right') newX += step;

    // Collision checking within corridors
    // 1. Vertical center corridor: x between 115 and 165, y between 60 and 240
    const inVertical = newX >= 120 && newX <= 160 && newY >= 60 && newY <= 230;
    // 2. Top horizontal corridor: x between 20 and 260, y between 60 and 110
    const inHorizontal = newX >= 30 && newX <= 250 && newY >= 70 && newY <= 110;

    // Check if player entered a gate
    let hitGate: Gate | null = null;
    activeRound.gates.forEach(gate => {
      // Check collision with gate area
      if (Math.abs(newX - (gate.x + 5)) < 20 && Math.abs(newY - 85) < 20) {
        hitGate = gate;
      }
    });

    if (hitGate) {
      const g = hitGate as Gate;
      if (g.letter === activeRound.target) {
        // Correct gate
        setPlayer({ x: g.x + 5, y: 85 });
        setStatus('success');
        setScore(prev => prev + 10);
        triggerHaptic([50, 50, 50]);
        playSpeechSound("Hebat!");
      } else {
        // Wrong gate (Reversal error)
        setStatus('error');
        setErrors(prev => prev + 1);
        setMessage(activeRound.warning);
        triggerHaptic(200);
        playSpeechSound("Awas tertukar!");
        // Bounce player slightly backward
        setPlayer({ x: 140, y: 150 });
      }
      return;
    }

    // Move only if inside path
    if (inVertical || inHorizontal) {
      setPlayer({ x: newX, y: newY });
    } else {
      // Hit wall feedback
      triggerHaptic(30);
    }
  };

  const playSpeechSound = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      window.speechSynthesis.speak(utterance);
    }
  };

  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const handleNextRound = () => {
    setStatus('idle');
    setPlayer({ x: 140, y: 220 });
    setRound(prev => (prev + 1) % ROUNDS.length);
  };

  const resetGame = () => {
    setStatus('idle');
    setPlayer({ x: 140, y: 220 });
    setScore(0);
    setErrors(0);
    setRound(0);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Labirin Huruf - DyLeks</title>
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
            <span>Labirin Spasial Huruf (Orientation Game)</span>
          </div>
          <h1 className={styles.title}>Labirin b/d/p/q</h1>
          <p className={styles.subtitle}>
            Arahkan maskot menabrak gerbang dengan label huruf yang tepat.
          </p>
        </header>

        <div className={`${styles.canvasCard} ${status === 'error' ? styles.canvasCardError : ''}`}>
          <div className={styles.canvasContainer}>
            <canvas ref={canvasRef} width={280} height={280} className={styles.canvas} />
          </div>

          <div className={`${styles.hintBanner} ${status === 'error' ? styles.dangersBanner : ''}`}>
            <span>{message}</span>
          </div>

          <div className={styles.controls}>
            <button className={styles.controlBtn} onClick={() => movePlayer('up')}>▲</button>
            <div className={styles.controlRow}>
              <button className={styles.controlBtn} onClick={() => movePlayer('left')}>◀</button>
              <button className={styles.controlBtn} style={{ opacity: 0.1, cursor: 'default' }}>●</button>
              <button className={styles.controlBtn} onClick={() => movePlayer('right')}>▶</button>
            </div>
            <button className={styles.controlBtn} onClick={() => movePlayer('down')}>▼</button>
          </div>
        </div>

        <div className={styles.scoreRow}>
          <div className={styles.scoreCard}>
            <span className={styles.scoreLabel}>Total Poin</span>
            <span className={styles.scoreVal}>{score}</span>
          </div>
          <div className={styles.scoreCard}>
            <span className={styles.scoreLabel}>Salah Gerbang</span>
            <span className={styles.scoreVal} style={{ color: '#ef4444' }}>{errors}</span>
          </div>
        </div>
      </div>

      {status === 'success' && (
        <div className={styles.rewardModal}>
          <div className={styles.modalContent}>
            <span style={{ fontSize: '48px' }}>🏆</span>
            <h2 className={styles.modalTitle}>Hebat Sekali!</h2>
            <p className={styles.modalText}>
              Kamu berhasil menuntaskan labirin menuju huruf <strong>"{activeRound.target.toUpperCase()}"</strong> dengan benar!
            </p>
            <button className={styles.modalBtn} onClick={handleNextRound}>
              Lanjut Tantangan Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
