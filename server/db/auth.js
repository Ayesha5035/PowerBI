// server/db/auth.js
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'Ayesha',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'analytics_studio'
});

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_this';

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Generate JWT token
const generateToken = (userId, email) => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Create new user
const createUser = async (name, email, password = null, googleId = null, avatarUrl = null) => {
  let passwordHash = null;
  if (password) {
    passwordHash = await hashPassword(password);
  }
  
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, google_id, avatar_url, created_at, last_login)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING id, name, email, avatar_url, created_at`,
    [name, email.toLowerCase(), passwordHash, googleId, avatarUrl]
  );
  
  return result.rows[0];
};

// Find user by email
const findUserByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  return result.rows[0];
};

// Find user by Google ID
const findUserByGoogleId = async (googleId) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE google_id = $1',
    [googleId]
  );
  return result.rows[0];
};

// Find user by ID
const findUserById = async (id) => {
  const result = await pool.query(
    'SELECT id, name, email, avatar_url, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

// Update last login
const updateLastLogin = async (userId) => {
  await pool.query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [userId]
  );
};

// Save user workspace data
const saveUserWorkspace = async (userId, workspaceData) => {
  const result = await pool.query(
    `INSERT INTO user_workspaces (user_id, workspace_data, created_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT (user_id) 
     DO UPDATE SET workspace_data = $2, updated_at = NOW()
     RETURNING *`,
    [userId, JSON.stringify(workspaceData)]
  );
  return result.rows[0];
};

// Get user workspace data
const getUserWorkspace = async (userId) => {
  const result = await pool.query(
    'SELECT workspace_data FROM user_workspaces WHERE user_id = $1',
    [userId]
  );
  return result.rows[0]?.workspace_data || null;
};

// Save user item (report, dataset, chart)
const saveUserItem = async (userId, itemType, itemData) => {
  const result = await pool.query(
    `INSERT INTO user_items (user_id, item_type, item_data, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     RETURNING *`,
    [userId, itemType, JSON.stringify(itemData)]
  );
  return result.rows[0];
};

// Get user items by type
const getUserItems = async (userId, itemType = null) => {
  let query = 'SELECT * FROM user_items WHERE user_id = $1';
  let params = [userId];
  
  if (itemType) {
    query += ' AND item_type = $2';
    params.push(itemType);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const result = await pool.query(query, params);
  return result.rows;
};

// Delete user item
const deleteUserItem = async (userId, itemId) => {
  const result = await pool.query(
    'DELETE FROM user_items WHERE id = $1 AND user_id = $2 RETURNING *',
    [itemId, userId]
  );
  return result.rows[0];
};

module.exports = {
  pool,
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  createUser,
  findUserByEmail,
  findUserByGoogleId,
  findUserById,
  updateLastLogin,
  saveUserWorkspace,
  getUserWorkspace,
  saveUserItem,
  getUserItems,
  deleteUserItem,
  JWT_SECRET
};