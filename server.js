const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

// Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jeff_designs_hub',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// =============== ROUTES ===============

// 1. CONTACT FORM
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, service, message, budget } = req.body;
    
    // Save to database
    const [result] = await pool.execute(
      `INSERT INTO contacts (name, email, phone, service, message, budget, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'new')`,
      [name, email, phone, service, message, budget]
    );
    
    // Send email notification
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: 'jeffdesignshub@gmail.com',
      subject: `New Contact Form: ${name}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Budget:</strong> ${budget}</p>
        <p><strong>Message:</strong> ${message}</p>
        <hr>
        <p>This message was sent from your website contact form.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    // Send auto-response to client
    const clientMail = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Thank you for contacting JEFF DESIGNS HUB',
      html: `
        <h2>Thank You, ${name}!</h2>
        <p>We have received your inquiry and will get back to you within 24 hours.</p>
        <p>For urgent matters, you can reach us on WhatsApp: +254 702 782 850</p>
        <hr>
        <p><strong>JEFF DESIGNS HUB</strong><br>
        Creative Design • Website Development • Mobile App Creation</p>
      `
    };
    
    await transporter.sendMail(clientMail);
    
    res.json({
      success: true,
      message: 'Message sent successfully!',
      data: { id: result.insertId }
    });
    
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message' 
    });
  }
});

// 2. PROJECT MANAGEMENT (Portfolio)
app.get('/api/projects', async (req, res) => {
  try {
    const { category, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `SELECT * FROM projects WHERE status = 'published'`;
    let params = [];
    
    if (category && category !== 'all') {
      query += ` AND category = ?`;
      params.push(category);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    const [projects] = await pool.execute(query, params);
    
    // Get total count for pagination
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM projects WHERE status = 'published'`
    );
    
    res.json({
      success: true,
      data: projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
    
  } catch (error) {
    console.error('Projects error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch projects' 
    });
  }
});

// 3. ADMIN AUTHENTICATION
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [users] = await pool.execute(
      `SELECT * FROM users WHERE username = ?`,
      [username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
});

// 4. ADMIN - CREATE PROJECT (protected)
app.post('/api/admin/projects', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }
    
    const { title, description, category, client, technologies } = req.body;
    const images = req.files ? req.files.map(f => f.filename) : [];
    
    const [result] = await pool.execute(
      `INSERT INTO projects (title, description, category, client, technologies, images, status, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)`,
      [title, description, category, client, technologies, JSON.stringify(images), req.user.id]
    );
    
    res.json({
      success: true,
      message: 'Project created successfully',
      data: { id: result.insertId }
    });
    
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create project' 
    });
  }
});

// 5. SUBSCRIBE TO NEWSLETTER
app.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if already subscribed
    const [existing] = await pool.execute(
      `SELECT * FROM subscribers WHERE email = ?`,
      [email]
    );
    
    if (existing.length > 0) {
      return res.json({ 
        success: true, 
        message: 'Already subscribed' 
      });
    }
    
    // Insert new subscriber
    await pool.execute(
      `INSERT INTO subscribers (email, status) VALUES (?, 'active')`,
      [email]
    );
    
    // Send welcome email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Welcome to JEFF DESIGNS HUB Newsletter',
      html: `
        <h2>Welcome to Our Creative Community! 🎨</h2>
        <p>Thank you for subscribing to JEFF DESIGNS HUB updates.</p>
        <p>You'll receive:</p>
        <ul>
          <li>Weekly design tips</li>
          <li>Exclusive offers</li>
          <li>Latest portfolio updates</li>
          <li>Free resources</li>
        </ul>
        <hr>
        <p>Need a project? <a href="https://jeffdesignshub.com/contact">Contact us now!</a></p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({ 
      success: true, 
      message: 'Subscribed successfully!' 
    });
    
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Subscription failed' 
    });
  }
});

// 6. GET QUOTE REQUEST
app.post('/api/quote', async (req, res) => {
  try {
    const { name, email, service, budget, deadline, details } = req.body;
    
    // Save to database
    const [result] = await pool.execute(
      `INSERT INTO quotes (name, email, service, budget, deadline, details, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [name, email, service, budget, deadline, details]
    );
    
    // Send email to admin
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: 'jeffdesignshub@gmail.com',
      subject: `New Quote Request: ${service}`,
      html: `
        <h3>New Quote Request</h3>
        <p><strong>Client:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Budget:</strong> ${budget}</p>
        <p><strong>Deadline:</strong> ${deadline}</p>
        <p><strong>Details:</strong></p>
        <p>${details}</p>
        <hr>
        <p><a href="${process.env.ADMIN_URL}/quotes/${result.insertId}">View in Dashboard</a></p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'Quote request received! We\'ll contact you within 2 hours.',
      data: { id: result.insertId }
    });
    
  } catch (error) {
    console.error('Quote request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit quote request' 
    });
  }
});

// 7. ANALYTICS TRACKING
app.post('/api/analytics/event', async (req, res) => {
  try {
    const { event, page, userAgent, referrer } = req.body;
    const ip = req.ip;
    
    await pool.execute(
      `INSERT INTO analytics (event, page, ip_address, user_agent, referrer) 
       VALUES (?, ?, ?, ?, ?)`,
      [event, page, ip, userAgent, referrer]
    );
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false });
  }
});

// 8. GET SITE STATISTICS (Admin only)
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }
    
    // Get various statistics
    const [messagesCount] = await pool.execute(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new,
              SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied
       FROM contacts`
    );
    
    const [projectsCount] = await pool.execute(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
              SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft
       FROM projects`
    );
    
    const [quotesCount] = await pool.execute(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
              SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted
       FROM quotes`
    );
    
    const [recentMessages] = await pool.execute(
      `SELECT * FROM contacts ORDER BY created_at DESC LIMIT 5`
    );
    
    res.json({
      success: true,
      data: {
        messages: messagesCount[0],
        projects: projectsCount[0],
        quotes: quotesCount[0],
        recentMessages
      }
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch statistics' 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}`);
  console.log(`📧 Email: ${process.env.SMTP_USER ? 'Configured' : 'Not configured'}`);
});