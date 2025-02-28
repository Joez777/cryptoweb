const express = require('express');
const router = express.Router();
const { Wallet } = require('../models');
const walletController = require('../controllers/wallet.controller');

// GET /api/wallets
router.get('/', async (req, res) => {
  try {
    const wallets = await Wallet.findAll();
    res.json(wallets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/wallets
router.post('/', async (req, res) => {
  try {
    const wallet = await Wallet.create(req.body);
    res.status(201).json(wallet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:wallet_id/deposit', walletController.deposit);
router.get('/:wallet_id/transactions', walletController.getTransactions);

module.exports = router; 