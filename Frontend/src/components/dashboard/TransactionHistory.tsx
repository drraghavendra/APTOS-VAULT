import { Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from '../../styles/components/TransactionHistory.module.css';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const TransactionHistory = ({ transactions }: TransactionHistoryProps) => {
  if (transactions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📝</div>
        <p>No transactions yet</p>
      </div>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return '↗️';
      case 'withdraw': return '↘️';
      case 'reward': return '💰';
      default: return '🔁';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit': return styles.deposit;
      case 'withdraw': return styles.withdraw;
      case 'reward': return styles.reward;
      default: return styles.other;
    }
  };

  return (
    <div className={styles.transactionHistory}>
      <div className={styles.transactionList}>
        {transactions.map((transaction, index) => (
          <div key={index} className={styles.transactionItem}>
            <div className={styles.transactionIcon}>
              {getTransactionIcon(transaction.type)}
            </div>
            <div className={styles.transactionDetails}>
              <div className={styles.transactionType}>
                {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
              </div>
              <div className={styles.transactionDate}>
                {formatDate(transaction.timestamp)}
              </div>
            </div>
            <div className={`${styles.transactionAmount} ${getTransactionColor(transaction.type)}`}>
              {transaction.type === 'withdraw' ? '-' : '+'}
              {formatCurrency(transaction.amount || 0)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory;
