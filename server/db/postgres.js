// server/db/postgres.js
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'Ayesha',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    database: process.env.DB_NAME || 'analytics_studio',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// Test connection
pool.on('connect', () => {
    console.log('✅ PostgreSQL/TimescaleDB connected');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL error:', err);
});

module.exports = { pool };