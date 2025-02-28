const { User, Wallet, Order } = require('../models');

const userController = {
  // สร้าง User และ Wallet เริ่มต้น
  async register(req, res) {
    try {
      const { name, email, password } = req.body;
      
      const user = await User.create({
        name,
        email,
        password // ในระบบจริงควรเข้ารหัสก่อนบันทึก
      });

      // สร้าง wallet เริ่มต้นให้ user
      await Wallet.create({
        user_id: user.id,
        currency: 'THB',
        balance: 0
      });

      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // ดึงข้อมูล User พร้อม Wallets
  async getProfile(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        include: ['wallets']
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // ดึงข้อมูล Wallets ของ User
  async getWallets(req, res) {
    try {
      const { user_id } = req.params;
      const wallets = await Wallet.findAll({
        where: { user_id },
        order: [['currency', 'ASC']]
      });
      res.json(wallets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // ดึงประวัติการซื้อ-ขายของ User
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
  }
};

module.exports = userController; 