# Studyverse — Full Project Audit

Generated: 2026-08-18. Scope: entire project (admin, student, faculty, free/forge, anchor, live, auth, payments, zoom, cron). This lists **genuine bugs and unimplemented/incomplete features only** — no security-hardening items. Every item was verified against the code (file:line included).

Severity: 🔴 Critical (breaks a core flow / loses data / revenue) · 🟠 High (feature advertised that doesn't work) · 🟡 Medium (wrong behavior).

Completed items are removed from this file once done (kept out entirely so no trace remains).

---

## A. Genuine bugs (broken / wrong code)

### A2. 🟡 ₹99 pay-per-session is bypassable — the free session-request route has no gate
`backend/routes/studentRoutes.js:748–770` `POST /session-request` creates a `SessionRequest` for any authenticated student with **no plan check and no payment requirement** — the same booking the paid flow materialises on payment. It's live and callable directly, so the advertised ₹99 single-session fee isn't enforced. (Frontend uses the paid path, but the public route defeats it.)

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

### B7. 🟡 Faculty "Quick Note", "Session Notes", and "Suggest a Test" modals are fake
`frontend/src/components/faculty-lms/FacultyModals.jsx`
- Quick Note `:361–376` — hardcoded fake student dropdown, no state, Save only toasts `'Note saved. Will appear in Sunday report ✓'`.
- Session Notes `:379–400` — every field is `defaultValue` hardcoded prose; Save only toasts. (A real notes flow exists via `POST /api/faculty/sessions/:id/note` + the inline editor in FacultyContent — this modal bypasses it entirely.)
- Suggest a Test `:452–473` — **no backend route exists at all** for test suggestions; Send only toasts. The advertised "mentor-assigned test → admin approval" flow is unbuilt; the review tables in FacultyContent are hardcoded `<tr>` rows.

### B8. 🟡 "Forgot password?" is a stub
`frontend/src/components/login/LoginForm.jsx:147–149` — `triggerToast('Password reset coming soon!')`. No reset route/controller/form anywhere. Dead end for a user who forgets their password.

### B9. 🟡 Student "Send Message" (mentor chat) is fake
`frontend/src/components/student-lms/StudentContent.jsx:872` — button only toasts `'Opening chat...'`. No chat feature/route exists.

---

## C. Misleading / fabricated data shown as real (admin & student hubs)

### C1. 🟠 Admin dashboard, pipeline, revenue, Access Log are hardcoded constants
`frontend/src/components/admin-lms/AdminContent.jsx` — "Active Students 12", "Revenue ₹1.84L", "Avg Improvement +76", pipeline cards with fake names, revenue numbers, revenue-by-plan, `RevenueChart` uses hardcoded `chartData`, Access Log hardcoded. Only "Premium Students" count and the subscriptions table read real `students`. Pipeline actions only toast — nothing persists. Revenue/pipeline analytics are fabricated; no payments query feeds them.

### C3. 🟠 "Subject Faculty — Apex only" panel writes data nobody reads; Anchor (which needs it) has no UI
`frontend/.../admin-lms/AdminContent.jsx:1028` (panel shown only when `plan === 'apex'`), writes via `PUT /api/admin/student/:id/subject-faculty`. But every consumer (`facultyRoutes.js`, 5 call sites) branches on `sp.plan`: Apex is matched by grade + exam-subject lookup and **never reads `subjectFaculty`**; only Anchor reads it. So the panel writes into a field no Apex logic consumes, while Anchor — the plan that actually depends on it — has no assignment UI.

---

## D. Notes on stale internal docs

- **`APEX_TODO.md` is now stale in two places:**
  - It claims Zoom/live-classes and the faculty "Schedule a Session" modal are **unbuilt / hardcoded fake names**. That is **no longer true** — the modal is wired (POSTs `studentIds`/`subject`/`scheduledAt` to `POST /api/faculty/:id/sessions`) and Zoom is a **real integration**: `backend/lib/zoom.js` does S2S OAuth + `createMeeting` + signed Meeting-SDK signatures; faculty session creation calls Zoom and persists `zoomMeetingId`/`joinUrl`/`startUrl`/`zoomPassword`; `LiveClassRoom.jsx` joins via `ZoomMtg`. (Since this audit, **mentor calls also use Zoom** via the same embedded player.) What's still missing around sessions: **recording** (B7) and the other fake modals (B8).
  - It claims no `POST /api/faculty/sessions` route exists — that route **does exist** and is used.
- **What remains true** from earlier audits: `GET /api/student/resources` has no plan gate (E1), and there's no admin plan-provisioning (B2).

## E. Plan-gate gaps / permission leaks (functional, not security)

### E1. 🟡 `GET /api/student/resources` has no plan gate
`backend/routes/studentRoutes.js:556–588` filters only by `status:'approved'`, exam subjects, type, grade — no `profile.plan` check, despite the comment describing it as "Forge, Apex, Anchor" and `session-notes` being Apex-exclusive in the notification logic. Any plan (Free/Spark) can fetch premium resources.

---

## Suggested fix order (highest-impact, cheapest first)

1. **B1 + A2** — tie gating to `planEndDate` (add an expiry cron + check planning), and gate `POST /session-request` behind the paid plan.
2. **B3 / B2** — decide the buying story: build real create-admin / enroll-student routes (or remove the fake modals).
3. **B4 / B5 / C1** — either build the weekly-test/course/test engines or replace the hardcoded mockups with honest "Coming Soon" placeholders and remove fabricated dashboards.
4. **C3** — decide whether Apex or Anchor owns `subjectFaculty`, and wire the correct plan's admin panel.
5. **B7 / B8 / B9** — wire the faculty note/test modals, forgot-password, and chat (or remove the fake ones).

---
