-- FinTrack Pro: Modular Accounting System Schema
-- Compatible with PostgreSQL / MySQL / SQLite

-- 1. ACCOUNT CATEGORIES / TYPES
-- Enums: 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'

-- 2. CHART OF ACCOUNTS
CREATE TABLE accounts (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. BILLS (INVOICES PAYABLE)
CREATE TABLE bills (
    id VARCHAR(50) PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL,
    invoice_number VARCHAR(100),
    invoice_date DATE,
    total_amount DECIMAL(15, 2) NOT NULL,
    total_vat DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'ZAR',
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PROCESSED, PAID
    document_data TEXT, -- Base64 encoded string or URL
    deposit_required DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. BILL LINE ITEMS
CREATE TABLE bill_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id VARCHAR(50),
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit_price DECIMAL(15, 2) DEFAULT 0.00,
    total DECIMAL(15, 2) NOT NULL,
    vat_amount DECIMAL(15, 2) DEFAULT 0.00,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);

-- 5. JOURNAL TRANSACTIONS
CREATE TABLE transactions (
    id VARCHAR(50) PRIMARY KEY,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    vat_amount DECIMAL(15, 2) DEFAULT 0.00,
    vat_rate DECIMAL(5, 4) DEFAULT 0.1500,
    from_account_id VARCHAR(50), -- Credit Account
    to_account_id VARCHAR(50),   -- Debit Account
    category VARCHAR(50),
    type VARCHAR(20),            -- INVOICE, EXPENSE, JOURNAL
    is_vat_claimed BOOLEAN DEFAULT FALSE,
    document_data TEXT,
    bill_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_account_id) REFERENCES accounts(id),
    FOREIGN KEY (to_account_id) REFERENCES accounts(id),
    FOREIGN KEY (bill_id) REFERENCES bills(id)
);

-- 6. ASSET REGISTER
CREATE TABLE assets (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    purchase_date DATE,
    purchase_price DECIMAL(15, 2) NOT NULL,
    supplier_name VARCHAR(255),
    warranty_expiry DATE,
    serial_number VARCHAR(100),
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, DISPOSED, MAINTENANCE
    document_data TEXT,
    transaction_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

-- INITIAL SEED DATA (Standard SA SME Template)

INSERT INTO accounts (id, name, code, type, balance) VALUES
('1', 'FNB Business Account', '1200', 'Asset', 150000),
('2', 'Trade Debtors', '1100', 'Asset', 25000),
('3', 'Service Revenue', '4000', 'Revenue', 0),
('4', 'Operating Expenses', '5100', 'Expense', 0),
('5', 'SARS VAT Control', '2200', 'Liability', 0),
('6', 'SARS PAYE Liability', '2300', 'Liability', 0),
('7', 'SARS CIT Provision', '2400', 'Liability', 0),
('8', 'Equity Capital', '3000', 'Equity', 175000),
('9', 'Trade Creditors', '2100', 'Liability', 0);

INSERT INTO transactions (id, transaction_date, description, amount, vat_amount, vat_rate, from_account_id, to_account_id, category, type) VALUES
('tx-1', '2024-01-01', 'Initial Business Capital', 175000, 0, 0, '8', '1', 'Capital', 'JOURNAL');
