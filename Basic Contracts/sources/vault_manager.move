module vaults::vault_manager {
    use std::signer;
    use std::vector;
    use aptos_framework::coin;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    
    const ERR_NOT_ADMIN: u64 = 1;
    const ERR_VAULT_NOT_FOUND: u64 = 2;
    const ERR_INSUFFICIENT_BALANCE: u64 = 3;
    const ERR_STRATEGY_EXECUTION_FAILED: u64 = 4;
    const ERR_WITHDRAWAL_NOT_ALLOWED: u64 = 5;
    const ERR_INVALID_STRATEGY: u64 = 6;
    const ERR_VAULT_PAUSED: u64 = 7;
    const ERR_INSUFFICIENT_LIQUIDITY: u64 = 8;
    const ERR_FEE_TOO_HIGH: u64 = 9;
    
    const MAX_PERFORMANCE_FEE: u64 = 2000; // 20%
    const MAX_MANAGEMENT_FEE: u64 = 200; // 2%
    
    const STRATEGY_LP: u8 = 0;
    const STRATEGY_LENDING: u8 = 1;
    const STRATEGY_COVERED_CALL: u8 = 2;
    const STRATEGY_YIELD_AGGREGATOR: u8 = 3;
    
    struct Vault<phantom CoinType> has key {
        total_supply: u64,
        total_assets: u64,
        share_price: u64,
        last_rebalance: u64,
        performance_fee: u64,
        management_fee: u64,
        is_active: bool,
        strategy_type: u8,
        creator: address,
        deposit_cap: u64,
        min_deposit: u64,
        user_count: u64,
        apr_30d: u64,
        apr_90d: u64
    }
    
    struct UserVault<phantom CoinType> has key {
        shares: u64,
        last_interaction: u64,
        total_deposited: u64,
        total_withdrawn: u64
    }
    
    struct VaultGlobalConfig has key {
        admin: address,
        fee_collector: address,
        emergency_pause: bool,
        whitelist_enabled: bool,
        max_vaults_per_user: u64
    }
    
    struct VaultPerformance has key {
        historical_apy: vector<u64>,
        total_fees_collected: u64,
        rebalance_count: u64,
        last_30d_performance: u64
    }
    
    struct VaultFees<phantom CoinType> has key {
        accumulated_performance_fees: u64,
        accumulated_management_fees: u64,
        last_collection: u64
    }
    
    struct VaultEvents has key {
        deposit_events: event::EventHandle<DepositEvent>,
        withdraw_events: event::EventHandle<WithdrawEvent>,
        rebalance_events: event::EventHandle<RebalanceEvent>,
        fee_events: event::EventHandle<FeeEvent>,
        emergency_events: event::EventHandle<EmergencyEvent>
    }
    
    struct DepositEvent has drop, store {
        user: address,
        amount: u64,
        shares_minted: u64,
        timestamp: u64
    }
    
    struct WithdrawEvent has drop, store {
        user: address,
        amount: u64,
        shares_burned: u64,
        timestamp: u64
    }
    
    struct RebalanceEvent has drop, store {
        old_assets: u64,
        new_assets: u64,
        profit: u64,
        timestamp: u64
    }
    
    struct FeeEvent has drop, store {
        fee_type: u8,
        amount: u64,
        timestamp: u64
    }
    
    struct EmergencyEvent has drop, store {
        action: u8,
        timestamp: u64
    }
    
    // ========== ADMIN FUNCTIONS ==========
    
    public fun initialize_vault_manager(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(!exists<VaultGlobalConfig>(admin_addr), ERR_NOT_ADMIN);
        
        move_to(admin, VaultGlobalConfig {
            admin: admin_addr,
            fee_collector: admin_addr,
            emergency_pause: false,
            whitelist_enabled: false,
            max_vaults_per_user: 10
        });
        
        move_to(admin, VaultEvents {
            deposit_events: account::new_event_handle<DepositEvent>(admin),
            withdraw_events: account::new_event_handle<WithdrawEvent>(admin),
            rebalance_events: account::new_event_handle<RebalanceEvent>(admin),
            fee_events: account::new_event_handle<FeeEvent>(admin),
            emergency_events: account::new_event_handle<EmergencyEvent>(admin)
        });
    }
    
    public entry fun create_vault<CoinType>(
        admin: &signer,
        strategy_type: u8,
        performance_fee: u64,
        management_fee: u64,
        deposit_cap: u64,
        min_deposit: u64
    ) acquires VaultGlobalConfig, VaultEvents {
        assert!(is_admin(signer::address_of(admin)), ERR_NOT_ADMIN);
        assert!(performance_fee <= MAX_PERFORMANCE_FEE, ERR_FEE_TOO_HIGH);
        assert!(management_fee <= MAX_MANAGEMENT_FEE, ERR_FEE_TOO_HIGH);
        assert!(strategy_type <= STRATEGY_YIELD_AGGREGATOR, ERR_INVALID_STRATEGY);
        
        let vault_addr = signer::address_of(admin);
        if (!exists<Vault<CoinType>>(vault_addr)) {
            move_to(admin, Vault<CoinType> {
                total_supply: 0,
                total_assets: 0,
                share_price: 1000000, // 1.0 with 6 decimals
                last_rebalance: timestamp::now_seconds(),
                performance_fee,
                management_fee,
                is_active: true,
                strategy_type,
                creator: vault_addr,
                deposit_cap,
                min_deposit,
                user_count: 0,
                apr_30d: 0,
                apr_90d: 0
            });
            
            move_to(admin, VaultPerformance {
                historical_apy: vector::empty(),
                total_fees_collected: 0,
                rebalance_count: 0,
                last_30d_performance: 0
            });
        };
    }
    
    public entry fun set_emergence_pause(admin: &signer, pause: bool) 
    acquires VaultGlobalConfig, VaultEvents {
        assert!(is_admin(signer::address_of(admin)), ERR_NOT_ADMIN);
        let config = borrow_global_mut<VaultGlobalConfig>(signer::address_of(admin));
        config.emergency_pause = pause;
        
        let events = borrow_global_mut<VaultEvents>(signer::address_of(admin));
        event::emit_event(&mut events.emergency_events, EmergencyEvent {
            action: if (pause) 1 else 0,
            timestamp: timestamp::now_seconds()
        });
    }
    
    // ========== USER FUNCTIONS ==========
    
    public entry fun deposit<CoinType>(
        user: &signer,
        vault_addr: address,
        amount: u64
    ) acquires Vault, UserVault, VaultGlobalConfig, VaultEvents, VaultPerformance {
        let user_addr = signer::address_of(user);
        let vault = borrow_global_mut<Vault<CoinType>>(vault_addr);
        let config = borrow_global<VaultGlobalConfig>(vault_addr);
        
        assert!(!config.emergency_pause, ERR_VAULT_PAUSED);
        assert!(vault.is_active, ERR_WITHDRAWAL_NOT_ALLOWED);
        assert!(amount >= vault.min_deposit, ERR_INSUFFICIENT_BALANCE);
        assert!(vault.total_assets + amount <= vault.deposit_cap, ERR_INSUFFICIENT_LIQUIDITY);
        
        // Withdraw coins from user
        let coin = coin::withdraw<CoinType>(user, amount);
        
        // Calculate shares to mint
        let shares_to_mint = calculate_shares_to_mint(vault, amount);
        
        // Update vault totals
        vault.total_supply = vault.total_supply + shares_to_mint;
        vault.total_assets = vault.total_assets + amount;
        
        // Update or create user vault position
        if (!exists<UserVault<CoinType>>(user_addr)) {
            move_to(user, UserVault<CoinType> {
                shares: shares_to_mint,
                last_interaction: timestamp::now_seconds(),
                total_deposited: amount,
                total_withdrawn: 0
            });
            vault.user_count = vault.user_count + 1;
        } else {
            let user_vault = borrow_global_mut<UserVault<CoinType>>(user_addr);
            user_vault.shares = user_vault.shares + shares_to_mint;
            user_vault.total_deposited = user_vault.total_deposited + amount;
            user_vault.last_interaction = timestamp::now_seconds();
        };
        
        // Emit deposit event
        let events = borrow_global_mut<VaultEvents>(vault_addr);
        event::emit_event(&mut events.deposit_events, DepositEvent {
            user: user_addr,
            amount: amount,
            shares_minted: shares_to_mint,
            timestamp: timestamp::now_seconds()
        });
        
        // Execute strategy
        execute_strategy<CoinType>(vault_addr, amount, true);
    }
    
    public entry fun withdraw<CoinType>(
        user: &signer,
        vault_addr: address,
        share_amount: u64
    ) acquires Vault, UserVault, VaultGlobalConfig, VaultEvents {
        let user_addr = signer::address_of(user);
        let vault = borrow_global_mut<Vault<CoinType>>(vault_addr);
        let config = borrow_global<VaultGlobalConfig>(vault_addr);
        
        assert!(!config.emergency_pause, ERR_VAULT_PAUSED);
        assert!(exists<UserVault<CoinType>>(user_addr), ERR_INSUFFICIENT_BALANCE);
        
        let user_vault = borrow_global_mut<UserVault<CoinType>>(user_addr);
        assert!(user_vault.shares >= share_amount, ERR_INSUFFICIENT_BALANCE);
        
        // Calculate assets to withdraw
        let assets_to_withdraw = (share_amount * vault.total_assets) / vault.total_supply;
        
        // Update vault totals
        vault.total_supply = vault.total_supply - share_amount;
        vault.total_assets = vault.total_assets - assets_to_withdraw;
        
        // Update user position
        user_vault.shares = user_vault.shares - share_amount;
        user_vault.total_withdrawn = user_vault.total_withdrawn + assets_to_withdraw;
        user_vault.last_interaction = timestamp::now_seconds();
        
        // Transfer assets to user
        let coin_to_withdraw = coin::withdraw<CoinType>(vault_addr, assets_to_withdraw);
        coin::deposit(user_addr, coin_to_withdraw);
        
        // Emit withdraw event
        let events = borrow_global_mut<VaultEvents>(vault_addr);
        event::emit_event(&mut events.withdraw_events, WithdrawEvent {
            user: user_addr,
            amount: assets_to_withdraw,
            shares_burned: share_amount,
            timestamp: timestamp::now_seconds()
        });
    }
    
    // ========== STRATEGY EXECUTION ==========
    
    public entry fun rebalance<CoinType>(
        admin: &signer,
        vault_addr: address
    ) acquires Vault, VaultEvents, VaultPerformance, VaultFees {
        assert!(is_admin(signer::address_of(admin)), ERR_NOT_ADMIN);
        let vault = borrow_global_mut<Vault<CoinType>>(vault_addr);
        
        let old_assets = vault.total_assets;
        execute_strategy<CoinType>(vault_addr, 0, false);
        let new_assets = vault.total_assets;
        let profit = if (new_assets > old_assets) new_assets - old_assets else 0;
        
        // Update performance metrics
        let performance = borrow_global_mut<VaultPerformance>(vault_addr);
        performance.rebalance_count = performance.rebalance_count + 1;
        if (profit > 0) {
            collect_performance_fee<CoinType>(vault_addr, profit);
        };
        
        // Emit rebalance event
        let events = borrow_global_mut<VaultEvents>(vault_addr);
        event::emit_event(&mut events.rebalance_events, RebalanceEvent {
            old_assets: old_assets,
            new_assets: new_assets,
            profit: profit,
            timestamp: timestamp::now_seconds()
        });
        
        vault.last_rebalance = timestamp::now_seconds();
    }
    
    fun execute_strategy<CoinType>(
        vault_addr: address,
        new_deposit: u64,
        is_deposit: bool
    ) acquires Vault {
        let vault = borrow_global_mut<Vault<CoinType>>(vault_addr);
        
        // Based on strategy_type, execute different strategies
        if (vault.strategy_type == STRATEGY_LP) {
            execute_lp_strategy<CoinType>(vault_addr, new_deposit, is_deposit);
        } else if (vault.strategy_type == STRATEGY_LENDING) {
            execute_lending_strategy<CoinType>(vault_addr, new_deposit, is_deposit);
        } else if (vault.strategy_type == STRATEGY_COVERED_CALL) {
            execute_covered_call_strategy<CoinType>(vault_addr, new_deposit, is_deposit);
        } else if (vault.strategy_type == STRATEGY_YIELD_AGGREGATOR) {
            execute_yield_aggregator_strategy<CoinType>(vault_addr, new_deposit, is_deposit);
        };
        
        // Update total assets after strategy execution
        let coin_balance = coin::balance<CoinType>(vault_addr);
        vault.total_assets = coin_balance;
        
        // Update share price
        if (vault.total_supply > 0) {
            vault.share_price = (vault.total_assets * 1000000) / vault.total_supply;
        };
    }
    
    fun execute_lp_strategy<CoinType>(vault_addr: address, new_deposit: u64, is_deposit: bool) {
        // Implementation for liquidity provision strategy
        // This would integrate with DEXes like LiquidSwap
        // Placeholder for actual implementation
    }
    
    fun execute_lending_strategy<CoinType>(vault_addr: address, new_deposit: u64, is_deposit: bool) {
        // Implementation for lending strategy
        // This would integrate with lending protocols like Aries Markets
        // Placeholder for actual implementation
    }
    
    fun execute_covered_call_strategy<CoinType>(vault_addr: address, new_deposit: u64, is_deposit: bool) {
        // Implementation for covered call strategy
        // Placeholder for actual implementation
    }
    
    fun execute_yield_aggregator_strategy<CoinType>(vault_addr: address, new_deposit: u64, is_deposit: bool) {
        // Implementation for yield aggregator strategy
        // This would move between different strategies dynamically
        // Placeholder for actual implementation
    }
    
    // ========== FEE MANAGEMENT ==========
    
    fun collect_performance_fee<CoinType>(vault_addr: address, profit: u64) 
    acquires Vault, VaultPerformance, VaultEvents, VaultGlobalConfig, VaultFees {
        let vault = borrow_global_mut<Vault<CoinType>>(vault_addr);
        let config = borrow_global<VaultGlobalConfig>(vault_addr);
        
        if (vault.performance_fee > 0 && profit > 0) {
            let fee_amount = (profit * vault.performance_fee) / 10000;
            if (fee_amount > 0) {
                // Initialize fees struct if it doesn't exist
                if (!exists<VaultFees<CoinType>>(vault_addr)) {
                    move_to(vault_addr, VaultFees<CoinType> {
                        accumulated_performance_fees: 0,
                        accumulated_management_fees: 0,
                        last_collection: timestamp::now_seconds()
                    });
                };
                
                let fees = borrow_global_mut<VaultFees<CoinType>>(vault_addr);
                fees.accumulated_performance_fees = fees.accumulated_performance_fees + fee_amount;
                
                vault.total_assets = vault.total_assets - fee_amount;
                
                // Update performance tracking
                let performance = borrow_global_mut<VaultPerformance>(vault_addr);
                performance.total_fees_collected = performance.total_fees_collected + fee_amount;
                
                // Emit fee event
                let events = borrow_global_mut<VaultEvents>(vault_addr);
                event::emit_event(&mut events.fee_events, FeeEvent {
                    fee_type: 0, // Performance fee
                    amount: fee_amount,
                    timestamp: timestamp::now_seconds()
                });
            };
        };
    }
    
    public entry fun collect_management_fees<CoinType>(admin: &signer, vault_addr: address) 
    acquires Vault, VaultGlobalConfig, VaultEvents, VaultPerformance, VaultFees {
        assert!(is_admin(signer::address_of(admin)), ERR_NOT_ADMIN);
        let vault = borrow_global_mut<Vault<CoinType>>(vault_addr);
        let config = borrow_global<VaultGlobalConfig>(vault_addr);
        
        if (vault.management_fee > 0 && vault.total_assets > 0) {
            // Calculate annual fee, prorated for time since last collection
            let time_elapsed = timestamp::now_seconds() - vault.last_rebalance;
            let annual_fee = (vault.total_assets * vault.management_fee) / 10000;
            let fee_amount = (annual_fee * time_elapsed) / 31536000; // Seconds in a year
            
            if (fee_amount > 0) {
                // Initialize fees struct if it doesn't exist
                if (!exists<VaultFees<CoinType>>(vault_addr)) {
                    move_to(vault_addr, VaultFees<CoinType> {
                        accumulated_performance_fees: 0,
                        accumulated_management_fees: 0,
                        last_collection: timestamp::now_seconds()
                    });
                };
                
                let fees = borrow_global_mut<VaultFees<CoinType>>(vault_addr);
                fees.accumulated_management_fees = fees.accumulated_management_fees + fee_amount;
                
                vault.total_assets = vault.total_assets - fee_amount;
                
                // Update performance tracking
                let performance = borrow_global_mut<VaultPerformance>(vault_addr);
                performance.total_fees_collected = performance.total_fees_collected + fee_amount;
                
                // Emit fee event
                let events = borrow_global_mut<VaultEvents>(vault_addr);
                event::emit_event(&mut events.fee_events, FeeEvent {
                    fee_type: 1, // Management fee
                    amount: fee_amount,
                    timestamp: timestamp::now_seconds()
                });
            };
        };
    }
    
    // Function to collect all accumulated fees
    public entry fun collect_all_fees<CoinType>(admin: &signer, vault_addr: address) 
    acquires VaultGlobalConfig, VaultFees {
        assert!(is_admin(signer::address_of(admin)), ERR_NOT_ADMIN);
        let config = borrow_global<VaultGlobalConfig>(vault_addr);
        
        if (exists<VaultFees<CoinType>>(vault_addr)) {
            let fees = borrow_global_mut<VaultFees<CoinType>>(vault_addr);
            let total_fees = fees.accumulated_performance_fees + fees.accumulated_management_fees;
            
            if (total_fees > 0) {
                // Withdraw all accumulated fees
                let fee_coin = coin::withdraw<CoinType>(vault_addr, total_fees);
                coin::deposit(config.fee_collector, fee_coin);
                
                // Reset accumulated fees
                fees.accumulated_performance_fees = 0;
                fees.accumulated_management_fees = 0;
                fees.last_collection = timestamp::now_seconds();
            };
        };
    }
    
    // ========== HELPER FUNCTIONS ==========
    
    fun calculate_shares_to_mint<CoinType>(vault: &Vault<CoinType>, amount: u64): u64 {
        if (vault.total_supply == 0) {
            amount
        } else {
            (amount * vault.total_supply) / vault.total_assets
        }
    }
    
    fun is_admin(addr: address): bool acquires VaultGlobalConfig {
        exists<VaultGlobalConfig>(addr) && 
        borrow_global<VaultGlobalConfig>(addr).admin == addr
    }
    
    // ========== VIEW FUNCTIONS ==========
    
    public fun get_vault_info<CoinType>(vault_addr: address): (
        u64, u64, u64, u64, bool, u8, u64, u64, u64, u64
    ) acquires Vault {
        if (exists<Vault<CoinType>>(vault_addr)) {
            let vault = borrow_global<Vault<CoinType>>(vault_addr);
            return (
                vault.total_supply,
                vault.total_assets,
                vault.share_price,
                vault.last_rebalance,
                vault.is_active,
                vault.strategy_type,
                vault.performance_fee,
                vault.management_fee,
                vault.apr_30d,
                vault.apr_90d
            )
        };
        (0, 0, 0, 0, false, 0, 0, 0, 0, 0)
    }
    
    public fun get_user_position<CoinType>(user_addr: address, vault_addr: address): (
        u64, u64, u64, u64
    ) acquires UserVault, Vault {
        if (exists<UserVault<CoinType>>(user_addr) && exists<Vault<CoinType>>(vault_addr)) {
            let user_vault = borrow_global<UserVault<CoinType>>(user_addr);
            let vault = borrow_global<Vault<CoinType>>(vault_addr);
            let value = (user_vault.shares * vault.total_assets) / vault.total_supply;
            return (user_vault.shares, value, user_vault.total_deposited, user_vault.total_withdrawn)
        };
        (0, 0, 0, 0)
    }
    
    public fun get_vault_performance(vault_addr: address): (u64, u64, vector<u64>) 
    acquires VaultPerformance {
        if (exists<VaultPerformance>(vault_addr)) {
            let performance = borrow_global<VaultPerformance>(vault_addr);
            return (
                performance.total_fees_collected,
                performance.rebalance_count,
                performance.historical_apy
            )
        };
        (0, 0, vector::empty())
    }
    
    public fun get_accumulated_fees<CoinType>(vault_addr: address): (u64, u64, u64) 
    acquires VaultFees {
        if (exists<VaultFees<CoinType>>(vault_addr)) {
            let fees = borrow_global<VaultFees<CoinType>>(vault_addr);
            return (
                fees.accumulated_performance_fees,
                fees.accumulated_management_fees,
                fees.last_collection
            )
        };
        (0, 0, 0)
    }
}