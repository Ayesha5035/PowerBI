// server/routes/user-data.js
const express = require('express');
const router = express.Router();
const { verifyToken, findUserById, saveUserWorkspace, getUserWorkspace, saveUserItem, getUserItems, deleteUserItem } = require('../db/auth');

// Middleware to verify user
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  
  const user = await findUserById(decoded.userId);
  if (!user) {
    return res.status(401).json({ success: false, message: 'User not found' });
  }
  
  req.user = user;
  next();
};

// Get user workspace
router.get('/workspace', authenticate, async (req, res) => {
  try {
    const workspace = await getUserWorkspace(req.user.id);
    res.json({ success: true, data: workspace || { workspaces: [], activeWorkspace: 'My Workspace' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Save user workspace
router.post('/workspace', authenticate, async (req, res) => {
  try {
    const workspace = await saveUserWorkspace(req.user.id, req.body);
    res.json({ success: true, data: workspace });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user items (reports, datasets)
router.get('/items/:type?', authenticate, async (req, res) => {
  try {
    const items = await getUserItems(req.user.id, req.params.type);
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Save user item
router.post('/items', authenticate, async (req, res) => {
  try {
    const { itemType, itemData } = req.body;
    const item = await saveUserItem(req.user.id, itemType, itemData);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user item
router.delete('/items/:itemId', authenticate, async (req, res) => {
  try {
    const item = await deleteUserItem(req.user.id, parseInt(req.params.itemId));
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;