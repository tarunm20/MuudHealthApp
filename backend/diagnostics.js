// Enhanced diagnostic tool for MUUD Health Backend
const { Pool } = require('pg');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
require('dotenv').config();

console.log('🔍 MUUD Health Enhanced Database Diagnostic Tool');
console.log('================================================\n');

// Helper function for colored output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, text) {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

// Load and display environment variables
console.log('📋 Environment Variables:');
const envVars = {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || '5432',
  DB_NAME: process.env.DB_NAME || 'muud_health',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD
};

Object.entries(envVars).forEach(([key, value]) => {
  if (key === 'DB_PASSWORD') {
    console.log(`${key}: ${value ? '***set***' : 'NOT SET'}`);
  } else {
    console.log(`${key}: ${value}`);
  }
});
console.log('');

// Test different connection configurations
async function testConnection(config, description) {
  colorLog('cyan', `🧪 Testing: ${description}`);
  const pool = new Pool(config);
  
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        NOW() as current_time, 
        version() as postgres_version,
        current_user as connected_user,
        current_database() as database_name
    `);
    client.release();
    await pool.end();
    
    colorLog('green', `✅ SUCCESS: ${description}`);
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   Database: ${result.rows[0].database_name}`);
    console.log(`   User: ${result.rows[0].connected_user}`);
    console.log(`   Version: ${result.rows[0].postgres_version.split(' ')[0]} ${result.rows[0].postgres_version.split(' ')[1]}`);
    return true;
  } catch (error) {
    colorLog('red', `❌ FAILED: ${description}`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code || 'N/A'}`);
    await pool.end();
    return false;
  }
}

async function checkDockerStatus() {
  colorLog('blue', '🐳 Checking Docker container status...');
  
  try {
    const { stdout } = await execAsync('docker ps --filter "name=muud_health_db" --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"');
    
    if (stdout.trim()) {
      console.log('Docker containers:');
      console.log(stdout);
      
      // Check if container is actually running
      if (stdout.includes('muud_health_db')) {
        colorLog('green', '✅ PostgreSQL container is running');
        
        // Test container health
        try {
          const { stdout: healthCheck } = await execAsync('docker exec muud_health_db pg_isready -U postgres');
          if (healthCheck.includes('accepting connections')) {
            colorLog('green', '✅ PostgreSQL is accepting connections');
          } else {
            colorLog('yellow', '⚠️  PostgreSQL container running but not ready');
          }
        } catch (healthError) {
          colorLog('red', '❌ PostgreSQL health check failed');
          console.log(`   Error: ${healthError.message}`);
        }
      } else {
        colorLog('red', '❌ PostgreSQL container not found');
      }
    } else {
      colorLog('red', '❌ No PostgreSQL container found');
    }
  } catch (error) {
    colorLog('red', '❌ Docker command failed');
    console.log(`   Error: ${error.message}`);
    console.log('   Make sure Docker is running and accessible');
  }
}

async function testDatabaseOperations(pool) {
  colorLog('cyan', '🔧 Testing database operations...');
  
  try {
    // Test creating tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        test_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    colorLog('green', '✅ Table creation successful');
    
    // Test inserting data
    const insertResult = await pool.query(
      'INSERT INTO test_table (test_data) VALUES ($1) RETURNING id',
      ['diagnostic test']
    );
    colorLog('green', `✅ Data insertion successful (ID: ${insertResult.rows[0].id})`);
    
    // Test selecting data
    const selectResult = await pool.query('SELECT COUNT(*) as count FROM test_table');
    colorLog('green', `✅ Data selection successful (${selectResult.rows[0].count} rows)`);
    
    // Clean up test table
    await pool.query('DROP TABLE IF EXISTS test_table');
    colorLog('green', '✅ Cleanup successful');
    
    return true;
  } catch (error) {
    colorLog('red', '❌ Database operations failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runComprehensiveDiagnostics() {
  console.log('🔄 Running comprehensive diagnostics...\n');
  
  // Check Docker first
  await checkDockerStatus();
  console.log('');
  
  // Test 1: With environment variables
  const envConfig = {
    user: envVars.DB_USER,
    host: envVars.DB_HOST,
    database: envVars.DB_NAME,
    port: parseInt(envVars.DB_PORT),
    connectionTimeoutMillis: 5000
  };
  
  // Only add password if it exists and is not empty
  if (envVars.DB_PASSWORD && envVars.DB_PASSWORD.trim() !== '') {
    envConfig.password = envVars.DB_PASSWORD;
  }
  
  let success = await testConnection(envConfig, 'Environment configuration');
  
  if (success) {
    // Test database operations if connection successful
    console.log('');
    const pool = new Pool(envConfig);
    const operationsSuccess = await testDatabaseOperations(pool);
    await pool.end();
    
    if (operationsSuccess) {
      colorLog('green', '\n🎉 All tests passed! Your database is ready.');
    }
  } else {
    // Try alternative configurations
    console.log('');
    colorLog('yellow', '🔄 Trying alternative configurations...');
    
    // Test 2: Force no password
    const noPasswordConfig = { ...envConfig };
    delete noPasswordConfig.password;
    success = await testConnection(noPasswordConfig, 'No password (trust auth)');
    
    if (!success) {
      // Test 3: Different host configurations
      const localhostConfig = { ...noPasswordConfig, host: '127.0.0.1' };
      success = await testConnection(localhostConfig, '127.0.0.1 instead of localhost');
      
      if (!success) {
        // Test 4: Different port
        const altPortConfig = { ...noPasswordConfig, port: 5433 };
        await testConnection(altPortConfig, 'Alternative port 5433');
      }
    }
  }
  
  // Provide recommendations
  console.log('');
  colorLog('blue', '💡 Troubleshooting Recommendations:');
  console.log('');
  
  if (!success) {
    colorLog('yellow', '🔧 Basic Setup:');
    console.log('1. Start PostgreSQL: cd backend && docker-compose up -d');
    console.log('2. Check status: docker ps');
    console.log('3. View logs: docker logs muud_health_db');
    console.log('');
    
    colorLog('yellow', '🚨 If problems persist:');
    console.log('1. Reset everything: docker-compose down -v');
    console.log('2. Remove old containers: docker system prune -f');
    console.log('3. Restart: docker-compose up -d');
    console.log('4. Wait 10 seconds, then test again');
    console.log('');
    
    colorLog('yellow', '🔍 Manual verification:');
    console.log('1. Connect directly: docker exec -it muud_health_db psql -U postgres -d muud_health');
    console.log('2. List databases: \\l');
    console.log('3. Quit: \\q');
  } else {
    colorLog('green', '🎯 Next Steps:');
    console.log('1. Start your backend: npm run dev');
    console.log('2. Test API: curl http://localhost:3000/health');
    console.log('3. Check your app connection');
  }
  
  console.log('');
  colorLog('cyan', '📖 Useful Commands:');
  console.log('• Check containers: docker ps');
  console.log('• View logs: docker logs muud_health_db');
  console.log('• Connect to DB: docker exec -it muud_health_db psql -U postgres -d muud_health');
  console.log('• Reset DB: docker-compose down -v && docker-compose up -d');
  console.log('• Backend health: curl http://localhost:3000/health');
}

// Run diagnostics
runComprehensiveDiagnostics().catch(error => {
  colorLog('red', '💥 Diagnostic failed with error:');
  console.error(error);
});