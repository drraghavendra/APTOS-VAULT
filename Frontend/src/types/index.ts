export interface Vault {
  id: string;
  name: string;
  description: string;
  apy: number;
  tvl: number;
  strategy: string;
  asset: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  minDeposit: number;
  createdAt: Date;
  performanceHistory: PerformanceData[];
}

export interface PerformanceData {
  date: Date;
  value: number;
}

export interface UserPosition {
  vaultId: string;
  depositedAmount: number;
  earnedAmount: number;
  currentValue: number;
}

export interface Transaction {
  hash: string;
  type: 'deposit' | 'withdraw' | 'claim';
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  asset: string;
  timestamp: Date;
  vaultId?: string;
}
