-- JEFF DESIGNS HUB DATABASE SCHEMA

-- Create database
CREATE DATABASE IF NOT EXISTS jeff_designs_hub;
USE jeff_designs_hub;

-- Admin Users
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('admin', 'editor') DEFAULT 'editor',
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Services Catalog
CREATE TABLE services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    full_description LONGTEXT,
    features JSON,
    starting_price DECIMAL(10, 2),
    category ENUM('design', 'development', 'marketing', 'print'),
    display_order INT DEFAULT 0,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_popular (is_popular)
);

-- Portfolio Projects
CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    full_description LONGTEXT,
    category VARCHAR(100),
    client_name VARCHAR(200),
    client_logo VARCHAR(500),
    project_date DATE,
    technologies JSON,
    featured_image VARCHAR(500),
    gallery_images JSON,
    live_url VARCHAR(500),
    github_url VARCHAR(500),
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_created (created_at)
);

-- Contact Messages
CREATE TABLE contacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    phone VARCHAR(50),
    service VARCHAR(100),
    message TEXT NOT NULL,
    budget VARCHAR(100),
    status ENUM('new', 'read', 'replied', 'archived') DEFAULT 'new',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    replied_at TIMESTAMP NULL,
    replied_by INT NULL,
    FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_created (created_at)
);

-- Quote Requests
CREATE TABLE quotes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    phone VARCHAR(50),
    service VARCHAR(100),
    budget VARCHAR(100),
    deadline VARCHAR(100),
    details TEXT,
    status ENUM('pending', 'reviewed', 'accepted', 'rejected') DEFAULT 'pending',
    estimated_price DECIMAL(10, 2),
    admin_notes TEXT,
    assigned_to INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status)
);

-- Testimonials
CREATE TABLE testimonials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_name VARCHAR(200) NOT NULL,
    company VARCHAR(200),
    position VARCHAR(200),
    avatar_url VARCHAR(500),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    testimonial TEXT NOT NULL,
    project_id INT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    INDEX idx_featured (is_featured),
    INDEX idx_approved (is_approved)
);

-- Subscribers (Newsletter)
CREATE TABLE subscribers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(200) UNIQUE NOT NULL,
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP NULL,
    last_sent TIMESTAMP NULL
);

-- Analytics Events
CREATE TABLE analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event VARCHAR(100) NOT NULL,
    page VARCHAR(500),
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer VARCHAR(500),
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event (event),
    INDEX idx_created (created_at)
);

-- Orders (Simple e-commerce for service packages)
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_email VARCHAR(200) NOT NULL,
    customer_phone VARCHAR(50),
    service_id INT,
    package_type ENUM('basic', 'standard', 'premium'),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KES',
    status ENUM('pending', 'paid', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(200),
    requirements TEXT,
    deadline DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_order_number (order_number)
);

-- Blog Posts (For future expansion)
CREATE TABLE blog_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    excerpt TEXT,
    content LONGTEXT,
    featured_image VARCHAR(500),
    author_id INT,
    category VARCHAR(100),
    tags JSON,
    views INT DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_published (is_published),
    INDEX idx_category (category)
);

-- Insert Default Admin User (password: Admin@2024)
INSERT INTO users (username, email, password_hash, full_name, role) 
VALUES (
    'admin',
    'admin@jeffdesignshub.com',
    '$2b$10$9J3m8qPZwHkQ7L7r6Y5ZVuG5VW5Q2Q9J3m8qPZwHkQ7L7r6Y5ZVuG5VW5Q2Q',
    'Jeff Admin',
    'admin'
);

-- Insert Sample Services
INSERT INTO services (title, slug, description, features, starting_price, category, is_popular) VALUES
('Logo Design', 'logo-design', 'Professional logos that make your brand memorable', '["Modern Design", "Multiple Revisions", "Brand Guidelines", "All File Formats"]', 5000.00, 'design', TRUE),
('Website Development', 'website-development', 'Modern, fast-loading websites that convert visitors', '["Responsive Design", "SEO Optimized", "CMS Integration", "1 Year Support"]', 15000.00, 'development', TRUE),
('Mobile App Creation', 'mobile-app-creation', 'User-friendly mobile apps for Android and iOS', '["Native Apps", "UI/UX Design", "App Store Deployment", "Maintenance"]', 25000.00, 'development', FALSE),
('Social Media Graphics', 'social-media-graphics', 'Eye-catching graphics for all social platforms', '["Multiple Designs", "Platform Optimization", "Brand Consistency", "Monthly Packages"]', 3000.00, 'design', FALSE);

-- Insert Sample Testimonials
INSERT INTO testimonials (client_name, company, rating, testimonial, is_featured, is_approved) VALUES
('Sarah Johnson', 'Tech Solutions Ltd', 5, 'JEFF DESIGNS HUB transformed our online presence completely. Our website traffic increased by 300%!', TRUE, TRUE),
('Michael Chen', 'Startup Africa', 5, 'Professional, fast, and affordable. Delivered our mobile app ahead of schedule. Highly recommended!', TRUE, TRUE),
('Grace Wambui', 'Grace Boutique', 4, 'Beautiful logo design that perfectly represents my brand. Will definitely work with them again.', TRUE, TRUE);