module vaults::reward_token {
    use std::signer;
    use std::string;
    use aptos_framework::coin;
    use aptos_framework::account;
    
    const ERR_NOT_ADMIN: u64 = 1;
    const ERR_INSUFFICIENT_BALANCE: u64 = 2;
    
    struct RewardTokenAdmin has key {
        mint_cap: coin::MintCapability,
        burn_cap: coin::BurnCapability
    }
    
    public fun initialize_reward_token(admin: &signer) {
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<RewardToken>(
            admin,
            string::utf8(b"Vault Reward Token"),
            string::utf8(b"VRT"),
            6,
            true
        );
        
        coin::destroy_freeze_cap(freeze_cap);
        
        move_to(admin, RewardTokenAdmin {
            mint_cap,
            burn_cap
        });
    }
    
    public fun mint_rewards(
        admin: &signer,
        recipient: address,
        amount: u64
    ) acquires RewardTokenAdmin {
        assert!(exists<RewardTokenAdmin>(signer::address_of(admin)), ERR_NOT_ADMIN);
        
        let admin_cap = borrow_global<RewardTokenAdmin>(signer::address_of(admin));
        coin::mint(recipient, amount, &admin_cap.mint_cap);
    }
    
    public fun burn_rewards(
        admin: &signer,
        amount: u64
    ) acquires RewardTokenAdmin {
        assert!(exists<RewardTokenAdmin>(signer::address_of(admin)), ERR_NOT_ADMIN);
        
        let