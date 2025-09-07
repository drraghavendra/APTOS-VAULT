import { AptosClient, TxnBuilderTypes, BCS } from 'aptos';
import { getAptosClient, getAdminAccount } from '../config/aptos';
import { Vault } from '../models/Vault';
import { UserPosition } from '../models/UserPosition';
import { Transaction } from '../models/Transaction';
import { priceService } from './priceService';

// Vault module address (would be deployed contract address)
const MODULE_ADDRESS = process.env.VAULT_MODULE_ADDRESS || '0x1234567890abcdef';

export const vaultService = {
  // Deposit into a vault
  deposit: async (vaultId: string, userId: string, amount: number): Promise<any> => {
    const client = getAptosClient();
    const adminAccount = getAdminAccount();
    
    try {
      // Get vault details
      const vault = await Vault.findById(vaultId);
      if (!vault) {
        throw new Error('Vault not found');
      }
      
      // Create deposit transaction
      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_ADDRESS}::vault::deposit`,
        type_arguments: [],
        arguments: [vaultId, amount * 100000000] // Convert to octas (8 decimals)
      };
      
      // Simulate transaction first
      const simulated = await client.simulateTransaction(adminAccount, payload);
      if (!simulated[0].success) {
        throw new Error('Transaction simulation failed');
      }
      
      // Submit transaction
      const transaction = await client.generateSignSubmitTransaction(adminAccount, payload);
      
      // Wait for transaction confirmation
      await client.waitForTransaction(transaction.hash);
      
      // Update user position
      let position = await UserPosition.findOne({ vaultId, userId });
      if (!position) {
        position = new UserPosition({
          vaultId,
          userId,
          depositedAmount: amount,
          earnedAmount: 0,
          shares: amount, // 1:1 initially, will change with vault growth
          lastUpdated: new Date()
        });
      } else {
        position.depositedAmount += amount;
        position.shares += amount; // Simplified - should use vault share price
        position.lastUpdated = new Date();
      }
      await position.save();
      
      // Update vault TVL
      vault.tvl += amount;
      await vault.save();
      
      // Record transaction
      const txRecord = new Transaction({
        hash: transaction.hash,
        type: 'deposit',
        status: 'completed',
        amount,
        asset: vault.asset,
        userId,
        vaultId,
        timestamp: new Date(),
        blockHeight: parseInt(transaction.version || '0')
      });
      await txRecord.save();
      
      return {
        transactionHash: transaction.hash,
        newPosition: position
      };
    } catch (error) {
      console.error('Deposit failed:', error);
      throw error;
    }
  },

  // Withdraw from a vault
  withdraw: async (vaultId: string, userId: string, amount: number): Promise<any> => {
    const client = getAptosClient();
    const adminAccount = getAdminAccount();
    
    try {
      // Get vault and user position
      const vault = await Vault.findById(vaultId);
      const position = await UserPosition.findOne({ vaultId, userId });
      
      if (!vault || !position) {
        throw new Error('Vault or position not found');
      }
      
      if (position.depositedAmount < amount) {
        throw new Error('Insufficient balance');
      }
      
      // Create withdrawal transaction
      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_ADDRESS}::vault::withdraw`,
        type_arguments: [],
        arguments: [vaultId, amount * 100000000] // Convert to octas
      };
      
      // Submit transaction
      const transaction = await client.generateSignSubmitTransaction(adminAccount, payload);
      
      // Wait for transaction confirmation
      await client.waitForTransaction(transaction.hash);
      
      // Update user position
      position.depositedAmount -= amount;
      position.shares -= amount; // Simplified
      position.lastUpdated = new Date();
      await position.save();
      
      // Update vault TVL
      vault.tvl -= amount;
      await vault.save();
      
      // Record transaction
      const txRecord = new Transaction({
        hash: transaction.hash,
        type: 'withdraw',
        status: 'completed',
        amount,
        asset: vault.asset,
        userId,
        vaultId,
        timestamp: new Date(),
        blockHeight: parseInt(transaction.version || '0')
      });
      await txRecord.save();
      
      return {
        transactionHash: transaction.hash,
        updatedPosition: position
      };
    } catch (error) {
      console.error('Withdrawal failed:', error);
      throw error;
    }
  },

  // Claim rewards from a vault
  claimRewards: async (vaultId: string, userId: string): Promise<any> => {
    const client = getAptosClient();
    const adminAccount = getAdminAccount();
    
    try {
      // Get user position
      const position = await UserPosition.findOne({ vaultId, userId });
      if (!position || position.earnedAmount <= 0) {
        throw new Error('No rewards to claim');
      }
      
      const rewardAmount = position.earnedAmount;
      
      // Create claim transaction
      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_ADDRESS}::vault::claim_rewards`,
        type_arguments: [],
        arguments: [vaultId]
      };
      
      // Submit transaction
      const transaction = await client.generateSignSubmitTransaction(adminAccount, payload);
      
      // Wait for transaction confirmation
      await client.waitForTransaction(transaction.hash);
      
      // Update user position
      position.earnedAmount = 0;
      position.lastUpdated = new Date();
      await position.save();
      
      // Record transaction
      const txRecord = new Transaction({
        hash: transaction.hash,
        type: 'claim',
        status: 'completed',
        amount: rewardAmount,
        asset: 'APT', // Assuming rewards in APT
        userId,
        vaultId,
        timestamp: new Date(),
        blockHeight: parseInt(transaction.version || '0')
      });
      await txRecord.save();
      
      return {
        transactionHash: transaction.hash,
        rewardAmount,
        updatedPosition: position
      };
    } catch (error) {
      console.error('Claim rewards failed:', error);
      throw error;
    }
  },

  // Harvest vault rewards (admin function)
  harvestVault: async (vaultId: string): Promise<any> => {
    const client = getAptosClient();
    const adminAccount = getAdminAccount();
    
    try {
      // Create harvest transaction
      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_ADDRESS}::vault::harvest`,
        type_arguments: [],
        arguments: [vaultId]
      };
      
      // Submit transaction
      const transaction = await client.generateSignSubmitTransaction(adminAccount, payload);
      
      // Wait for transaction confirmation
      await client.waitForTransaction(transaction.hash);
      
      // Update vault APY and performance (simplified)
      const vault = await Vault.findById(vaultId);
      if (vault) {
        // Simulate APY update based on harvest
        const newApy = await priceService.calculateNewApy(vaultId);
        vault.apy = newApy;
        
        // Add performance data point
        vault.performanceHistory.push({
          date: new Date(),
          value: vault.tvl * (1 + newApy / 100 / 365) // Daily growth
        });
        
        await vault.save();
      }
      
      // Record transaction
      const txRecord = new Transaction({
        hash: transaction.hash,
        type: 'harvest',
        status: 'completed',
        amount: 0, // Amount would be calculated
        asset: 'APT',
        timestamp: new Date(),
        blockHeight: parseInt(transaction.version || '0')
      });
      await txRecord.save();
      
      return {
        transactionHash: transaction.hash,
        vaultId
      };
    } catch (error) {
      console.error('Harvest failed:', error);
      throw error;
    }
  }
};
