// backend/server.js - Fixed version with proper database connection
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const Joi = require('joi');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Database configuration with improved error handling
const createPoolConfig = () => {
  const config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'muud_health',
    port: parseInt(process.env.DB_PORT) || 5432,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20,
    allowExitOnIdle: false,
  };

  // Handle password configuration
  const dbPassword = process.env.DB_PASSWORD;
  if (dbPassword && dbPassword.trim() !== '' && dbPassword !== 'undefined') {
    config.password = dbPassword;
    console.log('🔐 Using password authentication');
  } else {
    console.log('🔓 Using trust authentication (no password)');
  }

  console.log('🔧 Database Configuration:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Database: ${config.database}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Password: ${config.password ? '***SET***' : 'NOT SET'}`);

  return config;
};

const pool = new Pool(createPoolConfig());

// Enhanced connection testing with better error handling
async function testConnection(maxRetries = 10, retryDelay = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Testing database connection (attempt ${attempt}/${maxRetries})...`);
      
      const client = await pool.connect();
      const result = await client.query(`
        SELECT 
          NOW() as current_time, 
          current_user as user, 
          current_database() as database,
          version() as version
      `);
      
      const info = result.rows[0];
      console.log('✅ Database connection successful!');
      console.log(`   Connected as: ${info.user}`);
      console.log(`   Database: ${info.database}`);
      console.log(`   Server time: ${info.current_time}`);
      console.log(`   PostgreSQL: ${info.version.split(' ')[0]} ${info.version.split(' ')[1]}`);
      
      client.release();
      return true;
    } catch (error) {
      console.error(`❌ Connection attempt ${attempt} failed:`, error.message);
      
      // Provide specific error guidance
      if (error.code === 'ECONNREFUSED') {
        console.log('   💡 Database server is not running or not accessible');
      } else if (error.code === 'ENOTFOUND') {
        console.log('   💡 Database host not found - check DB_HOST setting');
      } else if (error.message.includes('password')) {
        console.log('   💡 Password authentication failed - check DB_PASSWORD');
      } else if (error.message.includes('database') && error.message.includes('does not exist')) {
        console.log('   💡 Database does not exist - check DB_NAME setting');
      }
      
      if (attempt < maxRetries) {
        console.log(`   ⏳ Retrying in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  console.error('❌ All database connection attempts failed');
  return false;
}

// Pool error handling
pool.on('error', (err, client) => {
  console.error('💥 Unexpected database pool error:', err);
});

pool.on('connect', (client) => {
  console.log('🔗 New database client connected');
});

// Validation schemas
const journalEntrySchema = Joi.object({
  user_id: Joi.number().integer().required(),
  entry_text: Joi.string().min(1).required(),
  mood_rating: Joi.number().integer().min(1).max(5).required(),
  timestamp: Joi.date().iso().optional()
});

const contactSchema = Joi.object({
  user_id: Joi.number().integer().required(),
  contact_name: Joi.string().min(1).required(),
  contact_email: Joi.string().email().required()
});

// Database initialization with better error handling
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database tables...');
    
    // Create journal_entries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        entry_text TEXT NOT NULL,
        mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create contacts table with proper constraints
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        contact_name VARCHAR(255) NOT NULL,
        contact_email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_email UNIQUE(user_id, contact_email)
      )
    `);

    // Check existing data
    const [journalCount, contactsCount] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM journal_entries'),
      pool.query('SELECT COUNT(*) FROM contacts')
    ]);

    console.log('✅ Database tables initialized successfully');
    console.log(`   Journal entries: ${journalCount.rows[0].count}`);
    console.log(`   Contacts: ${contactsCount.rows[0].count}`);

    // Add sample data if tables are empty
    if (parseInt(journalCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO journal_entries (user_id, entry_text, mood_rating, timestamp) VALUES
        (1, 'Welcome to MUUD Health! Your backend is now connected and working.', 5, NOW() - INTERVAL '1 hour'),
        (1, 'The database connection is secure and all API endpoints are functional.', 4, NOW() - INTERVAL '30 minutes')
      `);
      console.log('✅ Added sample journal entries');
    }

    if (parseInt(contactsCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO contacts (user_id, contact_name, contact_email) VALUES
        (1, 'Dr. Sarah Wilson', 'dr.wilson@healthcare.com'),
        (1, 'MUUD Health Support', 'support@muudhealth.com')
      `);
      console.log('✅ Added sample contacts');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    return false;
  }
}

// Enhanced error handling middleware
const handleError = (res, error, message = 'Internal server error', statusCode = 500) => {
  console.error(`❌ ${message}:`, error.message);
  
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack trace:', error.stack);
  }
  
  // Handle specific database errors
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      message: 'Database connection lost',
      error: 'The database server is not responding'
    });
  }
  
  res.status(statusCode).json({ 
    success: false, 
    message,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    timestamp: new Date().toISOString()
  });
};

// Journal Endpoints

// POST /journal/entry
app.post('/journal/entry', async (req, res) => {
  try {
    const { error, value } = journalEntrySchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message
      });
    }

    const { user_id, entry_text, mood_rating, timestamp } = value;
    const entryTimestamp = timestamp || new Date().toISOString();

    const result = await pool.query(
      'INSERT INTO journal_entries (user_id, entry_text, mood_rating, timestamp) VALUES ($1, $2, $3, $4) RETURNING id, timestamp',
      [user_id, entry_text, mood_rating, entryTimestamp]
    );

    console.log(`✅ Journal entry created for user ${user_id}, entry ID: ${result.rows[0].id}`);

    res.status(201).json({
      success: true,
      message: 'Journal entry created successfully',
      entry_id: result.rows[0].id,
      timestamp: result.rows[0].timestamp
    });
  } catch (error) {
    handleError(res, error, 'Failed to create journal entry');
  }
});

// GET /journal/user/:id
app.get('/journal/user/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const result = await pool.query(
      'SELECT id, entry_text, mood_rating, timestamp FROM journal_entries WHERE user_id = $1 ORDER BY timestamp DESC',
      [userId]
    );

    console.log(`✅ Retrieved ${result.rows.length} journal entries for user ${userId}`);

    res.json({
      success: true,
      entries: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    handleError(res, error, 'Failed to retrieve journal entries');
  }
});

// DELETE /journal/entry/:id
app.delete('/journal/entry/:id', async (req, res) => {
  try {
    const entryId = parseInt(req.params.id);
    
    if (isNaN(entryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entry ID'
      });
    }

    const result = await pool.query(
      'DELETE FROM journal_entries WHERE id = $1 RETURNING id',
      [entryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    console.log(`✅ Deleted journal entry ${entryId}`);

    res.json({
      success: true,
      message: 'Journal entry deleted successfully'
    });
  } catch (error) {
    handleError(res, error, 'Failed to delete journal entry');
  }
});

// POST /contacts/add
app.post('/contacts/add', async (req, res) => {
  try {
    const { error, value } = contactSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message
      });
    }

    const { user_id, contact_name, contact_email } = value;

    const result = await pool.query(
      'INSERT INTO contacts (user_id, contact_name, contact_email) VALUES ($1, $2, $3) RETURNING id, created_at',
      [user_id, contact_name, contact_email.toLowerCase()]
    );

    console.log(`✅ Contact added for user ${user_id}, contact ID: ${result.rows[0].id}`);

    res.status(201).json({
      success: true,
      message: 'Contact added successfully',
      contact_id: result.rows[0].id,
      created_at: result.rows[0].created_at
    });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'Contact with this email already exists for this user'
      });
    }
    handleError(res, error, 'Failed to add contact');
  }
});

// GET /contacts/user/:id
app.get('/contacts/user/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const result = await pool.query(
      'SELECT id, contact_name, contact_email, created_at FROM contacts WHERE user_id = $1 ORDER BY contact_name ASC',
      [userId]
    );

    console.log(`✅ Retrieved ${result.rows.length} contacts for user ${userId}`);

    res.json({
      success: true,
      contacts: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    handleError(res, error, 'Failed to retrieve contacts');
  }
});

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  try {
    const client = await pool.connect();
    const dbStatus = await client.query(`
      SELECT 
        NOW() as server_time, 
        current_user as user, 
        current_database() as database,
        version() as version
    `);
    client.release();

    const info = dbStatus.rows[0];

    res.json({ 
      success: true, 
      message: 'MUUD Health API is running and connected',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        user: info.user,
        database: info.database,
        server_time: info.server_time,
        version: info.version.split(' ')[0] + ' ' + info.version.split(' ')[1],
        connection_pool: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        }
      },
      server: {
        port: port,
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service unavailable - database connection failed',
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected',
        error: error.message
      },
      server: {
        port: port,
        environment: process.env.NODE_ENV || 'development'
      }
    });
  }
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'MUUD Health API is working!',
    timestamp: new Date().toISOString(),
    server: {
      port: port,
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    available_endpoints: [
      'GET /health',
      'GET /test',
      'POST /journal/entry',
      'GET /journal/user/:id',
      'DELETE /journal/entry/:id',
      'POST /contacts/add',
      'GET /contacts/user/:id'
    ]
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  try {
    await pool.end();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error closing database connections:', error.message);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully...');
  try {
    await pool.end();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error closing database connections:', error.message);
  }
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting MUUD Health API server...');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for all origins (development mode)`);
    
    // Test database connection
    const dbConnected = await testConnection();
    
    if (dbConnected) {
      const dbInitialized = await initializeDatabase();
      if (dbInitialized) {
        console.log('🎯 Backend is fully ready for API calls!');
      } else {
        console.log('⚠️ Server starting with database connection but initialization failed');
      }
    } else {
      console.log('⚠️ Server starting without database connection');
      console.log('');
      console.log('💡 Troubleshooting steps:');
      console.log('1. Check if Docker is running: docker ps');
      console.log('2. Check PostgreSQL container: docker logs muud_health_db');
      console.log('3. Verify .env file has correct password');
      console.log('4. Reset containers: docker-compose down -v && docker-compose up -d');
      console.log('5. Wait 10-15 seconds for database to fully start');
    }

    app.listen(port, '0.0.0.0', () => {
      console.log('');
      console.log('✅ MUUD Health API server is running!');
      console.log(`🌐 Local: http://localhost:${port}`);
      console.log(`🌐 Network: http://0.0.0.0:${port}`);
      console.log(`🏥 Health check: http://localhost:${port}/health`);
      console.log(`🧪 Test endpoint: http://localhost:${port}/test`);
      console.log('');
      console.log('📚 Available API endpoints:');
      console.log('   POST /journal/entry      - Create journal entry');
      console.log('   GET  /journal/user/:id   - Get user journal entries');
      console.log('   DELETE /journal/entry/:id - Delete journal entry');
      console.log('   POST /contacts/add       - Add contact');
      console.log('   GET  /contacts/user/:id  - Get user contacts');
      console.log('   GET  /health             - Health check');
      console.log('   GET  /test               - Simple test');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();