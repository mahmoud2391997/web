#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building SAM'S PS Gaming Center for Web...\n');

// Clean previous builds
console.log('🧹 Cleaning previous builds...');
try {
  execSync('npm run clean', { stdio: 'inherit' });
} catch (error) {
  console.log('No previous builds to clean');
}

// Install dependencies
console.log('📦 Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Build the React app
console.log('⚛️ Building React application...');
execSync('npm run build', { stdio: 'inherit' });

// Verify build output
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Build failed: dist directory not found');
  process.exit(1);
}

console.log('✅ Web build completed successfully');

// Show build output info
const files = fs.readdirSync(distPath);
console.log('\n📁 Build output location: ./dist');
console.log('📄 Generated files:');
files.forEach(file => {
  const filePath = path.join(distPath, file);
  const stats = fs.statSync(filePath);
  if (stats.isFile()) {
    const size = (stats.size / 1024).toFixed(2);
    console.log(`   - ${file} (${size} KB)`);
  }
});

console.log('\n🎉 Web build completed successfully!');
console.log('📋 Next steps:');
console.log('   1. Test the application: npm run preview');
console.log('   2. Deploy the dist folder to your web server');
console.log('   3. Or serve locally: npm run serve');
