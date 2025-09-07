import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Vault } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import styles from '../../styles/components/WithdrawModal.module.css';

interface WithdrawModalProps {
  vault: Vault;
  onClose: () => void;
  onSuccess?: () => void;
}

const WithdrawModal = ({ vault, onClose, onSuccess }: WithdrawModalProps) => {
  const { connected, account } = useWallet();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [withdrawType, setWithdrawType] = useState<'amount' | 'percentage'>('amount');

  // Mock user position data
  const userPosition = {
    shares: 150.25,
    value: 1250.75,
    total_deposited: 1000.00,
    total_yield_earned: 250.75
  };

  const handleWithdraw = async () => {
    if (!connected || !account) {
      setError('Please connect your wallet first');
      return;
    }

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (withdrawAmount > userPosition.value) {
      setError('Insufficient balance');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // TODO: Implement actual withdrawal logic
      console.log('Withdrawing:', withdrawAmount, 'from vault:', vault.id);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onSuccess?.();
      onClose();
    } catch (err) {
      setError('Withdrawal failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const setPercentage = (percent: number) => {
    setAmount((userPosition.value * percent / 100).toString());
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Withdraw from {vault.name}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.positionInfo}>
            <div className={styles.infoItem}>
              <span>Your Balance</span>
              <strong>{formatCurrency(userPosition.value)}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Total Yield Earned</span>
              <strong className={styles.positive}>
                +{formatCurrency(userPosition.total_yield_earned)}
              </strong>
            </div>
          </div>

          <div className={styles.withdrawOptions}>
            <label>Withdraw as:</label>
            <div className={styles.optionButtons}>
              <button
                className={withdrawType === 'amount' ? styles.active : ''}
                onClick={() => setWithdrawType('amount')}
              >
                Amount
              </button>
              <button
                className={withdrawType === 'percentage' ? styles.active : ''}
                onClick={() => setWithdrawType('percentage')}
              >
                Percentage
              </button>
            </div>
          </div>

          <div className={styles.amountInput}>
            <label htmlFor="amount">
              {withdrawType === 'amount' ? 'Amount to Withdraw' : 'Percentage to Withdraw'}
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={withdrawType === 'amount' ? '0.00' : '0'}
                min="0"
                max={withdrawType === 'percentage' ? 100 : userPosition.value}
                step={withdrawType === 'amount' ? '0.01' : '1'}
              />
              <span className={styles.unit}>
                {withdrawType === 'amount' ? 'APT' : '%'}
              </span>
            </div>
            {error && <div className={styles.error}>{error}</div>}
          </div>

          {withdrawType === 'amount' && (
            <div className={styles.quickSelect}>
              <button onClick={() => setPercentage(25)}>25%</button>
              <button onClick={() => setPercentage(50)}>50%</button>
              <button onClick={() => setPercentage(75)}>75%</button>
              <button onClick={() => setPercentage(100)}>Max</button>
            </div>
          )}

          <div className={styles.preview}>
            <h4>You will receive</h4>
            <div className={styles.receiveAmount}>
              {amount ? formatCurrency(
                withdrawType === 'amount' 
                  ? parseFloat(amount) 
                  : userPosition.value * parseFloat(amount) / 100
              ) : '$0.00'}
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={handleWithdraw}
            disabled={isLoading || !amount}
            className={styles.confirmButton}
          >
            {isLoading ? 'Processing...' : 'Confirm Withdrawal'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;
