import { useState } from 'react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import styles from '../../styles/components/WalletConnect.module.css';

interface WalletConnectProps {
  size?: 'small' | 'medium' | 'large';
}

const WalletConnect = ({ size = 'medium' }: WalletConnectProps) => {
  const { connected } = useWallet();
  const [showSelector, setShowSelector] = useState(false);

  const sizeClass = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  }[size];

  if (connected) {
    return null;
  }

  return (
    <div className={styles.walletConnect}>
      <button
        className={`${styles.connectButton} ${sizeClass}`}
        onClick={() => setShowSelector(true)}
      >
        Connect Wallet
      </button>

      {showSelector && (
        <div className={styles.selectorOverlay} onClick={() => setShowSelector(false)}>
          <div className={styles.selectorModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.selectorHeader}>
              <h3>Connect Wallet</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowSelector(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.selectorContent}>
              <WalletSelector />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
