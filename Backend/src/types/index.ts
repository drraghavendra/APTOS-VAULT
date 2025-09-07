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
  performanceFee: number;
  managementFee: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  performanceHistory: PerformanceData[];
}

export interface PerformanceData {
  date: Date;
  value: number;
}

export interface UserPosition {
  userId: string;
  vaultId: string;
  depositedAmount: number;
  earnedAmount: number;
  shares: number;
  lastUpdated: Date;
}

export interface Transaction {
  hash: string;
  type: 'deposit' | 'withdraw' | 'claim' | 'harvest';
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  asset: string;
  userId: string;
  vaultId?: string;
  timestamp: Date;
  blockHeight?: number;
}

export interface User {
  id: string;
  address: string;
  email?: string;
  createdAt: Date;
  lastLogin: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  emailNotifications: boolean;
  riskTolerance: 'Low' | 'Medium' | 'High';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
