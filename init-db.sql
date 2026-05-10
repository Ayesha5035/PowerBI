-- Create the admin user if not exists (matches docker-compose.yml)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'admin') THEN
        CREATE USER admin WITH PASSWORD 'Ayesha';
    END IF;
END
$$;

-- Grant privileges to admin
GRANT CONNECT ON DATABASE analytics_studio TO admin;
GRANT ALL PRIVILEGES ON DATABASE analytics_studio TO admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO admin;

-- init-db.sql
-- =====================================================
-- ENABLE TIMESCALEDB EXTENSION
-- =====================================================
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- =====================================================
-- 1. USERS & AUTHENTICATION TABLES (Regular PostgreSQL)
-- =====================================================

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    role VARCHAR(50) DEFAULT 'viewer',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. MACHINE REGISTRATION (Regular PostgreSQL)
-- =====================================================

CREATE TABLE machines (
    id SERIAL PRIMARY KEY,
    machine_id VARCHAR(50) UNIQUE NOT NULL,
    machine_name VARCHAR(100) NOT NULL,
    machine_type VARCHAR(50),
    location VARCHAR(200),
    status VARCHAR(20) DEFAULT 'offline',
    manufacturer VARCHAR(100),
    installation_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. SENSOR READINGS (TIMESCALEDB HYPERTABLE)
-- =====================================================
-- This is where ALL time-series data goes
-- TimescaleDB automatically partitions by time

CREATE TABLE sensor_readings (
    time TIMESTAMPTZ NOT NULL,
    machine_id VARCHAR(50) NOT NULL,
    temperature FLOAT,
    pressure FLOAT,
    speed INTEGER,
    bottle_count INTEGER,
    reject_count INTEGER,
    efficiency FLOAT,
    vibration FLOAT,
    power_consumption FLOAT,
    -- Metadata for tracking changes
    change_version BIGINT,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Convert to hypertable (automatically partitions by time)
SELECT create_hypertable('sensor_readings', 'time', 
    chunk_time_interval => INTERVAL '1 day',
    migrate_data => TRUE
);

-- Create indexes for fast queries
CREATE INDEX idx_sensor_machine_time ON sensor_readings (machine_id, time DESC);
CREATE INDEX idx_sensor_time ON sensor_readings (time DESC);
CREATE INDEX idx_sensor_version ON sensor_readings (change_version);

-- =====================================================
-- 4. MATERIALIZED VIEWS (for fast reporting)
-- =====================================================

-- Hourly aggregates (automatically refreshed by TimescaleDB)
CREATE MATERIALIZED VIEW hourly_machine_metrics
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS hour,
    machine_id,
    AVG(temperature) as avg_temperature,
    MAX(temperature) as max_temperature,
    MIN(temperature) as min_temperature,
    AVG(pressure) as avg_pressure,
    AVG(speed) as avg_speed,
    SUM(bottle_count) as total_bottles,
    SUM(reject_count) as total_rejects,
    AVG(efficiency) as avg_efficiency,
    COUNT(*) as reading_count
FROM sensor_readings
WHERE is_deleted = FALSE
GROUP BY hour, machine_id;

-- Add refresh policy (refresh every hour)
SELECT add_continuous_aggregate_policy('hourly_machine_metrics',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- Daily aggregates
CREATE MATERIALIZED VIEW daily_machine_metrics AS
SELECT 
    time_bucket('1 day', time) AS day,
    machine_id,
    AVG(temperature) as avg_temperature,
    AVG(pressure) as avg_pressure,
    AVG(efficiency) as avg_efficiency,
    SUM(bottle_count) as total_bottles,
    SUM(reject_count) as total_rejects
FROM sensor_readings
WHERE is_deleted = FALSE
GROUP BY day, machine_id;

-- =====================================================
-- 5. COMPRESSION POLICY (saves 90% storage)
-- =====================================================
-- Compress data older than 7 days
-- SELECT add_compression_policy('sensor_readings', INTERVAL '7 days');

-- =====================================================
-- 6. DATA RETENTION POLICY (optional)
-- =====================================================
-- Drop data older than 1 year (saves disk space)
-- SELECT add_retention_policy('sensor_readings', INTERVAL '365 days');

-- =====================================================
-- 7. IMPORTED FILES & DATA
-- =====================================================

CREATE TABLE imported_files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    original_name VARCHAR(255),
    file_size BIGINT,
    row_count INTEGER,
    column_count INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE imported_data (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES imported_files(id) ON DELETE CASCADE,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. SAVED REPORTS & DASHBOARDS
-- =====================================================

CREATE TABLE saved_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    report_name VARCHAR(200) NOT NULL,
    report_type VARCHAR(50),
    config JSONB,
    filters JSONB,
    chart_config JSONB,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. ALERTS
-- =====================================================

CREATE TABLE alert_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    machine_id VARCHAR(50),
    condition_type VARCHAR(50),
    metric_name VARCHAR(50),
    operator VARCHAR(10),
    threshold_value FLOAT,
    severity VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alert_history (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER REFERENCES alert_rules(id),
    machine_id VARCHAR(50),
    alert_message TEXT,
    severity VARCHAR(20),
    metric_value FLOAT,
    threshold_value FLOAT,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 10. WORKSPACES & FAVORITES
-- =====================================================

CREATE TABLE workspaces (
    id SERIAL PRIMARY KEY,
    workspace_name VARCHAR(100) NOT NULL,
    owner_id INTEGER REFERENCES users(id),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace_members (
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(50),
    item_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_type, item_id)
);

-- =====================================================
-- 11. FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_machines_updated_at 
    BEFORE UPDATE ON machines FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 12. SAMPLE DATA (for testing)
-- =====================================================

INSERT INTO users (username, email, password_hash, full_name, role)
VALUES ('admin', 'admin@analytics.com', 'temporary_hash', 'Administrator', 'admin')
ON CONFLICT (username) DO NOTHING;

INSERT INTO machines (machine_id, machine_name, machine_type, location, status)
VALUES 
    ('PACK-01', 'Bottle Packager 1', 'Packaging', 'Line A', 'running'),
    ('PACK-02', 'Bottle Packager 2', 'Packaging', 'Line A', 'idle')
ON CONFLICT (machine_id) DO NOTHING;

-- Generate sample sensor readings for last 7 days
INSERT INTO sensor_readings (time, machine_id, temperature, pressure, speed, bottle_count, reject_count, efficiency)
SELECT 
    generate_series(now() - interval '7 days', now(), interval '5 minutes') as time,
    'PACK-01',
    70 + (random() * 15) as temperature,
    4 + (random() * 1) as pressure,
    100 + (random() * 50) as speed,
    1000 + (random() * 500)::int as bottle_count,
    (random() * 30)::int as reject_count,
    85 + (random() * 15) as efficiency;