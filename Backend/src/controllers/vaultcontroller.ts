import { Request, Response } from 'express';
import { Vault } from '../models/Vault';
import { UserPosition } from '../models/UserPosition';
import { ApiResponse } from '../types';
import { vaultService } from '../services/vaultService';

export const vaultController = {
  // Get all vaults
  getAllVaults: async (req: Request, res: Response): Promise<void> => {
    try {
      const vaults = await Vault.find({ isActive: true }).sort({ createdAt: -1 });
      
      const response: ApiResponse<any> = {
        success: true,
        data: vaults
      };
      
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch vaults' 
      });
    }
  },

  // Get vault by ID
  getVaultById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const vault = await Vault.findById(id);
      
      if (!vault) {
        res.status(404).json({ 
          success: false, 
          error: 'Vault not found' 
        });
        return;
      }
      
      const response: ApiResponse<any> = {
        success: true,
        data: vault
      };
      
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch vault' 
      });
    }
  },

  // Get user positions for a vault
  getUserPositions: async (req: Request, res: Response): Promise<void> => {
    try {
      const { vaultId } = req.params;
      const { userId } = req.query;
      
      if (!userId) {
        res.status(400).json({ 
          success: false, 
          error: 'User ID is required' 
        });
        return;
      }
      
      const positions = await UserPosition.find({ 
        vaultId, 
        userId: userId as string 
      });
      
      const response: ApiResponse<any> = {
        success: true,
        data: positions
      };
      
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch user positions' 
      });
    }
  },

  // Deposit into vault
  deposit: async (req: Request, res: Response): Promise<void> => {
    try {
      const { vaultId, amount, userId } = req.body;
      
      if (!vaultId || !amount || !userId) {
        res.status(400).json({ 
          success: false, 
          error: 'Vault ID, amount, and user ID are required' 
        });
        return;
      }
      
      // Execute deposit through vault service
      const result = await vaultService.deposit(vaultId, userId, amount);
      
      const response: ApiResponse<any> = {
        success: true,
        data: result,
        message: 'Deposit initiated successfully'
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to process deposit' 
      });
    }
  },

  // Withdraw from vault
  withdraw: async (req: Request, res: Response): Promise<void> => {
    try {
      const { vaultId, amount, userId } = req.body;
      
      if (!vaultId || !amount || !userId) {
        res.status(400).json({ 
          success: false, 
          error: 'Vault ID, amount, and user ID are required' 
        });
        return;
      }
      
      // Execute withdrawal through vault service
      const result = await vaultService.withdraw(vaultId, userId, amount);
      
      const response: ApiResponse<any> = {
        success: true,
        data: result,
        message: 'Withdrawal initiated successfully'
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to process withdrawal' 
      });
    }
  },

  // Claim rewards from vault
  claimRewards: async (req: Request, res: Response): Promise<void> => {
    try {
      const { vaultId, userId } = req.body;
      
      if (!vaultId || !userId) {
        res.status(400).json({ 
          success: false, 
          error: 'Vault ID and user ID are required' 
        });
        return;
      }
      
      // Execute claim through vault service
      const result = await vaultService.claimRewards(vaultId, userId);
      
      const response: ApiResponse<any> = {
        success: true,
        data: result,
        message: 'Rewards claimed successfully'
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to claim rewards' 
      });
    }
  }
};
