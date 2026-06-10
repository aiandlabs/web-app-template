/**
 * Web App Template for Build.io
 *
 * This template comes with MongoDB support built-in.
 * To enable the database:
 *   bld addons:create donkey-to-go
 *   bld ps:restart
 */

const express = require("express");
const mongoose = require("mongoose");

// ============================================================
// CONFIGURATION
// ============================================================
const PORT   = process.env.PORT || 3000;
const env    = process.env.NODE_ENV || "development";
const appName= process.env.APP_NAME || "my-app";
const mongoUrl = process.env.MONGODB_URL;

// ============================================================
// DATABASE (Mongoose)
// ============================================================
let connected = false;

// Define your data model — interns can add more fields here
const ItemSchema = new mongoose.Schema({
  name      : { type: String, required: true },
  completed : { type: Boolean, default: false },
  createdAt : { type: Date, default: Date.now }
});

const Item = mongoose.model("Item", ItemSchema);

async function connectDB() {
  if (!mongoUrl) {
    console.log("⚠️  No MONGODB_URL — add-on not attached.");
    console.log("   Run: bld addons:create donkey-to-go");
    return;
  }
  try {
    await mongoose.connect(mongoUrl);
    connected = true;
    console.log("✅  MongoDB connected");
  } catch (err) {
    console.error("❌  MongoDB connection failed:", err.message);
  }
}

// ============================================================
// EXPRESS APP
// ============================================================
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ============================================================
// ROUTES
// ============================================================

// --- Home ----------------------------------------------------
app.get("/", async (_req, res) => {
  let count = 0;
  if (connected) {
    try { count = await Item.countDocuments(); } catch (_) { /* ignore */ }
  }

  res.json({
    message: `Welcome to ${appName}!`,
    environment: env,
    database: connected ? "connected" : "not configured",
    itemCount: count,
    endpoints: {
      health: "GET /health",
      items : {
        list   : "GET    /api/items",
        create : "POST   /api/items",
        get    : "GET    /api/items/:id",
        update : "PUT    /api/items/:id",
        delete : "DELETE /api/items/:id"
      }
    }
  });
});

// --- Health (Build.io requires this) -------------------------
app.get("/health", async (_req, res) => {
  let dbStatus = "not configured";
  if (mongoUrl) {
    dbStatus = connected && mongoose.connection.readyState === 1
      ? "healthy"
      : "unhealthy";
  }

  res.status(200).json({
    status: "healthy",
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// --- CRUD: List ----------------------------------------------
app.get("/api/items", async (_req, res, next) => {
  if (!connected) {
    return res.status(503).json({ error: "Database not configured" });
  }
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json({ count: items.length, items });
  } catch (err) { next(err); }
});

// --- CRUD: Create --------------------------------------------
app.post("/api/items", async (req, res, next) => {
  if (!connected) {
    return res.status(503).json({ error: "Database not configured" });
  }
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const item = await Item.create({ name });
    res.status(201).json({ message: "Created", item });
  } catch (err) { next(err); }
});

// --- CRUD: Read ----------------------------------------------
app.get("/api/items/:id", async (req, res, next) => {
  if (!connected) {
    return res.status(503).json({ error: "Database not configured" });
  }
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ item });
  } catch (err) { next(err); }
});

// --- CRUD: Update --------------------------------------------
app.put("/api/items/:id", async (req, res, next) => {
  if (!connected) {
    return res.status(503).json({ error: "Database not configured" });
  }
  try {
    const { name, completed } = req.body;
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { name, completed },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Updated", item });
  } catch (err) { next(err); }
});

// --- CRUD: Delete --------------------------------------------
app.delete("/api/items/:id", async (req, res, next) => {
  if (!connected) {
    return res.status(503).json({ error: "Database not configured" });
  }
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted", item });
  } catch (err) { next(err); }
});

// ============================================================
// ERROR HANDLING
// ============================================================

app.use((_req, res) => {
  res.status(404).json({ error: "Not found", path: _req.url });
});

app.use((err, _req, res, _next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: "Internal server error",
    message: env === "production" ? "Something went wrong" : err.message
  });
});

// ============================================================
// START SERVER
// ============================================================

async function main() {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log("\n" + "=".repeat(50));
    console.log(` 🚀  ${appName}`);
    console.log(` 📍  http://localhost:${PORT}`);
    console.log(` 🔧  ${env}`);
    if (!connected) console.log(` 💡  Run: bld addons:create donkey-to-go`);
    console.log("=".repeat(50) + "\n");
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("\n⚠️  SIGTERM received — closing...");
    server.close(async () => {
      if (connected) await mongoose.connection.close();
      console.log("👋  Bye!");
      process.exit(0);
    });
  });
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
