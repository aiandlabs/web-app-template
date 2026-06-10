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

  // ─── HTML helper ───────────────────────────────────────────────
  const layout = (title, body) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; background:#0f172a; color:#e2e8f0; line-height:1.6; min-height:100vh; display:flex; flex-direction:column; }
    header { background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%); padding:3rem 1rem 2rem; text-align:center; }
    header h1 { font-size:2.5rem; color:#fff; margin-bottom:.5rem; }
    header p { color:rgba(255,255,255,.85); font-size:1.15rem; }
    .container { max-width:860px; margin:0 auto; padding:2rem 1rem; flex:1; }
    .card { background:#1e293b; border:1px solid #334155; border-radius:1rem; padding:1.5rem; margin-bottom:1.5rem; }
    .card h2 { color:#a78bfa; margin-bottom:.75rem; font-size:1.35rem; }
    .badge { display:inline-block; padding:.25rem .6rem; border-radius:999px; font-size:.85rem; font-weight:600; }
    .badge.ok  { background:#22c55e22; color:#4ade80; border:1px solid #22c55e44; }
    .badge.warn{ background:#eab30822; color:#facc15; border:1px solid #eab30844; }
    .badge.err { background:#ef444422; color:#f87171; border:1px solid #ef444444; }
    table { width:100%; border-collapse:collapse; font-size:.95rem; }
    th, td { padding:.65rem .5rem; text-align:left; border-bottom:1px solid #334155; }
    th { color:#94a3b8; font-weight:500; }
    code { background:#0f172a; padding:.15rem .35rem; border-radius:.35rem; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,monospace; font-size:.85em; color:#c4b5fd; }
    pre { background:#0f172a; padding:1rem; border-radius:.6rem; overflow-x:auto; border:1px solid #334155; }
    pre code { background:none; padding:0; font-size:.85rem; }
    a { color:#a78bfa; }
    footer { text-align:center; padding:1.5rem; font-size:.85rem; color:#64748b; }
    .count { font-size:2rem; font-weight:700; color:#fff; }
    .count-label { font-size:.9rem; color:#94a3b8; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1rem; margin-top:1rem; }
    .stat { text-align:center; padding:1rem; }
  </style>
</head>
<body>
  ${body}
  <footer>
    Built with the <a href="https://github.com/aiandlabs/web-app-template" target="_blank">aiandlabs/web-app-template</a> &middot; Deployed on <a href="https://build.io" target="_blank">Build.io</a>
  </footer>
</body>
</html>`;

  function htmlHome(itemCount, dbStatus) {
    const badge = dbStatus === "healthy" ? "ok" : dbStatus === "connected" ? "ok" : "warn";
    return layout("My Web App", `
<header>
  <h1>Welcome to ${appName}</h1>
  <p>A simple web app template running on Build.io with MongoDB support</p>
</header>
<div class="container">
  <div class="grid">
    <div class="stat card">
      <div class="count">${itemCount}</div>
      <div class="count-label">Items in Database</div>
    </div>
    <div class="stat card">
      <div class="count"><span class="badge ${badge}">${dbStatus}</span></div>
      <div class="count-label">Database Status</div>
    </div>
  </div>

  <div class="card">
    <h2>Quick Start</h2>
    <p>This app is running in <strong>Express mode</strong> with a MongoDB backend.</p>
    <ol style="margin-left:1.2rem;margin-top:.75rem;">
      <li>View the <a href="/api">API Documentation</a> to explore endpoints.</li>
      <li>Try creating an item with <code>POST /api/items</code>.</li>
      <li>Check the <a href="/health">health endpoint</a> for status.</li>
    </ol>
  </div>

  <div class="card">
    <h2>Available Endpoints</h2>
    <table>
      <tr><th>Method</th><th>Path</th><th>Description</th></tr>
      <tr><td><code>GET</code></td><td><a href="/">/</a></td><td>This page</td></tr>
      <tr><td><code>GET</code></td><td><a href="/health">/health</a></td><td>Health check</td></tr>
      <tr><td><code>GET</code></td><td><a href="/api">/api</a></td><td>API docs (JSON)</td></tr>
      <tr><td><code>GET</code></td><td><code>/api/items</code></td><td>List all items</td></tr>
      <tr><td><code>POST</code></td><td><code>/api/items</code></td><td>Create item</td></tr>
      <tr><td><code>GET</code></td><td><code>/api/items/:id</code></td><td>Get single item</td></tr>
      <tr><td><code>PUT</code></td><td><code>/api/items/:id</code></td><td>Update item</td></tr>
      <tr><td><code>DELETE</code></td><td><code>/api/items/:id</code></td><td>Delete item</td></tr>
    </table>
  </div>

  <div class="card">
    <h2>Example API Call</h2>
    <pre><code>curl -X POST https://your-app.onbld.com/api/items \\
  -H "Content-Type: application/json" \\
  -d '{"name":"My first task"}'</code></pre>
  </div>
</div>`);
  }

  function htmlApiDocs() {
    return layout("API Docs", `
<header>
  <h1>API Documentation</h1>
  <p>RESTful JSON API for items stored in MongoDB</p>
</header>
<div class="container">
  <div class="card">
    <h2>Base URL</h2>
    <code>/api</code>
  </div>

  <div class="card">
    <h2>Endpoints</h2>

    <h3 style="margin-top:1rem;color:#c4b5fd;">GET /api/items</h3>
    <p>List all items.</p>
    <pre><code>curl https://your-app.onbld.com/api/items</code></pre>
    <p><strong>Response:</strong></p>
    <pre><code>{
  "count": 2,
  "items": [
    { "_id": "...", "name": "Task 1", "completed": false, "createdAt": "..." }
  ]
}</code></pre>

    <h3 style="margin-top:1.5rem;color:#c4b5fd;">POST /api/items</h3>
    <p>Create a new item.</p>
    <pre><code>curl -X POST https://your-app.onbld.com/api/items \\
  -H "Content-Type: application/json" \\
  -d '{"name":"My task"}'</code></pre>
    <p><strong>Response (201):</strong></p>
    <pre><code>{ "_id": "...", "name": "My task", "completed": false, "createdAt": "..." }</code></pre>

    <h3 style="margin-top:1.5rem;color:#c4b5fd;">GET /api/items/:id</h3>
    <pre><code>curl https://your-app.onbld.com/api/items/64abc...</code></pre>

    <h3 style="margin-top:1.5rem;color:#c4b5fd;">PUT /api/items/:id</h3>
    <pre><code>curl -X PUT https://your-app.onbld.com/api/items/64abc... \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Updated","completed":true}'</code></pre>

    <h3 style="margin-top:1.5rem;color:#c4b5fd;">DELETE /api/items/:id</h3>
    <pre><code>curl -X DELETE https://your-app.onbld.com/api/items/64abc...</code></pre>
  </div>
</div>`);
  }

  // ─── Routes ────────────────────────────────────────────────────
  app.get("/", async (_req, res) => {
    let count = 0;
    if (connected) try { count = await Item.countDocuments(); } catch (_) {}
    const dbStatus = connected ? "healthy" : mongoUrl ? "disconnected" : "not configured";
    res.send(htmlHome(count, dbStatus));
  });

  app.get("/api", (_req, res) => {
    res.send(htmlApiDocs());
  });

  app.get("/health", async (_req, res) => {
    const dbStatus = mongoUrl
      ? (connected && mongoose.connection.readyState === 1 ? "healthy" : "unhealthy")
      : "not configured";
    res.json({ status: "healthy", database: dbStatus, uptime: process.uptime() });
  });

  // CRUD (check `connected` at request time)
  const dbGuard = (_req, res) => res.status(503).json({ error: "Database not configured. Run: bld addons:create donkey-to-go --app my-app" });

  app.get("/api/items", async (_req, res) => {
    if (!connected) return dbGuard(_req, res);
    res.json({ count: await Item.countDocuments(), items: await Item.find().sort({ createdAt: -1 }) });
  });

  app.post("/api/items", async (req, res) => {
    if (!connected) return dbGuard(req, res);
    if (!req.body?.name) return res.status(400).json({ error: "name is required" });
    res.status(201).json(await Item.create({ name: req.body.name }));
  });

  app.get("/api/items/:id", async (req, res) => {
    if (!connected) return dbGuard(req, res);
    const item = await Item.findById(req.params.id);
    item ? res.json(item) : res.status(404).json({ error: "Not found" });
  });

  app.put("/api/items/:id", async (req, res) => {
    if (!connected) return dbGuard(req, res);
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    item ? res.json(item) : res.status(404).json({ error: "Not found" });
  });

  app.delete("/api/items/:id", async (req, res) => {
    if (!connected) return dbGuard(req, res);
    await Item.findByIdAndDelete(req.params.id);
    res.json({ deleted: true });
  });

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

    if (parsed.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "healthy", uptime: process.uptime(), timestamp: new Date().toISOString() }));
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${appName} — Zero-Dependency Mode</title>
<style>
 *{box-sizing:border-box;margin:0;padding:0}
 body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0f172a;color:#e2e8f0;line-height:1.6;min-height:100vh;display:flex;flex-direction:column}
 header{background:linear-gradient(135deg,#475569 0%,#334155 100%);padding:3rem 1rem 2rem;text-align:center}
 header h1{font-size:2.5rem;color:#fff;margin-bottom:.5rem}
 header p{color:rgba(255,255,255,.85);font-size:1.15rem}
 .container{max-width:760px;margin:0 auto;padding:2rem 1rem;flex:1}
 .card{background:#1e293b;border:1px solid #334155;border-radius:1rem;padding:1.5rem;margin-bottom:1.5rem}
 .card h2{color:#a78bfa;margin-bottom:.75rem;font-size:1.35rem}
 .badge{display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.85rem;font-weight:600}
 .badge.ok{background:#22c55e22;color:#4ade80;border:1px solid #22c55e44}
 .badge.warn{background:#eab30822;color:#facc15;border:1px solid #eab30844}
 pre{background:#0f172a;padding:1rem;border-radius:.6rem;overflow-x:auto;border:1px solid #334155;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,monospace;font-size:.85rem;color:#c4b5fd}
 code{color:#c4b5fd}
 a{color:#a78bfa}
 ol{margin-left:1.2rem;margin-top:.75rem}
 ol li{margin-bottom:.4rem}
 footer{text-align:center;padding:1.5rem;font-size:.85rem;color:#64748b}
</style>
</head>
<body>
<header>
  <h1>Welcome to ${appName}</h1>
  <p>This app is running in <strong>zero-dependency mode</strong> — no packages installed yet.</p>
</header>
<div class="container">
  <div class="card">
    <h2>Status</h2>
    <p>Database add-on: ${mongoUrl ? '<span class="badge ok">attached</span>' : '<span class="badge warn">not attached</span>'}</p>
  </div>

  <div class="card">
    <h2>Quick Start</h2>
    <ol>
      <li>Install dependencies locally:<br><pre>npm install express mongoose</pre></li>
      <li>Commit the lockfile and node_modules:<br><pre>git add -A && git commit -m "Add express and mongoose"</pre></li>
      <li>Deploy!<br><pre>git push build main</pre></li>
    </ol>
  </div>

  <div class="card">
    <h2>API Endpoints</h2>
    <p>Once upgraded, these will be available:</p>
    <ul style="margin-left:1.2rem;margin-top:.5rem">
      <li><code>GET  /health</code> — Health check</li>
      <li><code>GET  /api</code> — API documentation</li>
      <li><code>GET  /api/items</code> — List items</li>
      <li><code>POST /api/items</code> — Create item</li>
      <li><code>GET  /api/items/:id</code> — Get item</li>
      <li><code>PUT  /api/items/:id</code> — Update item</li>
      <li><code>DELETE /api/items/:id</code> — Delete item</li>
    </ul>
  </div>
</div>
<footer>
  Built with the <a href="https://github.com/aiandlabs/web-app-template" target="_blank">aiandlabs/web-app-template</a> &middot; Deployed on <a href="https://build.io" target="_blank">Build.io</a>
</footer>
</body>
</html>`);
  });

  server.listen(PORT, () => console.log(`🚀  ${appName} (zero-dep) on port ${PORT}`));
}
