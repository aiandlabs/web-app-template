/**
 * PostgreSQL Example for Build.io
 * 
 * This shows how to connect to PostgreSQL using the "schema-to-go" add-on
 * 
 * To use this example:
 * 1. Create the add-on: bld addons:create schema-to-go
 * 2. Install pg: npm install pg
 * 3. Replace the contents of src/server.js with this file
 * 4. Deploy: git push build main
 */

const express = require('express');
const { Pool } = require('pg');

const app = express();

// ============================================
// CONFIGURATION
// ============================================
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_NAME = process.env.APP_NAME || 'web-app-template';

// Build.io sets DATABASE_URL when you create the schema-to-go add-on
const DATABASE_URL = process.env.DATABASE_URL;

// ============================================
// DATABASE SETUP
// ============================================
let pool;

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  // Test connection and create table if not exists
  pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  .then(() => console.log('✅ PostgreSQL connected and table ready'))
  .catch(err => console.error('❌ PostgreSQL error:', err.message));
} else {
  console.log('⚠️ No DATABASE_URL set - database not connected');
  console.log('   Run: bld addons:create schema-to-go');
  console.log('   Then restart your app: bld ps:restart');
}

// ============================================
// MIDDLEWARE
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ============================================
// ROUTES
// ============================================

/**
 * HOME PAGE
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to PostgreSQL Example!',
    app: APP_NAME,
    env: NODE_ENV,
    database: DATABASE_URL ? 'connected' : 'not configured',
    endpoints: {
      health: '/health',
      items: {
        list: 'GET /api/items',
        create: 'POST /api/items',
        get: 'GET /api/items/:id',
        update: 'PUT /api/items/:id',
        delete: 'DELETE /api/items/:id'
      }
    }
  });
});

/**
 * HEALTH CHECK (Required by Build.io)
 */
app.get('/health', async (req, res) => {
  try {
    let dbStatus = 'not configured';
    
    if (pool) {
      await pool.query('SELECT 1');
      dbStatus = 'healthy';
    }
    
    res.status(200).json({
      status: 'healthy',
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * API: LIST ALL ITEMS
 */
app.get('/api/items', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Database not configured. Run: bld addons:create schema-to-go'
      });
    }
    
    const result = await pool.query(
      'SELECT * FROM items ORDER BY created_at DESC'
    );
    
    res.json({
      message: 'Items retrieved successfully',
      count: result.rowCount,
      items: result.rows
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      error: 'Database Error',
      message: NODE_ENV === 'production' ? 'Internal Server Error' : error.message
    });
  }
});

/**
 * API: CREATE ITEM
 */
app.post('/api/items', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Database not configured. Run: bld addons:create schema-to-go'
      });
    }
    
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name is required'
      });
    }
    
    const result = await pool.query(
      'INSERT INTO items (name) VALUES ($1) RETURNING *',
      [name]
    );
    
    res.status(201).json({
      message: 'Item created successfully',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      error: 'Database Error',
      message: NODE_ENV === 'production' ? 'Internal Server Error' : error.message
    });
  }
});

/**
 * API: GET SINGLE ITEM
 */
app.get('/api/items/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Database not configured. Run: bld addons:create schema-to-go'
      });
    }
    
    const result = await pool.query(
      'SELECT * FROM items WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Item not found'
      });
    }
    
    res.json({
      message: 'Item retrieved successfully',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      error: 'Database Error',
      message: NODE_ENV === 'production' ? 'Internal Server Error' : error.message
    });
  }
});

/**
 * API: UPDATE ITEM
 */
app.put('/api/items/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Database not configured. Run: bld addons:create schema-to-go'
      });
    }
    
    const { name, completed } = req.body;
    
    const result = await pool.query(
      'UPDATE items SET name = COALESCE($1, name), completed = COALESCE($2, completed) WHERE id = $3 RETURNING *',
      [name, completed, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Item not found'
      });
    }
    
    res.json({
      message: 'Item updated successfully',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      error: 'Database Error',
      message: NODE_ENV === 'production' ? 'Internal Server Error' : error.message
    });
  }
});

/**
 * API: DELETE ITEM
 */
app.delete('/api/items/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Database not configured. Run: bld addons:create schema-to-go'
      });
    }
    
    const result = await pool.query(
      'DELETE FROM items WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Item not found'
      });
    }
    
    res.json({
      message: 'Item deleted successfully',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      error: 'Database Error',
      message: NODE_ENV === 'production' ? 'Internal Server Error' : error.message
    });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  const message = NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: message
  });
});

// ============================================
// SERVER STARTUP
// ============================================

const server = app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(` Server: ${APP_NAME}`);
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${NODE_ENV}`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (pool) {
    pool.end(() => {
      console.log('PostgreSQL pool closed');
    });
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
