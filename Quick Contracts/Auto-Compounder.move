module vaults::auto_compounder {
    use std::signer;
    use aptos_framework::timestamp;
    use vaults::vault_manager;
    
    const ERR_NOT_ADMIN: u64 = 1;
    const ERR_TOO_SOON: u64 = 2;
    
    struct AutoCompoundConfig<phantom CoinType> has key {
        vault_addr: address,
        last_compound: u64,
        compound_interval: u64,
        min_profit_threshold: u64
    }
    
    public fun initialize_auto_compounder<CoinType>(
        admin: &signer,
        vault_addr: address,
        compound_interval: u64,
        min_profit_threshold: u64
    ) {
        assert!(vault_manager::is_admin(signer::address_of(admin)), ERR_NOT_ADMIN);
        
        move_to(admin, AutoCompoundConfig<CoinType> {
            vault_addr,
            last_compound: timestamp::now_seconds(),
            compound_interval,
            min_profit_threshold
        });
    }
    
    public entry fun auto_compound<CoinType>(admin: &signer) 
    acquires AutoCompoundConfig {
        assert!(vault_manager::is_admin(signer::address_of(admin)), ERR_NOT_ADMIN);
        let config = borrow_global_mut<AutoCompoundConfig<CoinType>>(signer::address_of(admin));
        
        let current_time = timestamp::now_seconds();
        assert!(current_time - config.last_compound >= config.compound_interval, ERR_TOO_SOON);
        
        // Execute rebalance to compound yields
        vault_manager::rebalance<CoinType>(admin, config.vault_addr);
        
        config.last_compound = current_time;
    }
    
    public entry fun check_and_compound<CoinType>(
        admin: &signer,
        expected_profit: u64
    ) acquires AutoCompoundConfig {
        assert!(vault_manager::is_admin(signer::address_of(admin)), ERR_NOT_ADMIN);
        let config = borrow_global<AutoCompoundConfig<CoinType>>(signer::address_of(admin));
        
        if (expected_profit >= config.min_profit_threshold) {
            vault_manager::rebalance<CoinType>(admin, config.vault_addr);
        }
    }
}
