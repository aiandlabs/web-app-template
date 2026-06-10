# Deployment Guide for Interns

## Step-by-Step: Deploying Your First App

### Prerequisites
1. You have a Build.io account
2. You have the `bld` CLI installed
3. You have Git installed

> **Getting `bld`:** If you don't have the `bld` CLI installed, download it from [Build.io](https://build.io) or ask your team lead for the installer.

> **Getting an account:** Ask your team lead to invite you to the team workspace on Build.io.

---

## Phase 1: Local Setup

### 1.1 Copy the Template (Recommended)

Go to: **https://github.com/aiandlabs/web-app-template/generate**

Or click "Use this template" on the repo page, then:
1. Name your repo (e.g., `my-first-app`)
2. Choose public/private
3. Click **"Create repository from template"**
4. Clone it:
   ```bash
   git clone https://github.com/YOUR_USERNAME/my-first-app.git
   cd my-first-app
   ```

### 1.1 Alternative: Manual Copy
```bash
cp -r web-app-template my-first-app
cd my-first-app
```

### 1.2 Customize package.json
```json
{
  "name": "my-first-app",
  "description": "My awesome first app",
  "author": "Your Name <your.email@company.com>"
}
```

### 1.3 Install Dependencies
```bash
npm install
```

### 1.4 Test Locally
```bash
npm run dev
```
Open browser: http://localhost:3000

---

## Phase 2: Git Setup

### 2.1 Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit from template"
```

### 2.2 Create GitHub Repository (Optional)
Go to GitHub → New Repository → Copy the URL

```bash
git remote add origin https://github.com/yourusername/my-first-app.git
git push -u origin main
```

---

## Phase 3: Build.io Setup

### 3.1 Login
```bash
bld login
```

### 3.2 Create App
```bash
bld apps:create my-first-app
```

### 3.3 Add Build Remote
```bash
git remote add build https://git.build.io/my-first-app.git
```

### 3.4 Push and Deploy
```bash
git push build main
```

Watch the output! You should see:
```
remote: -----> Building on the Heroku-24 stack
remote: -----> Node.js app detected
remote: -----> Installing dependencies
remote:        Running npm install
remote: -----> Launching...
remote:        Released v1
remote:        https://my-first-app-xxx.onbld.com/ deployed to Build
```

### 3.5 Get Your URL
```bash
bld apps:info my-first-app
```

Output:
```
=== my-first-app
Git URL:    https://git.build.io/my-first-app.git
Region:     us-east-1
Web URL:    https://my-first-app-xxx.onbld.com
```

---

## Phase 4: Making Changes

### 4.1 Edit Your Code
Make changes to `src/server.js` or add new files.

### 4.2 Test Locally
```bash
npm run dev
```

### 4.3 Commit and Deploy
```bash
git add .
git commit -m "Add new feature"
git push build main
```

---

## Phase 5: Monitoring

### 5.1 View Logs
```bash
# Recent logs
bld logs

# Live logs (tail)
bld logs --tail

# Specific number of lines
bld logs --num 100
```

### 5.2 Check App Status
```bash
bld apps:info my-first-app
bld ps:list
```

### 5.3 Restart App
```bash
bld ps:restart
```

---

## Troubleshooting Common Issues

### Issue: "No web processes running"
**Fix:** Check your Procfile exists and has correct content:
```
web: node src/server.js
```

### Issue: "App crashed"
**Fix:** Check logs:
```bash
bld logs --tail
```
Common causes:
- Missing dependency in package.json
- Syntax error in server.js
- Port not read from environment variable

### Issue: "Cannot find module"
**Fix:** Make sure you ran `npm install` and committed `package.json`

### Issue: "Health check failed"
**Fix:** Ensure `/health` endpoint exists and returns 200:
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});
```

---

## Quick Reference Card

| Task | Command |
|------|---------|
| Start locally | `npm run dev` |
| Create app | `bld apps:create my-app` |
| Deploy | `git push build main` |
| View logs | `bld logs --tail` |
| Set config | `bld config:set KEY=value` |
| Restart | `bld ps:restart` |
| App info | `bld apps:info my-app` |
| Scale | `bld ps:scale web=2` |

---

## Checklist Before First Deploy

- [ ] App runs locally with `npm run dev`
- [ ] `/health` endpoint returns 200
- [ ] `package.json` has start script
- [ ] `Procfile` exists with correct command
- [ ] `.gitignore` ignores `node_modules/` and `.env`
- [ ] All dependencies listed in `package.json`
- [ ] Git repository initialized with at least one commit
- [ ] Build.io app created
- [ ] Git remote `build` added

---

## Example Walkthrough

Here's a complete example from scratch using the GitHub template:

```bash
# 1. Use template (go to GitHub and click "Use this template")
# Or direct link: https://github.com/aiandlabs/web-app-template/generate
# Name it: todo-app

# 2. Clone your new repo
git clone https://github.com/YOUR_USERNAME/todo-app.git
cd todo-app

# 3. Edit package.json (change name to todo-app)
# ...

# 4. Install & test
npm install
npm run dev
# (Works? Great! Press Ctrl+C)

# 5. Create on Build.io
bld apps:create todo-app

# 6. Add remotes (if not already set up)
git remote add build https://git.build.io/todo-app.git
# (Optional: git remote add origin https://github.com/YOUR_USERNAME/todo-app.git)

# 7. Commit any edits
# (Template already has an initial commit)

# 8. Deploy!
git push build main

# 9. Get URL
bld apps:info todo-app
# Output: Web URL: https://todo-app-xxx.onbld.com
```

---

Happy coding! 🚀
