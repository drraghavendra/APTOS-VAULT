import React, { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { AptosClient } from 'aptos';

const AptosVaults = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const [vaults, setVaults] = useState([]);
  const [selectedVault, setSelectedVault] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [userPortfolio, setUserPortfolio] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const client = new AptosClient('https://fullnode.devnet.aptoslabs.com');

  useEffect(() => {
    fetchVaults();
    if (account) {
      fetchUserPortfolio();
    }
  }, [account]);

  const fetchVaults = async () => {
    try {
      const response = await fetch('/api/vaults');
      const data = await response.json();
      if (data.success) {
        setVaults(data.data);
      }
    } catch (error) {
      console.error('Error fetching vaults:', error);
    }
  };

  const fetchUserPortfolio = async () => {
    try {
      const response = await fetch(`/api/portfolio/${account.address}`);
      const data = await response.json();
      if (data.success) {
        setUserPortfolio(data.data);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  const handleDeposit = async (vaultId) => {
    if (!account || !depositAmount) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/vaults/${vaultId}/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: account.address,
          amount: parseFloat(depositAmount),
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Deposit successful!');
        setDepositAmount('');
        fetchVaults();
        fetchUserPortfolio();
      } else {
        alert(`Deposit failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error depositing:', error);
      alert('Deposit failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (vaultId) => {
    if (!account || !withdrawAmount) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/vaults/${vaultId}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: account.address,
          shares: parseFloat(withdrawAmount),
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Withdrawal successful!');
        setWithdrawAmount('');
        fetchVaults();
        fetchUserPortfolio();
      } else {
        alert(`Withdrawal failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error withdrawing:', error);
      alert('Withdrawal failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Aptos Vaults</h1>
        <p>Decentralized Structured Products on Aptos</p>
      </header>

      {account && userPortfolio && (
        <section className="portfolio">
          <h2>Your Portfolio</h2>
          <p>Total Value: {userPortfolio.totalValue.toFixed(2)} APT</p>
          <div className="holdings">
            {Object.values(userPortfolio.holdings).map(holding => (
              <div key={holding.vaultId} className="holding">
                <span>Vault: {holding.vaultId}</span>
                <span>Shares: {holding.shares.toFixed(4)}</span>
                <span>Value: {holding.value.toFixed(2)} APT</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="vaults">
        <h2>Available Vaults</h2>
        <div className="vault-list">
          {vaults.map(vault => (
            <div key={vault.id} className="vault-card">
              <h3>{vault.name}</h3>
              <p>{vault.description}</p>
              <div className="vault-stats">
                <span>APY: {(vault.apy * 100).toFixed(2)}%</span>
                <span>Total Assets: {vault.totalAssets.toFixed(2)} APT</span>
                <span>Share Price: {vault.sharePrice.toFixed(4)} APT</span>
              </div>
              
              {account && (
                <div className="vault-actions">
                  <div className="action">
                    <input
                      type="number"
                      placeholder="Amount to deposit"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                    <button 
                      onClick={() => handleDeposit(vault.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Deposit'}
                    </button>
                  </div>
                  
                  <div className="action">
                    <input
                      type="number"
                      placeholder="Shares to withdraw"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                    <button 
                      onClick={() => handleWithdraw(vault.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Withdraw'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {!account && (
        <section className="connect-wallet">
          <h2>Connect your wallet to get started</h2>
          <p>Please connect your Aptos wallet to deposit into vaults</p>
        </section>
      )}

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .portfolio, .vaults {
          margin-bottom: 40px;
        }
        
        .vault-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .vault-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .vault-stats {
          display: flex;
          flex-direction: column;
          margin: 15px 0;
        }
        
        .vault-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .action {
          display: flex;
          gap: 10px;
        }
        
        .action input {
          flex: 1;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .action button {
          padding: 8px 16px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .action button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .holdings {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        
        .holding {
          border: 1px solid #eee;
          border-radius: 6px;
          padding: 15px;
          display: flex;
          flex-direction: column;
        }
        
        .connect-wallet {
          text-align: center;
          padding: 40px;
          background-color: #f5f5f5;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

export default AptosVaults;
