import { UserPosition } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import styles from '../../styles/components/Portfolio.module.css';

interface PortfolioProps {
  positions: UserPosition[];
}

const Portfolio = ({ positions }: PortfolioProps) => {
  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);

  if (positions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📊</div>
        <h3>No positions yet</h3>
        <p>Start by depositing into a vault to see your portfolio here</p>
      </div>
    );
  }

  return (
    <div className={styles.portfolio}>
      <div className={styles.chartContainer}>
        {/* Pie chart would go here - using mock for now */}
        <div className={styles.pieChart}>
          <div className={styles.chartPlaceholder}>
            Portfolio Allocation
          </div>
        </div>
      </div>

      <div className={styles.positionsList}>
        <h3>Your Positions</h3>
        {positions.map((position, index) => (
          <div key={index} className={styles.positionItem}>
            <div className={styles.positionHeader}>
              <span className={styles.vaultName}>Vault {index + 1}</span>
              <span className={styles.positionValue}>
                {formatCurrency(position.value)}
              </span>
            </div>
            <div className={styles.positionDetails}>
              <div className={styles.detail}>
                <span>Shares:</span>
                <span>{position.shares.toFixed(4)}</span>
              </div>
              <div className={styles.detail}>
                <span>Yield Earned:</span>
                <span className={styles.positive}>
                  +{formatCurrency(position.total_yield_earned)}
                </span>
              </div>
              <div className={styles.detail}>
                <span>APY:</span>
                <span>{position.avg_apy.toFixed(2)}%</span>
              </div>
            </div>
            <div className={styles.allocation}>
              <div
                className={styles.allocationBar}
                style={{ width: `${(position.value / totalValue) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Portfolio;
