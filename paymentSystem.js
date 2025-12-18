const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');

class PaymentSystem {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async createInvoice(projectId, items, clientId) {
    try {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const tax = subtotal * 0.16; // 16% VAT for Kenya
      const total = subtotal + tax;

      // Create invoice in database
      const [result] = await this.pool.execute(
        `INSERT INTO invoices 
         (invoice_number, project_id, client_id, subtotal, tax, total, currency, status, due_date, items) 
         VALUES (?, ?, ?, ?, ?, ?, 'KES', 'pending', DATE_ADD(NOW(), INTERVAL 30 DAY), ?)`,
        [
          invoiceNumber,
          projectId,
          clientId,
          subtotal,
          tax,
          total,
          JSON.stringify(items)
        ]
      );

      const invoiceId = result.insertId;

      // Generate PDF
      const pdfPath = await this.generateInvoicePDF(invoiceId, invoiceNumber, items, subtotal, tax, total);
      
      // Send invoice email
      await this.sendInvoiceEmail(clientId, invoiceId, invoiceNumber, total, pdfPath);

      // Create payment link
      const paymentLink = await this.createPaymentLink(invoiceId, total, invoiceNumber);

      return {
        success: true,
        invoiceId,
        invoiceNumber,
        total,
        paymentLink,
        pdfUrl: `/invoices/${invoiceNumber}.pdf`
      };

    } catch (error) {
      console.error('Invoice creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateInvoicePDF(invoiceId, invoiceNumber, items, subtotal, tax, total) {
    const doc = new PDFDocument({ margin: 50 });
    const pdfPath = `./invoices/${invoiceNumber}.pdf`;
    
    // Create directory if it doesn't exist
    if (!fs.existsSync('./invoices')) {
      fs.mkdirSync('./invoices', { recursive: true });
    }

    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Header
    doc.fontSize(20).text('JEFF DESIGNS HUB', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text('Creative Design • Website Development • Mobile App Creation', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text('Phone: +254 702 782 850 • Email: jeffdesignshub@gmail.com', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text('Location: Kenya', { align: 'center' });
    
    // Invoice title
    doc.moveDown(2);
    doc.fontSize(24).text(`INVOICE ${invoiceNumber}`, { align: 'right' });
    
    // Line separator
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    
    // Invoice details
    doc.moveDown();
    doc.fontSize(12);
    
    // Client info
    const [client] = await this.pool.execute(
      `SELECT name, email, phone FROM clients WHERE id = (SELECT client_id FROM invoices WHERE id = ?)`,
      [invoiceId]
    );
    
    if (client[0]) {
      doc.text(`Bill To:`, { continued: true });
      doc.text(`\n${client[0].name}\n${client[0].email}\n${client[0].phone || ''}`, { align: 'right' });
    }
    
    doc.moveDown();
    doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Due Date: ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}`);
    
    // Items table
    doc.moveDown(2);
    const tableTop = doc.y;
    
    // Table headers
    doc.text('Description', 50, tableTop);
    doc.text('Quantity', 300, tableTop);
    doc.text('Unit Price', 370, tableTop);
    doc.text('Amount', 450, tableTop);
    
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
    
    // Table rows
    let y = tableTop + 30;
    items.forEach(item => {
      doc.text(item.description, 50, y);
      doc.text(item.quantity.toString(), 300, y);
      doc.text(`KES ${item.unitPrice.toLocaleString()}`, 370, y);
      doc.text(`KES ${(item.quantity * item.unitPrice).toLocaleString()}`, 450, y);
      y += 20;
    });
    
    // Totals
    y += 20;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 20;
    
    doc.text('Subtotal:', 370, y);
    doc.text(`KES ${subtotal.toLocaleString()}`, 450, y);
    y += 20;
    
    doc.text('VAT (16%):', 370, y);
    doc.text(`KES ${tax.toLocaleString()}`, 450, y);
    y += 20;
    
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('Total:', 370, y);
    doc.text(`KES ${total.toLocaleString()}`, 450, y);
    
    // Payment instructions
    doc.moveDown(3);
    doc.fontSize(10).font('Helvetica');
    doc.text('Payment Instructions:', { underline: true });
    doc.text('1. MPESA Paybill: 522522\n   Account: JEFFDESIGNS');
    doc.text('2. Bank Transfer:\n   Bank: Equity Bank\n   Account: 1234567890\n   Name: JEFF DESIGNS HUB');
    doc.text('3. Credit Card: Click the payment link in your email');
    
    // Terms
    doc.moveDown(2);
    doc.text('Terms & Conditions:', { underline: true });
    doc.text('• Payment due within 30 days\n• Late payments subject to 2% monthly interest\n• All prices in Kenyan Shillings (KES)\n• Contact us for payment plans');
    
    // Footer
    doc.moveDown(3);
    doc.fontSize(8).text('Thank you for choosing JEFF DESIGNS HUB!', { align: 'center' });
    
    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(pdfPath));
      writeStream.on('error', reject);
    });
  }

  async sendInvoiceEmail(clientId, invoiceId, invoiceNumber, total, pdfPath) {
    const [client] = await this.pool.execute(
      `SELECT email, name FROM clients WHERE id = ?`,
      [clientId]
    );

    if (!client[0]) return;

    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6C63FF, #36D1DC); padding: 20px; text-align: center; color: white;">
          <h1>💰 Invoice ${invoiceNumber}</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <p>Dear ${client[0].name},</p>
          <p>Your invoice <strong>${invoiceNumber}</strong> for <strong>KES ${total.toLocaleString()}</strong> is ready.</p>
          
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #6C63FF;">
            <h3>Payment Options:</h3>
            <ul>
              <li><strong>MPESA:</strong> Paybill: 522522 • Account: JEFFDESIGNS</li>
              <li><strong>Bank:</strong> Equity Bank • Acc: 1234567890</li>
              <li><strong>Online:</strong> <a href="${process.env.FRONTEND_URL}/pay/${invoiceId}">Pay Now</a></li>
            </ul>
          </div>
          
          <a href="${process.env.FRONTEND_URL}/invoices/${invoiceId}" 
             style="display: inline-block; padding: 12px 24px; background: #6C63FF; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px;">
             View Invoice Online
          </a>
          
          <a href="https://wa.me/254702782850?text=Invoice%20${invoiceNumber}" 
             style="display: inline-block; padding: 12px 24px; background: #25D366; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px;">
             💬 WhatsApp Payment
          </a>
        </div>
        <div style="background: #343a40; color: white; padding: 20px; text-align: center;">
          <p>Need help? Contact us:<br>
          📞 +254 702 782 850<br>
          📧 jeffdesignshub@gmail.com</p>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"JEFF DESIGNS HUB" <${process.env.SMTP_USER}>`,
      to: client[0].email,
      subject: `Invoice ${invoiceNumber} - KES ${total.toLocaleString()}`,
      html: emailTemplate,
      attachments: [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          path: pdfPath,
          contentType: 'application/pdf'
        }
      ]
    });
  }

  async createPaymentLink(invoiceId, amount, invoiceNumber) {
    try {
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price_data: {
              currency: 'kes',
              product_data: {
                name: `Invoice ${invoiceNumber}`,
                description: 'JEFF DESIGNS HUB - Design & Development Services'
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        after_completion: {
          type: 'redirect',
          redirect: {
            url: `${process.env.FRONTEND_URL}/payment/success?invoice=${invoiceId}`
          }
        },
        metadata: {
          invoice_id: invoiceId,
          invoice_number: invoiceNumber
        }
      });

      // Save payment link
      await this.pool.execute(
        `UPDATE invoices SET stripe_payment_link = ? WHERE id = ?`,
        [paymentLink.url, invoiceId]
      );

      return paymentLink.url;

    } catch (error) {
      console.error('Payment link error:', error);
      // Fallback to manual payment instructions
      return `${process.env.FRONTEND_URL}/pay/${invoiceId}`;
    }
  }

  async processMpesaPayment(phone, amount, invoiceId) {
    // This would integrate with Safaricom Daraja API
    // For now, simulate payment
    const transactionId = `MPE${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    await this.pool.execute(
      `UPDATE invoices SET 
       status = 'paid',
       payment_method = 'mpesa',
       transaction_id = ?,
       paid_at = NOW(),
       paid_amount = ?
       WHERE id = ?`,
      [transactionId, amount, invoiceId]
    );

    // Send payment confirmation
    await this.sendPaymentConfirmation(invoiceId);

    return {
      success: true,
      transactionId,
      message: 'Payment processed successfully'
    };
  }

  async sendPaymentConfirmation(invoiceId) {
    const [invoice] = await this.pool.execute(
      `SELECT i.*, c.email, c.name 
       FROM invoices i 
       JOIN clients c ON i.client_id = c.id 
       WHERE i.id = ?`,
      [invoiceId]
    );

    if (!invoice[0]) return;

    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #34D399); padding: 20px; text-align: center; color: white;">
          <h1>✅ Payment Received</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <p>Dear ${invoice[0].name},</p>
          <p>Thank you for your payment of <strong>KES ${invoice[0].total.toLocaleString()}</strong>.</p>
          
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #10B981;">
            <h3>Payment Details:</h3>
            <p><strong>Invoice:</strong> ${invoice[0].invoice_number}</p>
            <p><strong>Amount:</strong> KES ${invoice[0].total.toLocaleString()}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Transaction ID:</strong> ${invoice[0].transaction_id}</p>
          </div>
          
          <p>Your project will now proceed to the next phase. We'll keep you updated on the progress.</p>
          
          <a href="${process.env.FRONTEND_URL}/projects" 
             style="display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
             View Project Status
          </a>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"JEFF DESIGNS HUB" <${process.env.SMTP_USER}>`,
      to: invoice[0].email,
      subject: `Payment Confirmed - Invoice ${invoice[0].invoice_number}`,
      html: emailTemplate
    });
  }

  async getClientInvoices(clientId) {
    const [invoices] = await this.pool.execute(
      `SELECT * FROM invoices 
       WHERE client_id = ? 
       ORDER BY created_at DESC`,
      [clientId]
    );

    return invoices;
  }

  async generateFinancialReport(startDate, endDate) {
    const [results] = await this.pool.execute(
      `SELECT 
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pending' THEN total ELSE 0 END) as total_pending,
        SUM(CASE WHEN status = 'overdue' THEN total ELSE 0 END) as total_overdue,
        AVG(DATEDIFF(paid_at, created_at)) as avg_payment_days
       FROM invoices 
       WHERE created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    const [monthlyData] = await this.pool.execute(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as invoice_count,
        SUM(total) as total_amount,
        SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as paid_amount
       FROM invoices 
       WHERE created_at BETWEEN ? AND ?
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month`,
      [startDate, endDate]
    );

    return {
      summary: results[0],
      monthly: monthlyData
    };
  }
}

module.exports = PaymentSystem;