import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import styles from '../styles/Game.module.css';

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const VOCAB_PAIRS = [
  { value: 'BA' },
  { value: 'BI' },
  { value: 'BU' },
  { value: 'BO' }
];

export default function Game() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initializeGame();
  }, []);

  const initializeGame = () => {
    // Gandakan pasangan dan acak
    const deck = [...VOCAB_PAIRS, ...VOCAB_PAIRS]
      .map((item, index) => ({
        id: index,
        value: item.value,
        isFlipped: false,
        isMatched: false
      }))
      .sort(() => Math.random() - 0.5);

    setCards(deck);
    setSelectedCards([]);
    setMatchedPairs(0);
    setShowReward(false);
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

    // Putar suara suku kata saat kartu dibuka
    playSound(clickedCard.value);

    // Buka kartu
    const updatedCards = cards.map(c => c.id === id ? { ...c, isFlipped: true } : c);
    setCards(updatedCards);

    const newSelected = [...selectedCards, id];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const [firstId, secondId] = newSelected;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard && secondCard && firstCard.value === secondCard.value) {
        // Pasangan COCOK
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

          if (nextPairs === VOCAB_PAIRS.length) {
            // Semua pasangan cocok - Tampilkan reward
            setTimeout(() => {
              setShowReward(true);
              // Pemicu apresiasi lencana harian
              const currentStreak = parseInt(sessionStorage.getItem('game_streak') || '0') + 1;
              sessionStorage.setItem('game_streak', currentStreak.toString());
            }, 500);
          }
        }, 500);
      } else {
        // Pasangan SALAH - Tutup kembali
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

  return (
    <div className={styles.container}>
      <Head>
        <title>Petualangan Huruf - Game DyLeks</title>
      </Head>

      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => router.push('/latihan')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="#5d3eb3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className={styles.title}>Cari Pasangan Kata</h1>
        <div className={styles.statsRow}>
          <div className={`${styles.statBadge} ${styles.scoreBadge}`}>
            ⭐ {score} Poin
          </div>
        </div>
      </header>

      <main className={styles.gameArea}>
        <p className={styles.instructions}>Temukan dua kartu dengan bunyi suku kata yang sama!</p>

        <div className={styles.cardGrid}>
          {cards.map(card => (
            <div
              key={card.id}
              className={`${styles.card} ${card.isFlipped ? styles.cardFlipped : ''} ${card.isMatched ? styles.cardMatched : ''}`}
              onClick={() => handleCardClick(card.id)}
            >
              {card.isFlipped || card.isMatched ? card.value : '❓'}
            </div>
          ))}
        </div>
      </main>

      {showReward && (
        <div className={styles.rewardModal}>
          <div className={styles.modalContent}>
            <svg className={styles.badgeIcon} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" fill="#FFD983" stroke="#FFAC33" strokeWidth="4" />
              <path d="M50 20L58.8 38.2L78.8 41L64.4 55.2L67.8 75.2L50 65.8L32.2 75.2L35.6 55.2L21.2 41L41.2 38.2L50 20Z" fill="#FFAC33" />
            </svg>
            <h2 className={styles.modalTitle}>Hebat Sekali!</h2>
            <p className={styles.modalText}>
              Kamu berhasil mencocokkan semua kartu dan mendapatkan tambahan **{score} Poin** latihan!
            </p>
            <button className={styles.playAgainBtn} onClick={initializeGame}>
              Main Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
