#!/usr/bin/env node
/**
 * Railway Deployment Test
 * This file is used to test if the Railway deployment is working
 */

console.log('\n=== Railway Deployment Environment Check ===\n');

// Check Node.js version
console.log('Node.js version:', process.version);
console.log('npm version:', process.versions.npm);

// Check environment variables
console.log('\nEnvironment Variables:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  PORT:', process.env.PORT || 'not set (will use 3000)');
console.log('  USE_DATABASE:', process.env.USE_DATABASE);
console.log('  USE_CACHE:', process.env.USE_CACHE);

// Check if required modules can be loaded
console.log('\nModule Loading Test:');
try {
  require('express');
  console.log('  ✓ express');
} catch (error) {
  console.log('  ✗ express:', error.message);
}

try {
  require('cors');
  console.log('  ✓ cors');
} catch (error) {
  console.log('  ✗ cors:', error.message);
}

try {
  require('dotenv');
  console.log('  ✓ dotenv');
} catch (error) {
  console.log('  ✗ dotenv:', error.message);
}

try {
  require('pg');
  console.log('  ✓ pg');
} catch (error) {
  console.log('  ✗ pg:', error.message);
}

// Check file structure
const fs = require('fs');
const path = require('path');

console.log('\nFile Structure Check:');
const filesToCheck = [
  'server.js',
  'package.json',
  'nixpacks.toml',
  'src/cache/CacheService.js',
  'src/cache/redisClient.js',
  'src/db/connection.js',
  'data/heritage-figures.json',
  'data/banners.json'
];

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} NOT FOUND`);
  }
});

console.log('\n=== Test Complete ===\n');
