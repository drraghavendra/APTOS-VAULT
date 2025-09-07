import express from 'express';
import { vaultController } from '../controllers/vaultController';

const router = express.Router();

// Vault routes
router.get('/vaults', vaultController.getAllVaults);
router.get('/vaults/:id', vaultController.getVaultById);
router.get('/vaults/:vaultId/positions', vaultController.getUserPositions);

// Vault operations
router.post('/vaults/deposit', vaultController.deposit);
router.post('/vaults/withdraw', vaultController.withdraw);
router.post('/vaults/claim', vaultController.claimRewards);

export default router;
