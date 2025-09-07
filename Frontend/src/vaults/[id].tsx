import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import Layout from '../../components/common/Layout';
import DepositModal from '../../components/vaults/DepositModal';
import WithdrawModal from '../../components/vaults/WithdrawModal';
import PerformanceChart from '../../components/dashboard/PerformanceChart';
import { Vault } from '../../types';
import { getVaultById, getVaultPerformance } from '../../utils/api';
import { formatAPY, formatCurrency } from '../../utils/formatters';
import styles from '../../styles/pages/VaultDetail.module.css';

const VaultDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { connected, account } = useWallet();
  
  const [vault, setVault] = useState<Vault | null>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [userPosition, setUserPosition] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchVaultData();
      fetchPerformanceData();
    }
  }, [id]);

  const fetchVaultData = async () => {
    try {
      setLoading(true);
      const response = await getVaultById(id as string);
      if (response.success) {
        setVault(response.data);
      } else {
        setError('Vault not found');
      }
    } catch (err) {
      setError('Error loading vault data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const response = await getVaultPerformance(id as string);
      if (response.success) {
        setPerformanceData(response.data);
      }
    } catch (err) {
      console.error('Error loading performance data:', err);
    }
  };

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
    if (score <= 3) return { text: 'Low', color: '#10b981', class: styles.lowRisk };
    if (score <= 7) return { text: 'Medium', color: '#f59e0b', class: styles.mediumRisk };
    return { text: 'High', color: '#ef4444', class: styles.highRisk };
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading vault details...</p>
        </div>
      </Layout>
    );
  }

  if (error || !vault) {
    return (
      <Layout>
        <div className={styles.error}>
          <h2>Vault Not Found</h2>
          <p>{error || 'The vault you are looking for does not exist.'}</p>
          <button onClick={() => router.push('/vaults')} className={styles.backButton}>
            Back to Vaults
          </button>
        </div>
      </Layout>
    );
  }

  const risk = getRiskLevel(vault.risk_score);

  return (
    <Layout>
      <Head>
        <title>{vault.name} - Aptos Vaults</title>
        <meta name="description" content={vault.description} />
      </Head>

      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>
            ← Back
          </button>
          <div className={styles.headerContent}>
            <div className={styles.vaultIcon}>
              {vault.symbol.slice(0, 2).toUpperCase()}
            </div>
            <div className={styles.headerInfo}>
              <h1>{vault.name}</h1>
              <p className={styles.symbol}>{vault.symbol}</p>
              <div className={styles.tags}>
                {vault.tags.map(tag => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>
            <div className={styles.headerActions}>
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
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{formatAPY(vault.apr_30d)}</div>
            <div className={styles.statLabel}>30D APY</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{formatAPY(vault.apr_90d)}</div>
            <div className={styles.statLabel}>90D APY</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{formatCurrency(vault.total_assets)}</div>
            <div className={styles.statLabel}>Total Value Locked</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              <span className={risk.class}>{risk.text}</span>
            </div>
            <div className={styles.statLabel}>Risk Level</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{vault.user_count}</div>
            <div className={styles.statLabel}>Users</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{formatCurrency(vault.min_deposit)}</div>
            <div className={styles.statLabel}>Min. Deposit</div>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.content}>
          {/* Left Column */}
          <div className={styles.leftColumn}>
            <div className={styles.card}>
              <h3>Strategy Overview</h3>
              <p className={styles.description}>{vault.description}</p>
              
              <div className={styles.details}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Strategy Type</span>
                  <span className={styles.detailValue}>{getStrategyName(vault.strategy_type)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Performance Fee</span>
                  <span className={styles.detailValue}>{(vault.performance_fee / 100).toFixed(2)}%</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Management Fee</span>
                  <span className={styles.detailValue}>{(vault.management_fee / 100).toFixed(2)}%</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Deposit Cap</span>
                  <span className={styles.detailValue}>{formatCurrency(vault.deposit_cap)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Current Utilization</span>
                  <span className={styles.detailValue}>
                    {((vault.total_assets / vault.deposit_cap) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3>Performance History</h3>
              <div className={styles.chartContainer}>
                <PerformanceChart data={performanceData} />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.rightColumn}>
            <div className={styles.card}>
              <h3>Your Position</h3>
              {connected && account ? (
                userPosition ? (
                  <div className={styles.positionDetails}>
                    <div className={styles.positionStat}>
                      <span>Shares</span>
                      <strong>{userPosition.shares.toFixed(4)}</strong>
                    </div>
                    <div className={styles.positionStat}>
                      <span>Current Value</span>
                      <strong>{formatCurrency(userPosition.value)}</strong>
                    </div>
                    <div className={styles.positionStat}>
                      <span>Total Deposited</span>
                      <strong>{formatCurrency(userPosition.total_deposited)}</strong>
                    </div>
                    <div className={styles.positionStat}>
                      <span>Total Yield</span>
                      <strong className={styles.positive}>
                        +{formatCurrency(userPosition.total_yield_earned)}
                      </strong>
                    </div>
                    <div className={styles.positionStat}>
                      <span>Average APY</span>
                      <strong>{userPosition.avg_apy.toFixed(2)}%</strong>
                    </div>
                  </div>
                ) : (
                  <div className={styles.noPosition}>
                    <p>You don't have a position in this vault yet.</p>
                    <button
                      onClick={() => setShowDepositModal(true)}
                      className={styles.primaryButton}
                    >
                      Make First Deposit
                    </button>
                  </div>
                )
              ) : (
                <div className={styles.connectWallet}>
                  <p>Connect your wallet to view your position</p>
                </div>
              )}
            </div>

            <div className={styles.card}>
              <h3>Risk Assessment</h3>
              <div className={styles.riskMeter}>
                <div className={styles.riskScale}>
                  <div className={styles.riskSegment} style={{ backgroundColor: '#10b981', width: '30%' }}></div>
                  <div className={styles.riskSegment} style={{ backgroundColor: '#f59e0b', width: '40%' }}></div>
                  <div className={styles.riskSegment} style={{ backgroundColor: '#ef4444', width: '30%' }}></div>
                </div>
                <div className={styles.riskIndicator} style={{ left: `${(vault.risk_score / 10) * 100}%` }}></div>
              </div>
              <div className={styles.riskDescription}>
                <p>
                  This vault is rated <strong>{risk.text} risk</strong>. 
                  {vault.risk_score <= 3 ? ' Suitable for conservative investors.' :
                   vault.risk_score <= 7 ? ' Balanced risk-reward profile.' :
                   ' For experienced investors comfortable with higher volatility.'}
                </p>
              </div>
            </div>

            <div className={styles.card}>
              <h3>Recent Activity</h3>
              <div className={styles.activityList}>
                <div className={styles.activityItem}>
                  <div className={styles.activityIcon}>↗️</div>
                  <div className={styles.activityDetails}>
                    <span>User deposit</span>
                    <small>2 hours ago</small>
                  </div>
                  <div className={styles.activityAmount}>+1,200 APT</div>
                </div>
                <div className={styles.activityItem}>
                  <div className={styles.activityIcon}>↘️</div>
                  <div className={styles.activityDetails}>
                    <span>User withdrawal</span>
                    <small>5 hours ago</small>
                  </div>
                  <div className={styles.activityAmount}>-500 APT</div>
                </div>
                <div className={styles.activityItem}>
                  <div className={styles.activityIcon}>🔄</div>
                  <div className={styles.activityDetails}>
                    <span>Strategy rebalance</span>
                    <small>1 day ago</small>
                  </div>
                  <div className={styles.activityAmount}>+0.5% yield</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDepositModal && (
        <DepositModal
          vault={vault}
          onClose={() => setShowDepositModal(false)}
          onSuccess={() => {
            setShowDepositModal(false);
            fetchVaultData();
          }}
        />
      )}

      {showWithdrawModal && (
        <WithdrawModal
          vault={vault}
          userPosition={userPosition}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={() => {
            setShowWithdrawModal(false);
            fetchVaultData();
          }}
        />
      )}
    </Layout>
  );
};

export default VaultDetailPage;
