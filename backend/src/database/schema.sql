-- SMARTMART Normalized MySQL Database Schema
-- Production Grade with Foreign Keys, Decimal Types for Money, and Optimal Indexes

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'MANAGER', 'CASHIER', 'INVENTORY_STAFF', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
    phone VARCHAR(20),
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
);

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'ShoppingBag',
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_code (code)
);

CREATE TABLE IF NOT EXISTS brands (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id VARCHAR(36) NOT NULL,
    brand_id VARCHAR(36),
    unit VARCHAR(20) NOT NULL DEFAULT 'piece', -- 'kg', 'g', 'litre', 'ml', 'piece', 'pack', 'box', 'dozen'
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    mrp DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_percent DECIMAL(5, 2) DEFAULT 0.00,
    gst_rate DECIMAL(5, 2) NOT NULL DEFAULT 5.00, -- e.g., 0%, 5%, 12%, 18%
    stock DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    min_stock_alert DECIMAL(10, 3) NOT NULL DEFAULT 10.000,
    is_weighted BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    plu_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
    INDEX idx_product_barcode (barcode),
    INDEX idx_product_sku (sku),
    INDEX idx_product_plu (plu_code),
    INDEX idx_product_category (category_id)
);

CREATE TABLE IF NOT EXISTS product_barcodes (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    barcode_type ENUM('UPC', 'EAN13', 'EAN8', 'INTERNAL', 'QR') NOT NULL DEFAULT 'EAN13',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_extra_barcodes (barcode)
);

CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(30),
    address TEXT,
    tax_id VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_batches (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    initial_qty DECIMAL(10, 3) NOT NULL,
    remaining_qty DECIMAL(10, 3) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    mfg_date DATE,
    expiry_date DATE NOT NULL,
    supplier_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    INDEX idx_batch_expiry (expiry_date),
    INDEX idx_batch_product (product_id)
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    batch_id VARCHAR(36),
    type ENUM('SALE', 'PURCHASE', 'RETURN', 'ADJUSTMENT', 'DAMAGE', 'EXPIRED') NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL,
    reason TEXT,
    reference_id VARCHAR(100),
    user_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES product_batches(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_inv_tx_product (product_id),
    INDEX idx_inv_tx_created (created_at)
);

CREATE TABLE IF NOT EXISTS purchases (
    id VARCHAR(36) PRIMARY KEY,
    purchase_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id VARCHAR(36) NOT NULL,
    invoice_number VARCHAR(50),
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status ENUM('ORDERED', 'RECEIVED', 'CANCELLED') DEFAULT 'RECEIVED',
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id VARCHAR(36) PRIMARY KEY,
    purchase_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    mfg_date DATE,
    expiry_date DATE NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    customer_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20) UNIQUE NOT NULL,
    loyalty_points INT NOT NULL DEFAULT 0,
    loyalty_tier ENUM('Bronze', 'Silver', 'Gold', 'Platinum') DEFAULT 'Bronze',
    total_spent DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_customer_phone (phone)
);

CREATE TABLE IF NOT EXISTS customer_addresses (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coupons (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    description TEXT,
    discount_type ENUM('PERCENTAGE', 'FIXED') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
    max_discount_amount DECIMAL(10, 2),
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    usage_limit INT DEFAULT 1000,
    usage_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_coupon_code (code)
);

CREATE TABLE IF NOT EXISTS cashier_sessions (
    id VARCHAR(36) PRIMARY KEY,
    cashier_id VARCHAR(36) NOT NULL,
    device_id VARCHAR(50) DEFAULT 'POS-01',
    opening_cash DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    closing_cash DECIMAL(10, 2) DEFAULT 0.00,
    expected_cash DECIMAL(10, 2) DEFAULT 0.00,
    actual_cash DECIMAL(10, 2) DEFAULT 0.00,
    difference DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('OPEN', 'CLOSED') DEFAULT 'OPEN',
    notes TEXT,
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_session_cashier (cashier_id, status)
);

CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(36) PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(36),
    cashier_id VARCHAR(36),
    session_id VARCHAR(36),
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    payment_method ENUM('CASH', 'UPI', 'CARD', 'DIGITAL', 'SPLIT') NOT NULL DEFAULT 'CASH',
    payment_status ENUM('PAID', 'PARTIALLY_PAID', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PAID',
    sync_status ENUM('ONLINE', 'OFFLINE_SYNCED') DEFAULT 'ONLINE',
    idempotency_key VARCHAR(100) UNIQUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (session_id) REFERENCES cashier_sessions(id) ON DELETE SET NULL,
    INDEX idx_sales_invoice (invoice_number),
    INDEX idx_sales_created (created_at),
    INDEX idx_sales_idempotency (idempotency_key)
);

CREATE TABLE IF NOT EXISTS sale_items (
    id VARCHAR(36) PRIMARY KEY,
    sale_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    batch_id VARCHAR(36),
    product_name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (batch_id) REFERENCES product_batches(id) ON DELETE SET NULL,
    INDEX idx_sale_item_sale (sale_id),
    INDEX idx_sale_item_product (product_id)
);

CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    sale_id VARCHAR(36) NOT NULL,
    payment_method ENUM('CASH', 'UPI', 'CARD', 'DIGITAL') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    transaction_ref VARCHAR(100),
    provider_status ENUM('SUCCESS', 'PENDING', 'FAILED') DEFAULT 'SUCCESS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS returns (
    id VARCHAR(36) PRIMARY KEY,
    return_number VARCHAR(50) UNIQUE NOT NULL,
    original_sale_id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36),
    cashier_id VARCHAR(36) NOT NULL,
    total_refund_amount DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('APPROVED', 'PENDING', 'REJECTED') DEFAULT 'APPROVED',
    approved_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (original_sale_id) REFERENCES sales(id) ON DELETE RESTRICT,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS return_items (
    id VARCHAR(36) PRIMARY KEY,
    return_id VARCHAR(36) NOT NULL,
    sale_item_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    refund_amount DECIMAL(10, 2) NOT NULL,
    condition_status ENUM('RESELLABLE', 'DAMAGED', 'EXPIRED') DEFAULT 'RESELLABLE',
    restock_action ENUM('RESTOCKED', 'DISCARDED') DEFAULT 'RESTOCKED',
    FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
    FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(36) PRIMARY KEY,
    category ENUM('SUPPLIES', 'UTILITIES', 'SALARY', 'MAINTENANCE', 'PETTY_CASH', 'OTHER') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT NOT NULL,
    session_id VARCHAR(36),
    user_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES cashier_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    device_info VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_action (action),
    INDEX idx_audit_entity (entity),
    INDEX idx_audit_created (created_at)
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('INFO', 'WARNING', 'ALERT', 'SUCCESS') NOT NULL DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notification_read (is_read),
    INDEX idx_notification_created (created_at)
);

CREATE TABLE IF NOT EXISTS market_basket_rules (
    id VARCHAR(36) PRIMARY KEY,
    antecedent_sku VARCHAR(50) NOT NULL,
    antecedent_name VARCHAR(150) NOT NULL,
    consequent_sku VARCHAR(50) NOT NULL,
    consequent_name VARCHAR(150) NOT NULL,
    support DECIMAL(6, 4) NOT NULL,
    confidence DECIMAL(6, 4) NOT NULL,
    lift DECIMAL(6, 4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS demand_forecasts (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    forecast_date DATE NOT NULL,
    predicted_demand DECIMAL(10, 2) NOT NULL,
    lower_bound DECIMAL(10, 2),
    upper_bound DECIMAL(10, 2),
    recommended_order DECIMAL(10, 2) DEFAULT 0,
    confidence_score DECIMAL(5, 2) DEFAULT 90.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customer_segments (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) UNIQUE NOT NULL,
    recency_days INT NOT NULL,
    frequency_count INT NOT NULL,
    monetary_total DECIMAL(12, 2) NOT NULL,
    rfm_score VARCHAR(10) NOT NULL,
    segment_name VARCHAR(50) NOT NULL,
    churn_risk_score DECIMAL(5, 2) NOT NULL,
    churn_risk_level ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
    clv_estimate DECIMAL(12, 2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS anomalies (
    id VARCHAR(36) PRIMARY KEY,
    anomaly_type VARCHAR(100) NOT NULL,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
    description TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(50),
    cashier_id VARCHAR(36),
    metadata JSON,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE SET NULL
);
