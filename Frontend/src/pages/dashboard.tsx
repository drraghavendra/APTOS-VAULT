import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import Layout from '../components/common/Layout';
import Portfolio from '../components/dashboard/Portfolio';
import PerformanceChart from '../components/dashboard/PerformanceChart';
import TransactionHistory from '../components/dashboard/TransactionHistory';
import WalletConnect from '../components/common/WalletConnect';
import { UserPosition, Transaction } from '../types';
import { getUserPositions, getTransactionHistory } from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import styles from '../styles/pages/Dashboard.module.css';

const DashboardPage: NextPage = () => {
  const { connected, account } = useWallet();
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (connected && account) {
      fetchDashboardData();
    }
  }, [connected, account]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [positionsResponse, transactionsResponse] = await Promise.all([
        getUserPositions(account.address),
        getTransactionHistory(account.address)
      ]);

      if (positionsResponse.success) {
        setPositions(positionsResponse.data);
      }

      if (transactionsResponse.success) {
        setTransactions(transactionsResponse.data);
      }
    } catch (err) {
      setError('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const totalPortfolioValue = positions.reduce((total, position) => total + position.value, 0);
  const totalYield = positions.reduce((total, position) => total + position.total_yield_earned, 0);

  if (!connected) {
    return (
      <Layout>
        <div className={styles.notConnected}>
          <h2>Dashboard</h2>
          <p>Connect your wallet to view your portfolio and performance</p>
          <WalletConnect />
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading your dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Dashboard - Aptos Vaults</title>
        <meta name="description" content="View your portfolio performance and transaction history" />
      </Head>

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Dashboard</h1>
          <div className={styles.refreshSection}>
            <button onClick={fetchDashboardData} className={styles.refreshButton}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <h3>Total Portfolio Value</h3>
            <div className={styles.summaryValue}>{formatCurrency(totalPortfolioValue)}</div>
            <div className={styles.summaryChange}>+2.3% today</div>
          </div>
          <div className={styles.summaryCard}>
            <h3>Total Yield Earned</h3>
            <div className={styles.summaryValue}>{formatCurrency(totalYield)}</div>
            <div className={styles.summaryChange}>All time</div>
          </div>
          <div className={styles.summaryCard}>
            <h3>Active Vaults</h3>
            <div className={styles.summaryValue}>{positions.length}</div>
            <div className={styles.summaryChange}>Vaults with balance</div>
          </div>
          <div className={styles.summaryCard}>
            <h3>Avg. Portfolio APY</h3>
            <div className={styles.summaryValue}>
              {positions.length > 0 
                ? `${(positions.reduce((sum, pos) => sum + pos.avg_apy, 0) / positions.length).toFixed(2)}%`
                : '0.00%'
              }
            </div>
            <div className={styles.summaryChange}>Weighted average</div>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.content}>
          {/* Left Column */}
          <div className={styles.leftColumn}>
            <div className={styles.section}>
              <h2>Portfolio Allocation</h2>
              <Portfolio positions={positions} />
            </div>

            <div className={styles.section}>
              <h2>Performance Overview</h2>
              <div className={styles.chartContainer}>
                <PerformanceChart 
                  data={[
                    { date: '2023-10-01', value: 1000 },
                    { date: '2023-10-02', value: 1050 },
                    { date: '2023-10-03', value: 1100 },
                    { date: '2023-10-04', value: 1150 },
                    { date: '2023-10-05', value: 1200 },
                    { date: '2023-10-06', value: 1250 },
                    { date: '2023-10-07', value: 1300 },
                  ]} 
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.rightColumn}>
            <div className={styles.section}>
              <h2>Recent Transactions</h2>
              <TransactionHistory transactions={transactions.slice(0, 10)} />
              {
