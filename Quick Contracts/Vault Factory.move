module vaults::vault_factory {
    use std::signer;
    use std::vector;
    use std::string;
    use aptos_framework::coin;
    use vaults::vault_manager;
    use vaults::vault_token;
    
    const ERR_NOT_ADMIN: u64 = 1;
    const ERR_INVALID_STRATEGY: u64 = 2;
    
    struct VaultTemplate has store, drop {
        strategy_type: u8,
        performance_fee: u64,
        management_fee: u64,
        deposit_cap: u64,
        min_deposit: u64,
        description: string::String
    }
    
    struct VaultFactory has key {
        templates: vector<VaultTemplate>,
        vault_count: u64
    }
    
    public fun initialize_factory(admin: &signer) {
        move_to(admin, VaultFactory {
            templates: vector::empty(),
            vault_count: 0
        });
    }
    
    public entry fun add_template(
        admin: &signer,
        strategy_type: u8,
        performance_fee: u64,
        management_fee: u64,
        deposit_cap: u64,
        min_deposit: u64,
        description: string::String
    ) acquires VaultFactory {
        assert!(vault_manager::is_admin(signer::address_of(admin)), ERR_NOT_ADMIN);
        assert!(strategy_type <= 3, ERR_INVALID_STRATEGY); // 0-3 valid strategies
        
        let factory = borrow_global_mut<VaultFactory>(signer::address_of(admin));
        vector::push_back(&mut factory.templates, VaultTemplate {
            strategy_type,
            performance_fee,
            management_fee,
            deposit_cap,
            min_deposit,
            description
        });
    }
    
    public entry fun create_vault_from_template<CoinType>(
        admin: &signer,
        template_index: u64
    ) acquires VaultFactory {
        assert!(vault_manager::is_admin(signer::address_of(admin)), ERR_NOT_ADMIN);
        
        let factory = borrow_global_mut<VaultFactory>(signer::address_of(admin));
        assert!(template_index < vector::length(&factory.templates), ERR_INVALID_STRATEGY);
        
        let template = vector::borrow(&factory.templates, template_index);
        
        // Create the vault
        vault_manager::create_vault<CoinType>(
            admin,
            template.strategy_type,
            template.performance_fee,
            template.management_fee,
            template.deposit_cap,
            template.min_deposit
        );
        
        // Create vault token
        let token_name = string::utf8(b"Vault Share");
        let token_symbol = string::utf8(b"VLT");
        vault_token::create_vault_token(admin, signer::address_of(admin), token_name, token_symbol);
        
        factory.vault_count = factory.vault_count + 1;
    }
    
    public fun get_template_count(admin: &signer): u64 acquires VaultFactory {
        assert!(vault_manager::is_admin(signer::address_of(admin)), ERR_NOT_ADMIN);
        let factory = borrow_global<VaultFactory>(signer::address_of(admin));
        vector::length(&factory.templates)
    }
}
