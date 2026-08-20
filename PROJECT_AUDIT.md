# Studyverse — Full Project Audit

Generated: 2026-08-18. Scope: entire project (admin, student, faculty, free/forge, anchor, live, auth, payments, zoom, cron). This lists **genuine bugs and unimplemented/incomplete features only** — no security-hardening items. Every item was verified against the code (file:line included).

Severity: 🔴 Critical (breaks a core flow / loses data / revenue) · 🟠 High (feature advertised that doesn't work) · 🟡 Medium (wrong behavior).

Completed items are removed from this file once done (kept out entirely so no trace remains).

---

## C. Misleading / fabricated data shown as real (admin & student hubs)

### C2. 🟠 "Subject Faculty — Apex only" panel writes data nobody reads; Anchor (which needs it) has no UI
`frontend/.../admin-lms/AdminContent.jsx:1028` (panel shown only when `plan === 'apex'`), writes via `PUT /api/admin/student/:id/subject-faculty`. But every consumer (`facultyRoutes.js`, 5 call sites) branches on `sp.plan`: Apex is matched by grade + exam-subject lookup and **never reads `subjectFaculty`**; only Anchor reads it. So the panel writes into a field no Apex logic consumes, while Anchor — the plan that actually depends on it — has no assignment UI.

---

## Suggested fix order (highest-impact, cheapest first)

1. **C2** — decide whether Apex or Anchor owns `subjectFaculty`, and wire the correct plan's admin panel.

---
