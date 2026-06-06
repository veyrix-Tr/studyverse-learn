# Deployment Guide

This project has three parts that need to be hosted separately:

| Part | Service | Cost |
|------|---------|------|
| Database (PostgreSQL) | [Supabase](https://supabase.com) | Free |
| Backend (Node.js/Express) | [Render](https://render.com) | Free |
| Frontend (React/Vite) | [Vercel](https://vercel.com) | Free |

---

## Before You Start

Make sure your code is pushed to a GitHub repository. Both Render and Vercel connect directly to GitHub to deploy.

---

## Step 1 — Database on Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New Project** → fill in project name and database password (save this password).
3. Wait for the project to finish setting up (~1 minute).
4. Go to **Project Settings → Database → Connection string**.
5. Copy two strings — you will need both later:
   - **Transaction pooler** → this will be your `DATABASE_URL`
   - **Direct connection** → this will be your `DIRECT_URL`

> The transaction pooler is used for normal queries. The direct connection is required by Prisma migrations.

---

## Step 2 — Prepare the Backend Code

Before deploying, replace all hardcoded `localhost:5000` URLs in the frontend with an environment variable.

**In every frontend file that has a fetch call**, change:
```js
fetch(`http://localhost:5000/api/...`)
```
to:
```js
fetch(`${import.meta.env.VITE_API_URL}/api/...`)
```

Files to update (search the project for `localhost:5000`):
- `frontend/src/pages/FreeLMS.jsx`
- `frontend/src/pages/StudentLMS.jsx`
- `frontend/src/pages/FacultyLMS.jsx`
- `frontend/src/pages/AdminLMS.jsx`
- `frontend/src/components/faculty-lms/FacultyContent.jsx`
- `frontend/src/components/faculty-lms/FacultyModals.jsx`
- `frontend/src/components/free-lms/FreeContent.jsx`
- `frontend/src/components/student-lms/StudentContent.jsx`
- `frontend/src/components/student-lms/StudentModals.jsx`
- `frontend/src/components/login/RegisterForm.jsx`
- `frontend/src/pages/GoogleCallback.jsx`

Also update the Google OAuth redirect in `backend/routes/authRoutes.js`:
```js
// Change this:
res.redirect(`http://localhost:3000/auth/google?...`)
// To:
res.redirect(`${process.env.FRONTEND_URL}/auth/google?...`)
```

Also update CORS in `backend/server.js` to allow the Vercel domain:
```js
// Change this:
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }));
// To:
app.use(cors({ origin: [process.env.FRONTEND_URL, 'http://localhost:3000'], credentials: true }));
```

Commit and push these changes to GitHub before moving to the next step.

---

## Step 3 — Backend on Render

1. Go to [render.com](https://render.com) and create a free account.
2. Click **New → Web Service**.
3. Connect your GitHub repository.
4. Fill in the settings:

   | Setting | Value |
   |---------|-------|
   | **Name** | `studyverse-backend` (or anything) |
   | **Root Directory** | `backend` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install && npx prisma generate && npx prisma migrate deploy` |
   | **Start Command** | `node server.js` |
   | **Instance Type** | Free |

5. Scroll down to **Environment Variables** and add:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Transaction pooler string from Supabase |
   | `DIRECT_URL` | Direct connection string from Supabase |
   | `JWT_SECRET` | Any long random string (e.g. `mySuperSecretKey123!`) |
   | `FRONTEND_URL` | Leave blank for now — fill in after Vercel deploy |
   | `NODE_ENV` | `production` |

6. Click **Deploy**. Wait for it to finish (2–5 minutes).
7. Once done, copy your backend URL — it will look like:
   ```
   https://studyverse-backend.onrender.com
   ```

> **Note:** On Render's free tier, the backend sleeps after 15 minutes of inactivity. The first request after sleep takes ~30 seconds to wake up. This is normal on the free plan.

---

## Step 4 — Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and create a free account.
2. Click **Add New → Project**.
3. Import your GitHub repository.
4. Fill in the settings:

   | Setting | Value |
   |---------|-------|
   | **Root Directory** | `frontend` |
   | **Framework Preset** | Vite |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

5. Under **Environment Variables**, add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | Your Render backend URL (e.g. `https://studyverse-backend.onrender.com`) |

6. Click **Deploy**. Wait 1–2 minutes.
7. Once done, copy your frontend URL — it will look like:
   ```
   https://studyverse-learn.vercel.app
   ```

---

## Step 5 — Final Wiring

After both are deployed, go back and update:

**Render (backend) → Environment Variables:**
- Set `FRONTEND_URL` = your Vercel URL (e.g. `https://studyverse-learn.vercel.app`)
- Click **Save** → Render will redeploy automatically.

**If using Google OAuth**, update the redirect URI in [Google Cloud Console](https://console.cloud.google.com):
- Go to **APIs & Services → Credentials → OAuth 2.0 Client**
- Add to **Authorized redirect URIs**:
  ```
  https://studyverse-backend.onrender.com/api/auth/google/callback
  ```
- Add to **Authorized JavaScript origins**:
  ```
  https://studyverse-learn.vercel.app
  ```

---

## Step 6 — Seed the Database (Optional)

If you want test data in the live database, run the seed script pointing at the Supabase database:

```bash
cd backend
DATABASE_URL="your-supabase-transaction-url" npx prisma db seed
```

---

## Verify Everything Works

Go through this checklist after deploying:

- [ ] Frontend loads at the Vercel URL
- [ ] Login page appears
- [ ] Can log in with a seeded account
- [ ] Dashboard loads with profile data
- [ ] API calls reach the backend (check browser DevTools → Network tab)

---

## Local Development (unchanged)

Nothing changes for local development. Keep using `localhost:5000` locally — the `VITE_API_URL` env var is only set in Vercel, so locally `import.meta.env.VITE_API_URL` will be `undefined` and fetch calls will break.

To fix this, create a `.env.local` file in the `frontend/` folder:
```
VITE_API_URL=http://localhost:5000
```

This file is gitignored by default (never commit it), and Vite will automatically use it during local development.

---

## Summary

```
GitHub → Render (backend) ← Supabase (database)
                 ↑
           Vercel (frontend)
```

1. Supabase → get database URLs
2. Render → deploy backend with those URLs → get backend URL
3. Vercel → deploy frontend with backend URL → get frontend URL
4. Render → add frontend URL to CORS env var
