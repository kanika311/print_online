-- PrintPorter Production PostgreSQL Relational Database Schema
-- Modules: Users, Shops, Orders, Delivery Partners, Transactions, Reviews, Pricing, Chat, Stock, Broadcasts

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER', -- 'CUSTOMER', 'SHOP_OWNER', 'ADMIN', 'DELIVERY_PARTNER'
    avatar_url TEXT,
    address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    wallet_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    cod_no_shows INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. SHOPS TABLE (Cyber Cafe / Print Shop)
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    phone VARCHAR(20) NOT NULL,
    kyc_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'VERIFIED', 'REJECTED'
    kyc_docs JSONB NOT NULL DEFAULT '{"tradeLicense": null, "ownerIdProof": null, "gstNumber": null}'::jsonb,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    is_busy BOOLEAN NOT NULL DEFAULT FALSE,
    capabilities JSONB NOT NULL DEFAULT '{
        "supportedSizes": ["A4", "A3", "Legal", "Letter"],
        "supportedPapers": ["Normal 75gsm", "Bond paper 85gsm", "Glossy 180gsm", "Cardstock 250gsm"],
        "supportedBindings": ["None", "Corner Staple", "Spiral Ring Binding"],
        "colorPrinting": true,
        "duplexPrinting": true,
        "maxDailyCapacity": 2000
    }'::jsonb,
    max_daily_capacity INTEGER NOT NULL DEFAULT 2000,
    current_queue_count INTEGER NOT NULL DEFAULT 0,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 4.80,
    review_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shops_geo ON shops(lat, lng);
CREATE INDEX IF NOT EXISTS idx_shops_online ON shops(is_online);
CREATE INDEX IF NOT EXISTS idx_shops_kyc ON shops(kyc_status);

-- 3. DELIVERY PARTNERS TABLE
CREATE TABLE IF NOT EXISTS delivery_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL DEFAULT 'BIKE', -- 'BIKE', 'SCOOTER', 'CYCLE'
    lat DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    lng DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    current_order_id UUID,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 4.90,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    shop_id UUID REFERENCES shops(id),
    delivery_partner_id UUID REFERENCES delivery_partners(id),
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_mb NUMERIC(6, 2) NOT NULL DEFAULT 1.00,
    page_count INTEGER NOT NULL DEFAULT 1,
    specs JSONB NOT NULL, -- { paperSize, printType, paperType, copies, duplex, binding, customInstructions }
    total_price NUMERIC(10, 2) NOT NULL,
    platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
    shop_earnings NUMERIC(10, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_mode VARCHAR(20) NOT NULL, -- 'ONLINE', 'COD'
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ESCROW_HELD', 'COLLECTED_BY_SHOP', 'PAID_OUT', 'REFUNDED'
    order_status VARCHAR(50) NOT NULL DEFAULT 'MATCHING', -- 'MATCHING', 'DISPATCHED_TO_SHOP', 'ACCEPTED', 'PRINTING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED', 'REASSIGNED'
    delivery_type VARCHAR(50) NOT NULL DEFAULT 'SELF_PICKUP', -- 'SELF_PICKUP', 'HOME_DELIVERY'
    delivery_address TEXT,
    delivery_lat DOUBLE PRECISION,
    delivery_lng DOUBLE PRECISION,
    custom_notes TEXT,
    auto_delete_at TIMESTAMP WITH TIME ZONE, -- Privacy requirement: Purge sensitive docs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- 5. TRANSACTIONS & ESCROW LEDGER
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    shop_id UUID REFERENCES shops(id),
    amount NUMERIC(10, 2) NOT NULL,
    platform_cut NUMERIC(10, 2) NOT NULL,
    shop_cut NUMERIC(10, 2) NOT NULL,
    mode VARCHAR(20) NOT NULL, -- 'ONLINE', 'COD'
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'HELD_IN_ESCROW', 'SETTLED', 'REFUNDED'
    settlement_status VARCHAR(50) NOT NULL DEFAULT 'UNSETTLED', -- 'UNSETTLED', 'VERIFIED_BY_ADMIN', 'DISBURSED'
    settled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. REVIEWS & RATINGS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. PRICING RULES MATRIX
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paper_size VARCHAR(20) NOT NULL, -- 'A4', 'A3', 'Legal', 'Letter'
    print_type VARCHAR(20) NOT NULL, -- 'BW', 'COLOR'
    paper_type VARCHAR(50) NOT NULL, -- 'Normal 75gsm', 'Bond paper 85gsm', 'Glossy 180gsm', 'Cardstock 250gsm'
    price_per_page NUMERIC(6, 2) NOT NULL,
    binding_prices JSONB NOT NULL DEFAULT '{"None": 0, "Corner Staple": 5, "Spiral Ring Binding": 35}'::jsonb,
    delivery_base_fee NUMERIC(6, 2) NOT NULL DEFAULT 30.00,
    delivery_per_km NUMERIC(6, 2) NOT NULL DEFAULT 8.00,
    surge_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. SHOP INVENTORY / STOCK MANAGEMENT
CREATE TABLE IF NOT EXISTS stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'PAPER', 'TONER', 'BINDING'
    current_stock INTEGER NOT NULL DEFAULT 500,
    unit VARCHAR(20) NOT NULL DEFAULT 'sheets', -- 'sheets', 'cartridges', 'coils'
    low_stock_threshold INTEGER NOT NULL DEFAULT 100,
    is_low_stock BOOLEAN NOT NULL DEFAULT FALSE,
    is_out_of_stock BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. IN-APP CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    sender_role VARCHAR(50) NOT NULL, -- 'CUSTOMER', 'SHOP', 'SUPPORT'
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. SYSTEM BROADCASTS & CMS CONTENT
CREATE TABLE IF NOT EXISTS broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_audience VARCHAR(50) NOT NULL DEFAULT 'ALL', -- 'ALL', 'SHOPS', 'CUSTOMERS'
    banner_type VARCHAR(50) NOT NULL DEFAULT 'INFO', -- 'INFO', 'OFFER', 'WARNING'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
