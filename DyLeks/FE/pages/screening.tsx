import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import styles from '../styles/Screening.module.css';
import { useTheme } from '../contexts/ThemeContext';
import BatMascot from '../components/BatMascot';
import ButterflyMascot from '../components/ButterflyMascot';
import ThemeToggle from '../components/ThemeToggle';
import { SCREENING_WORDS } from '../lib/wordBank';
import { SyncService, OfflineSession, OfflineWordAttempt } from '../lib/sync_service';

const letters = SCREENING_WORDS;


export default function ScreeningPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<'listening' | 'camera'>('listening');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFinished, setAudioFinished] = useState(false);
  const [isOfflineSession, setIsOfflineSession] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [sessionResults, setSessionResults] = useState<any[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentLetter = letters[currentIndex];

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera(); // Cleanup when leaving page
    };
  }, []);

  const handleListen = () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    const audio = new Audio(`/assets/audio/instruksi_${currentLetter.toLowerCase()}.mp3`);
    
    audio.play().catch(e => {
      console.error("Audio Play Error, falling back to TTS:", e);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`Tulis huruf atau kata berikut: ${currentLetter.toLowerCase()}`);
        utterance.lang = 'id-ID';
        utterance.rate = 0.75;
        window.speechSynthesis.speak(utterance);
        
        setTimeout(() => {
          setIsPlaying(false);
          setAudioFinished(true);
        }, 3000);
      } else {
        setIsPlaying(false);
        setAudioFinished(true);
      }
    });

    audio.onended = () => {
      setIsPlaying(false);
      setAudioFinished(true);
    };
  };

  const startCamera = async () => {
    setMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Kamera tidak dapat diakses.");
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || isCapturing) return;

    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      alert("Kamera belum siap, tunggu sebentar.");
      return;
    }

    setIsCapturing(true);
    const canvas = document.createElement('canvas');
    // Downscale untuk menghemat ruang LocalStorage saat offline (Pilar 2)
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    // Crop center / fit image to 400x400
    ctx?.drawImage(videoRef.current, 0, 0, 400, 400);

    const base64Image = canvas.toDataURL('image/jpeg', 0.6);

    let resultData = null;
    let isAttemptOffline = false;

    try {
      const response = await fetch('http://localhost:3004/api/v1/screening/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: base64Image,
          target_letter: currentLetter
        }),
      });

      if (response.ok) {
        resultData = await response.json();
      } else {
        isAttemptOffline = true;
      }
    } catch (error) {
      console.warn("Upload failed, switching to offline mode:", error);
      isAttemptOffline = true;
    }

    if (isAttemptOffline) {
      setIsOfflineSession(true);
      resultData = {
        status: "offline",
        risk_score: -1,
        risk_level: "Luring",
        recommended_level: 1,
        feedback: "Gambar tulisan disimpan secara lokal. Hubungkan ke Wi-Fi guru untuk sinkronisasi.",
        detected_errors: ["Luring (menunggu sinkronisasi)"]
      };
    }

    const updatedResults = [...sessionResults, { letter: currentLetter, image_base64: base64Image, result: resultData }];
    setSessionResults(updatedResults);

    if (currentIndex < letters.length - 1) {
      stopCamera();
      setCurrentIndex(prev => prev + 1);
      setMode('listening');
      setAudioFinished(false);
    } else {
      stopCamera();

      // Hapus data base64 sebelum menyimpan ke sessionStorage untuk efisiensi
      const storageResults = updatedResults.map(r => ({
        letter: r.letter,
        result: r.result
      }));
      sessionStorage.setItem('dyslexia_screening_results', JSON.stringify(storageResults));

      if (isOfflineSession || isAttemptOffline) {
        // Mode Luring: Simpan sesi lengkap ke antrean LocalStorage
        const childId = sessionStorage.getItem('selected_child_id') || null;
        const offlineSession: OfflineSession = {
          id: Math.random().toString(36).substring(2, 11),
          child_id: childId,
          timestamp: new Date().toISOString(),
          word_attempts: updatedResults.map(r => ({
            target_letter: r.letter,
            image_base64: r.image_base64
          })),
          synced: false
        };

        SyncService.addSessionToQueue(offlineSession);

        sessionStorage.setItem('dyslexia_result', JSON.stringify({
          risk_score: -1,
          risk_level: 'Luring',
          recommended_level: 1,
          detected_errors: ['Skrining luring tersimpan.'],
          offline_session_id: offlineSession.id
        }));

        router.push('/summary');
      } else {
        // Mode Daring: Kirim data sesi agregat ke server
        const childId = sessionStorage.getItem('selected_child_id') || null;
        
        // Hitung nilai agregat sesi di frontend
        const total = updatedResults.length;
        const avgScore = updatedResults.reduce((sum, r) => sum + r.result.risk_score, 0) / total;
        
        // Tentukan label risiko & rekomendasi level
        let riskLabel = "Sangat Rendah";
        let recLevel = 5;
        if (avgScore >= 75) {
          riskLabel = "Tinggi";
          recLevel = 1;
        } else if (avgScore >= 55) {
          riskLabel = "Sedang-Tinggi";
          recLevel = 2;
        } else if (avgScore >= 35) {
          riskLabel = "Sedang";
          recLevel = 3;
        } else if (avgScore >= 15) {
          riskLabel = "Rendah";
          recLevel = 4;
        }

        // Cari tipe error dominan dari list error per kata
        const allErrors = updatedResults.flatMap(r => r.result.detected_errors || []);
        let feedbackMsg = "Luar biasa! Latihan dapat dilanjutkan ke level berikutnya.";
        if (riskLabel === "Tinggi") {
          feedbackMsg = `Pola tulisan menunjukkan risiko tinggi. Disarankan mulai dari Level 1 secara visual.`;
        } else if (riskLabel === "Sedang-Tinggi" || riskLabel === "Sedang") {
          feedbackMsg = `Terdeteksi beberapa pola kesalahan. Level ${recLevel} direkomendasikan untuk memperkuat suku kata.`;
        }

        try {
          const submitResponse = await fetch('http://localhost:3004/api/v1/screening/submit-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              child_id: childId,
              risk_score: avgScore,
              risk_level: riskLabel,
              recommended_level: recLevel,
              feedback: feedbackMsg
            })
          });

          if (submitResponse.ok) {
            const submitData = await submitResponse.json();
            sessionStorage.setItem('dyslexia_result', JSON.stringify({
              risk_score: submitData.risk_score,
              risk_level: submitData.risk_level,
              recommended_level: submitData.recommended_level,
              detected_errors: allErrors,
            }));
          }
        } catch (submitErr) {
          console.error("Gagal submit sesi ke server, mengantrekan luring:", submitErr);
          // Jika submit sesi gagal di akhir (misal jaringan putus mendadak), antrekan secara offline
          const offlineSession: OfflineSession = {
            id: Math.random().toString(36).substring(2, 11),
            child_id: childId,
            timestamp: new Date().toISOString(),
            word_attempts: updatedResults.map(r => ({
              target_letter: r.letter,
              image_base64: r.image_base64
            })),
            synced: false
          };
          SyncService.addSessionToQueue(offlineSession);

          sessionStorage.setItem('dyslexia_result', JSON.stringify({
            risk_score: -1,
            risk_level: 'Luring',
            recommended_level: 1,
            detected_errors: ['Skrining luring tersimpan.'],
            offline_session_id: offlineSession.id
          }));
        }

        router.push('/summary');
      }
    }
  };

  return (
    <>
      <div className="background-container">
        <div className="star" style={{ top: '15%', left: '25%', animationDelay: '0s' }}></div>
        <div className="star" style={{ top: '65%', left: '75%', animationDelay: '1s' }}></div>
        <div className="star" style={{ top: '35%', left: '55%', animationDelay: '2s' }}></div>
      </div>

      <div className={styles.container}>
        <Head>
          <title>Skrining Dini - DyLeks</title>
        </Head>

        <ThemeToggle />

        <div className={styles.header}>
          <div className={styles.headerRow}>
            <button className={styles.backButton} onClick={() => router.push('/')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className={styles.headerTitle}>Halaman Skrining ({currentIndex + 1}/{letters.length})</p>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progress} style={{ width: `${((currentIndex + 1) / letters.length) * 100}%` }}></div>
          </div>
        </div>
        
        <div className={styles.content}>
          <div className={styles.row}>
            {theme === 'dark' ? <BatMascot className={styles.duck} /> : <ButterflyMascot className={styles.duck} />}
            <h1 className={styles.title}>
              Dengarkan lalu tulis di kertas
            </h1>
          </div>
        </div>

        {mode === 'listening' ? (
          <>
            <div className={styles.centerAction}>
              <button 
                className={`${styles.listenCard} ${isPlaying ? styles.listenCardPlaying : ''}`} 
                onClick={handleListen}
                disabled={isPlaying}
              >
                <img 
                  src="/assets/ear.svg" 
                  alt="Listen" 
                  className={styles.listenIcon} 
                  style={{ 
                     filter: isPlaying 
                       ? 'grayscale(1) brightness(0.7)' 
                       : (theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0) invert(0.12)')
                  }} 
                /> 
                <span className={styles.listenText}>
                  {isPlaying ? 'Mendengarkan...' : 'Dengarkan'}
                </span>
              </button>
              <p className={styles.subTitle}>Tekan tombol di atas untuk mendengarkan instruksi suara!</p>
            </div>

            <div className={styles.bottomContainer}>
              <button 
                className={`${styles.continueButton} ${!audioFinished ? styles.continueButtonDisabled : ''}`} 
                onClick={startCamera}
                disabled={!audioFinished}
              >
                Lanjutkan
              </button>
            </div>
          </>
        ) : (
          <div className={styles.centerAction} style={{ justifyContent: 'flex-start' }}>
            <div className={styles.cameraContainer}>
              <video ref={videoRef} autoPlay playsInline className={styles.videoFeed} />
              
              {isCapturing && (
                <div className={styles.loadingOverlay}>
                  <div className={styles.spinner}></div>
                  <span>Sedang menganalisis tulisan tangan...</span>
                </div>
              )}

              <button 
                className={`${styles.cameraButton} ${isCapturing ? styles.cameraButtonDisabled : ''}`} 
                onClick={handleCapture}
                disabled={isCapturing}
              >
                Ambil Foto "{currentLetter}"
              </button>
            </div>
            <p className={styles.subTitle} style={{ marginTop: '16px' }}>
               Posisikan kertas tulisan Anda tepat di dalam kotak kamera
            </p>
          </div>
        )}
      </div>
    </>
  );
}