import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import styles from '../../styles/components/VaultCreator.module.css';

interface VaultFormData {
  name: string;
  symbol: string;
  description: string;
  strategyType: string;
  performanceFee: string;
  managementFee: string;
  coinType: string;
  depositCap: string;
  minDeposit: string;
  riskScore: string;
  tags: string;
}

const VaultCreator = () => {
  const { connected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<VaultFormData>({
    name: '',
    symbol: '',
    description: '',
    strategyType: '0',
    performanceFee: '20',
    managementFee: '2',
    coinType: 'APT',
    depositCap: '1000000',
    minDeposit: '10',
    riskScore: '5',
    tags: ''
  });

  const handleInputChange = (field: keyof VaultFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected) return;

    setIsLoading(true);
    try {
      // TODO: Implement vault creation logic
      console.log('Creating vault:', formData);
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Vault created successfully!');
      setFormData({
        name: '',
        symbol: '',
        description: '',
        strategyType: '0',
        performanceFee: '20',
        managementFee: '2',
        coinType: 'APT',
        depositCap: '1000000',
        minDeposit: '10',
        riskScore: '5',
        tags: ''
      });
    } catch (error) {
      alert('Failed to create vault');
    } finally {
      setIsLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className={styles.notConnected}>
        <h3>Connect your wallet to create vaults</h3>
        <p>You need to be connected as an admin to create new vaults</p>
      </div>
    );
  }

  return (
    <div className={styles.vaultCreator}>
      <h2>Create New Vault</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Vault Name</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              placeholder="e.g., Stablecoin Yield Optimizer"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="symbol">Vault Symbol</label>
            <input
              type="text"
              id="symbol"
              value={formData.symbol}
              onChange={(e) => handleInputChange('symbol', e.target.value)}
              required
              placeholder="e.g., SYO"
              maxLength={10}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="strategyType">Strategy Type</label>
            <select
              id="strategyType"
              value={formData.strategyType}
              onChange={(e) => handleInputChange('strategyType', e.target.value)}
              required
            >
              <option value="0">Liquidity Provision</option>
              <option value="1">Lending</option>
              <option value="2">Covered Calls</option>
              <option value="3">Yield Aggregator</option>
              <option value="4">Arbitrage</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="coinType">Coin Type</label>
            <select
              id="coinType"
              value={formData.coinType}
              onChange={(e) => handleInputChange('coinType', e.target.value)}
              required
            >
              <option value="APT">APT</option>
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
           
