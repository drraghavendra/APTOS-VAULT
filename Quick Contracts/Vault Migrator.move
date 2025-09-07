module vaults::vault_migrator {
    use std::signer;
    use aptos_framework::coin;
    use vaults::vault_manager;
    
    const ERR_NOT_ADMIN: u64 = 1;
    const ERR_SAME_VAULT: u64 = 2;
    const ERR_MIGRATION_DISABLED: u64 = 3;
    
    struct MigrationConfig has key {
        enabled: bool,
        migration_fee: u64
    }
    
    public fun initialize_migrator(admin: &signer) {
        move_to(admin, MigrationConfig {
            enabled: true,
            migration_fee: 1000 // 0.1%
        });
    }
    
    public entry fun migrate_vault<CoinType>(
        admin: &signer,
        from_vault: address,
        to_vault: address
    ) acquires MigrationConfig {
        assert!(vault_manager::is_admin(signer::address_of(admin)), ERR_NOT_ADMIN);
        assert!(from_vault != to_vault, ERR_SAME_VAULT);
        
        let config = borrow_global<MigrationConfig>(signer::address_of(admin));
        assert!(config.enabled, ERR_MIGRATION_DISABLED);
        
        // Get total assets from old vault
        let (_, total_assets, _, _, _, _, _, _, _, _) = 
            vault_manager::get_vault_info<CoinType>(from_vault);
        
        if (total_assets > 0) {
            // Calculate migration fee
            let fee_amount = (total_assets * config.migration_fee) / 1000000;
            let migrate_amount = total_assets - fee_amount;
            
            // Withdraw from old vault
            let coins = coin::withdraw<CoinType>(from_vault, total_assets);
            
            // Take fee
            let fee_coins = coin::extract(&mut coins, fee_amount);
            coin::deposit(signer::address_of(admin), fee_coins);
            
            // Deposit into new vault
            coin::deposit(to_vault, coins);
            
            // Update vault records
            // Note: This would require additional logic to handle share migration
        }
    }
}
