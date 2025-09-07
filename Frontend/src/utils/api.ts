import { Vault, UserPosition, Transaction } from '../types';

// Mock data for demonstration - in a real app, this would connect to your backend/blockchain
const mockVaults: Vault[] = [
  {
    id: 'stable-apt',
    name: 'Stable APT Yield',
    description: 'This vault provides stable yield by leveraging lending protocols and automated rebalancing to maximize returns while minimizing risk.',
    apy: 8.5,
    tvl: 1250000,
    strategy: 'Lending & Yield Optimization',
    asset: 'APT',
    riskLevel: 'Low',
    minDeposit: 1,
    createdAt: new Date('2023-01-15'),
    performanceHistory: [
      { date: new Date('2023-01-15'), value: 1.0 },
      { date: new Date('2023-02-15'), value: 1.07 },
      // ... more historical data
    ]
  },
  // ... more vaults
];

export const api = {
  getVaults: async (): Promise<Vault[]> => {
    // In a real app, this would be an API call
    return mockVaults;
  },

  getUserPositions: async (address?: string): Promise<UserPosition[]> => {
    // In a real app, this would fetch from the blockchain based on user address
    return [];
  },

  deposit: async (vaultId: string, amount: number): Promise<string> => {
    // This would interact with the smart contract
    console.log(`Depositing ${amount} to vault ${vaultId}`);
    return '0x1234567890abcdef'; // mock transaction hash
  },

  withdraw: async (vaultId: string, amount: number): Promise<string> => {
    // This would interact with the smart contract
    console.log(`Withdrawing ${amount} from vault ${vaultId}`);
    return '0x1234567890abcdef'; // mock transaction hash
  },

  claim: async (vaultId: string): Promise<string> => {
    // This would interact with the smart contract
    console.log(`Claiming rewards from vault ${vaultId}`);
    return '0x1234567890abcdef'; // mock transaction hash
  }
};
