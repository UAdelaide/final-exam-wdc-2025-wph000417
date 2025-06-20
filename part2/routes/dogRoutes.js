const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all dogs with their owner's username
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.dog_id, d.name AS dog_name, d.size, u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    res.status(500).json({ error: '获取狗狗列表失败' });
  }
});

// GET a specific dog by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.dog_id, d.name AS dog_name, d.size, u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
      WHERE d.dog_id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Dog not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching dog:', error);
    res.status(500).json({ error: '获取狗狗信息失败' });
  }
});

module.exports = router; 