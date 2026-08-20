# Studyverse — Full Project Audit

Generated: 2026-08-18. Scope: entire project (admin, student, faculty, free/forge, anchor, live, auth, payments, zoom, cron). This lists **genuine bugs and unimplemented/incomplete features only** — no security-hardening items. Every item was verified against the code (file:line included).

Severity: 🔴 Critical (breaks a core flow / loses data / revenue) · 🟠 High (feature advertised that doesn't work) · 🟡 Medium (wrong behavior).

Completed items are removed from this file once done (kept out entirely so no trace remains).

---

## B. Unimplemented / advertised-but-not-built features

### B5. 🟠 Courses / video player and Tests tabs are hardcoded mockups
`frontend/src/components/student-lms/StudentContent.jsx:631–693` (courses + video player), `:800–828` (test cards)
Course cards show fabricated progress ("36 of 48 lectures"); the video player and lecture list are hardcoded; "Start Test →" only toasts `'Launching test environment...'`. No course content / test-engine data source exists. Advertised-but-unbuilt.

---

## C. Misleading / fabricated data shown as real (admin & student hubs)

### C1. 🟠 Admin dashboard, pipeline, revenue, Access Log are hardcoded constants
`frontend/src/components/admin-lms/AdminContent.jsx` — "Active Students 12", "Revenue ₹1.84L", "Avg Improvement +76", pipeline cards with fake names, revenue numbers, revenue-by-plan, `RevenueChart` uses hardcoded `chartData`, Access Log hardcoded. Only "Premium Students" count and the subscriptions table read real `students`. Pipeline actions only toast — nothing persists. Revenue/pipeline analytics are fabricated; no payments query feeds them.

### C3. 🟠 "Subject Faculty — Apex only" panel writes data nobody reads; Anchor (which needs it) has no UI
`frontend/.../admin-lms/AdminContent.jsx:1028` (panel shown only when `plan === 'apex'`), writes via `PUT /api/admin/student/:id/subject-faculty`. But every consumer (`facultyRoutes.js`, 5 call sites) branches on `sp.plan`: Apex is matched by grade + exam-subject lookup and **never reads `subjectFaculty`**; only Anchor reads it. So the panel writes into a field no Apex logic consumes, while Anchor — the plan that actually depends on it — has no assignment UI.

---

## D. Notes on stale internal docs

- **`APEX_TODO.md` is stale:** it claims Zoom/live-classes and the faculty "Schedule a Session" modal are **unbuilt / hardcoded fake names**. That is **no longer true** — the modal is wired (`POST /api/faculty/:id/sessions`) and Zoom is a **real integration** (`backend/lib/zoom.js`: S2S OAuth, `createMeeting`, signed Meeting-SDK signatures; `LiveClassRoom.jsx` joins via `ZoomMtg`; **mentor calls also use Zoom**). What's still missing around sessions is just the **recording** path (planned recording/reporting loop).
- It also claims no `POST /api/faculty/sessions` route exists — that route **does exist** and is used.

---

## Suggested fix order (highest-impact, cheapest first)

1. **B5 / C1** — either build the course/test engines or replace the hardcoded mockups with honest "Coming Soon" placeholders and remove fabricated dashboards.
2. **C3** — decide whether Apex or Anchor owns `subjectFaculty`, and wire the correct plan's admin panel.

---
