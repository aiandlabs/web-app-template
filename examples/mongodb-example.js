/**
 * MongoDB Example for Build.io
 * 
 * This shows how to connect to MongoDB using the "donkey-to-go" add-on
 * 
 * To use this example:
 * 1. Create the add-on: bld addons:create donkey-to-go
 * 2. Install mongoose: npm install mongoose
 * 3. Replace the contents of src/server.js with this file
 * 4. Deploy: git push build main
 */

const express = require('express');
const mongoose = require('mongoose');

const app = express();

// ============================================
// CONFIGURATION
// ============================================
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_NAME = process.env.APP_NAME || 'web-app-template';

// Build.io sets MONGODB_URL when you create the donkey-to-go add-on
const MONGODB_URL = process.env.MONGODB_URL;

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
// MONGOOSE SCHEMA
// ============================================
// Define your data models here
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Item = mongoose.model('Item', itemSchema);

// ============================================
// ROUTES
// ============================================

/**
 * HOME PAGE
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to MongoDB Example!',
    app: APP_NAME,
    env: NODE_ENV,
    database: MONGODB_URL ? 'connected' : 'not configured',
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
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'disconnected';
    
    res.status(200).json({
      status: 'healthy',
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
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
    const items = await Item.find().sort({ createdAt: -1 });
    res.json({
      message: 'Items retrieved successfully',
      count: items.length,
      items: items
    });
  } catch (error) {
    next(error);
  }
});

/**
 * API: CREATE ITEM
 */
app.post('/api/items', async (req, res, next) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name is required'
      });
    }
    
    const item = new Item({ name });
    await item.save();
    
    res.status(201).json({
      message: 'Item created successfully',
      item: item
    });
  } catch (error) {
    next(error);
  }
});

/**
 * API: GET SINGLE ITEM
 */
app.get('/api/items/:id', async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Item not found'
      });
    }
    
    res.json({
      message: 'Item retrieved successfully',
      item: item
    });
  } catch (error) {
    next(error);
  }
});

/**
 * API: UPDATE ITEM
 */
app.put('/api/items/:id', async (req, res, next) => {
  try {
    const { name, completed } = req.body;
    
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { name, completed },
      { new: true, runValidators: true }
    );
    
    if (!item) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Item not found'
      });
    }
    
    res.json({
      message: 'Item updated successfully',
      item: item
    });
  } catch (error) {
    next(error);
  }
});

/**
 * API: DELETE ITEM
 */
app.delete('/api/items/:id', async (req, res, next) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Item not found'
      });
    }
    
    res.json({
      message: 'Item deleted successfully',
      item: item
    });
  } catch (error) {
    next(error);
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
// DATABASE CONNECTION & SERVER START
// ============================================

async function startServer() {
  try {
    if (MONGODB_URL) {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(MONGODB_URL);
      console.log('✅ MongoDB connected successfully');
    } else {
      console.log('⚠️ No MONGODB_URL set - database not connected');
      console.log('   Run: bld addons:create donkey-to-go');
      console.log('   Then restart your app: bld ps:restart');
    }
    
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
      server.close(async () => {
        if (MONGODB_URL) {
          await mongoose.connection.close();
          console.log('MongoDB connection closed');
        }
        console.log('Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
