import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import styles from '../styles/Tracer.module.css';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

// Define structures
interface Checkpoint {
  x: number;
  y: number;
  name: string;
}

// Letter definitions with 300x300 canvas coordinates
const LETTER_CONFIGS: Record<string, {
  label: string;
  checkpoints: Checkpoint[];
  guideText: string;
  reversalWarning: string;
  drawTemplate: (ctx: CanvasRenderingContext2D) => void;
}> = {
  d: {
    label: 'd',
    guideText: 'Buat lingkaran kecil berputar ke kiri (arah panah), lalu tarik garis tegak di kanan dari atas ke bawah.',
    reversalWarning: 'Awas tertukar dengan huruf "b"! Gambar lingkaran kirinya dulu, tiang tegaknya di sebelah kanan.',
    checkpoints: [
      { x: 200, y: 160, name: 'Mulai Lingkaran' },
      { x: 150, y: 120, name: 'Atas Lingkaran' },
      { x: 100, y: 160, name: 'Kiri Lingkaran' },
      { x: 150, y: 200, name: 'Bawah Lingkaran' },
      { x: 200, y: 160, name: 'Tutup Lingkaran' },
      { x: 200, y: 70, name: 'Atas Tiang' },
      { x: 200, y: 240, name: 'Bawah Tiang' },
    ],
    drawTemplate: (ctx) => {
      // Draw dashed outline
      ctx.beginPath();
      ctx.arc(150, 160, 50, 0, 2 * Math.PI);
      ctx.moveTo(200, 70);
      ctx.lineTo(200, 240);
      ctx.strokeStyle = 'rgba(98, 60, 234, 0.2)';
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]); // Reset
    }
  },
  b: {
    label: 'b',
    guideText: 'Tarik garis tegak di kiri dari atas ke bawah, lalu buat lingkaran memutar ke kanan dari atas ke bawah.',
    reversalWarning: 'Awas tertukar dengan huruf "d"! Tiang tegaknya ada di sebelah kiri baru lingkaran di kanan.',
    checkpoints: [
      { x: 100, y: 70, name: 'Mulai Tiang' },
      { x: 100, y: 160, name: 'Tengah Tiang' },
      { x: 100, y: 240, name: 'Bawah Tiang' },
      { x: 100, y: 160, name: 'Mulai Lingkaran' },
      { x: 150, y: 120, name: 'Atas Lingkaran' },
      { x: 200, y: 160, name: 'Kanan Lingkaran' },
      { x: 150, y: 200, name: 'Bawah Lingkaran' },
      { x: 100, y: 160, name: 'Tutup Lingkaran' },
    ],
    drawTemplate: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(100, 70);
      ctx.lineTo(100, 240);
      ctx.arc(150, 180, 50, 1.2 * Math.PI, 3.2 * Math.PI); // rough loop outline
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  },
  p: {
    label: 'p',
    guideText: 'Tarik garis tegak ke bawah di kiri, lalu buat kepala lingkaran di kanan atas memutar dari kiri ke kanan.',
    reversalWarning: 'Awas tertukar dengan "q"! Tiang p ada di sebelah kiri bawah, kepalanya di kanan atas.',
    checkpoints: [
      { x: 100, y: 120, name: 'Mulai Tiang' },
      { x: 100, y: 260, name: 'Bawah Tiang' },
      { x: 100, y: 120, name: 'Kembali ke Atas' },
      { x: 150, y: 120, name: 'Atas Lengkung' },
      { x: 200, y: 160, name: 'Kanan Kepala' },
      { x: 150, y: 200, name: 'Bawah Lengkung' },
      { x: 100, y: 200, name: 'Tutup Kepala' },
    ],
    drawTemplate: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(100, 120);
      ctx.lineTo(100, 260);
      ctx.moveTo(100, 120);
      ctx.arc(150, 160, 50, 1.2 * Math.PI, 3.2 * Math.PI);
      ctx.strokeStyle = 'rgba(98, 60, 234, 0.2)';
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  },
  q: {
    label: 'q',
    guideText: 'Buat kepala lingkaran di kiri atas berputar ke kiri, lalu tarik tiang lurus ke bawah di kanan.',
    reversalWarning: 'Awas tertukar dengan "p"! Kepala q ada di kiri atas, lalu tiang tegaknya di sebelah kanan bawah.',
    checkpoints: [
      { x: 200, y: 160, name: 'Mulai Kepala' },
      { x: 150, y: 120, name: 'Atas Kepala' },
      { x: 100, y: 160, name: 'Kiri Kepala' },
      { x: 150, y: 200, name: 'Bawah Kepala' },
      { x: 200, y: 160, name: 'Tutup Kepala' },
      { x: 200, y: 120, name: 'Mulai Tiang' },
      { x: 200, y: 260, name: 'Bawah Tiang' },
    ],
    drawTemplate: (ctx) => {
      ctx.beginPath();
      ctx.arc(150, 160, 50, 0, 2 * Math.PI);
      ctx.moveTo(200, 120);
      ctx.lineTo(200, 260);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
};

export default function Tracer() {
  const router = useRouter();
  const { theme } = useTheme();
  
  const [activeLetter, setActiveLetter] = useState<'b' | 'd' | 'p' | 'q'>('d');
  const [status, setStatus] = useState<'idle' | 'drawing' | 'error' | 'success'>('idle');
  const [message, setMessage] = useState<string>('');
  
  // Scoring
  const [score, setScore] = useState<number>(0);
  const [reversalErrors, setReversalErrors] = useState<number>(0);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentIdxRef = useRef<number>(0);
  const pathPointsRef = useRef<{ x: number; y: number }[]>([]);

  const config = LETTER_CONFIGS[activeLetter];

  // Initialize and Draw template
  useEffect(() => {
    resetCanvas();
  }, [activeLetter, theme]);

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear all
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    isDrawingRef.current = false;
    currentIdxRef.current = 0;
    pathPointsRef.current = [];
    
    setStatus('idle');
    setMessage(config.guideText);

    // Draw background letter shape template
    config.drawTemplate(ctx);

    // Draw checkpoints as faint circles, first checkpoint glows
    drawCheckpoints(ctx);
  };

  const drawCheckpoints = (ctx: CanvasRenderingContext2D) => {
    config.checkpoints.forEach((cp, idx) => {
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, 8, 0, 2 * Math.PI);
      
      if (idx === currentIdxRef.current) {
        // Glowing target dot
        ctx.fillStyle = theme === 'dark' ? '#00f0ff' : '#623cea';
        ctx.shadowColor = theme === 'dark' ? '#00f0ff' : '#623cea';
        ctx.shadowBlur = 10;
      } else if (idx < currentIdxRef.current) {
        // Completed checkpoints
        ctx.fillStyle = '#10b981';
        ctx.shadowBlur = 0;
      } else {
        // Unvisited checkpoints
        ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 0;
      }
      
      ctx.fill();
      ctx.shadowBlur = 0; // Reset shadow
    });
  };

  const drawUserPath = (ctx: CanvasRenderingContext2D) => {
    if (pathPointsRef.current.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(pathPointsRef.current[0].x, pathPointsRef.current[0].y);
    for (let i = 1; i < pathPointsRef.current.length; i++) {
      ctx.lineTo(pathPointsRef.current[i].x, pathPointsRef.current[i].y);
    }
    
    if (status === 'error') {
      ctx.strokeStyle = '#ef4444';
    } else if (status === 'success') {
      ctx.strokeStyle = '#10b981';
    } else {
      ctx.strokeStyle = theme === 'dark' ? '#00f0ff' : '#623cea';
    }
    
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const getCanvasCoords = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Scale appropriately based on actual canvas dimensions (300x300)
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const handleStart = (e: any) => {
    e.preventDefault();
    if (status === 'success') return;

    const coords = getCanvasCoords(e);
    const firstCP = config.checkpoints[0];

    // Check if start touch is close enough to the first checkpoint (within 25px)
    const dist = Math.hypot(coords.x - firstCP.x, coords.y - firstCP.y);
    if (dist < 25) {
      isDrawingRef.current = true;
      setStatus('drawing');
      currentIdxRef.current = 1; // Advance target
      pathPointsRef.current = [coords];
      
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas!.width, canvas!.height);
        config.drawTemplate(ctx);
        drawCheckpoints(ctx);
      }
    } else {
      // Haptic feedback for starting at the wrong place
      triggerHaptic(50);
      setMessage(`Mulai menulis dari titik berdenyut warna cyan ya!`);
    }
  };

  const handleMove = (e: any) => {
    if (!isDrawingRef.current || status === 'error' || status === 'success') return;

    const coords = getCanvasCoords(e);
    pathPointsRef.current.push(coords);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redraw templates and user stroke
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    config.drawTemplate(ctx);
    drawUserPath(ctx);
    drawCheckpoints(ctx);

    // Evaluate checkpoints
    const targetCP = config.checkpoints[currentIdxRef.current];
    const distToTarget = Math.hypot(coords.x - targetCP.x, coords.y - targetCP.y);

    // If close to active checkpoint, advance
    if (distToTarget < 22) {
      if (currentIdxRef.current < config.checkpoints.length - 1) {
        currentIdxRef.current += 1;
        triggerHaptic(40);
        setMessage(`Bagus! Tarik terus mengikuti arah titik selanjutnya.`);
      } else {
        // Finished all checkpoints in correct order
        isDrawingRef.current = false;
        setStatus('success');
        setScore(prev => prev + 1);
        setMessage('Luar biasa! Kamu menggambar huruf dengan arah yang tepat! 🎉');
        triggerHaptic([100, 50, 100]);
        playCorrectSound();
      }
      return;
    }

    // --- REVERSAL / ERROR DETECTION ---
    // Check if they skipped and hit a future checkpoint way out of order
    // or if they strayed to a wrong side (e.g. hitting the wrong side stem)
    config.checkpoints.forEach((cp, idx) => {
      if (idx > currentIdxRef.current && idx !== currentIdxRef.current) {
        const dist = Math.hypot(coords.x - cp.x, coords.y - cp.y);
        
        // If they touched a future checkpoint prematurely
        if (dist < 18) {
          handleFailure();
        }
      }
    });

    // Special dyslexia reversal checks
    if (activeLetter === 'd' && currentIdxRef.current <= 4) {
      // Writing the stem of 'b' on left (around x=100) before finishing circles
      if (coords.x < 110 && coords.y < 150) {
        handleFailure();
      }
    } else if (activeLetter === 'b' && currentIdxRef.current <= 3) {
      // Writing the circle on right first (like d loop)
      if (coords.x > 180 && coords.y > 120 && coords.y < 200) {
        handleFailure();
      }
    }
  };

  const handleEnd = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (status === 'drawing') {
      // Lifted finger too early
      setStatus('idle');
      setMessage('Jangan angkat jarimu sebelum garis hurufnya selesai ya! Coba lagi.');
      currentIdxRef.current = 0;
      pathPointsRef.current = [];
      resetCanvas();
    }
  };

  const handleFailure = () => {
    isDrawingRef.current = false;
    setStatus('error');
    setReversalErrors(prev => prev + 1);
    setMessage(config.reversalWarning);
    triggerHaptic([200, 100, 200]);
  };

  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const playCorrectSound = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance("Luar biasa!");
      utterance.lang = 'id-ID';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Papan Tulis Kinestetik - DyLeks</title>
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
            <span>Latihan Kinestetik (Motorik Halus)</span>
          </div>
          <h1 className={styles.title}>Tracer Putar & Tarik</h1>
          <p className={styles.subtitle}>
            Hubungkan titik-titik dengan arah yang benar menggunakan jarimu.
          </p>
        </header>

        <div className={styles.letterSelector}>
          {(['d', 'b', 'p', 'q'] as const).map((letChar) => (
            <button
              key={letChar}
              className={`${styles.letterBtn} ${activeLetter === letChar ? styles.letterBtnActive : ''}`}
              onClick={() => setActiveLetter(letChar)}
            >
              {letChar}
            </button>
          ))}
        </div>

        <div className={`${styles.canvasCard} ${
          status === 'error' ? styles.canvasCardError : 
          status === 'success' ? styles.canvasCardSuccess : ''
        }`}>
          <div className={styles.canvasContainer}>
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className={styles.canvas}
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
            />
          </div>

          <div className={`${styles.banner} ${
            status === 'error' ? styles.bannerDanger :
            status === 'success' ? styles.bannerSuccess :
            status === 'drawing' ? styles.bannerInfo : styles.bannerWarning
          }`}>
            <div className={styles.bannerIcon}>
              {status === 'success' ? '🏆' : status === 'error' ? '⚠' : '💡'}
            </div>
            <span>{message}</span>
          </div>

          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={resetCanvas}>
              Mulai Ulang
            </button>
            {status === 'success' && (
              <button 
                className={`${styles.btn} ${styles.btnPrimary}`} 
                onClick={() => {
                  const letters: Array<'d' | 'b' | 'p' | 'q'> = ['d', 'b', 'p', 'q'];
                  const nextIndex = (letters.indexOf(activeLetter) + 1) % letters.length;
                  setActiveLetter(letters[nextIndex]);
                }}
              >
                Huruf Berikutnya
              </button>
            )}
          </div>
        </div>

        <div className={styles.scoreRow}>
          <div className={styles.scoreCard}>
            <span className={styles.scoreLabel}>Berhasil Digambar</span>
            <span className={styles.scoreVal}>{score}</span>
          </div>
          <div className={styles.scoreCard}>
            <span className={styles.scoreLabel}>Tipe Inversi Dihindari</span>
            <span className={styles.scoreVal} style={{ color: '#ef4444' }}>{reversalErrors}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
