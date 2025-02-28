const { User } = require('../models');

const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'ไม่พบผู้ใช้งาน' });
      }

      // ในระบบจริงควรเข้ารหัสและตรวจสอบรหัสผ่าน
      if (user.password !== password) {
        return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = authController; 