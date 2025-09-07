import { Vault } from '../../types';
import VaultCard from './VaultCard';
import styles from '../../styles/components/VaultList.module.css';

interface VaultListProps {
  vaults: Vault[];
}

const VaultList = ({ vaults }: VaultListProps) => {
  if (vaults.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🔍</div>
        <h3>No vaults found</h3>
        <p>Try adjusting your filters to see more results</p>
      </div>
    );
  }

  return (
    <div className={styles.vaultGrid}>
      {vaults.map(vault => (
        <VaultCard key={vault.id} vault={vault} />
      ))}
    </div>
  );
};

export default VaultList;
