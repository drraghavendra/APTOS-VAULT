-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    username VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    preferences JSONB DEFAULT '{}'::jsonb
);

-- Vaults table
CREATE TABLE vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    description TEXT,
    strategy_type INTEGER NOT NULL,
    performance_fee DECIMAL(5,2) NOT NULL CHECK (performance_fee >= 0 AND performance_fee <= 20),
    management_fee DECIMAL(5,2) NOT NULL CHECK (management_fee >= 0 AND management_fee <= 2),
    coin_type VARCHAR(100) NOT NULL,
    total_assets DECIMAL(20,8) DEFAULT 0,
    total_shares DECIMAL(20,8) DEFAULT 0,
    share_price DECIMAL(20,8) DEFAULT 1,
    apr_30d DECIMAL(7,2) DEFAULT 0,
    apr_90d DECIMAL(7,2) DEFAULT 0,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 1 AND risk_score <= 10),
    deposit_cap DECIMAL(20,8) NOT NULL,
    min_deposit DECIMAL(20,8) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    tags VARCHAR(255)[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    creator_address VARCHAR(255) NOT NULL
);

-- User vault holdings table
CREATE TABLE user_vaults (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(255) NOT NULL REFERENCES users(address) ON DELETE CASCADE,
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    shares DECIMAL(20,8) DEFAULT 0 CHECK (shares >= 0),
    total_deposited DECIMAL(20,8) DEFAULT 0,
    total_withdrawn DECIMAL(20,8) DEFAULT 0,
    total_yield_earned DECIMAL(20,8) DEFAULT 0,
    avg_apy DECIMAL(7,2) DEFAULT 0,
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_address, vault_id)
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('deposit', 'withdraw', 'rebalance', 'fee')),
    user_address VARCHAR(255) NOT NULL REFERENCES users(address) ON DELETE CASCADE,
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    amount DECIMAL(20,8),
    shares DECIMAL(20,8),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    tx_hash VARCHAR(255),
    block_number BIGINT,
    gas_used DECIMAL(20,8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vault performance history table
CREATE TABLE vault_performance (
    id SERIAL PRIMARY KEY,
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    total_assets DECIMAL(20,8) NOT NULL,
    total_shares DECIMAL(20,8) NOT NULL,
    share_price DECIMAL(20,8) NOT NULL,
    apy DECIMAL(7,2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    user_address VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_user_vaults_user ON user_vaults(user_address);
CREATE INDEX idx_user_vaults_vault ON user_vaults(vault_id);
CREATE INDEX idx_transactions_user ON transactions(user_address);
CREATE INDEX idx_transactions_vault ON transactions(vault_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_vault_performance_vault ON vault_performance(vault_id);
CREATE INDEX idx_vaults_strategy_type ON vaults(strategy_type);
CREATE INDEX idx_vaults_risk_score ON vaults(risk_score);
CREATE INDEX idx_vaults_is_active ON vaults(is_active);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_vaults_updated_at
    BEFORE UPDATE ON vaults
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_vaults_updated_at
    BEFORE UPDATE ON user_vaults
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
