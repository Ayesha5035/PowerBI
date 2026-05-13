// server/db/redis.js
const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('connect', () => {
    console.log('✅ Redis connected');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis error:', err);
});

redisClient.connect();

// =====================================================
// HELPER FUNCTIONS FOR REAL-TIME DATA
// =====================================================

// Store latest machine status (overwrites previous)
const setMachineCurrentStatus = async (machineId, data) => {
    await redisClient.hSet(`machine:${machineId}`, {
        temperature: data.temperature || 0,
        pressure: data.pressure || 0,
        speed: data.speed || 0,
        bottle_count: data.bottle_count || 0,
        reject_count: data.reject_count || 0,
        efficiency: data.efficiency || 0,
        status: data.status || 'unknown',
        last_update: Date.now()
    });
    // Also store in sorted set for recent history
    await redisClient.zAdd(`machine:${machineId}:history`, {
        score: Date.now(),
        value: JSON.stringify(data)
    });
    // Keep only last 100 readings in history
    await redisClient.zRemRangeByRank(`machine:${machineId}:history`, 0, -101);
};

// Get current machine status (for dashboard)
const getMachineCurrentStatus = async (machineId) => {
    const data = await redisClient.hGetAll(`machine:${machineId}`);
    if (Object.keys(data).length === 0) return null;
    return {
        temperature: parseFloat(data.temperature),
        pressure: parseFloat(data.pressure),
        speed: parseInt(data.speed),
        bottle_count: parseInt(data.bottle_count),
        reject_count: parseInt(data.reject_count),
        efficiency: parseFloat(data.efficiency),
        status: data.status,
        last_update: parseInt(data.last_update)
    };
};

// Get recent history for charts (last N readings)
const getRecentHistory = async (machineId, limit = 50) => {
    const history = await redisClient.zRange(`machine:${machineId}:history`, -limit, -1);
    return history.map(item => JSON.parse(item));
};

// Get all machines current status
const getAllMachineStatuses = async () => {
    const keys = await redisClient.keys('machine:*');
    const machineIds = keys.filter(k => !k.includes(':history')).map(k => k.split(':')[1]);
    const statuses = {};
    for (const id of machineIds) {
        statuses[id] = await getMachineCurrentStatus(id);
    }
    return statuses;
};

// Store alert (for instant notification)
const pushAlert = async (alert) => {
    await redisClient.lPush('alerts:recent', JSON.stringify(alert));
    await redisClient.lTrim('alerts:recent', 0, 49); // Keep last 50 alerts
};

// Get recent alerts
const getRecentAlerts = async (limit = 20) => {
    const alerts = await redisClient.lRange('alerts:recent', 0, limit - 1);
    return alerts.map(a => JSON.parse(a));
};

module.exports = {
    redisClient,
    setMachineCurrentStatus,
    getMachineCurrentStatus,
    getRecentHistory,
    getAllMachineStatuses,
    pushAlert,
    getRecentAlerts
};