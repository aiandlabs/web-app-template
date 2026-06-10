# Web App Template for Build.io

A production-ready Express.js template for deploying web applications to [Build.io](https://build.io).

## Prerequisites (Before You Start!)

Before using this template, make sure you have:

1. **Node.js 18+** and **npm** installed
   ```bash
   node -v  # Should show v18.x.x or higher
   npm -v   # Should work
   ```

2. **Git** installed
   ```bash
   git --version
   ```

3. **Build.io account** (ask your team lead to invite you)

4. **`bld` CLI** installed (the Build.io command-line tool)
   ```bash
   bld --version
   ```
   If not found, download from [Build.io](https://build.io)

5. **GitHub access** (if your team uses GitHub)
   - Have a GitHub account
   - SSH key set up: `ssh -T git@github.com` should work

> **⚠️ Can't install these yourself?** Ask your team lead — they should set these up before you start.

---

## Quick Start (for Interns)

### Option 1: Use GitHub Template (Recommended)

Click the green **"Use this template"** button at the top of this page, or visit:
👉 **[https://github.com/aiandlabs/web-app-template/generate](https://github.com/aiandlabs/web-app-template/generate)**

Then:
1. Give your repo a name (e.g., `my-first-app`)
2. Choose public or private
3. Click **"Create repository from template"**
4. Clone it locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/my-first-app.git
   cd my-first-app
   ```

### Option 2: Manual Copy

```bash
# Clone manually instead of using template button
git clone https://github.com/aiandlabs/web-app-template.git my-new-app
cd my-new-app
rm -rf .git
git init
```

> ⚠️ **Don't fork!** Forks are for contributing back to this repo. Use **"Use this template"** to create your own independent copy.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Locally

```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

### 4. Test Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Home page with app info |
| `/health` | GET | **Required by Build.io** - Health check |
| `/api/info` | GET | Application information |
| `/api/echo` | POST | Example POST endpoint |

### 5. Deploy to Build.io

```bash
# Step 1: Create app on Build.io
bld apps:create my-new-app

# Step 2: Set environment variables (optional)
bld config:set NODE_ENV=production APP_NAME=my-new-app

# Step 3: Push code
# Make sure your remote is set up:
git remote add build https://git.build.io/my-new-app.git

# Deploy!
git push build main

# Step 4: Get your URL
bld apps:info my-new-app
```

## Project Structure

```
web-app-template/
├── src/
│   └── server.js          # Main application file
├── package.json           # Dependencies and scripts
├── Procfile               # Tells Build.io how to run your app
├── .gitignore             # Files to ignore in git
└── README.md             # This file
```

## Important Files Explained

### `package.json`
- Lists your app dependencies
- `scripts.start` is what Build.io runs to start your app
- `engines.node` specifies the Node.js version

### `Procfile`
- Tells Build.io which command to run
- Format: `web: <command>`
- Example: `web: node src/server.js`

### `.gitignore`
- Prevents sensitive files from being committed
- **Never commit**: node_modules, .env files, logs

### `src/server.js`
- Main application entry point
- Includes:
  - Express setup
  - Middleware (JSON parsing, logging)
  - Routes (endpoints)
  - Error handling
  - Graceful shutdown

## Adding New Endpoints

```javascript
// In src/server.js, add after existing routes:

app.get('/api/my-feature', (req, res) => {
  res.json({ 
    message: 'My feature is working!',
    data: [1, 2, 3]
  });
});

app.post('/api/users', (req, res) => {
  const user = req.body;
  // Save user to database, etc.
  res.status(201).json({ 
    message: 'User created',
    user: user
  });
});
```

## Environment Variables

Build.io automatically sets `PORT`. You can add your own:

```bash
# Set a config variable
bld config:set API_KEY=secret123

# Set multiple at once
bld config:set DATABASE_URL=mongodb://... JWT_SECRET=mysecret

# List all config vars
bld config:list

# Remove a config var
bld config:unset API_KEY
```

Access in code:
```javascript
const apiKey = process.env.API_KEY;
const dbUrl = process.env.DATABASE_URL;
```

## Common Commands

### Local Development
```bash
npm run dev          # Start development server
```

### Build.io Commands
```bash
bld login            # Login to Build.io
bld whoami           # Check logged-in user
bld apps:list        # List your apps
bld apps:info my-app # Show app details
bld logs --tail      # View app logs (streaming)
bld ps:restart       # Restart your app
bld ps:scale web=2   # Scale to 2 dynos
```

### Git Commands
```bash
git status           # Check changed files
git add .            # Stage all changes
git commit -m "..."  # Commit changes
git push build main  # Deploy to Build.io
```

## Health Check (Very Important!)

Build.io requires a `/health` endpoint that returns HTTP 200:

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});
```

**If this fails, Build.io will restart your app!**

## Error Handling

The template includes error handling. To add custom errors:

```javascript
// Create custom error
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

// Use in route
app.post('/api/users', (req, res, next) => {
  if (!req.body.email) {
    return next(new ValidationError('Email is required'));
  }
  // ...
});
```

## Adding a Database

Build.io provides managed databases and services. All add-ons set environment variables automatically—no manual configuration needed!

### Quick Start

```bash
# Choose your database and create the add-on:
bld addons:create donkey-to-go    # MongoDB
bld addons:create schema-to-go    # PostgreSQL
bld addons:create ave-to-go       # MariaDB (MySQL-compatible)
bld addons:create cache-to-go     # Redis cache

# Then restart your app to pick up new env vars:
bld ps:restart
```

### MongoDB (donkey-to-go)
```bash
# 1. Create add-on
bld addons:create donkey-to-go

# 2. Install driver
npm install mongoose

# 3. Use in code
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URL);
```

### PostgreSQL (schema-to-go)
```bash
# 1. Create add-on
bld addons:create schema-to-go

# 2. Install driver
npm install pg

# 3. Use in code
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

### All Available Add-ons

| Add-on | Service | Environment Variable | Driver |
|--------|---------|----------------------|--------|
| `donkey-to-go` | MongoDB | `MONGODB_URL` | `mongoose` |
| `schema-to-go` | PostgreSQL | `DATABASE_URL` | `pg` |
| `ave-to-go` | MariaDB (MySQL) | `DATABASE_URL` | `mysql2` |
| `cache-to-go` | Redis Cache | `REDIS_URL` | `redis` |
| `mailertogo` | Email Service | `MAILERTOGO_URL` | `nodemailer` |
| `sftptogo` | SFTP Storage | `SFTPTOGO_URL` | `ssh2-sftp-client` |
| `crontogo` | Job Scheduler | — | — |
| `infer-to-go` | AI Inference | `INFER_URL` | `openai` |

### Database Examples

Ready-to-use examples are in the `examples/` folder:
- `examples/mongodb-example.js` - Full CRUD with MongoDB & Mongoose
- `examples/postgresql-example.js` - Full CRUD with PostgreSQL

```bash
# To use an example:
cp examples/mongodb-example.js src/server.js
npm install mongoose
bld addons:create donkey-to-go
git add -A && git commit -m "Add MongoDB support"
git push build main
```

## Troubleshooting

### App Won't Start
1. Check logs: `bld logs --tail`
2. Verify `PORT` is used: `const PORT = process.env.PORT || 3000`
3. Check `Procfile` exists and is correct

### Health Check Fails
1. Ensure `/health` returns 200
2. Check if app crashes on startup
3. Verify all dependencies are in `package.json`

### Deployment Fails
1. Make sure you committed all changes: `git status`
2. Check if `npm install` works locally
3. Verify git remote: `git remote -v`

## Best Practices

1. **Never commit secrets** - Use environment variables
2. **Always handle errors** - Use try/catch and error middleware
3. **Log important events** - Use console.log for debugging
4. **Test locally first** - Run `npm run dev` before deploying
5. **Use version control** - Commit often with clear messages
6. **Monitor logs** - Check `bld logs` after deployment

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [Build.io Documentation](https://docs.build.io)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## License

MIT
