const twilio = require('twilio');
const mysql = require('mysql2/promise');
const axios = require('axios');

class WhatsAppBot {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
  }

  async processMessage(from, message) {
    const phone = from.replace('whatsapp:', '');
    
    // Check if user exists
    const [users] = await this.pool.execute(
      `SELECT * FROM whatsapp_users WHERE phone = ?`,
      [phone]
    );

    if (users.length === 0) {
      // New user - start onboarding
      await this.sendWelcomeMessage(phone);
      await this.pool.execute(
        `INSERT INTO whatsapp_users (phone, stage, created_at) VALUES (?, 'welcome', NOW())`,
        [phone]
      );
    } else {
      const user = users[0];
      await this.handleStage(user, phone, message);
    }
  }

  async sendWelcomeMessage(phone) {
    const message = `🎉 Welcome to JEFF DESIGNS HUB!\n\nI'm your virtual assistant. How can I help you today?\n\nPlease choose:\n1️⃣ Logo Design\n2️⃣ Website Development\n3️⃣ Mobile App\n4️⃣ Get Quote\n5️⃣ Talk to Human\n\nReply with the number of your choice.`;
    
    await this.client.messages.create({
      from: 'whatsapp:+14155238886',
      to: phone,
      body: message
    });
  }

  async handleStage(user, phone, message) {
    switch(user.stage) {
      case 'welcome':
        await this.handleServiceSelection(phone, message);
        break;
      case 'service_selected':
        await this.handleDetails(phone, message);
        break;
      case 'awaiting_budget':
        await this.handleBudget(phone, message);
        break;
      default:
        await this.sendDefaultMessage(phone);
    }
  }

  async handleServiceSelection(phone, choice) {
    const services = {
      '1': { name: 'Logo Design', basePrice: 5000 },
      '2': { name: 'Website Development', basePrice: 15000 },
      '3': { name: 'Mobile App', basePrice: 25000 },
      '4': { name: 'Custom Quote', basePrice: null },
      '5': { name: 'Human Support', basePrice: null }
    };

    const service = services[choice];
    
    if (!service) {
      await this.client.messages.create({
        from: 'whatsapp:+14155238886',
        to: phone,
        body: '❌ Invalid choice. Please send 1, 2, 3, 4, or 5.'
      });
      return;
    }

    if (choice === '5') {
      // Connect to human
      await this.client.messages.create({
        from: 'whatsapp:+14155238886',
        to: phone,
        body: `📞 Connecting you to our team...\nOur agent will contact you within 2 minutes.\n\nMeanwhile, you can call us directly:\n+254 702 782 850`
      });

      // Notify admin
      await this.notifyAdmin(phone, 'Requested human support');
      
      return;
    }

    // Update user stage
    await this.pool.execute(
      `UPDATE whatsapp_users SET stage = 'service_selected', service = ? WHERE phone = ?`,
      [service.name, phone]
    );

    // Ask for project details
    await this.client.messages.create({
      from: 'whatsapp:+14155238886',
      to: phone,
      body: `Great choice! 🎯\n\nYou selected: *${service.name}*\n\nPlease describe your project in detail:\n• What's your business about?\n• Any specific requirements?\n• Color preferences?\n• Timeline?\n\n*Reply with your project details.*`
    });
  }

  async handleDetails(phone, details) {
    // Save details
    await this.pool.execute(
      `UPDATE whatsapp_users SET project_details = ?, stage = 'awaiting_budget' WHERE phone = ?`,
      [details, phone]
    );

    // Ask for budget
    await this.client.messages.create({
      from: 'whatsapp:+14155238886',
      to: phone,
      body: `📝 Project details saved!\n\nNow, what's your budget range?\n\nPlease select:\nA) Under KES 10,000\nB) KES 10,000 - 30,000\nC) KES 30,000 - 50,000\nD) KES 50,000+\nE) Not sure\n\n*Reply with A, B, C, D, or E*`
    });
  }

  async handleBudget(phone, budgetChoice) {
    const budgets = {
      'A': 'Under KES 10,000',
      'B': 'KES 10,000 - 30,000',
      'C': 'KES 30,000 - 50,000',
      'D': 'KES 50,000+',
      'E': 'Not sure'
    };

    const budget = budgets[budgetChoice];
    
    // Get user data
    const [users] = await this.pool.execute(
      `SELECT * FROM whatsapp_users WHERE phone = ?`,
      [phone]
    );

    const user = users[0];

    // Create order
    const [orderResult] = await this.pool.execute(
      `INSERT INTO whatsapp_orders 
       (phone, service, project_details, budget_range, status) 
       VALUES (?, ?, ?, ?, 'pending')`,
      [phone, user.service, user.project_details, budget]
    );

    // Calculate price
    let price = null;
    if (user.service === 'Logo Design') price = 5000;
    if (user.service === 'Website Development') price = 15000;
    if (user.service === 'Mobile App') price = 25000;

    // Send confirmation
    await this.client.messages.create({
      from: 'whatsapp:+14155238886',
      to: phone,
      body: `✅ Order Created!\n\n*Order #W${orderResult.insertId.toString().padStart(4, '0')}*\n\nService: ${user.service}\nBudget: ${budget}\n\nEstimated Price: ${price ? `KES ${price.toLocaleString()}` : 'To be quoted'}\n\nWe'll send you a detailed quote within 2 hours.\n\nNeed immediate help? Call: +254 702 782 850`
    });

    // Notify admin
    await this.notifyAdmin(phone, `New WhatsApp order: ${user.service}`);

    // Reset user stage
    await this.pool.execute(
      `UPDATE whatsapp_users SET stage = 'welcome' WHERE phone = ?`,
      [phone]
    );
  }

  async notifyAdmin(phone, message) {
    // Send email
    const emailData = {
      to: 'jeffdesignshub@gmail.com',
      subject: `WhatsApp Order: ${phone}`,
      text: message
    };

    await axios.post(`${process.env.API_URL}/api/notify/email`, emailData);
    
    // Send SMS to admin phone
    await this.client.messages.create({
      from: process.env.TWILIO_PHONE,
      to: process.env.ADMIN_PHONE,
      body: `📱 WhatsApp Order Alert:\n${message}\nFrom: ${phone}`
    });
  }

  async sendQuote(phone, orderId, quoteDetails) {
    const message = `📋 Your Quote is Ready!\n\n*Order #W${orderId}*\n\nService: ${quoteDetails.service}\nPrice: KES ${quoteDetails.price.toLocaleString()}\nDelivery: ${quoteDetails.delivery} days\n\nTo accept:\nReply "ACCEPT ${orderId}"\n\nTo modify:\nReply "MODIFY ${orderId}"\n\nTo decline:\nReply "DECLINE ${orderId}"`;

    await this.client.messages.create({
      from: 'whatsapp:+14155238886',
      to: phone,
      body: message
    });

    // Update order status
    await this.pool.execute(
      `UPDATE whatsapp_orders SET quote_sent = NOW(), quoted_price = ? WHERE id = ?`,
      [quoteDetails.price, orderId]
    );
  }
}

module.exports = WhatsAppBot;