const express = require("express");
const router = express.Router();
const priceController = require('../controllers/price.controller');

const userRoutes = require("./user.routes");
const walletRoutes = require("./wallet.routes");
const orderRoutes = require("./order.routes");
const transactionRoutes = require("./transaction.routes");

// กำหนดเส้นทางหลัก
router.use("/users", userRoutes);
router.use("/wallets", walletRoutes);
router.use("/orders", orderRoutes);
router.use("/transactions", transactionRoutes);
router.get('/prices', priceController.getPrices);

module.exports = router;
