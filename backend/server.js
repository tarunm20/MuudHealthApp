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

// PostgreSQL connection
const poolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'muud_health',
  port: process.env.DB_PORT || 5432,
};

// Only add password if it's provided and not empty
if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '') {
  poolConfig.password = process.env.DB_PASSWORD;
}

console.log('Database config:', {
  ...poolConfig,
  password: poolConfig.password ? '***hidden***' : 'no password'
});

const pool = new Pool(poolConfig);

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
    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        entry_text TEXT NOT NULL,
        mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        contact_name VARCHAR(255) NOT NULL,
        contact_email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Error handling middleware
const handleError = (res, error, message = 'Internal server error') => {
  console.error(error);
  res.status(500).json({ 
    success: false, 
    message,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

// Journal Endpoints

// POST /journal/entry - Create a new journal entry
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
      'INSERT INTO journal_entries (user_id, entry_text, mood_rating, timestamp) VALUES ($1, $2, $3, $4) RETURNING id',
      [user_id, entry_text, mood_rating, entryTimestamp]
    );

    res.status(201).json({
      success: true,
      message: 'Journal entry created successfully',
      entry_id: result.rows[0].id
    });
  } catch (error) {
    handleError(res, error, 'Failed to create journal entry');
  }
});

// GET /journal/user/:id - Get journal entries for a user
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

    res.json({
      success: true,
      entries: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    handleError(res, error, 'Failed to retrieve journal entries');
  }
});

// Contact Endpoints

// POST /contacts/add - Add a new contact
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

    // Check if contact already exists for this user
    const existingContact = await pool.query(
      'SELECT id FROM contacts WHERE user_id = $1 AND contact_email = $2',
      [user_id, contact_email]
    );

    if (existingContact.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Contact with this email already exists for this user'
      });
    }

    const result = await pool.query(
      'INSERT INTO contacts (user_id, contact_name, contact_email) VALUES ($1, $2, $3) RETURNING id',
      [user_id, contact_name, contact_email]
    );

    res.status(201).json({
      success: true,
      message: 'Contact added successfully',
      contact_id: result.rows[0].id
    });
  } catch (error) {
    handleError(res, error, 'Failed to add contact');
  }
});

// GET /contacts/user/:id - Get contacts for a user
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
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'MUUD Health API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(port, async () => {
  console.log(`MUUD Health API server running on port ${port}`);
  await initializeDatabase();
});

module.exports = app;