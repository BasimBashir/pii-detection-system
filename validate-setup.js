#!/usr/bin/env node

/**
 * Setup Validation Script
 * Checks if your environment is properly configured
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('\n===========================================');
console.log('🔍 PII Detection System - Setup Validator');
console.log('===========================================\n');

let hasErrors = false;
let warnings = 0;

// Check 1: .env file exists
console.log('📋 Checking environment setup...\n');

if (!fs.existsSync('.env')) {
  console.error('❌ ERROR: .env file not found!');
  console.error('   Please create a .env file from .env.example');
  hasErrors = true;
} else {
  console.log('✅ .env file exists');
}

// Check 2: API keys configured
console.log('\n🔑 Checking API keys...\n');

let validKeys = 0;
let keyIndex = 1;

while (true) {
  const key = process.env[`GEMINI_API_KEY_${keyIndex}`];
  
  if (!key) {
    break;
  }
  
  // Check if placeholder
  if (key.includes('your-api-key') || key.includes('your-key') || key === 'your-actual-api-key-here') {
    console.warn(`⚠️  WARNING: GEMINI_API_KEY_${keyIndex} is a placeholder`);
    console.warn('   Replace with actual key from https://aistudio.google.com/app/apikey');
    warnings++;
  } else if (key.trim().length < 20) {
    console.error(`❌ ERROR: GEMINI_API_KEY_${keyIndex} appears too short`);
    hasErrors = true;
  } else if (!key.startsWith('AIza')) {
    console.warn(`⚠️  WARNING: GEMINI_API_KEY_${keyIndex} doesn't match expected format`);
    console.warn('   Gemini API keys typically start with "AIza"');
    warnings++;
    validKeys++;
  } else {
    console.log(`✅ GEMINI_API_KEY_${keyIndex} configured (${key.substring(0, 8)}...)`);
    validKeys++;
  }
  
  keyIndex++;
}

if (validKeys === 0) {
  console.error('\n❌ ERROR: No valid API keys found!');
  console.error('\n   Setup Instructions:');
  console.error('   1. Visit: https://aistudio.google.com/app/apikey');
  console.error('   2. Sign in with Google account');
  console.error('   3. Click "Create API Key"');
  console.error('   4. Copy the key');
  console.error('   5. Add to .env file:');
  console.error('      GEMINI_API_KEY_1=your-copied-key');
  hasErrors = true;
} else {
  console.log(`\n✅ Found ${validKeys} valid API key(s)`);
  
  if (validKeys === 1) {
    console.warn('\n⚠️  TIP: Add more keys for better rate limit handling');
    console.warn('   GEMINI_API_KEY_2=your-second-key');
    console.warn('   GEMINI_API_KEY_3=your-third-key');
    warnings++;
  }
}

// Check 3: Dependencies installed
console.log('\n📦 Checking dependencies...\n');

const requiredDeps = [
  '@google/generative-ai',
  'express',
  'cors',
  'multer',
  'dotenv'
];

let missingDeps = [];

requiredDeps.forEach(dep => {
  try {
    require.resolve(dep);
    console.log(`✅ ${dep}`);
  } catch (e) {
    console.error(`❌ ${dep} - NOT FOUND`);
    missingDeps.push(dep);
  }
});

if (missingDeps.length > 0) {
  console.error('\n❌ ERROR: Missing dependencies!');
  console.error('   Run: npm install');
  hasErrors = true;
}

// Check 4: Required files exist
console.log('\n📁 Checking required files...\n');

const requiredFiles = [
  'pii-detection-service.js',
  'chat-pii-middleware.js',
  'server.js',
  'package.json'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.error(`❌ ${file} - NOT FOUND`);
    hasErrors = true;
  }
});

// Check 5: Port availability (basic check)
console.log('\n🌐 Checking configuration...\n');

const port = process.env.PORT || 3000;
console.log(`✅ Server will run on port: ${port}`);

if (process.env.DATABASE_URL) {
  console.log(`✅ Database URL configured`);
} else {
  console.log(`ℹ️  Database URL not set (optional for MVP)`);
}

if (process.env.ADMIN_WEBHOOK_URL) {
  console.log(`✅ Admin webhook configured`);
} else {
  console.log(`ℹ️  Admin webhook not set (optional for MVP)`);
}

// Final Summary
console.log('\n===========================================');
console.log('📊 VALIDATION SUMMARY');
console.log('===========================================\n');

if (hasErrors) {
  console.error('❌ Setup has ERRORS - Please fix them before starting\n');
  console.error('For help, see: SETUP_GUIDE.md\n');
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`⚠️  Setup is OK but has ${warnings} warning(s)\n`);
  console.warn('System will work, but consider addressing warnings\n');
  console.log('✅ You can start the server with: npm start');
  console.log('✅ Or run tests with: npm test\n');
  process.exit(0);
} else {
  console.log('✅ Perfect! All checks passed!\n');
  console.log('🚀 Ready to start:');
  console.log('   - Start server: npm start');
  console.log('   - Run tests: npm test\n');
  process.exit(0);
}