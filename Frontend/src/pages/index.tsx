import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import Link from 'next/link';
import Layout from '../components/common/Layout';
import VaultList from '../components/vaults/VaultList';
import WalletConnect from '../components/common/WalletConnect';
import { Vault } from '../types';
import { getVaults } from '../utils/api';
import styles from '../styles/pages/Home.module.css';

const Home: NextPage = () => {
  const { connected, account } = useWallet();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featuredVaults, setFeaturedVaults] = useState<Vault[]>([]);

  useEffect(() => {
    const fetchVaults = async () => {
      try {
        setLoading(true);
        const response = await getVaults();
        if (response.success) {
          setVaults(response.data.vaults);
          // Get top 3 vaults by APY for featured section
          const featured = response.data.vaults
            .sort((a: Vault, b: Vault) => b.apr_30d - a.apr_30d)
            .slice(0, 3);
          setFeaturedVaults(featured);
        } else {
          setError('Failed to fetch vaults');
        }
      } catch (err) {
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchVaults();
  }, []);

  return (
    <Layout>
      <Head>
        <title>Aptos Vaults - Decentralized Structured Products</title>
        <meta name="description" content="Earn yield on your crypto assets with automated strategies on Aptos blockchain" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.title}>
              Automated Yield Strategies <br />on <span className={styles.aptosHighlight}>Aptos</span>
            </h1>
            <p className={styles.subtitle}>
              Deposit your assets and let our smart contracts automatically execute 
              optimized DeFi strategies to maximize your returns. No technical knowledge required.
            </p>
            
            <div className={styles.ctaSection}>
              {!connected ? (
                <>
                  <WalletConnect size="large" />
                  <p className={styles.ctaText}>Connect your wallet to get started</p>
                </>
              ) : (
                <div className={styles.connectedActions}>
                  <Link href="/vaults" className={styles.primaryButton}>
                    Explore Vaults
                  </Link>
                  <Link href="/dashboard" className={styles.secondaryButton}>
                    View Portfolio
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.heroVisual}>
            <div className={styles.visualContainer}>
              <div className={styles.floatingCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>📈</div>
                  <div>
                    <h4>High Yield</h4>
                    <span>12.8% APY</span>
                  </div>
                </div>
                <div className={styles.cardStats}>
                  <div className={styles.stat}>
                    <span>TVL</span>
                    <strong>$2.4M</strong>
                  </div>
                  <div className={styles.stat}>
                    <span>Risk</span>
                    <strong className={styles.lowRisk}>Low</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.statsSection}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <h3>$15.2M+</h3>
              <p>Total Value Locked</p>
            </div>
            <div className={styles.statItem}>
              <h3>8.2%</h3>
              <p>Average APY</p>
            </div>
            <div className={styles.statItem}>
              <h3>2,450+</h3>
              <p>Active Users</p>
            </div>
            <div className={styles.statItem}>
              <h3>99.9%</h3>
              <p>Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Why Choose Aptos Vaults?</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>⚡</div>
              <h3>Automated Strategies</h3>
              <p>Our smart contracts automatically execute complex DeFi strategies while you sleep</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🔒</div>
              <h3>Secure & Audited</h3>
              <p>Built on Aptos Move language with formal verification capabilities and regular audits</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📈</div>
              <h3>Optimized Yield</h3>
              <p>Maximize returns with professionally designed strategies across multiple protocols</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>💸</div>
              <h3>Low Fees</h3>
              <p>Competitive fee structure with performance-based pricing and no hidden costs</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🌐</div>
              <h3>Multi-Chain Ready</h3>
              <p>Designed for the Aptos ecosystem with cross-chain capabilities in development</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🛡️</div>
              <h3>Insurance Fund</h3>
              <p>Protocol-owned insurance fund to protect against smart contract vulnerabilities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Vaults Section */}
      <section className={styles.featuredSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Featured Vaults</h2>
            <Link href="/vaults" className={styles.viewAllLink}>
              View All Vaults →
            </Link>
          </div>
          
          {loading ? (
            <div className={styles.loadingGrid}>
              {[1, 2, 3].map(i => (
                <div key={i} className={styles.vaultCardSkeleton}>
                  <div className={styles.skeletonHeader}></div>
                  <div className={styles.skeletonBody}></div>
                  <div className={styles.skeletonFooter}></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : (
            <div className={styles.featuredGrid}>
              {featuredVaults.map(vault => (
                <div key={vault.id} className={styles.featuredVault}>
                  <div className={styles.vaultHeader}>
                    <div className={styles.vaultIcon}>
                      {vault.symbol.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4>{vault.name}</h4>
                      <span className={styles.vaultSymbol}>{vault.symbol}</span>
                    </div>
                    <div className={styles.vaultApy}>
                      {vault.apr_30d.toFixed(2)}% APY
                    </div>
                  </div>
                  <div className={styles.vaultStats}>
                    <div className={styles.stat}>
                      <span>TVL</span>
                      <strong>${(vault.total_assets / 1000000).toFixed(1)}M</strong>
                    </div>
                    <div className={styles.stat}>
                      <span>Risk</span>
                      <strong className={
                        vault.risk_score <= 3 ? styles.lowRisk : 
                        vault.risk_score <= 7 ? styles.mediumRisk : styles.highRisk
                      }>
                        {vault.risk_score <= 3 ? 'Low' : vault.risk_score <= 7 ? 'Medium' : 'High'}
                      </strong>
                    </div>
                  </div>
                  <p className={styles.vaultDescription}>
                    {vault.description.length > 100 
                      ? `${vault.description.substring(0, 100)}...` 
                      : vault.description
                    }
                  </p>
                  <Link href={`/vaults/${vault.id}`} className={styles.vaultLink}>
                    Explore Vault
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2>Ready to Start Earning?</h2>
            <p>Join thousands of users already earning passive income with Aptos Vaults</p>
            {connected ? (
              <div className={styles.ctaButtons}>
                <Link href="/vaults" className={styles.ctaPrimary}>
                  Explore Vaults
                </Link>
                <Link href="/dashboard" className={styles.ctaSecondary}>
                  View Dashboard
                </Link>
              </div>
            ) : (
              <WalletConnect size="large" />
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
