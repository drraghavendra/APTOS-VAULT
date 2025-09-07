import { AptosClient, AptosAccount, FaucetClient } from 'aptos';
import { NODE_URL, FAUCET_URL, PRIVATE_KEY } from '../utils/constants';

let aptosClient: AptosClient;
let faucetClient: FaucetClient;
let adminAccount: AptosAccount;

export const initAptosClient = (): void => {
  try {
    aptosClient = new AptosClient(NODE_URL);
    
    if (FAUCET_URL) {
      faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
    }
    
    // Initialize admin account for contract interactions
    if (PRIVATE_KEY) {
      adminAccount = new AptosAccount(Buffer.from(PRIVATE_KEY, 'hex'));
      console.log('Admin account initialized:', adminAccount.address().toString());
    }
    
    console.log('Aptos client initialized');
  } catch (error) {
    console.error('Failed to initialize Aptos client:', error);
    throw error;
  }
};

export const getAptosClient = (): AptosClient => aptosClient;
export const getFaucetClient = (): FaucetClient | null => faucetClient;
export const getAdminAccount = (): AptosAccount => adminAccount;
