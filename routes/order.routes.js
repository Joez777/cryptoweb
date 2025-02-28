const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

// GET /api/orders
router.get('/', orderController.getAllOrders);

// POST /api/orders
router.post('/', orderController.createOrder);

// GET /api/orders/pending
router.get('/pending', orderController.getPendingOrders);

// POST /api/orders/limit
router.post('/limit', orderController.createLimitOrder);

// POST /api/orders/:order_id/accept
router.post('/:order_id/accept', orderController.acceptOrder);

// GET /api/orders/user/:user_id
router.get('/user/:user_id', orderController.getUserOrders);

module.exports = router; 