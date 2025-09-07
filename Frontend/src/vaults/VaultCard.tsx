import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Vault } from '../../types';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import { formatAPY, formatCurrency } from '../../utils/formatters';
import styles from '../../styles/components/VaultCard.module.css';

interface VaultCardProps {
  vault: Vault;
}

const VaultCard = ({ vault }: VaultCardProps) => {
  const { connected } = useWallet();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const getStrategyName = (type: number) => {
    switch (type) {
      case 0: return 'Liquidity Provision';
      case 1: return 'Lending';
      case 2: return 'Covered Calls';
      case 3: return 'Yield Aggregator';
      case 4: return 'Arbitrage';
      default: return 'Unknown';
    }
  };

  const getRiskLevel = (score: number) => {
    if (score <= 3) return { text: 'Low', color: '#10b981' };
    if (score <= 7) return { text: 'Medium', color: '#f59e0b' };
    return { text: 'High', color: '#ef4444' };
  };

  const risk = getRiskLevel(vault.risk_score);

  return (
    <>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.icon}>
            {vault.symbol.slice(0, 2).toUpperCase()}
          </div>
          <div className={styles.titleSection}>
            <h3 className={styles.name}>{vault.name}</h3>
            <span className={styles.symbol}>{vault.symbol}</span>
          </div>
          <div className={styles.apy}>
            {formatAPY(vault.apr_30d)}
          </div>
        </div>

        {/* Description */}
        <div className={styles.description}>
          {vault.description}
        </div>

        {/* Details Grid */}
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Strategy</span>
            <span className={styles.detailValue}>{getStrategyName(vault.strategy_type)}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Risk</span>
            <span className={styles.detailValue} style={{ color: risk.color }}>
              {risk.text}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>TVL</span>
            <span className={styles.detailValue}>
              {formatCurrency(vault.total_assets)}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Min. Deposit</span>
            <span className={styles.detailValue}>
              {formatCurrency(vault.min_deposit)}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className={styles.tags}>
          {vault.tags.map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            onClick={() => setShowDepositModal(true)}
            disabled={!connected || !vault.is_active}
            className={styles.primaryButton}
          >
            Deposit
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={!connected}
            className={styles.secondaryButton}
          >
            Withdraw
          </button>
          <Link href={`/vaults/${vault.id}`} className={styles.detailsButton}>
            Details
          </Link>
        </div>

        {/* Status Badge */}
        {!vault.is_active && (
          <div className={styles.inactiveLabel}>
            Vault Inactive
          </div>
        )}
      </div>

      {/* Modals */}
      {showDepositModal && (
        <DepositModal
          vault={vault}
          onClose={() => setShowDepositModal(false)}
        />
      )}

      {showWithdrawModal && (
        <WithdrawModal
          vault={vault}
          onClose={() => setShowWithdrawModal(false)}
        />
      )}
    </>
  );
};

export default VaultCard;
