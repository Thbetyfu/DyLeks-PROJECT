import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  const router = useRouter();

  const handleStart = () => {
    router.push('/screening');
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>DyLeks - Deteksi Dini & Belajar Adaptif</title>
        <meta name="description" content="Platform skrining dini dan belajar adaptif multisensori ramah anak disleksia." />
      </Head>

      <div className={styles.centered}>
        <img src="/assets/duck.svg" alt="Duck Mascot" className={styles.duck} draggable={false} />
        <h1 className={styles.title}>Yuk, Main & Belajar!</h1>
        <p className={styles.subtitle}>
          Temukan keseruan belajar huruf dan kata secara menyenangkan bersama bebek pintar!
        </p>
      </div>

      <button className={styles.button} onClick={handleStart}>Mulai Petualangan</button>
    </div>
  );
}
