import { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import Layout from '../../components/common/Layout';
import VaultList from '../../components/vaults/VaultList';
import WalletConnect from '../../components/common/WalletConnect';
import { useVaults } from '../../hooks/useVaults';
import styles from '../../styles/pages/Vaults.module.css';

const VaultsPage: NextPage = () => {
  const { connected } = useWallet();
  const [filters, setFilters] = useState({
    strategyType: '',
    riskScore: '',
    minApy: '',
    maxApy: ''
  });

  const { vaults, loading, error, refetch } = useVaults({ filters });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      strategyType: '',
      riskScore: '',
      minApy: '',
      maxApy: ''
    });
  };

  return (
    <Layout>
      <Head>
        <title>Vaults - Aptos Vaults</title>
        <meta name="description" content="Browse all available yield vaults on Aptos blockchain" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Yield Vaults</h1>
          <p>Choose from our curated selection of automated yield strategies</p>
        </div>

        {!connected && (
          <div className={styles.walletPrompt}>
            <div className={styles.walletContent}>
              <h3>Connect your wallet to start investing</h3>
              <p>You need to connect your Aptos wallet to deposit into vaults</p>
              <WalletConnect />
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className={styles.filters}>
          <h3>Filter Vaults</h3>
          <div className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label>Strategy Type</label>
              <select 
                value={filters.strategyType} 
                onChange={(e) => handleFilterChange('strategyType', e.target.value)}
              >
                <option value="">All Strategies</option>
                <option value="0">Liquidity Provision</option>
                <option value="1">Lending</option>
                <option value="2">Covered Calls</option>
                <option value="3">Yield Aggregator</option>
                <option value="4">Arbitrage</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Max Risk Level</label>
              <select 
                value={filters.riskScore} 
                onChange={(e) => handleFilterChange('riskScore', e.target.value)}
              >
                <option value="">Any Risk</option>
                <option value="3">Low (1-3)</option>
                <option value="7">Medium (4-7)</option>
                <option value="10">High (8-10)</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Min APY</label>
              <input
                type="number"
                placeholder="0%"
                value={filters.minApy}
                onChange={(e) => handleFilterChange('minApy', e.target.value)}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Max APY</label>
              <input
                type="number"
                placeholder="100%"
                value={filters.maxApy}
                onChange={(e) => handleFilterChange('maxApy', e.target.value)}
              />
            </div>

            <div className={styles.filterActions}>
              <button onClick={clearFilters} className={styles.clearButton}>
                Clear Filters
              </button>
              <button onClick={() => refetch()} className={styles.applyButton}>
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Vaults List */}
        <div className={styles.vaultsSection}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading vaults...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <p>{error}</p>
              <button onClick={() => refetch()} className={styles.retryButton}>
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className={styles.resultsHeader}>
                <h2>{vaults.length} Vaults Found</h2>
                <div className={styles.sortOptions}>
                  <span>Sort by:</span>
                  <select>
                    <option value="apy">Highest APY</option>
                    <option value="risk">Lowest Risk</option>
                    <option value="tvl">Total Value Locked</option>
                  </select>
                </div>
              </div>
              <VaultList vaults={vaults} />
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default VaultsPage;
