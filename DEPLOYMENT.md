# Deployment Guide

Everything deploys to **Vercel** (free) + **Supabase** (free database).

| Part | Service | Cost |
|------|---------|------|
| Database (PostgreSQL) | [Supabase](https://supabase.com) | Free |
| Backend (Node.js/Express) | [Vercel](https://vercel.com) | Free |
| Frontend (React/Vite) | [Vercel](https://vercel.com) | Free |
| Scheduled jobs | Vercel Cron | Free |

Push your code to GitHub before starting. Vercel and Supabase connect directly to GitHub.

---

## Step 1 — Database on Supabase

1. Go to [supabase.com](https://supabase.com) → create a free account → **New Project**.
2. Fill in project name and database password (save this password).
3. Wait ~1 minute for setup to finish.
4. Go to **Project Settings → Database → Connection string**.
5. Copy two strings — you will need both:
   - **Transaction pooler** → your `DATABASE_URL`
   - **Direct connection** → your `DIRECT_URL`

---

## Step 2 — Backend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**.
2. Import your GitHub repository.
3. Set the **Root Directory** to `backend`.
4. Set **Framework Preset** to **Other**.
5. Leave **Build Command** blank — `vercel.json` controls the build, and `prisma generate` runs automatically via the `postinstall` script in `package.json`.
6. Leave **Output Directory** blank (not a static site).

   > **First deploy only:** After the backend is live, run this once from your local machine to create the database tables:
   > ```bash
   > cd backend
   > npx prisma db push
   > ```
   > Do not put `prisma db push` in the Vercel build command — it is not safe to run automatically on every deploy.
7. Under **Environment Variables**, add all of the following:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Transaction pooler string from Supabase |
   | `DIRECT_URL` | Direct connection string from Supabase |
   | `JWT_SECRET` | Any long random string (e.g. `mySuperSecretKey123!`) |
   | `FRONTEND_URL` | Leave blank for now — fill in after frontend deploys |
   | `CLIENT_URL` | Leave blank for now — same as FRONTEND_URL |
   | `NODE_ENV` | `production` |
   | `CRON_SECRET` | Any random string (e.g. `cronSecret456!`) — Vercel Cron sends it automatically as `Authorization: Bearer <value>`; required, the cron endpoints return 401 without it |
   | `CLOUDINARY_CLOUD_NAME` | From your Cloudinary dashboard |
   | `CLOUDINARY_API_KEY` | From your Cloudinary dashboard |
   | `CLOUDINARY_API_SECRET` | From your Cloudinary dashboard |
   | `CLOUDINARY_UPLOAD_PRESET` | From your Cloudinary dashboard |
   | `GOOGLE_CLIENT_ID` | From Google Cloud Console |
   | `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
   | `GOOGLE_CALLBACK_URL` | Leave blank for now — fill in after backend deploys |
   | `BREVO_API_KEY` | From your Brevo account (used for OTP emails) |
   | `BREVO_SENDER_EMAIL` | Your verified sender email in Brevo |

8. Click **Deploy**. Wait 1–3 minutes.
9. Once done, copy your backend URL — looks like:
   ```
   https://studyverse-backend.vercel.app
   ```

---

## Step 3 — Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**.
2. Import the **same** GitHub repository again.
3. Set the **Root Directory** to `frontend`.
4. Set **Framework Preset** to **Vite**.
5. Under **Environment Variables**, add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | Your backend Vercel URL (e.g. `https://studyverse-backend.vercel.app`) |

6. Click **Deploy**. Wait 1–2 minutes.
7. Once done, copy your frontend URL — looks like:
   ```
   https://studyverse-learn.vercel.app
   ```

---

## Step 4 — Final Wiring

After both are deployed, go back to the **backend** Vercel project → **Settings → Environment Variables** and fill in the blanks:

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | Your frontend Vercel URL (e.g. `https://studyverse-learn.vercel.app`) |
| `CLIENT_URL` | Same as `FRONTEND_URL` |
| `GOOGLE_CALLBACK_URL` | `https://studyverse-backend.vercel.app/api/auth/google/callback` |

Click **Save** — Vercel will redeploy the backend automatically.

**If using Google OAuth**, update in [Google Cloud Console](https://console.cloud.google.com):
- Go to **APIs & Services → Credentials → OAuth 2.0 Client**
- Add to **Authorized redirect URIs**:
  ```
  https://studyverse-backend.vercel.app/api/auth/google/callback
  ```
- Add to **Authorized JavaScript origins**:
  ```
  https://studyverse-learn.vercel.app
  ```

---

## Step 5 — Scheduled Jobs (Vercel Cron)

Vercel uses serverless functions, so background processes cannot run. Instead **Vercel Cron** calls protected API endpoints on a schedule — no third-party service needed.

The jobs are declared in **`backend/vercel.json`** and are created automatically on every production deploy:

| Path | Schedule (UTC) | What it does |
|------|----------------|--------------|
| `/api/cron/expire-plans` | `0 0 * * *`, `0 6 * * *`, `0 12 * * *`, `0 18 * * *` | Drops expired plans back to Spark (restoring a paid plan first if a manual grant had replaced one). Every 6 hours. |
| `/api/cron/plan-warnings` | `30 0 * * *` (06:00 IST) | "Your plan expires in 3 days" notice, once per day per student |
| `/api/cron/send-reports` | `30 0 * * 6,0` (Sat/Sun 06:00 IST) | Marks approved weekly reports as sent + notifies faculty |

**Why four entries for the same path?** The Vercel **Hobby** plan allows at most *one run per day per cron job* — expressions like `*/6 * * * *` are rejected at deploy time. Listing the same path at four different times gives a sweep every 6 hours while staying inside that limit.

**Verify it's registered:** Vercel → backend project → **Cron Jobs** tab should list all six entries after the first deploy.

**Verify it's authorized** (Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`):

```bash
curl https://studyverse-backend.vercel.app/api/cron/expire-plans \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
# → {"message":"Settled expired plans: 0 → spark, 0 restored", ...}
# 401 = CRON_SECRET missing/mismatched in Vercel env (redeploy after fixing)
```

The endpoints accept **both** `Authorization: Bearer` (Vercel Cron) and `x-cron-secret` (an external scheduler), and work over **GET and POST**, so you can still point cron-job.org at them later if you ever want sub-daily schedules on Pro.

---

## Step 6 — Seed the Database (Optional)

To load test data into the live database, run this locally pointing at Supabase:

```bash
cd backend
DATABASE_URL="your-supabase-transaction-url" DIRECT_URL="your-supabase-direct-url" node prisma/seed.js
```

---

## Verify Everything Works

- [ ] Frontend loads at the Vercel URL
- [ ] Login page appears
- [ ] Can log in with a seeded account
- [ ] Dashboard loads with profile data
- [ ] API calls reach the backend (DevTools → Network tab)
- [ ] OTP emails arrive (Brevo)
- [ ] File uploads/downloads work (Cloudinary)

---

## Local Development

1. Copy the frontend env template:
   ```bash
   cp frontend/.env.example frontend/.env
   ```
2. Create `backend/.env` with all the keys listed in Step 2 above (using your local/dev values).
3. Start both servers:
   ```bash
   # Terminal 1 — backend
   cd backend && node server.js

   # Terminal 2 — frontend
   cd frontend && npm run dev
   ```

The backend runs on port 5000, the frontend on port 5173. node-cron runs normally in local dev.

---

## Architecture

```
GitHub
  ├── Vercel (backend)  ← Supabase (database)
  │         ↑
  │   Vercel Cron (expiry sweep / warnings / weekend reports)
  │
  └── Vercel (frontend)
```
