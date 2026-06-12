import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import styles from '../styles/Game.module.css';
import { WORD_BANK } from '../lib/wordBank';

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function Game() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [moves, setMoves] = useState(0);

  // DDS Game States
  const [ddsActive, setDdsActive] = useState(false);
  const [consecutiveFails, setConsecutiveFails] = useState(0);
  const [telemetryTremor, setTelemetryTremor] = useState(0.22);
  const [telemetryPressure, setTelemetryPressure] = useState(0.53);
  const [telemetryHesitation, setTelemetryHesitation] = useState(0.12);

  useEffect(() => {
    setMounted(true);
    // Auto-load level dari hasil screening jika ada
    const stored = sessionStorage.getItem('dyslexia_result');
    if (stored) {
      const data = JSON.parse(stored);
      setSelectedLevel(data.recommended_level || 1);
    }
  }, []);

  useEffect(() => {
    if (selectedLevel !== null) {
      initializeGame(selectedLevel);
    }
  }, [selectedLevel]);

  const initializeGame = (level: number, forceDds = false) => {
    const levelData = WORD_BANK[level] || WORD_BANK[1];
    const isDdsMode = forceDds || ddsActive;
    
    // Jika DDS aktif (anak kebingungan/lelah), kurangi dari 4 pasang ke 2 pasang kartu
    const pairsCount = isDdsMode ? 2 : 4;
    
    const pool = [...levelData.targets]
      .sort(() => Math.random() - 0.5)
      .slice(0, pairsCount)
      .map(w => w.target);

    const deck = [...pool, ...pool]
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false,
      }))
      .sort(() => Math.random() - 0.5);

    setCards(deck);
    setSelectedCards([]);
    setMatchedPairs(0);
    setShowReward(false);
    setScore(0);
    setMoves(0);

    // Simulasi telemetri grip sensor di game
    setTelemetryTremor(isDdsMode ? 0.48 : 0.22);
    setTelemetryPressure(isDdsMode ? 0.38 : 0.53);
    setTelemetryHesitation(isDdsMode ? 0.35 : 0.12);
  };

  const playSound = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.toLowerCase());
      utterance.lang = 'id-ID';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCardClick = (id: number) => {
    const clickedCard = cards.find(c => c.id === id);
    if (!clickedCard || clickedCard.isFlipped || clickedCard.isMatched || selectedCards.length >= 2) return;

    playSound(clickedCard.value);
    const updatedCards = cards.map(c => c.id === id ? { ...c, isFlipped: true } : c);
    setCards(updatedCards);

    const newSelected = [...selectedCards, id];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves(m => m + 1);
      const [firstId, secondId] = newSelected;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard && secondCard && firstCard.value === secondCard.value) {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === firstId || c.id === secondId
              ? { ...c, isMatched: true, isFlipped: true }
              : c
          ));
          setScore(prev => prev + 10);
          const nextPairs = matchedPairs + 1;
          setMatchedPairs(nextPairs);
          setSelectedCards([]);

          if (nextPairs === 4) {
            setTimeout(() => {
              setShowReward(true);
              const currentStreak = parseInt(sessionStorage.getItem('game_streak') || '0') + 1;
              sessionStorage.setItem('game_streak', currentStreak.toString());
            }, 500);
          }
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === firstId || c.id === secondId
              ? { ...c, isFlipped: false }
              : c
          ));
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  if (!mounted) return null;

  // Level Selection Screen
  if (selectedLevel === null) {
    return (
      <div className={styles.container}>
        <Head><title>Pilih Level - Game DyLeks</title></Head>
        <header className={styles.header}>
          <button className={styles.backButton} onClick={() => router.push('/latihan')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className={styles.title}>Pilih Level Permainan</h1>
        </header>
        <main className={styles.gameArea}>
          <p className={styles.instructions}>Pilih level yang sesuai kemampuanmu!</p>
          <div className={styles.levelGrid}>
            {[1, 2, 3, 4, 5].map(lvl => {
              const data = WORD_BANK[lvl];
              return (
                <button
                  key={lvl}
                  id={`btn-level-${lvl}`}
                  className={styles.levelCard}
                  onClick={() => setSelectedLevel(lvl)}
                >
                  <span className={styles.levelNum}>Level {lvl}</span>
                  <span className={styles.levelName}>{data.label}</span>
                  <span className={styles.levelDesc}>{data.description}</span>
                </button>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Petualangan Huruf - Game DyLeks</title>
      </Head>

      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => setSelectedLevel(null)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <h1 className={styles.title}>Cari Pasangan Kata</h1>
          <p className={styles.levelBadge}>{WORD_BANK[selectedLevel]?.label} — {WORD_BANK[selectedLevel]?.description}</p>
        </div>
        <div className={styles.statsRow}>
          <div className={`${styles.statBadge} ${styles.scoreBadge}`}>
            {score} Poin
          </div>
          <div className={styles.statBadge}>
            {moves} Langkah
          </div>
        </div>
      </header>

      <main className={styles.gameArea}>
        <p className={styles.instructions}>Temukan dua kartu dengan bunyi yang sama!</p>

        <div className={styles.cardGrid}>
          {cards.map(card => (
            <div
              key={card.id}
              id={`card-${card.id}`}
              className={`${styles.card} ${card.isFlipped ? styles.cardFlipped : ''} ${card.isMatched ? styles.cardMatched : ''}`}
              onClick={() => handleCardClick(card.id)}
            >
              <div className={styles.cardInner}>
                <div className={styles.cardFront}>?</div>
                <div className={styles.cardBack}>{card.value}</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {showReward && (
        <div className={styles.rewardModal}>
          <div className={styles.modalContent}>
            <svg className={styles.badgeIcon} viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="45" fill="#FFD983" stroke="#FFAC33" strokeWidth="4" />
              <path d="M50 20L58.8 38.2L78.8 41L64.4 55.2L67.8 75.2L50 65.8L32.2 75.2L35.6 55.2L21.2 41L41.2 38.2L50 20Z" fill="#FFAC33" />
            </svg>
            <h2 className={styles.modalTitle}>Hebat Sekali!</h2>
            <p className={styles.modalText}>
              {moves <= 5 ? 'Kamu sangat cerdas!' : 'Terus berlatih ya!'} Skor: {score} poin dalam {moves} langkah!
            </p>
            <div className={styles.modalActions}>
              <button className={styles.playAgainBtn} onClick={() => initializeGame(selectedLevel)}>
                Main Lagi
              </button>
              <button className={styles.nextLevelBtn} onClick={() => setSelectedLevel(Math.min(5, selectedLevel + 1))}>
                Level Berikutnya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
