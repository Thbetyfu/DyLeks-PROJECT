import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Lexend } from 'next/font/google';
import '../styles/globals.css';
import { ThemeProvider } from '../contexts/ThemeContext';
import ConnectivityAlert from '../components/ConnectivityAlert';

/*
 * Lexend dipilih karena dirancang secara klinis oleh Thomas Jockin
 * bersama Google.org untuk meningkatkan readability bagi pembaca
 * dengan disleksia. Studi klinis menunjukkan peningkatan reading speed
 * signifikan dibanding sans-serif generik.
 */
const lexend = Lexend({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-lexend',
  display: 'swap',
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = sessionStorage.getItem('token');
      if (!storedToken) {
        const localToken = localStorage.getItem('student_token');
        const localResult = localStorage.getItem('student_dyslexia_result');
        const localName = localStorage.getItem('student_connected_name');
        const localChildId = localStorage.getItem('selected_child_id');

        if (localToken && localResult && localName && localChildId) {
          console.log('[PWA Sync] Restoring session from localStorage...');
          sessionStorage.setItem('token', localToken);
          sessionStorage.setItem('dyslexia_result', localResult);
          sessionStorage.setItem('student_connected_name', localName);
          sessionStorage.setItem('selected_child_id', localChildId);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = sessionStorage.getItem('token') || localStorage.getItem('student_token');
      const isPublicPath = router.pathname === '/' || router.pathname === '/connect';
      
      if (!storedToken && !isPublicPath) {
        console.log('[PWA Auth] Access denied: Student token not found. Redirecting to landing...');
        router.replace('/');
      }
    }
  }, [router.pathname]);

  return (
    <ThemeProvider>
      <main className={lexend.className}>
        <ConnectivityAlert />
        <Component {...pageProps} />
      </main>
    </ThemeProvider>
  );
}

