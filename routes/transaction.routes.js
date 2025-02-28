const express = require('express');
const router = express.Router();
const { Transaction } = require('../models');

// GET /api/transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.findAll();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/transactions
router.post('/', async (req, res) => {
  try {
    const transaction = await Transaction.create(req.body);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 