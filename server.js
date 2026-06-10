/**
 * Web App Template for Build.io
 *
 * Phase 1 (default): Zero dependencies — uses Node's built-in `http` module.
 *   Deploys instantly. Works even before `npm install`.
 *
 * Phase 2 (after `npm install express mongoose` locally):
 *   Upgrades to Express + Mongoose CRUD automatically.
 *
 * Why this two-phase approach?
 *   Build.io's Heroku buildpack runs `npm ci` when package-lock.json exists.
 *   If the lockfile is fake/malformed, `npm ci` fails and NO node_modules
 *   are installed, causing "Cannot find module 'express'" crashes.
 *   By starting with NO dependencies, the first deploy always succeeds.
 *   Interns then run `npm install` locally (generating a REAL lockfile),
 *   and subsequent pushes install correctly.
 */

const http = require("http");
const url  = require("url");

const PORT    = process.env.PORT || 3000;
const env     = process.env.NODE_ENV || "development";
const appName = process.env.APP_NAME || "my-app";
const mongoUrl= process.env.DONKEY_TO_GO_URL;  // Set by Build.io add-on

// Attempt to load optional dependencies (available after `npm install`)
let express, mongoose, Item, connected = false;
try {
  express  = require("express");
  mongoose = require("mongoose");
} catch (_) { /* not installed yet — that's fine */ }

// ===================================================================
// PHASE 2: Express + MongoDB (runs when express & mongoose installed)
// ===================================================================
if (express && mongoose) {
  const app = express();
  app.use(express.json());

  // Connect to MongoDB if add-on is attached
  async function connectDB() {
    if (!mongoUrl) return;
    try {
      await mongoose.connect(mongoUrl);
      connected = true;
      console.log("✅  MongoDB connected");
    } catch (err) {
      console.error("❌  MongoDB failed:", err.message);
    }
  }

  // Schema + model
  const ItemSchema = new mongoose.Schema({
    name      : { type: String, required: true },
    completed : { type: Boolean, default: false },
    createdAt : { type: Date, default: Date.now }
  });
  Item = mongoose.model("Item", ItemSchema);

  // Routes
  app.get("/", async (_req, res) => {
    let count = 0;
    if (connected) {
      try { count = await Item.countDocuments(); } catch (_) {}
    }
    res.json({
      message: `Welcome to ${appName} (Express mode)!`,
      database: connected ? "connected" : mongoUrl ? "disconnected" : "not configured",
      itemCount: count,
      endpoints: {
        health: "GET /health",
        items : { list: "GET /api/items", create: "POST /api/items", get: "GET /api/items/:id", update: "PUT /api/items/:id", delete: "DELETE /api/items/:id" }
      }
    });
  });

  app.get("/health", async (_req, res) => {
    const dbStatus = mongoUrl
      ? (connected && mongoose.connection.readyState === 1 ? "healthy" : "unhealthy")
      : "not configured";
    res.json({ status: "healthy", database: dbStatus, uptime: process.uptime() });
  });

  // CRUD (guard when DB not connected)
  const guard = (_req, res) => res.status(503).json({ error: "Database not configured" });

  app.get("/api/items",  connected ? async (_req, res) => res.json({ count: await Item.countDocuments(), items: await Item.find().sort({ createdAt: -1 }) }) : guard);
  app.post("/api/items", connected ? async (req, res) => { const item = await Item.create({ name: req.body.name }); res.status(201).json(item); } : guard);
  app.get("/api/items/:id", connected ? async (req, res) => { const item = await Item.findById(req.params.id); item ? res.json(item) : res.status(404).json({ error: "Not found" }); } : guard);
  app.put("/api/items/:id", connected ? async (req, res) => { const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true }); item ? res.json(item) : res.status(404).json({ error: "Not found" }); } : guard);
  app.delete("/api/items/:id", connected ? async (req, res) => { await Item.findByIdAndDelete(req.params.id); res.json({ deleted: true }); } : guard);

  app.use((_req, res) => res.status(404).json({ error: "Not found" }));

  // Start
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`🚀  ${appName} (Express) on port ${PORT}`));
  });

// ===================================================================
// PHASE 1: Built-in http (zero dependencies)
// ===================================================================
} else {
  const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);
    res.setHeader("Content-Type", "application/json");

    if (parsed.pathname === "/health") {
      res.writeHead(200);
      res.end(JSON.stringify({ status: "healthy", uptime: process.uptime(), timestamp: new Date().toISOString() }));
      return;
    }

    res.writeHead(200);
    res.end(JSON.stringify({
      message: `Welcome to ${appName}!`,
      mode: "zero-dependency",
      note: "Express and Mongoose are not installed yet.",
      mongodbAddon: mongoUrl ? "attached (donkey-to-go)" : "not attached",
      instructions: [
        "1. Run 'npm install' locally to add dependencies",
        "2. Commit package-lock.json + node_modules",
        "3. git push build main"
      ],
      quickStart: {
        addMongoDB: "bld addons:create donkey-to-go --app my-app",
        installLocally: "npm install express mongoose",
        deploy: "git add -A && git commit -m 'Add deps' && git push build main"
      }
    }, null, 2));
  });

  server.listen(PORT, () => console.log(`🚀  ${appName} (zero-dep) on port ${PORT}`));
}
