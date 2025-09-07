module vaults::emergency_withdraw {
    use std::signer;
    use aptos_framework::coin;
    use vaults::vault_manager;
    
    const ERR_NOT_USER: u64 = 1;
    const ERR_VAULT_NOT_FOUND: u64 = 2;
    
    public entry fun emergency_withdraw<CoinType>(
        user: &signer,
        vault_addr: address
    ) {
        let user_addr = signer::address_of(user);
        
        // Get user's share balance from vault
        let (shares, _, _, _) = vault_manager::get_user_position<CoinType>(user_addr, vault_addr);
        assert!(shares > 0, ERR_NOT_USER);
        
        // Calculate proportional share of vault assets
        let (total_supply, total_assets, _, _, _, _, _, _, _, _) = 
            vault_manager::get_vault_info<CoinType>(vault_addr);
        assert!(total_supply > 0, ERR_VAULT_NOT_FOUND);
        
        let user_share = (shares * total_assets) / total_supply;
        
        // Withdraw user's share directly from vault
        let coins = coin::withdraw<CoinType>(vault_addr, user_share);
        coin::deposit(user_addr, coins);
        
        // Note: This bypasses normal withdrawal process and may incur losses
        // but ensures users can always access funds in emergency
    }
}
