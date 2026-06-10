# Database Examples

This folder contains ready-to-use database examples for the `aiandlabs-web-app-template`.

## How to Use

1. Choose your database type (MongoDB or PostgreSQL)
2. Install the Build.io add-on
3. Copy the example to `src/server.js`
4. Install the database driver
5. Deploy!

---

## MongoDB (donkey-to-go)

### Quick Start

```bash
# 1. Enable MongoDB add-on
bld addons:create donkey-to-go

# 2. Install driver
npm install mongoose

# 3. Copy example
cp examples/mongodb-example.js src/server.js

# 4. Commit & deploy
git add -A
git commit -m "Add MongoDB support"
git push build main
```

### What Happens
- Build.io creates a MongoDB instance automatically
- Sets `MONGODB_URL` environment variable
- Your app connects on startup
- Full CRUD API available at `/api/items`

### Customizing the Schema

```javascript
// In mongodb-example.js, modify the schema:
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  priority: { type: Number, default: 1 },
  tags: [String],
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
```

---

## PostgreSQL (schema-to-go)

### Quick Start

```bash
# 1. Enable PostgreSQL add-on
bld addons:create schema-to-go

# 2. Install driver
npm install pg

# 3. Copy example
cp examples/postgresql-example.js src/server.js

# 4. Commit & deploy
git add -A
git commit -m "Add PostgreSQL support"
git push build main
```

### What Happens
- Build.io creates a PostgreSQL instance
- Sets `DATABASE_URL` environment variable
- Your app auto-creates tables on startup
- Full CRUD API available at `/api/items`

### Customizing the Schema

```javascript
// In postgresql-example.js, modify the table:
pool.query(`
  CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 1,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`)
```

---

## API Endpoints (Both Examples)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Home page with app info |
| GET | `/health` | Health check (includes DB status) |
| GET | `/api/items` | List all items |
| POST | `/api/items` | Create new item |
| GET | `/api/items/:id` | Get single item |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |

### Testing the API

```bash
# Create an item
curl -X POST https://your-app.onbld.com/api/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Learn Build.io"}'

# List items
curl https://your-app.onbld.com/api/items

# Update item
curl -X PUT https://your-app.onbld.com/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Delete item
curl -X DELETE https://your-app.onbld.com/api/items/1
```

---

## Environment Variables

### MongoDB (donkey-to-go)
```bash
# Check the URL
bld config | grep MONGODB_URL

# Output: MONGODB_URL=mongodb://user:pass@host:port/db
```

### PostgreSQL (schema-to-go)
```bash
# Check the URL
bld config | grep DATABASE_URL

# Output: DATABASE_URL=postgres://user:pass@host:port/db
```

---

## Managing Add-ons

```bash
# List your add-ons
bld addons

# Attach an add-on to a different app
bld addons:attach <addon-name> --app other-app

# Detach add-on from app
bld addons:detach <addon-name>

# View add-on info
bld addons:info <addon-name>
```

---

## Back to Basic Template

If you want to go back to the simple template without a database:

```bash
# Reset to basic server
cp examples/backup/server.js src/server.js

# Or just remove DB driver from package.json
# and delete the examples folder
```

---

## Tips

1. **Always test locally first** - The database will be local if you set `MONGODB_URL` or `DATABASE_URL` locally
2. **Check logs after deployment** - If database fails to connect, `bld logs --tail` will show why
3. **Database URLs are secrets** - They're automatically set as environment variables, never hardcode them
4. **Connection pooling** - Both examples use connection pooling for performance
5. **SSL/TLS** - Production connections use SSL automatically (handled by Build.io)

---

## Troubleshooting

### "Database not configured"
Check if add-on was created:
```bash
bld addons
```

### "Connection refused"
App might have started before add-on was ready. Restart:
```bash
bld ps:restart
```

### "Missing module"
Forgot to install driver. Add to package.json:
```bash
npm install pg  # for PostgreSQL
# OR
npm install mongoose  # for MongoDB

git add package.json package-lock.json
git commit -m "Add database driver"
git push build main
```

---

## Other Database Options

Build.io also supports:
- **MariaDB** (`ave-to-go`) - MySQL-compatible
- **Redis** (`cache-to-go`) - In-memory cache
- **SQL Server** (`sequel-to-go`) - Microsoft SQL Server
- **ElasticSearch** (`spandex-to-go`) - Search engine

See [Build.io Docs](https://build.io) for more details.
