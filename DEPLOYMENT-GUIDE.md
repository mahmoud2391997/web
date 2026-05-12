# SAM'S PS Gaming Center - Deployment Guide

## 🚀 **Windows Deployment Instructions**

### **Method 1: Portable Package (Recommended)**

1. **Copy the portable package:**
   - Copy the entire `portable-package` folder to your Windows machine
   - This folder contains everything needed to run the application

2. **Install Node.js on Windows:**
   - Download Node.js LTS from: https://nodejs.org/
   - Run the installer with default settings
   - Restart your computer after installation

3. **Run the application:**
   - Navigate to the `portable-package` folder
   - Double-click `run.bat`
   - The application will install dependencies and start automatically

### **Method 2: Manual Installation**

1. **Install Node.js** (if not already installed)
2. **Open Command Prompt** in the portable-package folder
3. **Run these commands:**
   \`\`\`cmd
   npm install --production
   npm run electron
   \`\`\`

## 📦 **Package Contents**

The `portable-package` folder contains:
- `dist/` - Built application files
- `electron-main.cjs` - Main Electron process
- `preload.cjs` - Security preload script
- `package.json` - Dependencies and scripts
- `node_modules/` - Required Node.js modules
- `run.bat` - Windows launcher script
- `README-Windows.txt` - Windows-specific instructions

## 🔧 **System Requirements**

### **Windows Requirements:**
- Windows 10 or later
- Node.js 18+ (LTS recommended)
- 100MB free disk space
- 4GB RAM minimum

### **Network Requirements:**
- No internet required after initial setup
- Database is stored locally

## 🗄️ **Database Information**

- **Database Type:** SQLite (local file)
- **Location:** `%APPDATA%/vite-electron-knex-app/database.sqlite`
- **Backup:** Use the built-in backup/restore feature
- **Initial Data:** 8 rooms (4 PS4, 4 PS5) are created automatically

## 🎮 **Features Included**

- ✅ **Room Management:** PS4 and PS5 rooms only
- ✅ **Order Tracking:** Real-time order management
- ✅ **Payment Processing:** Cash, card, and transfer payments
- ✅ **Café Products:** Food and beverage management
- ✅ **Transaction History:** Complete financial tracking
- ✅ **Backup/Restore:** Data protection and migration
- ✅ **Responsive Design:** Works on different screen sizes

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"Node.js not found" error:**
   - Install Node.js from https://nodejs.org/
   - Restart your computer after installation

2. **Permission errors:**
   - Run Command Prompt as Administrator
   - Right-click Command Prompt → "Run as administrator"

3. **SQLite errors:**
   - Make sure Node.js is properly installed
   - Try running: `npm rebuild sqlite3`

4. **Application won't start:**
   - Check if port 8080 is available
   - Try running: `npm install --production` again

### **Database Issues:**

1. **Database not found:**
   - The database is created automatically on first run
   - Check: `%APPDATA%/vite-electron-knex-app/`

2. **Data not saving:**
   - Make sure the application has write permissions
   - Check disk space availability

## 📱 **Usage Instructions**

### **First Time Setup:**
1. Run the application
2. Select "Administrator Access" or "Cashier Access"
3. The database will be initialized automatically
4. 8 rooms (4 PS4, 4 PS5) will be created

### **Daily Operations:**
1. **Start Sessions:** Book rooms for customers
2. **Process Orders:** Add café items to orders
3. **Handle Payments:** Complete transactions
4. **View Reports:** Check daily/weekly/monthly revenue

### **Backup Strategy:**
1. Use the built-in backup feature regularly
2. Store backups in a safe location
3. Test restore functionality periodically

## 🔒 **Security Notes**

- Database is stored locally (not in cloud)
- No internet connection required for operation
- All data remains on the local machine
- Regular backups recommended

## 📞 **Support**

- **Email:** admin@zone14gaming.com
- **Application Version:** 1.0.0
- **Last Updated:** September 2025

## 🔄 **Updates**

To update the application:
1. Download the new portable package
2. Replace the old folder with the new one
3. Run `run.bat` to start the updated version
4. Your existing database will be preserved

---

**Note:** This application is designed for SAM'S PS Gaming Center and includes PS4/PS5 room management, order tracking, and payment processing capabilities.
