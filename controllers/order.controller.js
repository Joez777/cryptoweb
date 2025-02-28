const { Order, Wallet, Transaction, User } = require('../models');

const orderController = {
  async createOrder(req, res) {
    try {
      const { user_id, crypto, type, amount, price, currency } = req.body;

      // ตรวจสอบ wallet
      const cryptoWallet = await Wallet.findOne({ 
        where: { user_id, currency: crypto }
      });

      const thbWallet = await Wallet.findOne({
        where: { user_id, currency: 'THB' }
      });

      if (!thbWallet) {
        return res.status(400).json({ error: 'ไม่พบกระเป๋าเงินบาท' });
      }

      // คำนวณราคารวม
      const cryptoPrices = {
        BTC: 50000,
        ETH: 3000,
        XRP: 1,
        DOGE: 0.1
      };
      
      const pricePerUnit = price || cryptoPrices[crypto] || 0;
      const totalPrice = pricePerUnit * amount;

      if (type === 'BUY') {
        // ตรวจสอบเงินบาท
        if (thbWallet.balance < totalPrice) {
          return res.status(400).json({ error: 'ยอดเงินบาทไม่เพียงพอ' });
        }

        // หักเงินบาท
        await thbWallet.update({
          balance: Number(thbWallet.balance) - totalPrice
        });

        // เพิ่ม crypto
        if (!cryptoWallet) {
          await Wallet.create({
            user_id,
            currency: crypto,
            balance: amount
          });
        } else {
          await cryptoWallet.update({
            balance: Number(cryptoWallet.balance) + Number(amount)
          });
        }
      } else { // SELL
        if (!cryptoWallet || cryptoWallet.balance < amount) {
          return res.status(400).json({ error: 'ยอด Crypto ไม่เพียงพอ' });
        }

        // หัก crypto
        await cryptoWallet.update({
          balance: Number(cryptoWallet.balance) - Number(amount)
        });

        // เพิ่มเงินบาท
        await thbWallet.update({
          balance: Number(thbWallet.balance) + totalPrice
        });
      }

      // บันทึกคำสั่งซื้อ-ขาย
      const order = await Order.create({
        user_id,
        crypto,
        type,
        amount,
        price: pricePerUnit,
        currency: currency || 'THB',
        status: 'SUCCESS'
      });

      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getUserOrders(req, res) {
    try {
      const { user_id } = req.params;
      const orders = await Order.findAll({
        where: { user_id },
        order: [['created_at', 'DESC']]
      });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getPendingOrders(req, res) {
    try {
      const orders = await Order.findAll({
        where: { status: 'PENDING' },
        include: [{
          model: User,
          attributes: ['name']
        }],
        order: [['created_at', 'DESC']]
      });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async acceptOrder(req, res) {
    try {
      const { order_id } = req.params;
      const { user_id: acceptor_id } = req.body;

      const order = await Order.findByPk(order_id);
      if (!order || order.status !== 'PENDING') {
        return res.status(400).json({ error: 'คำสั่งซื้อขายไม่ถูกต้อง' });
      }

      // ดึงข้อมูล wallet ของทั้งสองฝ่าย
      const creator_id = order.user_id;
      const totalPrice = order.price * order.amount;

      if (order.type === 'BUY') {
        // ผู้สร้างคำสั่งเป็นผู้ซื้อ, ผู้ยอมรับคำสั่งเป็นผู้ขาย
        // ตรวจสอบ crypto ของผู้ขาย
        const sellerCryptoWallet = await Wallet.findOne({
          where: { user_id: acceptor_id, currency: order.crypto }
        });

        if (!sellerCryptoWallet || sellerCryptoWallet.balance < order.amount) {
          return res.status(400).json({ error: 'ผู้ขายมี Crypto ไม่เพียงพอ' });
        }

        // ตรวจสอบเงินของผู้ซื้อ
        const buyerFiatWallet = await Wallet.findOne({
          where: { user_id: creator_id, currency: order.currency }
        });

        if (!buyerFiatWallet || buyerFiatWallet.balance < totalPrice) {
          return res.status(400).json({ error: 'ผู้ซื้อมีเงินไม่เพียงพอ' });
        }

        // อัพเดท wallet ผู้ซื้อ
        await buyerFiatWallet.update({
          balance: Number(buyerFiatWallet.balance) - totalPrice
        });

        let buyerCryptoWallet = await Wallet.findOne({
          where: { user_id: creator_id, currency: order.crypto }
        });

        if (!buyerCryptoWallet) {
          buyerCryptoWallet = await Wallet.create({
            user_id: creator_id,
            currency: order.crypto,
            balance: 0
          });
        }

        await buyerCryptoWallet.update({
          balance: Number(buyerCryptoWallet.balance) + Number(order.amount)
        });

        // อัพเดท wallet ผู้ขาย
        await sellerCryptoWallet.update({
          balance: Number(sellerCryptoWallet.balance) - Number(order.amount)
        });

        let sellerFiatWallet = await Wallet.findOne({
          where: { user_id: acceptor_id, currency: order.currency }
        });

        if (!sellerFiatWallet) {
          sellerFiatWallet = await Wallet.create({
            user_id: acceptor_id,
            currency: order.currency,
            balance: 0
          });
        }

        await sellerFiatWallet.update({
          balance: Number(sellerFiatWallet.balance) + totalPrice
        });

        // สร้าง transactions
        await Transaction.create({
          wallet_id: buyerCryptoWallet.id,
          type: 'BUY',
          amount: order.amount,
          currency: order.crypto,
          status: 'SUCCESS'
        });

        await Transaction.create({
          wallet_id: sellerCryptoWallet.id,
          type: 'SELL',
          amount: order.amount,
          currency: order.crypto,
          status: 'SUCCESS'
        });

      } else {
        // ผู้สร้างคำสั่งเป็นผู้ขาย, ผู้ยอมรับคำสั่งเป็นผู้ซื้อ
        // ตรวจสอบเงินของผู้ซื้อ
        const buyerFiatWallet = await Wallet.findOne({
          where: { user_id: acceptor_id, currency: order.currency }
        });

        if (!buyerFiatWallet || buyerFiatWallet.balance < totalPrice) {
          return res.status(400).json({ error: 'ผู้ซื้อมีเงินไม่เพียงพอ' });
        }

        // ตรวจสอบ crypto ของผู้ขาย
        const sellerCryptoWallet = await Wallet.findOne({
          where: { user_id: creator_id, currency: order.crypto }
        });

        if (!sellerCryptoWallet || sellerCryptoWallet.balance < order.amount) {
          return res.status(400).json({ error: 'ผู้ขายมี Crypto ไม่เพียงพอ' });
        }

        // อัพเดท wallet ผู้ซื้อ
        await buyerFiatWallet.update({
          balance: Number(buyerFiatWallet.balance) - totalPrice
        });

        let buyerCryptoWallet = await Wallet.findOne({
          where: { user_id: acceptor_id, currency: order.crypto }
        });

        if (!buyerCryptoWallet) {
          buyerCryptoWallet = await Wallet.create({
            user_id: acceptor_id,
            currency: order.crypto,
            balance: 0
          });
        }

        await buyerCryptoWallet.update({
          balance: Number(buyerCryptoWallet.balance) + Number(order.amount)
        });

        // อัพเดท wallet ผู้ขาย
        await sellerCryptoWallet.update({
          balance: Number(sellerCryptoWallet.balance) - Number(order.amount)
        });

        let sellerFiatWallet = await Wallet.findOne({
          where: { user_id: creator_id, currency: order.currency }
        });

        if (!sellerFiatWallet) {
          sellerFiatWallet = await Wallet.create({
            user_id: creator_id,
            currency: order.currency,
            balance: 0
          });
        }

        await sellerFiatWallet.update({
          balance: Number(sellerFiatWallet.balance) + totalPrice
        });

        // สร้าง transactions
        await Transaction.create({
          wallet_id: buyerCryptoWallet.id,
          type: 'BUY',
          amount: order.amount,
          currency: order.crypto,
          status: 'SUCCESS'
        });

        await Transaction.create({
          wallet_id: sellerCryptoWallet.id,
          type: 'SELL',
          amount: order.amount,
          currency: order.crypto,
          status: 'SUCCESS'
        });
      }

      // อัพเดทสถานะคำสั่งซื้อขาย
      await order.update({ status: 'SUCCESS' });
      
      res.json({ message: 'ดำเนินการสำเร็จ' });
    } catch (error) {
      console.error('Error in acceptOrder:', error);
      res.status(400).json({ error: error.message });
    }
  },

  async createLimitOrder(req, res) {
    try {
      const { user_id, crypto, type, amount, price, currency } = req.body;

      // สร้างคำสั่งซื้อขายแบบตั้งราคา
      const order = await Order.create({
        user_id,
        crypto,
        type,
        amount,
        price,
        currency,
        status: 'PENDING'
      });

      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAllOrders(req, res) {
    try {
      const orders = await Order.findAll({
        include: [{
          model: User,
          attributes: ['name']
        }],
        order: [['created_at', 'DESC']]
      });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = orderController; 