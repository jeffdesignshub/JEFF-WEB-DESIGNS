#!/bin/bash

echo "🚀 Deploying JEFF DESIGNS HUB..."

# Frontend deployment
echo "📦 Building frontend..."
cd frontend
npm install
npm run build

# Backend deployment
echo "⚙️ Setting up backend..."
cd ../backend
npm install
npm run migrate

# Copy build files
echo "📁 Copying files..."
cp -r ../frontend/build ./public

# Set permissions
echo "🔐 Setting permissions..."
chmod -R 755 public
chmod +x server.js

# Start server with PM2
echo "🚀 Starting server..."
pm2 start server.js --name "jeff-designs-hub"

echo "✅ Deployment complete!"
echo "🌐 Website: https://jeffdesignshub.com"
echo "📊 Admin: https://jeffdesignshub.com/admin"

#!/bin/bash

echo "🚀 JEFF DESIGNS HUB - Deployment Script"

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install dependencies
echo "🔧 Installing dependencies..."
sudo apt install -y nodejs npm mysql-server nginx certbot python3-certbot-nginx

# Setup MySQL
echo "🗄️ Setting up MySQL database..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS jeff_designs_hub;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'jeffdesigns_user'@'localhost' IDENTIFIED BY 'StrongPassword@2024';"
sudo mysql -e "GRANT ALL PRIVILEGES ON jeff_designs_hub.* TO 'jeffdesigns_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Import database schema
echo "📋 Importing database schema..."
sudo mysql jeff_designs_hub < database/schema.sql

# Setup project directory
echo "📁 Setting up project structure..."
sudo mkdir -p /var/www/jeffdesignshub
sudo chown -R $USER:$USER /var/www/jeffdesignshub

# Clone/Setup project
cd /var/www/jeffdesignshub
git clone https://github.com/jeffdesignshub/website.git .

# Install backend dependencies
echo "⚙️ Installing backend dependencies..."
cd backend
npm install --production

# Setup environment
cp .env.example .env
nano .env  # Edit with your credentials

# Install frontend dependencies
echo "🎨 Installing frontend dependencies..."
cd ../frontend
npm install --production
npm run build

# Setup PM2 for process management
echo "🔄 Setting up PM2..."
sudo npm install -g pm2
cd ../backend
pm2 start server.js --name "jeff-designs-hub-api"
pm2 save
pm2 startup

# Setup Nginx
echo "🌐 Configuring Nginx..."
sudo cp nginx.conf /etc/nginx/sites-available/jeffdesignshub
sudo ln -s /etc/nginx/sites-available/jeffdesignshub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL
echo "🔐 Setting up SSL..."
sudo certbot --nginx -d jeffdesignshub.com -d www.jeffdesignshub.com

# Setup firewall
echo "🛡️ Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Setup backups
echo "💾 Setting up backups..."
sudo mkdir -p /backups/jeffdesignshub
sudo crontab -l | { cat; echo "0 2 * * * /usr/bin/mysqldump -u jeffdesigns_user -pStrongPassword@2024 jeff_designs_hub > /backups/jeffdesignshub/backup_\$(date +\%Y\%m\%d).sql"; } | sudo crontab -
sudo crontab -l | { cat; echo "0 3 * * * tar -czf /backups/jeffdesignshub/files_\$(date +\%Y\%m\%d).tar.gz /var/www/jeffdesignshub/"; } | sudo crontab -

# Setup monitoring
echo "📊 Setting up monitoring..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

echo "✅ Deployment complete!"
echo "🌐 Website: https://jeffdesignshub.com"
echo "📊 Admin: https://jeffdesignshub.com/admin"
echo "📱 API: https://jeffdesignshub.com/api"
echo "🔧 Monitor: pm2 monit"