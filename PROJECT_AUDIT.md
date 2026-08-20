# Studyverse — Full Project Audit

Generated: 2026-08-18. Scope: entire project (admin, student, faculty, free/forge, anchor, live, auth, payments, zoom, cron). This lists **genuine bugs and unimplemented/incomplete features only** — no security-hardening items. Every item was verified against the code (file:line included).

Severity: 🔴 Critical (breaks a core flow / loses data / revenue) · 🟠 High (feature advertised that doesn't work) · 🟡 Medium (wrong behavior).

Completed items are removed from this file once done (kept out entirely so no trace remains).

---

## B. Unimplemented / advertised-but-not-built features

### B5. 🟠 Courses / video player and Tests tabs are hardcoded mockups
`frontend/src/components/student-lms/StudentContent.jsx:631–693` (courses + video player), `:800–828` (test cards)
Course cards show fabricated progress ("36 of 48 lectures"); the video player and lecture list are hardcoded; "Start Test →" only toasts `'Launching test environment...'`. No course content / test-engine data source exists. Advertised-but-unbuilt.

### B7. 🟡 Faculty "Quick Note", "Session Notes", and "Suggest a Test" modals are fake
`frontend/src/components/faculty-lms/FacultyModals.jsx`
- Quick Note `:361–376` — hardcoded fake student dropdown, no state, Save only toasts `'Note saved. Will appear in Sunday report ✓'`.
- Session Notes `:379–400` — every field is `defaultValue` hardcoded prose; Save only toasts. (A real notes flow exists via `POST /api/faculty/sessions/:id/note` + the inline editor in FacultyContent — this modal bypasses it entirely.)
- Suggest a Test `:452–473` — **no backend route exists at all** for test suggestions; Send only toasts. The advertised "mentor-assigned test → admin approval" flow is unbuilt; the review tables in FacultyContent are hardcoded `<tr>` rows.

---

## C. Misleading / fabricated data shown as real (admin & student hubs)

### C1. 🟠 Admin dashboard, pipeline, revenue, Access Log are hardcoded constants
`frontend/src/components/admin-lms/AdminContent.jsx` — "Active Students 12", "Revenue ₹1.84L", "Avg Improvement +76", pipeline cards with fake names, revenue numbers, revenue-by-plan, `RevenueChart` uses hardcoded `chartData`, Access Log hardcoded. Only "Premium Students" count and the subscriptions table read real `students`. Pipeline actions only toast — nothing persists. Revenue/pipeline analytics are fabricated; no payments query feeds them.

### C3. 🟠 "Subject Faculty — Apex only" panel writes data nobody reads; Anchor (which needs it) has no UI
`frontend/.../admin-lms/AdminContent.jsx:1028` (panel shown only when `plan === 'apex'`), writes via `PUT /api/admin/student/:id/subject-faculty`. But every consumer (`facultyRoutes.js`, 5 call sites) branches on `sp.plan`: Apex is matched by grade + exam-subject lookup and **never reads `subjectFaculty`**; only Anchor reads it. So the panel writes into a field no Apex logic consumes, while Anchor — the plan that actually depends on it — has no assignment UI.

---

## D. Notes on stale internal docs

- **`APEX_TODO.md` is stale:** it claims Zoom/live-classes and the faculty "Schedule a Session" modal are **unbuilt / hardcoded fake names**. That is **no longer true** — the modal is wired (`POST /api/faculty/:id/sessions`) and Zoom is a **real integration** (`backend/lib/zoom.js`: S2S OAuth, `createMeeting`, signed Meeting-SDK signatures; `LiveClassRoom.jsx` joins via `ZoomMtg`; **mentor calls also use Zoom**). What's still missing around sessions is the **recording** path (B7) and the **fake faculty note/test modals** (B7).
- It also claims no `POST /api/faculty/sessions` route exists — that route **does exist** and is used.

---

## Suggested fix order (highest-impact, cheapest first)

1. **B5 / C1** — either build the course/test engines or replace the hardcoded mockups with honest "Coming Soon" placeholders and remove fabricated dashboards.
2. **C3** — decide whether Apex or Anchor owns `subjectFaculty`, and wire the correct plan's admin panel.
3. **B7** — wire the faculty note/test modals (or remove the fake ones).

---
