const { User, Wallet, Transaction, Order } = require("../models");
const sequelize = require("../config/database");

async function seedData() {
  try {
    await sequelize.sync({ force: true }); // รีเซ็ตฐานข้อมูล

    // สร้างผู้ใช้ทดสอบ
    const users = await User.bulkCreate([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123456'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: '123456'
      }
    ]);

    // สร้าง wallets
    const currencies = ['THB', 'USD', 'BTC', 'ETH', 'XRP', 'DOGE'];
    const wallets = [];
    for (const user of users) {
      for (const currency of currencies) {
        const wallet = await Wallet.create({
          user_id: user.id,
          currency,
          balance: currency === 'THB' ? 100000 : 
                   currency === 'USD' ? 3000 : 0
        });
        wallets.push(wallet);
      }
    }

    // สร้างคำสั่งซื้อขายตัวอย่าง
    const orderData = [
      {
        user_id: users[0].id,
        crypto: 'BTC',
        type: 'BUY',
        amount: 0.1,
        price: 50000,
        currency: 'THB',
        status: 'SUCCESS'
      },
      {
        user_id: users[0].id,
        crypto: 'ETH',
        type: 'BUY',
        amount: 1,
        price: 3000,
        currency: 'THB',
        status: 'SUCCESS'
      },
      {
        user_id: users[1].id,
        crypto: 'BTC',
        type: 'SELL',
        amount: 0.05,
        price: 49000,
        currency: 'THB',
        status: 'PENDING'
      }
    ];

    // สร้าง transactions และอัพเดท wallets
    for (const data of orderData) {
      // สร้าง order
      await Order.create(data);

      // หา wallet ที่เกี่ยวข้อง
      const wallet = wallets.find(w => 
        w.user_id === data.user_id && 
        w.currency === data.crypto
      );

      if (wallet) {
        // สร้าง transaction
        await Transaction.create({
          wallet_id: wallet.id,
          type: data.type,
          amount: data.amount,
          currency: data.crypto,
          status: 'SUCCESS'
        });

        // อัพเดทยอด wallet
        const newBalance = Number(wallet.balance) + Number(data.amount);
        await wallet.update({ balance: newBalance });
      }
    }

    console.log('Seed data created successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error; // เพิ่มการ throw error เพื่อดู stack trace ที่สมบูรณ์
  }
}

// รัน seed
seedData();

module.exports = seedData;
