import React, { createContext, useContext, useEffect, useState } from 'react';
import { AptosAccount, AptosClient } from 'aptos';
import { useApi } from '../hooks/useApi';

interface WalletContextType {
  connect: () => Promise<void>;
  disconnect: () => void;
  account: AptosAccount | null;
  isConnected: boolean;
  balance: number;
}

const WalletContext = createContext<WalletContextType>({} as WalletContextType);

export const useWallet = () => useContext(WalletContext);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<AptosAccount | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState(0);
  const { getBalance } = useApi();

  const connect = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Connect to wallet (Petra or Martian)
      if (window.aptos) {
        await window.aptos.connect();
        const account = await window.aptos.account();
        setAccount(account);
        setIsConnected(true);
        
        // Get balance
        const bal = await getBalance(account.address);
        setBalance(bal);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setIsConnected(false);
    setBalance(0);
  };

  return (
    <WalletContext.Provider value={{ connect, disconnect, account, isConnected, balance }}>
      {children}
    </WalletContext.Provider>
  );
};
