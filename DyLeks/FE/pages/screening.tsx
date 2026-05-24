import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Screening.module.css';

const letters = ['A', 'BA', 'BAN', 'NYALA', 'MENEMANI'];

export default function ScreeningPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<'listening' | 'camera'>('listening');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFinished, setAudioFinished] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [sessionResults, setSessionResults] = useState<any[]>([]); // Menyimpan hasil kolektif
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentLetter = letters[currentIndex];

  const handleListen = () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    const audio = new Audio(`/assets/instruksi_${currentLetter.toLowerCase()}.mp3`);
    
    audio.play().catch(e => console.error("Audio Play Error:", e));
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

    setIsCapturing(true);
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);

    const base64Image = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/screening/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: base64Image,
          target_letter: currentLetter
        }),
      });

      const data = await response.json();
      
      // Simpan hasil ke memori sementara
      const updatedResults = [...sessionResults, { letter: currentLetter, result: data }];
      setSessionResults(updatedResults);

      if (currentIndex < letters.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setMode('listening');
        setAudioFinished(false);
      } else {
        // Simpan kolektif ke sessionStorage untuk Summary Page
        sessionStorage.setItem('dyslexia_screening_results', JSON.stringify(updatedResults));
        window.location.href = '/summary';
      }
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Hubungan ke server terputus.");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Screening - ARCANA</title>
      </Head>

      <div className={styles.header}>
        <p className={styles.headerTitle}>Halaman screening</p>
        <div className={styles.progressBar}>
          <div className={styles.progress} style={{ width: `${((currentIndex + 1) / letters.length) * 100}%` }}></div>
        </div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.row} style={{ gap: '16px' }}>
          <img src="/assets/duck.svg" alt="Duck" className={styles.duck} />
          <h1 className={styles.title} style={{ fontSize: '1.55rem' }}>
            Dengarkan lalu tulis dalam kertas
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
                   filter: isPlaying ? 'grayscale(1) brightness(0.7)' : 'brightness(0) invert(1)',
                   width: '85px'
                }} 
              /> 
              <span className={styles.listenText}>
                {isPlaying ? 'Mendengarkan...' : 'Dengarkan bunyinya'}
              </span>
            </button>
            <p className={styles.subTitle}>Tekan tombol untuk mendengar!</p>
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
                <span>Menganalisis...</span>
              </div>
            )}

            <button 
              className={`${styles.cameraButton} ${isCapturing ? styles.cameraButtonDisabled : ''}`} 
              onClick={handleCapture}
              disabled={isCapturing}
            >
              Ambil foto "{currentLetter}"
            </button>
          </div>
          <p className={styles.subTitle} style={{ color: '#6F45BA', marginTop: '20px' }}>
             Posisikan tulisan di dalam kotak
          </p>
        </div>
      )}
    </div>
  );
}