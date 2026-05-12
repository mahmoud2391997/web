#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🛠️ Setting up SAM'S PS Gaming Center for Development...\n');

// Install dependencies
console.log('📦 Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Rebuild native modules for current platform
console.log('🔧 Rebuilding native modules for development...');
try {
  execSync('npm run postinstall', { stdio: 'inherit' });
  console.log('✅ Native modules rebuilt successfully');
} catch (error) {
  console.error('⚠️ Warning: Failed to rebuild native modules:', error.message);
  console.log('This may cause issues with SQLite. Try running: npm rebuild better-sqlite3');
}

// Create necessary directories
const directories = ['build', 'release', 'logs'];
directories.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Check for required files
const requiredFiles = [
  'main.cjs',
  'preload.cjs',
  'src/services/localDbService.js'
];

let missingFiles = [];
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.error('❌ Missing required files:');
  missingFiles.forEach(file => console.error(`   - ${file}`));
  process.exit(1);
}

console.log('\n✅ Development setup completed successfully!');
console.log('🚀 You can now run:');
console.log('   - npm run electron:dev (for development with hot reload)');
console.log('   - npm run electron (for production-like testing)');
console.log('   - npm run electron:build (to build for distribution)');
