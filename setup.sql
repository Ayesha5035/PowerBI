CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    role VARCHAR(50) DEFAULT 'viewer',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS machines (
    id SERIAL PRIMARY KEY,
    machine_id VARCHAR(50) UNIQUE NOT NULL,
    machine_name VARCHAR(100) NOT NULL,
    machine_type VARCHAR(50),
    location VARCHAR(200),
    status VARCHAR(20) DEFAULT 'offline',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sensor_readings (
    time TIMESTAMPTZ NOT NULL,
    machine_id VARCHAR(50) NOT NULL,
    temperature FLOAT,
    pressure FLOAT,
    speed INTEGER,
    bottle_count INTEGER,
    reject_count INTEGER,
    efficiency FLOAT
);

SELECT create_hypertable('sensor_readings', 'time', if_not_exists => TRUE);

INSERT INTO machines (machine_id, machine_name, machine_type, location, status)
VALUES 
    ('PACK-01', 'Bottle Packager 1', 'Packaging', 'Line A', 'running'),
    ('PACK-02', 'Bottle Packager 2', 'Packaging', 'Line A', 'idle')
ON CONFLICT (machine_id) DO NOTHING;
