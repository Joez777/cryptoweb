const express = require('express');
const router = express.Router();
const { User } = require('../models');
const userController = require('../controllers/user.controller');
const authController = require('../controllers/auth.controller');

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', authController.login);
router.post('/register', userController.register);
router.get('/:id/profile', userController.getProfile);
router.get('/:user_id/wallets', userController.getWallets);
router.get('/:user_id/orders', userController.getUserOrders);

module.exports = router; 