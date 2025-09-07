import mongoose, { Schema, Document } from 'mongoose';

export interface IVault extends Document {
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
  performanceHistory: {
    date: Date;
    value: number;
  }[];
}

const PerformanceSchema = new Schema({
  date: { type: Date, required: true },
  value: { type: Number, required: true }
});

const VaultSchema = new Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true 
  },
  apy: { 
    type: Number, 
    required: true,
    min: 0
  },
  tvl: { 
    type: Number, 
    required: true,
    default: 0,
    min: 0
  },
  strategy: { 
    type: String, 
    required: true 
  },
  asset: { 
    type: String, 
    required: true,
    default: 'APT'
  },
  riskLevel: { 
    type: String, 
    required: true,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  minDeposit: { 
    type: Number, 
    required: true,
    default: 1,
    min: 0
  },
  performanceFee: { 
    type: Number, 
    required: true,
    default: 0.2, // 20%
    min: 0,
    max: 1
  },
  managementFee: { 
    type: Number, 
    required: true,
    default: 0.02, // 2%
    min: 0,
    max: 1
  },
  isActive: { 
    type: Boolean, 
    required: true,
    default: true 
  },
  performanceHistory: [PerformanceSchema]
}, {
  timestamps: true
});

// Index for better query performance
VaultSchema.index({ isActive: 1, riskLevel: 1 });
VaultSchema.index({ asset: 1, isActive: 1 });

export const Vault = mongoose.model<IVault>('Vault', VaultSchema);
