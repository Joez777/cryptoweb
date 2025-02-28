const priceController = {
  // จำลองราคา crypto
  async getPrices(req, res) {
    const prices = {
      BTC: Math.random() * 50000 + 30000,
      ETH: Math.random() * 3000 + 2000,
      XRP: Math.random() * 1 + 0.5,
      DOGE: Math.random() * 0.2 + 0.1
    };

    res.json(prices);
  }
};

module.exports = priceController; 