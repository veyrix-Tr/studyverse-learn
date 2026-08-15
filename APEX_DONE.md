# Apex Plan — Completed Fixes

Items originally found in `APEX_TODO.md`'s audit that have since been fixed. Moved here to keep the TODO file focused on what's still outstanding.

## 1. Login-block contradiction — fixed 2026-08-15

Apex logins were blocked in three separate places (`backend/middleware/blockDeprecatedPlans.js`, `backend/controllers/authController.js`, `backend/routes/authRoutes.js`), each with inconsistent messaging, while the plan was still actively marketed everywhere else (pricing page, upsell CTAs, dedicated dashboard routing).

**Fix**: all three login blockers removed — `backend/middleware/blockDeprecatedPlans.js` deleted, apex-check clauses removed from `authController.js` login and `authRoutes.js` Google OAuth callback, and the middleware wiring removed from `server.js`. Apex is now a normal, unblocked plan again.

## 2. Fake "Create Zoom Meeting" toggle — fixed 2026-08-15

`frontend/src/components/faculty-lms/FacultyModals.jsx`'s "Schedule a Session" modal had a "Create Zoom Meeting" toggle (`zoomEnabled` state) that did nothing when flipped — never persisted, never sent anywhere.

**Fix**: toggle UI and `zoomEnabled` state removed entirely, so the modal no longer implies a working Zoom feature that isn't there. (Note: the modal's Student dropdown is still hardcoded fake names, and the Schedule button still doesn't call any real API — those remain in `APEX_TODO.md`.)

## 3. Dead `VALID_PLANS` array — fixed 2026-08-15

`backend/routes/adminRoutes.js` had a stale, unused `VALID_PLANS` array missing `'anchor'`.

**Fix**: removed. The actual validation nearby already used a separate, correct literal array including all four plans.

## 4. Missing `anchor` in `PLAN_LABEL` — fixed 2026-08-15

`frontend/src/pages/AdminLMS.jsx`'s `PLAN_LABEL` map had `spark`, `forge`, `apex` but no `anchor` entry, causing blank/undefined labels for anchor-only filters.

**Fix**: added `anchor: 'Anchor only'` to the map.
