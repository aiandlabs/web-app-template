/**
 * Web App Template for Build.io
 * 
 * This is a production-ready Express.js template for deploying to Build.io.
 * It includes:
 * - Health check endpoint (required by Build.io)
 * - Environment-based configuration
 * - Error handling
 * - Request logging
 * - Graceful shutdown
 * 
 * For interns: This is your starting point. Copy this folder and modify!
 */

const express = require('express');
const path = require('path');

// Create Express application
const app = express();

// ============================================
// CONFIGURATION
// ============================================
// Build.io sets PORT environment variable automatically
// Fallback to 3000 for local development
const PORT = process.env.PORT || 3000;

// You can add more environment variables here
const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_NAME = process.env.APP_NAME || 'web-app-template';

// ============================================
// MIDDLEWARE
// ============================================
// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Simple request logger (for debugging)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Serve static files from 'public' folder (if you add one)
// app.use(express.static(path.join(__dirname, '../public')));

// ============================================
// ROUTES
// ============================================

/**
 * HOME PAGE
 * Main entry point of your application
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to your web app!',
    app: APP_NAME,
    env: NODE_ENV,
    timestamp: new Date().toISOString(),
    docs: 'Visit /health for status, /api/info for app info'
  });
});

/**
 * HEALTH CHECK ENDPOINT (REQUIRED)
 * 
 * Build.io uses this to check if your app is running.
 * Must return HTTP 200 with a JSON response.
 * If this fails, Build.io will restart your app!
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

/**
 * APP INFO ENDPOINT
 * Returns information about the running application
 */
app.get('/api/info', (req, res) => {
  res.json({
    name: APP_NAME,
    version: require('../package.json').version,
    node_version: process.version,
    environment: NODE_ENV,
    platform: process.platform,
    uptime: process.uptime(),
    memory_usage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

/**
 * EXAMPLE: POST endpoint
 * Shows how to handle incoming data
 */
app.post('/api/echo', (req, res) => {
  // req.body contains the parsed JSON data
  res.json({
    message: 'Echo response',
    received: req.body,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler - when no route matches
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't leak error details in production
  const message = NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: message,
    timestamp: new Date().toISOString()
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

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
// Build.io may send SIGTERM when stopping/restarting your app
// We handle it gracefully to avoid dropping requests

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Export for testing (if needed)
module.exports = app;
