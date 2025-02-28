const { Wallet, Transaction } = require('../models');

const walletController = {
  // ฝากเงินเข้า wallet
  async deposit(req, res) {
    try {
      const { wallet_id } = req.params;
      const { amount } = req.body;

      const wallet = await Wallet.findByPk(wallet_id);
      if (!wallet) {
        return res.status(404).json({ error: 'ไม่พบ wallet' });
      }

      // อัพเดทยอดเงิน
      const newBalance = Number(wallet.balance) + Number(amount);
      await wallet.update({ balance: newBalance });

      // บันทึก transaction
      await Transaction.create({
        wallet_id,
        type: 'DEPOSIT',
        amount,
        currency: wallet.currency,
        status: 'SUCCESS'
      });

      res.json({ message: 'เติมเงินสำเร็จ', balance: newBalance });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // ดูประวัติ transaction
  async getTransactions(req, res) {
    try {
      const { wallet_id } = req.params;
      const transactions = await Transaction.findAll({
        where: { wallet_id },
        order: [['created_at', 'DESC']]
      });

      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = walletController; 