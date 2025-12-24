# Quick Deployment Guide

## Backend Deployment (Choose One Platform)

### Railway (Recommended - Easiest)

1. **Go to [railway.app](https://railway.app) and sign up**

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `intellichat-ai` repository
   - Railway will auto-detect `railway.toml`

3. **Add PostgreSQL**
   - Click "New" → "Database" → "PostgreSQL"
   - Copy the `DATABASE_URL` from Variables tab

4. **Add Environment Variables**
   Click on your service → Variables tab → Add these:
   ```
   DATABASE_URL=<paste from PostgreSQL service>
   GROQ_API_KEY=<your groq API key>
   CORS_ORIGIN=https://your-frontend.vercel.app
   NODE_ENV=production
   ```

5. **Deploy** - Railway auto-deploys on git push!

6. **Get Backend URL** - Copy from Settings → Domains

---

### Render (Alternative)

1. **Go to [render.com](https://render.com) and sign up**

2. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect GitHub repo
   - Root Directory: `packages/backend`
   - Build: `pnpm install --frozen-lockfile && pnpm build`
   - Start: `pnpm prisma:migrate:deploy && pnpm start`

3. **Add PostgreSQL**
   - "New" → "PostgreSQL"
   - Copy Internal Database URL

4. **Add Environment Variables** (same as Railway)

5. **Deploy** - Render auto-deploys!

---

## Frontend Deployment (Vercel)

1. **Go to [vercel.com](https://vercel.com) and sign up**

2. **Import Project**
   - Click "Add New" → "Project"
   - Import `intellichat-ai` from GitHub

3. **Configure**
   - Framework Preset: SvelteKit
   - Root Directory: `packages/frontend`
   - Build Command: `pnpm --filter frontend build`
   - Output Directory: `packages/frontend/.vercel/output`

4. **Add Environment Variable**
   - `VITE_API_URL` = `https://your-backend-url.railway.app`
   - (Use the Railway/Render backend URL from above)

5. **Deploy** - Vercel auto-deploys on git push!

---

## Update CORS After Deployment

Once you have both URLs:

1. **Update Backend Environment Variable**
   - Railway/Render dashboard
   - Set `CORS_ORIGIN` to your Vercel frontend URL
   - Example: `https://intellichat-ai.vercel.app`
   - **Important**: No trailing slash!

2. **Update Frontend Environment Variable**
   - Vercel dashboard → Settings → Environment Variables
   - Set `VITE_API_URL` to your Railway/Render backend URL
   - Example: `https://intellichat-backend.up.railway.app`

3. **Redeploy Both**
   - Backend: Push a commit or manually redeploy
   - Frontend: Vercel auto-redeploys

---

## Test Deployment

### Test Backend
```bash
curl https://your-backend-url.railway.app/api/health
```

Should return:
```json
{"status":"ok","timestamp":1703422800000}
```

### Test Frontend
1. Open `https://your-frontend.vercel.app`
2. Send a test message: "What are your shipping options?"
3. Should receive AI response

### Test Full Integration
1. Send message from frontend
2. Check backend logs for the request
3. Verify response appears in frontend chat

---

## Common Issues

### Backend won't start
- Check logs for Prisma errors
- Verify `DATABASE_URL` is set correctly
- Ensure migrations ran (look for "prisma migrate deploy" in logs)

### Frontend can't connect to backend
- Check `VITE_API_URL` matches backend URL exactly
- Check `CORS_ORIGIN` on backend matches frontend URL exactly
- Open browser DevTools → Network tab for CORS errors

### Database connection fails
- For Neon: Add `?sslmode=require` to connection string
- For Railway/Render: Use the internal database URL they provide

---

## Environment Variables Checklist

### Backend (Railway/Render)
- [ ] `DATABASE_URL` - from PostgreSQL service
- [ ] `GROQ_API_KEY` - from Groq dashboard
- [ ] `CORS_ORIGIN` - Vercel frontend URL
- [ ] `NODE_ENV` - set to `production`

### Frontend (Vercel)
- [ ] `VITE_API_URL` - Railway/Render backend URL

---

## Next Steps After Deployment

1. ✅ Test the chat functionality end-to-end
2. ✅ Send 21 messages to test rate limiting
3. ✅ Refresh page to test conversation persistence
4. ✅ Test on mobile device
5. ✅ Monitor logs for errors (first 24 hours)

---

## Support

- **Railway Docs**: https://docs.railway.app
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Full Guide**: See `DEPLOYMENT.md` in repository
