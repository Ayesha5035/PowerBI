-- Analytics Studio Database Schema

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  google_id VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- User Workspaces
CREATE TABLE IF NOT EXISTS user_workspaces (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  workspace_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Items (reports, datasets)
CREATE TABLE IF NOT EXISTS user_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(50),
  item_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);