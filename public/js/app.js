let currentUser = null;

// ฟังก์ชันสำหรับล็อกอิน
async function login(email, password) {
  try {
    const response = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (response.ok) {
      currentUser = data;
      document.getElementById("login-section").style.display = "none";
      document.getElementById("trading-section").style.display = "block";
      
      // อัพเดทข้อมูลครั้งแรก
      await Promise.all([
        updateWalletBalances(),
        updateTransactionHistory(),
        startPriceUpdates(),
        updateWalletOptions()
      ]);

      // เริ่มการอัพเดทอัตโนมัติ
      setInterval(async () => {
        if (document.visibilityState === 'visible') {
          await Promise.all([
            updateWalletBalances(),
            updateTransactionHistory(),
            updateOrderBook()
          ]);
        }
      }, 3000);
    } else {
      alert(data.error);
    }
  } catch (error) {
    alert("เกิดข้อผิดพลาด: " + error);
  }
}

// อัพเดทยอดเงินในกระเป๋า
async function updateWalletBalances() {
  try {
    const response = await fetch(`/api/users/${currentUser.id}/wallets`);
    const wallets = await response.json();

    const walletList = document.getElementById("walletList");
    walletList.innerHTML = wallets
      .map(
        (wallet) => `
            <div class="col-md-4 mb-3">
                <div class="card balance-card">
                    <div class="card-body">
                        <h5 class="card-title">
                            <span class="currency-icon">${getCurrencyIcon(
                              wallet.currency
                            )}</span>
                            ${wallet.currency}
                        </h5>
                        <div class="balance-amount" id="balance-${wallet.currency}">${formatNumber(
                          wallet.balance,
                          2
                        )}</div>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error updating wallet balances:", error);
  }
}

// อัพเดทประวัติการซื้อ-ขาย
async function updateTransactionHistory() {
  try {
    const response = await fetch(`/api/users/${currentUser.id}/orders`);
    const orders = await response.json();

    const historyList = document.getElementById("transactionHistory");
    historyList.innerHTML = orders
      .map(
        (order) => `
            <div class="transaction-item p-3 ${getTransactionClass(
              order.type
            )}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="transaction-amount">
                            ${order.type} ${order.crypto}
                            <span class="${
                              order.type === "BUY"
                                ? "text-success"
                                : "text-danger"
                            }">
                                ${formatNumber(order.amount)}
                            </span>
                        </div>
                        <div class="transaction-date">
                            ${new Date(order.created_at).toLocaleString()}
                        </div>
                    </div>
                    <div class="badge ${
                      order.status === "SUCCESS" ? "bg-success" : "bg-warning"
                    }">
                        ${order.status}
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error updating transaction history:", error);
  }
}

// อัพเดทราคา Crypto
function startPriceUpdates() {
  const updatePrices = async () => {
    try {
      const response = await fetch("/api/prices");
      const prices = await response.json();
      Object.entries(prices).forEach(([crypto, price]) => {
        const thbPrice = price * 35; // อัตราแลกเปลี่ยน USD เป็น THB
        document.getElementById(
          `${crypto.toLowerCase()}-price`
        ).innerHTML = `${getCurrencyIcon(crypto)} ${crypto}: $${formatNumber(
          price,
          2
        )} / ฿${formatNumber(thbPrice, 2)}`;
      });
    } catch (error) {
      console.error("Error updating prices:", error);
    }
  };
  updatePrices();
  setInterval(updatePrices, 5000);
}

// เพิ่มฟังก์ชันนี้
async function updateWalletOptions() {
  try {
    const response = await fetch(`/api/users/${currentUser.id}/wallets`);
    const wallets = await response.json();

    const walletSelect = document.querySelector(
      '#depositForm select[name="wallet_id"]'
    );
    walletSelect.innerHTML = wallets
      .filter((w) => w.currency === "THB" || w.currency === "USD")
      .map(
        (wallet) => `
                <option value="${wallet.id}">
                    ${getCurrencyIcon(wallet.currency)} ${wallet.currency} 
                    (${formatNumber(wallet.balance)})
                </option>
            `
      )
      .join("");
  } catch (error) {
    console.error("Error updating wallet options:", error);
  }
}

// Utility functions
function formatNumber(num, decimals = 2) {
  return Number(num).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function getCurrencyIcon(currency) {
  const icons = {
    THB: "฿",
    USD: "$",
    BTC: "₿",
    ETH: "Ξ",
    XRP: "✕",
    DOGE: "Ð",
  };
  return icons[currency] || currency;
}

function getTransactionClass(type) {
  return (
    {
      BUY: "transaction-buy",
      SELL: "transaction-sell",
      DEPOSIT: "transaction-deposit",
    }[type] || ""
  );
}

// อัพเดทฟังก์ชันคำนวณราคา
function calculateTotal() {
  const crypto = document.querySelector(
    '#tradeForm select[name="crypto"]'
  ).value;
  const amount =
    document.querySelector('#tradeForm input[name="amount"]').value || 0;
  const currency = document.querySelector(
    '#tradeForm select[name="currency"]'
  ).value;

  if (!crypto || !amount) {
    document.getElementById("totalPrice").textContent = `ราคารวม: ${
      currency === "THB" ? "฿" : "$"
    }0.00`;
    return;
  }

  // ดึงราคาล่าสุดจาก API
  fetch("/api/prices")
    .then((res) => res.json())
    .then((prices) => {
      const cryptoPrice = prices[crypto] || 0;
      const exchangeRate = currency === "USD" ? 1 : 35; // THB/USD rate
      const total = cryptoPrice * Number(amount) * exchangeRate;

      document.getElementById("totalPrice").textContent = `ราคารวม: ${
        currency === "THB" ? "฿" : "$"
      }${formatNumber(total, 2)}`;
    });
}

// เพิ่มฟังก์ชันอัพเดท Order Book
async function updateOrderBook() {
  try {
    const response = await fetch("/api/orders/pending");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const orders = await response.json();
    
    const buyOrders = document.getElementById("buyOrders");
    const sellOrders = document.getElementById("sellOrders");
    
    if (buyOrders && sellOrders) {
      buyOrders.innerHTML = orders.filter(o => o.type === 'BUY')
        .map(order => `
          <div class="order-item">
            <div class="d-flex justify-content-between">
              <div>
                ${order.User?.name || 'Unknown'} ต้องการซื้อ ${order.crypto}
                <br>
                จำนวน: ${formatNumber(order.amount, 8)}
                <br>
                ราคา: ${order.currency} ${formatNumber(order.price, 2)}
              </div>
              ${currentUser && currentUser.id !== order.user_id ? `
                <button class="btn btn-sm btn-success" 
                        onclick="acceptOrder(${order.id})">
                  ขาย
                </button>
              ` : ''}
            </div>
          </div>
        `).join('') || '<div class="p-3">ไม่มีคำสั่งซื้อ</div>';

      sellOrders.innerHTML = orders.filter(o => o.type === 'SELL')
        .map(order => `
          <div class="order-item">
            <div class="d-flex justify-content-between">
              <div>
                ${order.User?.name || 'Unknown'} ต้องการขาย ${order.crypto}
                <br>
                จำนวน: ${formatNumber(order.amount, 8)}
                <br>
                ราคา: ${order.currency} ${formatNumber(order.price, 2)}
              </div>
              ${currentUser && currentUser.id !== order.user_id ? `
                <button class="btn btn-sm btn-primary" 
                        onclick="acceptOrder(${order.id})">
                  ซื้อ
                </button>
              ` : ''}
            </div>
          </div>
        `).join('') || '<div class="p-3">ไม่มีคำสั่งขาย</div>';
    }
  } catch (error) {
    console.error('Error updating order book:', error);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger';
    errorDiv.textContent = 'ไม่สามารถโหลดข้อมูลคำสั่งซื้อ-ขายได้';
    document.getElementById('buyOrders').innerHTML = errorDiv.outerHTML;
    document.getElementById('sellOrders').innerHTML = errorDiv.outerHTML;
  }
}

// เพิ่มฟังก์ชันยอมรับคำสั่งซื้อขาย
async function acceptOrder(orderId) {
  try {
    const response = await fetch(`/api/orders/${orderId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id
      })
    });
    
    if (response.ok) {
      // อัพเดททันทีหลังจากซื้อขายสำเร็จ
      await Promise.all([
        updateWalletBalances(),
        updateTransactionHistory(),
        updateOrderBook()
      ]);
      
      // รีเฟรชข้อมูลอีกครั้งหลังจาก 1 วินาที
      setTimeout(async () => {
        await Promise.all([
          updateWalletBalances(),
          updateTransactionHistory(),
          updateOrderBook()
        ]);
      }, 1000);

      alert('ดำเนินการสำเร็จ');
    } else {
      const data = await response.json();
      alert(data.error);
    }
  } catch (error) {
    alert('เกิดข้อผิดพลาด: ' + error);
  }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Login Form
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await login(formData.get("email"), formData.get("password"));
  });

  // Register Form
  document
    .getElementById("registerForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      try {
        const response = await fetch("/api/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(formData)),
        });
        const data = await response.json();
        if (response.ok) {
          alert("สมัครสมาชิกสำเร็จ กรุณาล็อกอิน");
          e.target.reset();
        } else {
          alert(data.error);
        }
      } catch (error) {
        alert("เกิดข้อผิดพลาด: " + error);
      }
    });

  // Deposit Form
  document
    .getElementById("depositForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      try {
        const response = await fetch(
          `/api/wallets/${formData.get("wallet_id")}/deposit`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: formData.get("amount") }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          alert("ฝากเงินสำเร็จ");
          updateWalletBalances();
          e.target.reset();
        } else {
          alert(data.error);
        }
      } catch (error) {
        alert("เกิดข้อผิดพลาด: " + error);
      }
    });

  // Trade Form
  document.getElementById("tradeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          ...Object.fromEntries(formData),
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("คำสั่งซื้อ-ขายสำเร็จ");
        updateWalletBalances();
        updateTransactionHistory();
        e.target.reset();
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + error);
    }
  });

  // เพิ่ม Event Listener สำหรับ depositModal
  const depositModal = document.getElementById("depositModal");
  depositModal.addEventListener("show.bs.modal", updateWalletOptions);

  // เพิ่ม Event Listener สำหรับการเปลี่ยนสกุลเงิน
  const tradeForm = document.getElementById("tradeForm");
  tradeForm
    .querySelector('select[name="crypto"]')
    .addEventListener("change", calculateTotal);
  tradeForm
    .querySelector('select[name="currency"]')
    .addEventListener("change", calculateTotal);
  tradeForm
    .querySelector('select[name="type"]')
    .addEventListener("change", calculateTotal);
  tradeForm
    .querySelector('input[name="amount"]')
    .addEventListener("input", calculateTotal);

  // อัพเดท Order Book ทุก 5 วินาที
  updateOrderBook();
  setInterval(updateOrderBook, 5000);

  // Limit Order Form
  document
    .getElementById("limitOrderForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      try {
        const response = await fetch("/api/orders/limit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: currentUser.id,
            ...Object.fromEntries(formData),
            status: "PENDING",
          }),
        });
        const data = await response.json();
        if (response.ok) {
          alert("ตั้งคำสั่งซื้อ-ขายสำเร็จ");
          updateOrderBook();
          e.target.reset();
        } else {
          alert(data.error);
        }
      } catch (error) {
        alert("เกิดข้อผิดพลาด: " + error);
      }
    });

  // ตรวจจับการกลับมาที่แท็บ
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && currentUser) {
      Promise.all([
        updateWalletBalances(),
        updateTransactionHistory(),
        updateOrderBook()
      ]);
    }
  });
});
