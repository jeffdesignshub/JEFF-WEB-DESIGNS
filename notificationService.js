const WebPush = require('web-push');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

class NotificationService {
  constructor() {
    // Initialize web push
    WebPush.setVapidDetails(
      'mailto:jeffdesignshub@gmail.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    // Database connection
    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // SMS client
    this.twilioClient = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_TOKEN
    );
  }

  async sendNotification(userId, type, data) {
    const notification = await this.createNotification(userId, type, data);
    
    // Send via all available channels
    const promises = [
      this.sendPushNotification(userId, notification),
      this.sendEmailNotification(userId, notification),
      this.sendSMSNotification(userId, notification),
      this.sendWhatsAppNotification(userId, notification)
    ];

    await Promise.allSettled(promises);
    
    return notification;
  }

  async createNotification(userId, type, data) {
    const [result] = await this.pool.execute(
      `INSERT INTO notifications 
       (user_id, type, title, message, data, status) 
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [
        userId,
        type,
        data.title,
        data.message,
        JSON.stringify(data.data || {}),
        data.title
      ]
    );

    return {
      id: result.insertId,
      userId,
      type,
      ...data
    };
  }

  async sendPushNotification(userId, notification) {
    try {
      // Get user's subscription
      const [subscriptions] = await this.pool.execute(
        `SELECT subscription FROM push_subscriptions WHERE user_id = ?`,
        [userId]
      );

      if (subscriptions.length === 0) return;

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.message,
        icon: '/logo.png',
        badge: '/badge.png',
        data: {
          url: this.getNotificationUrl(notification),
          notificationId: notification.id
        }
      });

      // Send to all subscriptions
      for (const sub of subscriptions) {
        await WebPush.sendNotification(
          JSON.parse(sub.subscription),
          payload
        );
      }

      await this.markNotificationSent(notification.id, 'push');
      
    } catch (error) {
      console.error('Push notification error:', error);
    }
  }

  async sendEmailNotification(userId, notification) {
    try {
      // Get user email
      const [users] = await this.pool.execute(
        `SELECT email, name FROM users WHERE id = ?`,
        [userId]
      );

      if (users.length === 0) return;

      const user = users[0];
      const emailTemplate = this.getEmailTemplate(notification.type, notification);

      await this.transporter.sendMail({
        from: `"JEFF DESIGNS HUB" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: notification.title,
        html: emailTemplate,
        text: notification.message
      });

      await this.markNotificationSent(notification.id, 'email');
      
    } catch (error) {
      console.error('Email notification error:', error);
    }
  }

  async sendSMSNotification(userId, notification) {
    try {
      // Get user phone
      const [users] = await this.pool.execute(
        `SELECT phone FROM users WHERE id = ? AND phone IS NOT NULL`,
        [userId]
      );

      if (users.length === 0) return;

      const user = users[0];
      
      await this.twilioClient.messages.create({
        body: `JEFF DESIGNS: ${notification.message}`,
        from: process.env.TWILIO_PHONE,
        to: user.phone
      });

      await this.markNotificationSent(notification.id, 'sms');
      
    } catch (error) {
      console.error('SMS notification error:', error);
    }
  }

  async sendWhatsAppNotification(userId, notification) {
    try {
      // Check if user has WhatsApp enabled
      const [users] = await this.pool.execute(
        `SELECT phone FROM users WHERE id = ? AND whatsapp_optin = true`,
        [userId]
      );

      if (users.length === 0) return;

      const user = users[0];
      const whatsappMessage = this.getWhatsAppTemplate(notification.type, notification);

      await this.twilioClient.messages.create({
        body: whatsappMessage,
        from: 'whatsapp:+14155238886',
        to: `whatsapp:${user.phone}`
      });

      await this.markNotificationSent(notification.id, 'whatsapp');
      
    } catch (error) {
      console.error('WhatsApp notification error:', error);
    }
  }

  getEmailTemplate(type, notification) {
    const templates = {
      'project_update': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6C63FF, #36D1DC); padding: 20px; text-align: center; color: white;">
            <h1>🎨 JEFF DESIGNS HUB</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            ${notification.data.project_id ? `
              <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 10px; border-left: 4px solid #6C63FF;">
                <strong>Project Update:</strong><br>
                <a href="${process.env.FRONTEND_URL}/projects/${notification.data.project_id}" 
                   style="display: inline-block; padding: 10px 20px; background: #6C63FF; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
                   View Project Progress
                </a>
              </div>
            ` : ''}
            ${notification.data.deadline ? `
              <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 10px; border-left: 4px solid #ffc107;">
                <strong>⏰ Deadline Reminder:</strong><br>
                ${notification.data.deadline}
              </div>
            ` : ''}
          </div>
          <div style="background: #343a40; color: white; padding: 20px; text-align: center;">
            <p>Need help? Contact us:<br>
            📞 +254 702 782 850<br>
            📧 jeffdesignshub@gmail.com</p>
          </div>
        </div>
      `,
      'new_message': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6C63FF, #36D1DC); padding: 20px; text-align: center; color: white;">
            <h1>💬 New Message</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <p>You have a new message from our team:</p>
            <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <strong>${notification.data.sender}:</strong><br>
              ${notification.message}
            </div>
            <a href="${process.env.FRONTEND_URL}/messages" 
               style="display: inline-block; padding: 10px 20px; background: #6C63FF; color: white; text-decoration: none; border-radius: 5px;">
               View Conversation
            </a>
          </div>
        </div>
      `,
      'payment_reminder': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #28a745, #20c997); padding: 20px; text-align: center; color: white;">
            <h1>💰 Payment Reminder</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <h3>Payment Due: ${notification.data.amount}</h3>
            <p>${notification.message}</p>
            ${notification.data.invoice_url ? `
              <a href="${notification.data.invoice_url}" 
                 style="display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px;">
                 View Invoice
              </a>
            ` : ''}
            <a href="${process.env.FRONTEND_URL}/payments" 
               style="display: inline-block; padding: 10px 20px; background: #6C63FF; color: white; text-decoration: none; border-radius: 5px;">
               Make Payment
            </a>
          </div>
        </div>
      `
    };

    return templates[type] || templates['project_update'];
  }

  getWhatsAppTemplate(type, notification) {
    const templates = {
      'project_update': `🎨 *JEFF DESIGNS HUB Update*\n\n${notification.title}\n\n${notification.message}\n\nView: ${this.getNotificationUrl(notification)}\n\nNeed help? Call: +254 702 782 850`,
      'new_message': `💬 *New Message*\n\n${notification.data.sender}:\n${notification.message}\n\nReply: ${process.env.FRONTEND_URL}/messages`,
      'payment_reminder': `💰 *Payment Due: ${notification.data.amount}*\n\n${notification.message}\n\nPay: ${process.env.FRONTEND_URL}/payments\n\nCall for help: +254 702 782 850`
    };

    return templates[type] || notification.message;
  }

  getNotificationUrl(notification) {
    const urls = {
      'project_update': `${process.env.FRONTEND_URL}/projects/${notification.data.project_id}`,
      'new_message': `${process.env.FRONTEND_URL}/messages`,
      'payment_reminder': `${process.env.FRONTEND_URL}/payments`,
      'new_blog': `${process.env.FRONTEND_URL}/blog/${notification.data.post_slug}`
    };

    return urls[notification.type] || process.env.FRONTEND_URL;
  }

  async markNotificationSent(notificationId, channel) {
    await this.pool.execute(
      `UPDATE notifications SET status = 'sent', sent_via = CONCAT(IFNULL(sent_via, ''), ?), sent_at = NOW() WHERE id = ?`,
      [`,${channel}`, notificationId]
    );
  }

  async subscribeToPush(userId, subscription) {
    await this.pool.execute(
      `INSERT INTO push_subscriptions (user_id, subscription) VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE subscription = ?`,
      [userId, JSON.stringify(subscription), JSON.stringify(subscription)]
    );
  }

  async getUserNotifications(userId, limit = 20) {
    const [notifications] = await this.pool.execute(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, limit]
    );

    // Mark as read
    await this.pool.execute(
      `UPDATE notifications SET is_read = true 
       WHERE user_id = ? AND is_read = false`,
      [userId]
    );

    return notifications;
  }
}

module.exports = NotificationService;