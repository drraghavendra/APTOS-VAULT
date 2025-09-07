import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Vault } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import styles from '../../styles/components/DepositModal.module.css';

interface DepositModalProps {
  vault: Vault;
  onClose: () => void;
  onSuccess?: () => void;
}

const DepositModal = ({ vault, onClose, onSuccess }: DepositModalProps) => {
  const { connected, account } = useWallet();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDeposit = async () => {
    if (!connected || !account) {
      setError('Please connect your wallet first');
      return;
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (depositAmount < vault.min_deposit) {
      setError(`Minimum deposit is ${formatCurrency(vault.min_deposit)}`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // TODO: Implement actual deposit logic
      console.log('Depositing:', depositAmount, 'to vault:', vault.id);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onSuccess?.();
      onClose();
    } catch (err) {
      setError('Deposit failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const setPercentage = (percent: number) => {
    // In a real app, this would use the user's wallet balance
    const maxAmount = 1000; // Example balance
    setAmount((maxAmount * percent / 100).toString());
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Deposit to {vault.name}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.vaultInfo}>
            <div className={styles.infoItem}>
              <span>Current APY</span>
              <strong>{vault.apr_30d.toFixed(2)}%</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Minimum Deposit</span>
              <strong>{formatCurrency(vault.min_deposit)}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Your Balance</span>
              <strong>{formatCurrency(1000)}</strong> {/* Example balance */}
            </div>
          </div>

          <div className={styles.amountInput}>
            <label htmlFor="amount">Amount to Deposit</label>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min={vault.min_deposit}
                step="0.01"
              />
              <span className={styles.currency}>APT</span>
            </div>
            {error && <div className={styles.error}>{error}</div>}
          </div>

          <div className={styles.quickSelect}>
            <button onClick={() => setPercentage(25)}>25%</button>
            <button onClick={() => setPercentage(50)}>50%</button>
            <button onClick={() => setPercentage(75)}>75%</button>
            <button onClick={() => setPercentage(100)}>Max</button>
          </div>

          <div className={styles.preview}>
            <h4>Estimated Annual Yield</h4>
            <div className={styles.yieldAmount}>
              {amount ? formatCurrency(parseFloat(amount) * vault.apr_30d / 100) : '$0.00'}
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={handleDeposit}
            disabled={isLoading || !amount}
            className={styles.confirmButton}
          >
            {isLoading ? 'Processing...' : 'Confirm Deposit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
