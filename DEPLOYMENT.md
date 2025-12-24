# Backend Deployment Checklist

## Pre-Deployment

- [ ] All tests passing: `pnpm test`
- [ ] Build succeeds locally: `pnpm build`
- [ ] Environment variables documented in `.env.example`
- [ ] Prisma schema is finalized
- [ ] No hardcoded secrets in code
- [ ] CORS_ORIGIN set to production frontend URL

## Database Setup

### Using Neon (Recommended for Serverless)

1. **Create Database**
   - Go to [Neon Console](https://console.neon.tech)
   - Create new project
   - Copy connection string

2. **Configure Connection**
   - Add `?sslmode=require` to connection string
   - Example: `postgresql://user:pass@host.neon.tech/db?sslmode=require`

3. **Run Migrations**
   ```bash
   DATABASE_URL="your-neon-url" pnpm prisma:migrate:deploy
   ```

### Using Railway PostgreSQL

1. Railway auto-provisions PostgreSQL
2. Copy `DATABASE_URL` from Railway dashboard
3. Migrations run automatically on deploy

## Platform-Specific Deployment

### Option 1: Railway (Recommended)

**Pros:**
- Automatic PostgreSQL provisioning
- Simple configuration with `railway.toml`
- Built-in Redis support
- GitHub integration
- Free tier available

**Steps:**

1. **Sign Up & Connect**
   - Go to [railway.app](https://railway.app)
   - Connect GitHub account
   - Click "New Project" → "Deploy from GitHub repo"

2. **Add PostgreSQL**
   - In project dashboard: "New" → "Database" → "PostgreSQL"
   - Copy `DATABASE_URL` from Variables tab

3. **Configure Environment Variables**
   ```
   DATABASE_URL=<from Railway PostgreSQL>
   GROQ_API_KEY=<your-groq-key>
   REDIS_URL=<optional, from Railway Redis>
   CORS_ORIGIN=https://your-app.vercel.app
   NODE_ENV=production
   PORT=3001
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=20
   MAX_MESSAGE_LENGTH=2000
   ```

4. **Deploy**
   - Push to `main` branch
   - Railway auto-deploys using `railway.toml`
   - Check logs for any errors

5. **Verify**
   - Visit: `https://your-app.up.railway.app/api/health`
   - Should return: `{"status":"ok","timestamp":...}`

### Option 2: Render

**Pros:**
- Free tier with PostgreSQL
- Good for monorepos
- YAML configuration

**Steps:**

1. **Create Web Service**
   - Go to [render.com](https://render.com)
   - "New" → "Web Service"
   - Connect GitHub repo

2. **Configure Service**
   - **Name**: intellichat-backend
   - **Root Directory**: `packages/backend`
   - **Environment**: Node
   - **Region**: Ohio (or nearest)
   - **Branch**: main
   - **Build Command**: `pnpm install --frozen-lockfile && pnpm build`
   - **Start Command**: `pnpm prisma:migrate:deploy && pnpm start`

3. **Add PostgreSQL**
   - "New" → "PostgreSQL"
   - Name: intellichat-db
   - Copy Internal Database URL

4. **Set Environment Variables**
   - Add all variables from Railway section above
   - Use Render's Database Internal URL for `DATABASE_URL`

5. **Deploy**
   - Click "Create Web Service"
   - Monitor build logs

### Option 3: Heroku

**Using Procfile:**

1. **Create Heroku App**
   ```bash
   heroku create intellichat-backend
   ```

2. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set GROQ_API_KEY=your-key
   heroku config:set CORS_ORIGIN=https://your-app.vercel.app
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-backend-url.com/api/health
```

Expected:
```json
{"status":"ok","timestamp":1703422800000}
```

### 2. Database Connection
Check logs for:
```
✅ Connected to database successfully
✅ Server running on port 3001
```

### 3. Send Test Message
```bash
curl -X POST https://your-backend-url.com/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message":"What are your shipping options?"}'
```

Expected: AI response about shipping policy

### 4. Rate Limiting
Send 21 requests in 1 minute:
```bash
for i in {1..21}; do
  curl -X POST https://your-backend-url.com/api/chat/message \
    -H "Content-Type: application/json" \
    -d '{"message":"test"}' &
done
```

21st request should return 429 (Too Many Requests)

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `GROQ_API_KEY` | ✅ | Groq API key for LLM | `gsk_...` |
| `REDIS_URL` | ❌ | Redis connection (optional caching) | `redis://host:6379` |
| `CORS_ORIGIN` | ✅ | Frontend URL for CORS | `https://app.vercel.app` |
| `NODE_ENV` | ✅ | Environment | `production` |
| `PORT` | ❌ | Server port (auto-set by platform) | `3001` |
| `RATE_LIMIT_WINDOW_MS` | ❌ | Rate limit window | `60000` (1 min) |
| `RATE_LIMIT_MAX_REQUESTS` | ❌ | Max requests per window | `20` |
| `MAX_MESSAGE_LENGTH` | ❌ | Max message characters | `2000` |

## Troubleshooting

### Build Fails

**Error**: `Cannot find module '@prisma/client'`
- **Fix**: Ensure `postinstall` script runs: `"postinstall": "prisma generate"`

**Error**: `Prisma schema not found`
- **Fix**: Check `prisma/schema.prisma` exists
- Verify `prisma.config.ts` exports correct path

### Migration Fails

**Error**: `Can't reach database server`
- **Fix**: Check `DATABASE_URL` is correct
- Ensure database is running
- For Neon, add `?sslmode=require`

**Error**: `Migration already applied`
- **Fix**: This is safe, migrations are idempotent
- Use `prisma migrate deploy` (not `prisma migrate dev`)

### Runtime Errors

**Error**: `CORS policy blocked`
- **Fix**: Set `CORS_ORIGIN` to exact frontend URL (no trailing slash)

**Error**: `Rate limit exceeded`
- **Fix**: Adjust `RATE_LIMIT_MAX_REQUESTS` or `RATE_LIMIT_WINDOW_MS`
- For testing, temporarily set to 1000

**Error**: `LLM API timeout`
- **Fix**: Check `GROQ_API_KEY` is valid
- Verify Groq API status
- Check network connectivity

## Monitoring

### Railway
- **Logs**: Project → Service → Logs tab
- **Metrics**: Built-in CPU/Memory graphs
- **Database**: Database service → Data tab

### Render
- **Logs**: Service → Logs
- **Metrics**: Service → Metrics
- **Database**: Database → Info (connection details)

### Key Metrics to Watch
- Response time (should be < 3s P95)
- Error rate (should be < 1%)
- Database connections (monitor for leaks)
- Memory usage (Node.js < 512MB typical)

## Rollback Procedure

### Railway
1. Go to Deployments tab
2. Click "..." on previous deployment
3. Select "Redeploy"

### Render
1. Go to Events tab
2. Find previous successful deploy
3. Click "Rollback to this version"

### Database Rollback
⚠️ **Warning**: Database migrations are one-way

To undo a migration:
1. Restore database from backup
2. Or write a reverse migration manually

## Security Checklist

- [ ] No API keys in code (use environment variables)
- [ ] `.env` in `.gitignore`
- [ ] CORS configured (not `*`)
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] HTTPS enforced (handled by Railway/Render)
- [ ] Database connection uses SSL

## Performance Optimization

### Database
- [ ] Indexes on frequently queried columns (`conversationId`, `sessionId`)
- [ ] Connection pooling enabled (Prisma default)
- [ ] Pagination for large result sets

### Caching (if using Redis)
- [ ] Cache conversation context (5-minute TTL)
- [ ] Cache LLM responses for identical queries (1-hour TTL)

### Monitoring
- [ ] Set up error tracking (Sentry/LogRocket)
- [ ] Set up uptime monitoring (UptimeRobot/Better Uptime)
- [ ] Configure alerts for >500ms response time

## Deployment Complete! 🎉

Your backend is now live. Next steps:

1. Update frontend `VITE_API_URL` to production backend URL
2. Test end-to-end flow
3. Monitor logs for first 24 hours
4. Set up automated backups (Railway/Render handle this)

Need help? Check:
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Prisma Docs: https://www.prisma.io/docs
