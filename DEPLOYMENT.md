# Deployment Guide

Everything deploys to **Vercel** (free) + **Supabase** (free database).

| Part | Service | Cost |
|------|---------|------|
| Database (PostgreSQL) | [Supabase](https://supabase.com) | Free |
| Backend (Node.js/Express) | [Vercel](https://vercel.com) | Free |
| Frontend (React/Vite) | [Vercel](https://vercel.com) | Free |
| Scheduled reports | [cron-job.org](https://cron-job.org) | Free |

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
5. Set **Build Command** to:
   ```
   npm install && npx prisma generate && npx prisma db push
   ```
6. Leave **Output Directory** blank (not a static site).
7. Under **Environment Variables**, add all of the following:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Transaction pooler string from Supabase |
   | `DIRECT_URL` | Direct connection string from Supabase |
   | `JWT_SECRET` | Any long random string (e.g. `mySuperSecretKey123!`) |
   | `FRONTEND_URL` | Leave blank for now — fill in after frontend deploys |
   | `CLIENT_URL` | Leave blank for now — same as FRONTEND_URL |
   | `NODE_ENV` | `production` |
   | `CRON_SECRET` | Any random string (e.g. `cronSecret456!`) — secures the cron endpoint |
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

## Step 5 — Set Up the Weekly Report Cron Job

Vercel uses serverless functions, so background processes cannot run. Instead, an external scheduler calls a protected API endpoint on a schedule.

1. Go to [cron-job.org](https://cron-job.org) → create a free account.
2. Click **Create Cronjob**.
3. Fill in:

   | Field | Value |
   |-------|-------|
   | **URL** | `https://studyverse-backend.vercel.app/api/cron/send-reports` |
   | **Request method** | `POST` |
   | **Schedule** | Custom — every Saturday and Sunday at 6:00 AM |
   | **Timezone** | Asia/Kolkata |
   | **Headers** | Add: `x-cron-secret` = the value you set for `CRON_SECRET` |

4. Save the cronjob.

This replicates the original node-cron behaviour — approved reports are marked as sent and faculty notifications are created every weekend morning.

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
  │   cron-job.org (weekend report cron)
  │
  └── Vercel (frontend)
```
