import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/Summary.module.css';

export default function Summary() {
  const router = useRouter();
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(5);

  useEffect(() => {
    const stored = sessionStorage.getItem('dyslexia_screening_results');
    if (stored) {
      try {
        const pastResults = JSON.parse(stored);
        setTotalCount(pastResults.length);
        
        // Menghitung jumlah kata yang risiko-nya rendah (skor <= 40)
        const correct = pastResults.filter((r: any) => r.result.risk_score <= 40).length;
        setCorrectCount(correct);
        
        // Logika Rekomendasi Level
        let recommendedLevel = 5; 
        for (let i = 0; i < pastResults.length; i++) {
          if (pastResults[i].result.risk_score > 40) {
            recommendedLevel = i + 1;
            break;
          }
        }

        const avgScore = pastResults.reduce((acc: number, val: any) => acc + val.result.risk_score, 0) / pastResults.length;
        const allErrors = pastResults.flatMap((r: any) => r.result.detected_errors);
        
        let label = "Rendah";
        let msg = "";

        if (recommendedLevel === 1) {
          label = "Tinggi";
          msg = "Kami merekomendasikan mulai dari Level 1 untuk memperkuat fondasi.";
        } else if (recommendedLevel === 2) {
          label = "Sedang";
          msg = "Mari asah kemampuan di Level 2 untuk pengenalan suku kata.";
        } else if (recommendedLevel === 3) {
          label = "Sedang";
          msg = "Kerja bagus! Mari kita perkuat pemahaman di Level 3.";
        } else if (recommendedLevel === 4) {
          label = "Rendah";
          msg = "Hampir sempurna! Ayo coba tantangan di Level 4.";
        } else {
          label = "Rendah";
          msg = "Luar biasa! Kamu siap untuk petualangan di Level 5.";
        }

        const consolidated = {
           status: "success",
           risk_score: avgScore,
           risk_level: label,
           recommended_level: recommendedLevel,
           feedback: msg,
           detected_errors: allErrors
        };

        // Simpan hasil akhir yang sudah dikonsolidasikan
        sessionStorage.setItem('dyslexia_result', JSON.stringify(consolidated));

      } catch (e) {
        console.error("Summary Processing Error:", e);
      }
    }
  }, []);

  const handleNext = () => {
    router.push('/result');
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Selesai Screening - ARCANA</title>
      </Head>

      <h1 className={styles.headline}>Kamu benar {correctCount} dari {totalCount} kata</h1>
      
      <div className={styles.mascotContainer}>
        <img src="/assets/duck.svg" alt="Duck Mascot" className={styles.duck} />
      </div>
      
      <h2 className={styles.subheadline}>Kita lihat hasil latihan yang cocok untukmu ya!</h2>
      
      <div className={styles.footer}>
        <button className={styles.button} onClick={handleNext}>
          Lihat Hasil
        </button>
      </div>
    </div>
  );
}
