#!/bin/bash

echo "Creating portable package for Windows deployment..."

# Create portable directory
mkdir -p portable-package

# Build the application
echo "Building application..."
npm run build

# Copy necessary files
echo "Copying files..."
cp -r dist portable-package/
cp electron-main.cjs portable-package/
cp preload.cjs portable-package/
cp package.json portable-package/
cp -r node_modules/sqlite3 portable-package/node_modules/ 2>/dev/null || echo "SQLite3 module not found, will be installed on target machine"

# Create a simple launcher script for Windows
cat > portable-package/run.bat << 'EOF'
@echo off
echo Starting SAM'S PS Gaming Center...
echo.
echo If this is the first time running, please install Node.js from https://nodejs.org/
echo.
echo Installing dependencies...
npm install --production
echo.
echo Starting application...
npm run electron
pause
EOF

# Create a README for Windows users
cat > portable-package/README-Windows.txt << 'EOF'
SAM'S PS Gaming Center - Desktop Application
==========================================

INSTALLATION INSTRUCTIONS FOR WINDOWS:

1. Install Node.js (if not already installed):
   - Download from: https://nodejs.org/
   - Choose the LTS version
   - Run the installer with default settings

2. Run the application:
   - Double-click "run.bat" in this folder
   - The application will install dependencies and start automatically

3. Alternative manual installation:
   - Open Command Prompt in this folder
   - Run: npm install --production
   - Run: npm run electron

TROUBLESHOOTING:
- If you get permission errors, run Command Prompt as Administrator
- If SQLite errors occur, make sure Node.js is properly installed
- The database will be created automatically in your user data folder

FEATURES:
- Room management (PS4/PS5 only)
- Order tracking and payments
- Café product management
- Transaction history
- Backup and restore functionality

For support, contact: admin@zone14gaming.com
EOF

# Create a simple package.json for the portable version
cat > portable-package/package-portable.json << 'EOF'
{
  "name": "zone14-gaming-center",
  "version": "1.0.0",
  "description": "SAM'S PS Gaming Center - Desktop Management Application",
  "main": "electron-main.cjs",
  "scripts": {
    "electron": "electron .",
    "postinstall": "npm rebuild sqlite3"
  },
  "dependencies": {
    "sqlite3": "^5.1.6",
    "knex": "2.5.1"
  },
  "devDependencies": {
    "electron": "28.0.0"
  }
}
EOF

echo "Portable package created in 'portable-package' folder"
echo "Copy this entire folder to your Windows machine and run 'run.bat'"
echo ""
echo "Package contents:"
ls -la portable-package/
