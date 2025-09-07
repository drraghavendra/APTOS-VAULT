import { AptosClient, Types } from 'aptos';
import { getAptosClient } from '../config/aptos';

export const aptosService = {
  // Get account balance
  getBalance: async (address: string): Promise<number> => {
    const client = getAptosClient();
    
    try {
      const resources = await client.getAccountResources(address);
      const coinResource = resources.find((r: Types.MoveResource) => 
        r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
      );
      
      if (coinResource) {
        const balance = (coinResource.data as any).coin.value;
        return parseInt(balance) / 100000000; // Convert from octas to APT
      }
      
      return 0;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  },

  // Get transaction details
  getTransaction: async (hash: string): Promise<Types.Transaction | null> => {
    const client = getAptosClient();
    
    try {
      const transaction = await client.getTransactionByHash(hash);
      return transaction;
    } catch (error) {
      console.error('Failed to get transaction:', error);
      return null;
    }
  },

  // Get account transactions
  getAccountTransactions: async (address: string, limit: number = 25): Promise<Types.Transaction[]> => {
    const client = getAptosClient();
    
    try {
      const transactions = await client.getAccountTransactions(address, { limit });
      return transactions;
    } catch (error) {
      console.error('Failed to get account transactions:', error);
      return [];
    }
  },

  // Check if account exists
  accountExists: async (address: string): Promise<boolean> => {
    const client = getAptosClient();
    
    try {
      await client.getAccount(address);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Get block information
  getBlock: async (height: number): Promise<Types.Block | null> => {
    const client = getAptosClient();
    
    try {
      const block = await client.getBlockByHeight(height);
      return block;
    } catch (error) {
      console.error('Failed to get block:', error);
      return null;
    }
  }
};
