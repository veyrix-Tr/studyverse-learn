# Studyverse — Full Project Audit

Generated: 2026-08-18. Scope: entire project (admin, student, faculty, free/forge, anchor, live, auth, payments, zoom, cron). This lists **genuine bugs and unimplemented/incomplete features only** — no security-hardening items. Every item was verified against the code (file:line included).

Severity: 🔴 Critical (breaks a core flow / loses data / revenue) · 🟠 High (feature advertised that doesn't work) · 🟡 Medium (wrong behavior).

Completed items are removed from this file once done (kept out entirely so no trace remains).

---

## A. Genuine bugs (broken / wrong code)

### A1. 🟡 Session note / remind notifications ignore the actual roster → over-notify
`backend/routes/facultyRoutes.js:452–459` (note) and `502–506` (remind)
New sessions store an explicit roster (`SessionStudent`), and creation notifies per-roster. But the "add note" and "remind" routes recompute recipients by **grade + exam-subject across all Apex/Anchor students**, ignoring the roster. A 1:1 session's note/reminder goes to every student of that grade studying that subject — not the enrollees. Over-notification bug.

### A2. 🟡 Apex & Anchor plan CTAs are no-ops / unbuyable
`frontend/src/components/free-lms/FreeContent.jsx:2613` (Apex) and `:2632` (Anchor) — both cards' only CTA is `onClick={() => onNav('plans')}` while **already on the plans page**, so clicking does nothing. `openPlanCheckout` is only ever called with `'forge'` (sole call site). The backend `create-plan-order` supports `'apex'`/`'anchor'` (paymentController.js:139–140) but no UI path triggers it. **Two of four paid plans can't be bought through the app.** (Stacked with B3.)

### A3. 🟡 ₹99 pay-per-session is bypassable — the free session-request route has no gate
`backend/routes/studentRoutes.js:748–770` `POST /session-request` creates a `SessionRequest` for any authenticated student with **no plan check and no payment requirement** — the same booking the paid flow materialises on payment. It's live and callable directly, so the advertised ₹99 single-session fee isn't enforced. (Frontend uses the paid path, but the public route defeats it.)

### A4. 🟠 Webhook `notify_url` can fall back to a relative/invalid URL
`backend/controllers/paymentController.js:158` and `:206`
`notify_url: process.env.CASHFREE_WEBHOOK_URL || `${process.env.BACKEND_URL || ''}/api/payment/webhook``. If neither env var is set, this becomes relative `/api/payment/webhook`, which Cashfree cannot POST to. If the user also closes the checkout before the frontend `verify` runs, the payment is **never applied and the plan stays PENDING forever** ("paid but not upgraded"). Depends on env, but the default fallback is broken.

---

## B. Unimplemented / advertised-but-not-built features

### B1. 🔴 Paid plans never expire — `planEndDate` is decorative; no renewal/expiry job
`backend/services/cronService.js` (only cron = weekly reports), `backend/controllers/paymentController.js:78–84`
On a successful plan payment, `plan = X`, `planEndDate = now + months` is written. But **nothing ever reads `planEndDate`** — no cron downgrades `plan` to `spark` on expiry, and all backend gating reads only `profile.plan`. A one-time ₹999/₹2499/₹799 "monthly" payment grants **permanent** premium. Only Apex has a (display-only, frontend) expiry screen (`StudentContent.jsx`); Forge and Anchor have no expiry handling at all.

### B2. 🟠 No admin flow to provision a student into Apex/Anchor/Forge
`backend/routes/adminRoutes.js` (whole file), `frontend/.../admin-lms/AdminModals.jsx`, `AdminContent.jsx`
No PUT/PATCH route writes `StudentProfile.plan`. The only code path that ever sets `plan` on a student is the Cashfree webhook. And "Create Admin" (`AdminModals.jsx:161–189`) also does nothing — its button only fires a toast, no route exists (only `GET /admins` + deactivate/reactivate).

### B3. 🟠 Admin "Enroll Student" and "Assign / Reassign Faculty" modals create nothing
`frontend/src/components/admin-lms/AdminModals.jsx:73–104` (enroll) and `:107–128` (assign)
Both have hardcoded fake dropdowns (fake names, not real plans) and a button that only calls `onClose()` + toast. No API call, and there is **no create-student route** anywhere in the backend. Enrolling/assigning shows a success toast but persists nothing.

### B4. 🟠 "Weekly Tests" (a paid Forge/Apex advertised feature) is entirely unbuilt
`frontend/src/components/free-lms/FreeContent.jsx:2976–2986`
Forge card advertises "Weekly tests based on current weak topics"; sidebar exposes "Weekly Tests" as a nav item; but the page renders only a "Coming Soon" banner + score history read from `/scores` (admin-fed). There is **no test-taking UI, no questions, no submission, no endpoint** anywhere.

### B5. 🟠 Courses / video player and Tests tabs are hardcoded mockups
`frontend/src/components/student-lms/StudentContent.jsx:631–693` (courses + video player), `:800–828` (test cards)
Course cards show fabricated progress ("36 of 48 lectures"); the video player and lecture list are hardcoded; "Start Test →" only toasts `'Launching test environment...'`. No course content / test-engine data source exists. Advertised-but-unbuilt.

### B6. 🟠 Student-side "Book a 1-to-1 Session" modal never calls the API
`frontend/src/components/student-lms/StudentModals.jsx:67`
"Send Request" runs `onClose(); onShowToast('Session request sent!')` — form fields (topic/date/time) aren't wired to state. Yet a complete round-trip exists unused: `POST /api/student/session-request` (studentRoutes.js:748) and `GET /api/student/session-requests` (:773). Requests from this modal are never persisted.

### B7. 🟠 Session recordings don't exist end-to-end
`frontend/.../student-lms/StudentContent.jsx:755`, `faculty-lms/FacultyContent.jsx:664` both render a "Recording" link guarded by `s.recordingUrl`. But the `Session` model **has no `recordingUrl` column**, and neither session mapper returns it. `s.recordingUrl` is always falsy → the Recording link can never appear.

### B8. 🟡 Faculty "Quick Note", "Session Notes", and "Suggest a Test" modals are fake
`frontend/src/components/faculty-lms/FacultyModals.jsx`
- Quick Note `:361–376` — hardcoded fake student dropdown, no state, Save only toasts `'Note saved. Will appear in Sunday report ✓'`.
- Session Notes `:379–400` — every field is `defaultValue` hardcoded prose; Save only toasts. (A real notes flow exists via `POST /api/faculty/sessions/:id/note` + the inline editor in FacultyContent — this modal bypasses it entirely.)
- Suggest a Test `:452–473` — **no backend route exists at all** for test suggestions; Send only toasts. The advertised "mentor-assigned test → admin approval" flow is unbuilt; the review tables in FacultyContent are hardcoded `<tr>` rows.

### B9. 🟡 "Forgot password?" is a stub
`frontend/src/components/login/LoginForm.jsx:147–149` — `triggerToast('Password reset coming soon!')`. No reset route/controller/form anywhere. Dead end for a user who forgets their password.

### B10. 🟡 Student "Send Message" (mentor chat) is fake
`frontend/src/components/student-lms/StudentContent.jsx:872` — button only toasts `'Opening chat...'`. No chat feature/route exists.

### B11. 🟡 Registration "City" is silently discarded
`frontend/src/components/login/RegisterForm.jsx:164` sends `city`; `backend/controllers/authController.js:8` destructures only `{ name, email, password, examTarget, targetYear, grade, phone }`, and `StudentProfile` has **no `city` column**. Accepted then dropped — never stored or shown.

### B12. 🟡 Diagnostic "score" is the form-fill percentage, not an assessment result
`frontend/src/components/common/DiagnosticForm.jsx:262–268` posts `{ score: progress, answers: form }` where `progress` is `% of questionnaire answered` (:153–160). Stored as `diagnosticScore` and surfaced to admins as "completed their diagnostic (score: N%)". Misrepresents completion % as an exam score. Real scoring never happens.

---

## C. Misleading / fabricated data shown as real (admin & student hubs)

### C1. 🟠 Admin dashboard, pipeline, revenue, Access Log are hardcoded constants
`frontend/src/components/admin-lms/AdminContent.jsx` — "Active Students 12", "Revenue ₹1.84L", "Avg Improvement +76", pipeline cards with fake names, revenue numbers, revenue-by-plan, `RevenueChart` uses hardcoded `chartData`, Access Log hardcoded. Only "Premium Students" count and the subscriptions table read real `students`. Pipeline actions only toast — nothing persists. Revenue/pipeline analytics are fabricated; no payments query feeds them.

### C2. 🟠 Student dashboard "Tests" page shows hardcoded metrics
`frontend/src/components/student-lms/StudentContent.jsx:795–798` — "Tests Taken: 18", "Best Accuracy: 83%", "Weak Areas: 7" are literals, not derived from data.

### C3. 🟠 "Subject Faculty — Apex only" panel writes data nobody reads; Anchor (which needs it) has no UI
`frontend/.../admin-lms/AdminContent.jsx:1028` (panel shown only when `plan === 'apex'`), writes via `PUT /api/admin/student/:id/subject-faculty`. But every consumer (`facultyRoutes.js`, 5 call sites) branches on `sp.plan`: Apex is matched by grade + exam-subject lookup and **never reads `subjectFaculty`**; only Anchor reads it. So the panel writes into a field no Apex logic consumes, while Anchor — the plan that actually depends on it — has no assignment UI.

### C4. 🟡 Admin "Mentor" column / per-faculty counts use a fabricated faculty name
`backend/routes/adminRoutes.js:56–64` — `facultyName` is computed via `findFirst` over any faculty whose subject matches the exam list, **ignoring `mentorId` and `subjectFaculty`**. So the students-table Mentor column and "N students" counts can show the wrong/generic faculty, not the student's actual mentor.

---

## D. Notes on stale internal docs (so you don't chase dead leads)

- **`APEX_TODO.md` is now stale in two places:**
  - It claims Zoom/live-classes and the faculty "Schedule a Session" modal are **unbuilt / hardcoded fake names**. That is **no longer true** — the modal is wired (POSTs `studentIds`/`subject`/`scheduledAt` to `POST /api/faculty/:id/sessions`) and Zoom is a **real integration**: `backend/lib/zoom.js` does S2S OAuth + `createMeeting` + signed Meeting-SDK signatures; faculty session creation calls Zoom and persists `zoomMeetingId`/`joinUrl`/`startUrl`/`zoomPassword`; `LiveClassRoom.jsx` joins via `ZoomMtg`. (Since this audit, **mentor calls also use Zoom** via the same embedded player.) What's still missing around sessions: **recording** (B7) and the other fake modals (B8).
  - It claims no `POST /api/faculty/sessions` route exists — that route **does exist** and is used.
- **What remains true** from earlier audits: `GET /api/student/resources` has no plan gate (E1), and there's no admin plan-provisioning (B2).

## E. Plan-gate gaps / permission leaks (functional, not security)

### E1. 🟡 `GET /api/student/resources` has no plan gate
`backend/routes/studentRoutes.js:556–588` filters only by `status:'approved'`, exam subjects, type, grade — no `profile.plan` check, despite the comment describing it as "Forge, Apex, Anchor" and `session-notes` being Apex-exclusive in the notification logic. Any plan (Free/Spark) can fetch premium resources.

---

## Suggested fix order (highest-impact, cheapest first)

1. **B1 + A3** — tie gating to `planEndDate` (add an expiry cron + check planning), and gate `POST /session-request` behind the paid plan.
2. **A2 / B3 / B2** — decide the buying story: wire Apex/Anchor to `openPlanCheckout`, and build real create-admin / enroll-student routes (or remove the fake modals).
3. **B4 / B5 / C1 / C2** — either build the weekly-test/course/test engines or replace the hardcoded mockups with honest "Coming Soon" placeholders and remove fabricated dashboards.
4. **C3 / C4** — decide whether Apex or Anchor owns `subjectFaculty`, wire the correct plan's admin panel, and make the Mentor column use `mentorId`.
5. **B6 / B8 / B9 / B10** — wire the student session-request modal, the faculty note/test modals, forgot-password, and chat (or remove the fake ones).
6. **B7** — recording: add a `recordingUrl`-capable field + surface it, or remove the dead UI checks.
7. **A1** — make session note/remind notifications use the actual roster.
8. **A4** — set `CASHFREE_WEBHOOK_URL` (+ `BACKEND_URL`) in backend env / `.env.example` so webhooks resolve.

---
