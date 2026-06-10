/**
 * Web App Template for Build.io
 *
 * This is a zero-dependency starter.  It uses only Node's built-in `http`
 * module so it deploys immediately even before `npm install` is run.
 *
 * After cloning locally you can add Express + MongoDB:
 *   npm install express mongoose
 *   git add -A && git commit -m "Add express and mongoose"
 *   git push build main
 */

const http = require("http");
const url  = require("url");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  res.setHeader("Content-Type", "application/json");

  if (parsed.pathname === "/health") {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: "healthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
    return;
  }

  res.writeHead(200);
  res.end(JSON.stringify({
    message: "Welcome to your web app!",
    mode: "zero-dependency",
    note: "Install express + mongoose locally to upgrade to full CRUD mode.",
    endpoints: {
      health: "GET /health"
    },
    nextSteps: [
      "1. npm install express mongoose",
      "2. Replace server.js with your Express app",
      "3. git add -A && git commit -m 'Add express'",
      "4. git push build main"
    ]
  }, null, 2));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
