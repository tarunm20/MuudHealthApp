const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const Joi = require('joi');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// PostgreSQL connection configuration
const poolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'muud_health',
  port: parseInt(process.env.DB_PORT) || 5432,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
};

// Only add password if it exists and is not empty
const dbPassword = process.env.DB_PASSWORD;
if (dbPassword && dbPassword.trim() !== '' && dbPassword !== 'undefined') {
  poolConfig.password = dbPassword;
  console.log('✅ Using password authentication');
} else {
  console.log('📝 Using trust authentication (no password)');
}

console.log('🔧 Database Configuration:', {
  user: poolConfig.user,
  host: poolConfig.host,
  database: poolConfig.database,
  port: poolConfig.port,
  password: poolConfig.password ? '***set***' : 'none'
});

const pool = new Pool(poolConfig);

// Test database connection with retry logic
async function testConnection(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Testing database connection (attempt ${i + 1}/${retries})...`);
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as time, current_user as user, version() as version');
      console.log('✅ Database connection successful!');
      console.log(`   Connected as: ${result.rows[0].user}`);
      console.log(`   Server time: ${result.rows[0].time}`);
      console.log(`   PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
      client.release();
      return true;
    } catch (error) {
      console.error(`❌ Database connection failed (attempt ${i + 1}):`, error.message);
      if (i < retries - 1) {
        console.log('⏳ Retrying in 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }
  return false;
}

// Enhanced error handling for pool
pool.on('error', (err, client) => {
  console.error('💥 Unexpected error on idle client:', err);
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

// Database initialization
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

    // Create contacts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        contact_name VARCHAR(255) NOT NULL,
        contact_email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, contact_email)
      )
    `);

    // Check if tables have data
    const journalCount = await pool.query('SELECT COUNT(*) FROM journal_entries');
    const contactsCount = await pool.query('SELECT COUNT(*) FROM contacts');

    console.log('✅ Database tables initialized successfully');
    console.log(`   Journal entries: ${journalCount.rows[0].count}`);
    console.log(`   Contacts: ${contactsCount.rows[0].count}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    return false;
  }
}

// Error handling middleware
const handleError = (res, error, message = 'Internal server error') => {
  console.error(`❌ ${message}:`, error.message);
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack trace:', error.stack);
  }
  
  res.status(500).json({ 
    success: false, 
    message,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const client = await pool.connect();
    const dbStatus = await client.query('SELECT NOW(), current_user, version()');
    client.release();

    res.json({ 
      success: true, 
      message: 'MUUD Health API is running',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        user: dbStatus.rows[0].current_user,
        server_time: dbStatus.rows[0].now,
        version: dbStatus.rows[0].version.split(' ')[0] + ' ' + dbStatus.rows[0].version.split(' ')[1]
      },
      server: {
        port: port,
        environment: process.env.NODE_ENV || 'development'
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
      }
    });
  }
});

// Test endpoint for quick verification
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'MUUD Health API is working!',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  await pool.end();
  console.log('✅ Database connections closed');
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting MUUD Health API server...');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Test database connection with retries
    const dbConnected = await testConnection();
    
    if (dbConnected) {
      await initializeDatabase();
      console.log('🎯 Backend is ready for API calls!');
    } else {
      console.log('⚠️  Server starting without database connection');
      console.log('💡 To fix database connection:');
      console.log('   1. Make sure Docker is running');
      console.log('   2. Check PostgreSQL container: docker ps');
      console.log('   3. Check container logs: docker logs muud_health_db');
      console.log('   4. Reset containers: docker-compose down -v && docker-compose up -d');
    }

    app.listen(port, () => {
      console.log(`✅ MUUD Health API server running on port ${port}`);
      console.log(`🌐 Health check: http://localhost:${port}/health`);
      console.log(`🧪 Test endpoint: http://localhost:${port}/test`);
      console.log('📚 API Endpoints:');
      console.log('   POST /journal/entry      - Create journal entry');
      console.log('   GET  /journal/user/:id   - Get user journal entries');
      console.log('   DELETE /journal/entry/:id - Delete journal entry');
      console.log('   POST /contacts/add       - Add contact');
      console.log('   GET  /contacts/user/:id  - Get user contacts');
      console.log('   GET  /health             - Health check');
      console.log('   GET  /test               - Simple test');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;