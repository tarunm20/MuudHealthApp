// diagnostic.js - Database connection diagnostic tool
const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 MUUD Health Database Diagnostic Tool');
console.log('=====================================\n');

// Load environment variables
console.log('📋 Environment Variables:');
console.log(`DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
console.log(`DB_PORT: ${process.env.DB_PORT || '5432'}`);
console.log(`DB_NAME: ${process.env.DB_NAME || 'muud_health'}`);
console.log(`DB_USER: ${process.env.DB_USER || 'postgres'}`);
console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '***set***' : 'NOT SET'}`);
console.log('');

// Test different connection configurations
async function testConnection(config, description) {
  console.log(`🧪 Testing: ${description}`);
  const pool = new Pool(config);
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    client.release();
    await pool.end();
    
    console.log(`✅ SUCCESS: ${description}`);
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   Version: ${result.rows[0].postgres_version.split(' ')[0]} ${result.rows[0].postgres_version.split(' ')[1]}`);
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${description}`);
    console.log(`   Error: ${error.message}`);
    await pool.end();
    return false;
  }
}

async function runDiagnostics() {
  console.log('🔄 Running connection tests...\n');
  
  // Test 1: With environment variables
  const envConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'muud_health',
    port: process.env.DB_PORT || 5432,
  };
  
  if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '') {
    envConfig.password = process.env.DB_PASSWORD;
  }
  
  const success1 = await testConnection(envConfig, 'Environment configuration');
  
  if (!success1) {
    // Test 2: Without password
    console.log('\n🔄 Trying without password...');
    const noPasswordConfig = { ...envConfig };
    delete noPasswordConfig.password;
    
    const success2 = await testConnection(noPasswordConfig, 'No password');
    
    if (!success2) {
      // Test 3: Default postgres password
      console.log('\n🔄 Trying with default postgres password...');
      const defaultConfig = {
        ...envConfig,
        password: 'postgres'
      };
      
      const success3 = await testConnection(defaultConfig, 'Default postgres password');
      
      if (!success3) {
        // Test 4: Empty password
        console.log('\n🔄 Trying with empty password...');
        const emptyPasswordConfig = {
          ...envConfig,
          password: ''
        };
        
        await testConnection(emptyPasswordConfig, 'Empty password');
      }
    }
  }
  
  console.log('\n📋 Recommendations:');
  console.log('1. Make sure PostgreSQL container is running: docker ps');
  console.log('2. Check container logs: docker logs muud_health_db');
  console.log('3. Try connecting directly: docker exec -it muud_health_db psql -U postgres -d muud_health');
  console.log('4. If all else fails, recreate the container with: docker-compose down -v && docker-compose up -d');
}

// Check if Docker container is running
console.log('🐳 Checking Docker container status...');
const { exec } = require('child_process');

exec('docker ps --filter "name=muud_health_db" --format "table {{.Names}}\\t{{.Status}}"', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Docker command failed. Make sure Docker is running.');
    console.log(`   Error: ${error.message}`);
  } else {
    console.log('Docker containers:');
    console.log(stdout || 'No containers found with name muud_health_db');
  }
  
  console.log('');
  runDiagnostics();
});