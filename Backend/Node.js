const express = require('express');
const cors = require('cors');
const { AptosClient, AptosAccount, FaucetClient, TokenClient } = require('aptos');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Aptos client setup
const NODE_URL = process.env.APTOS_NODE_URL || 'https://fullnode.devnet.aptoslabs.com';
const FAUCET_URL = process.env.APTOS_FAUCET_URL || 'https://faucet.devnet.aptoslabs.com';
const client = new AptosClient(NODE_URL);
const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

// Database simulation (in production, use a real database)
let vaults = [];
let userPortfolios = {};
let transactions = [];

// API Routes

// Get all vaults
app.get('/api/vaults', async (req, res) => {
  try {
    // In a real implementation, this would fetch from the blockchain
    res.json({
      success: true,
      data: vaults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get vault by ID
app.get('/api/vaults/:id', async (req, res) => {
  try {
    const vaultId = req.params.id;
    const vault = vaults.find(v => v.id === vaultId);
    
    if (!vault) {
      return res.status(404).json({
        success: false,
        error: 'Vault not found'
      });
    }
    
    res.json({
      success: true,
      data: vault
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new vault (admin only)
app.post('/api/vaults', async (req, res) => {
  try {
    const { name, description, strategyType, performanceFee, managementFee, coinType } = req.body;
    
    // Validate input
    if (!name || !strategyType || !coinType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // Create vault object
    const newVault = {
      id: uuidv4(),
      name,
      description,
      strategyType,
      performanceFee,
      managementFee,
      coinType,
      totalAssets: 0,
      totalShares: 0,
      sharePrice: 1,
      apy: calculateApy(strategyType), // This would be calculated based on strategy
      createdAt: new Date().toISOString(),
      isActive: true
    };
    
    vaults.push(newVault);
    
    // In a real implementation, we would also deploy the smart contract
    
    res.status(201).json({
      success: true,
      data: newVault
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Deposit into vault
app.post('/api/vaults/:id/deposit', async (req, res) => {
  try {
    const vaultId = req.params.id;
    const { userAddress, amount } = req.body;
    
    const vault = vaults.find(v => v.id === vaultId);
    if (!vault) {
      return res.status(404).json({
        success: false,
        error: 'Vault not found'
      });
    }
    
    // In a real implementation, this would call the smart contract
    const sharesMinted = amount / vault.sharePrice;
    
    // Update vault totals
    vault.totalAssets += amount;
    vault.totalShares += sharesMinted;
    
    // Update user portfolio
    if (!userPortfolios[userAddress]) {
      userPortfolios[userAddress] = {};
    }
    
    if (!userPortfolios[userAddress][vaultId]) {
      userPortfolios[userAddress][vaultId] = {
        vaultId,
        shares: 0,
        value: 0
      };
    }
    
    userPortfolios[userAddress][vaultId].shares += sharesMinted;
    userPortfolios[userAddress][vaultId].value = userPortfolios[userAddress][vaultId].shares * vault.sharePrice;
    
    // Record transaction
    const transaction = {
      id: uuidv4(),
      type: 'deposit',
      userAddress,
      vaultId,
      amount,
      shares: sharesMinted,
      timestamp: new Date().toISOString()
    };
    
    transactions.push(transaction);
    
    res.json({
      success: true,
      data: {
        sharesMinted,
        transactionId: transaction.id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Withdraw from vault
app.post('/api/vaults/:id/withdraw', async (req, res) => {
  try {
    const vaultId = req.params.id;
    const { userAddress, shares } = req.body;
    
    const vault = vaults.find(v => v.id === vaultId);
    if (!vault) {
      return res.status(404).json({
        success: false,
        error: 'Vault not found'
      });
    }
    
    // Check if user has enough shares
    if (!userPortfolios[userAddress] || !userPortfolios[userAddress][vaultId] || 
        userPortfolios[userAddress][vaultId].shares < shares) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient shares'
      });
    }
    
    // Calculate amount to withdraw
    const amountToWithdraw = shares * vault.sharePrice;
    
    // Update vault totals
    vault.totalAssets -= amountToWithdraw;
    vault.totalShares -= shares;
    
    // Update user portfolio
    userPortfolios[userAddress][vaultId].shares -= shares;
    userPortfolios[userAddress][vaultId].value = userPortfolios[userAddress][vaultId].shares * vault.sharePrice;
    
    // Record transaction
    const transaction = {
      id: uuidv4(),
      type: 'withdraw',
      userAddress,
      vaultId,
      amount: amountToWithdraw,
      shares,
      timestamp: new Date().toISOString()
    };
    
    transactions.push(transaction);
    
    res.json({
      success: true,
      data: {
        amountWithdrawn: amountToWithdraw,
        transactionId: transaction.id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user portfolio
app.get('/api/portfolio/:userAddress', async (req, res) => {
  try {
    const userAddress = req.params.userAddress;
    const portfolio = userPortfolios[userAddress] || {};
    
    // Calculate total value
    let totalValue = 0;
    Object.values(portfolio).forEach(item => {
      totalValue += item.value;
    });
    
    res.json({
      success: true,
      data: {
        holdings: portfolio,
        totalValue
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to calculate APY based on strategy
function calculateApy(strategyType) {
  // This would be more complex in a real implementation
  // Possibly fetching data from various DeFi protocols
  const baseRates = {
    0: 0.05, // LP strategy
    1: 0.03, // Lending strategy
    2: 0.08  // Covered call strategy
  };
  
  return baseRates[strategyType] || 0.02;
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});