import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import styles from '../styles/Speech.module.css';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

// Dyslexia-targeted words categorized by difficulty/similarity
const EVAL_WORDS = [
  { target: 'buku', hint: 'Huruf depan b - berbunyi beh-buku' },
  { target: 'duku', hint: 'Huruf depan d - berbunyi deh-duku' },
  { target: 'paku', hint: 'Huruf depan p - berbunyi peh-paku' },
  { target: 'bola', hint: 'Huruf depan b - berbunyi beh-bola' },
  { target: 'pola', hint: 'Huruf depan p - berbunyi peh-pola' },
  { target: 'pisang', hint: 'Suku kata awal pi - pisang' },
  { target: 'dinding', hint: 'Huruf d berulang - dinding' },
  { target: 'magnet', hint: 'Latihan kata STEM kompleks - magnet' }
];

export default function Speech() {
  const router = useRouter();
  const { theme } = useTheme();
  
  const [wordIdx, setWordIdx] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcriptText, setTranscriptText] = useState<string>('');
  
  // Evaluation Response States
  const [status, setStatus] = useState<'idle' | 'evaluating' | 'success' | 'wrong'>('idle');
  const [feedbackDetails, setFeedbackDetails] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [errorType, setErrorType] = useState<string>('');
  
  const [supported, setSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  const activeWord = EVAL_WORDS[wordIdx];

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSupported(false);
        return;
      }

      const rec = new SpeechRecognition();
      rec.lang = 'id-ID';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setIsRecording(true);
        setStatus('idle');
        setTranscriptText('');
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setTranscriptText(resultText);
        evaluateResult(resultText);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsRecording(false);
        if (e.error === 'no-speech') {
          setFeedbackDetails('Tidak ada suara terdeteksi. Silakan coba dekatkan mikrofon.');
          setStatus('wrong');
        }
      };

      recognitionRef.current = rec;
    }
  }, [wordIdx]);

  const toggleRecording = () => {
    if (!supported) {
      alert("Browser Anda tidak mendukung Web Speech API.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Start failed:", err);
      }
    }
  };

  const evaluateResult = async (speechText: string) => {
    setStatus('evaluating');
    try {
      const response = await fetch('http://localhost:3004/api/v1/speech/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_speech: speechText,
          target_word: activeWord.target
        })
      });

      if (response.ok) {
        const data = await response.json();
        setScore(data.score);
        setErrorType(data.error_type);
        setFeedbackDetails(data.details);
        setIsCorrect(data.is_correct);
        
        if (data.is_correct) {
          setStatus('success');
          triggerHaptic([50, 50, 50]);
          playSuccessSynth();
        } else {
          setStatus('wrong');
          triggerHaptic(200);
          playFailSynth();
        }
      } else {
        setFeedbackDetails("Gagal mengevaluasi suara di server lokal.");
        setStatus('wrong');
      }
    } catch (err) {
      console.error(err);
      setFeedbackDetails("Tidak dapat terhubung ke server backend lokal.");
      setStatus('wrong');
    }
  };

  const playSuccessSynth = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance("Luar biasa tepat!");
      utterance.lang = 'id-ID';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const playFailSynth = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance("Coba ucapkan lebih jelas.");
      utterance.lang = 'id-ID';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const playTargetAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(activeWord.target);
      utterance.lang = 'id-ID';
      utterance.rate = 0.7; // Slow for phonics clarity
      window.speechSynthesis.speak(utterance);
    }
  };

  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const handleNextWord = () => {
    setStatus('idle');
    setTranscriptText('');
    setFeedbackDetails('');
    setIsCorrect(null);
    setWordIdx((prev) => (prev + 1) % EVAL_WORDS.length);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Speech AI Fonologis - DyLeks</title>
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
            <span>Speech AI (Latihan Fonologis)</span>
          </div>
          <h1 className={styles.title}>Bicara & Eja Fonem</h1>
          <p className={styles.subtitle}>
            Dengarkan bunyi kata, lalu ucapkan kembali dengan suara yang jelas.
          </p>
        </header>

        <div className={styles.card}>
          <span style={{ fontSize: '14px', color: '#a78bfa' }}>Kata Target</span>
          <h2 className={styles.targetWord}>{activeWord.target.toUpperCase()}</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted, #9ca3af)', marginBottom: '16px' }}>
            {activeWord.hint}
          </p>

          <button className={styles.speakerBtn} onClick={playTargetAudio}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
            Dengarkan Contoh Bunyi
          </button>

          {!supported ? (
            <div className={styles.transcriptBox} style={{ color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              ⚠ Browser Anda tidak mendukung perekaman suara offline. Gunakan Chrome di Android untuk hasil terbaik.
            </div>
          ) : (
            <div className={styles.micSection}>
              <button 
                className={`${styles.micBtn} ${isRecording ? styles.micBtnActive : ''}`}
                onClick={toggleRecording}
                aria-label={isRecording ? 'Hentikan perekaman' : 'Mulai merekam'}
              >
                {isRecording ? (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                  </svg>
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                )}
              </button>
              <span className={styles.micLabel}>
                {isRecording ? 'Siswa sedang berbicara... Ketuk untuk Selesai' : 'Ketuk Mikrofon lalu Ucapkan Kata'}
              </span>
            </div>
          )}

          {transcriptText && (
            <div className={styles.transcriptBox}>
              Kamu mengucapkan: <span className={styles.transcriptVal}>"{transcriptText}"</span>
            </div>
          )}

          {status === 'evaluating' && (
            <div style={{ marginTop: '16px', color: '#a78bfa' }}>Mengevaluasi pelafalan fonis...</div>
          )}

          {isCorrect !== null && status !== 'evaluating' && (
            <div className={`${styles.feedback} ${isCorrect ? styles.feedbackSuccess : styles.feedbackWrong}`}>
              <div className={styles.feedbackTitle}>
                {isCorrect ? '🏆 Pengucapan Tepat!' : '⚠ Perlu Koreksi Fonis'}
              </div>
              <p className={styles.feedbackDesc}>{feedbackDetails}</p>
              
              {!isCorrect && errorType && (
                <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '12px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Deteksi Pola: {errorType}
                </div>
              )}

              {isCorrect && (
                <button className={styles.nextBtn} onClick={handleNextWord}>
                  Kata Selanjutnya →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
