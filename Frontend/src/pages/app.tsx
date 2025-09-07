import { useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import { WalletProvider } from '../contexts/WalletContext';
import { AppProvider } from '../contexts/AppContext';
import Layout from '../components/common/Layout';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent SSR issues with wallet connection
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AppProvider>
      <WalletProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </WalletProvider>
    </AppProvider>
  );
}
