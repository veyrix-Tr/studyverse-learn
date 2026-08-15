# Apex Plan — Audit of Unfinished / Hardcoded / Buggy Areas

Generated: 2026-08-15. Scope: **Apex plan only** (not Free/Spark/Forge/Anchor, except where their code intersects Apex logic). See `APEX_DONE.md` for items already fixed.

## TL;DR

The headline pending feature — **live classes via Zoom** — still has zero real backend/plan support anywhere in the repo. The actual join-a-live-class feature (schema field, create-session API, real link) is still unbuilt.

---

## 1. No admin flow to assign a student to the Apex plan

Registration never assigns `plan: 'apex'` (new accounts default to `"spark"` per `schema.prisma:29`), and there is **no admin UI or route to set a student's plan to Apex** post-registration (no PUT/PATCH route in `adminRoutes.js` writes `plan` at all). The only place `'apex'` is ever assigned is `backend/prisma/seed.js` (two test users). Now that Apex logins are unblocked (see `APEX_DONE.md`), this is the next thing needed to actually sell/provision the plan in practice.

---

## 2. Live classes via Zoom — confirmed 100% unbuilt (matches what you already suspected)

You mentioned this is still pending and you're planning to use Zoom. Confirmed: **there is no real implementation anywhere**, not even a partial one. No Zoom SDK/package, no Zoom API keys referenced anywhere, no meeting-link field in the database.

What exists instead is a convincing-looking UI mockup:

- `backend/prisma/schema.prisma` — the `Session` model (title, subject, grade, dayOfWeek, scheduledAt, duration, note, facultyId) **has no link/URL field at all** — no `joinUrl`, `startUrl`, or `meetingLink`.
- `frontend/src/components/faculty-lms/FacultyModals.jsx` (the "Schedule a Session" modal):
  - The Student dropdown is **hardcoded fake names** (Rahul Mehta, Sneha Kapoor, Priya Desai, Arjun Singh, Vanya Rao, Kavya Menon) — none of these exist in the seed data, and none of the form fields (topic/subject/date/time/duration) are wired to state.
  - The "Schedule →" button **doesn't call any API** — it just closes the modal and pops a fake success toast ("Session scheduled. Student notified ✓"). Nothing is persisted. There is no session-creation route in `facultyRoutes.js` at all — sessions only ever exist via `seed.js`.
- Student side (`StudentContent.jsx`) and faculty side (`FacultyContent.jsx`) both check for `s.joinUrl` / `s.startUrl` on session cards — since the backend never returns these fields (they don't exist on the model), these checks **always fail**, and users always see fallback toasts like "Meeting link not set yet — contact your mentor" / "Set up Zoom in the schedule modal to get a start link."

**Useful prior art already in the codebase**: the Anchor plan's "Mentor Calls" feature is a real, working analog you can copy the pattern from — `MentorCall` model has a genuine `meetLink String?` field, the faculty route requires a pasted Google Meet URL (`facultyRoutes.js:875-907`, `if (!meetLink?.trim()) return res.status(400)...`), and the frontend renders a real clickable "Join Now" link that only activates in a live time window. This is *not* auto-generated Zoom, just a manually pasted link — but it's a fully functional pattern (schema field → API validation → stored → rendered conditionally) you could either extend to Apex sessions (quick win: just add a manual "paste your Zoom link" field, same as Mentor Calls) or use as the target shape once real Zoom API auto-generation is added later.

**To actually build this, you need at minimum:**
1. Add a link field to `Session` in `schema.prisma` (start manual, like `MentorCall.meetLink`, before investing in Zoom API auto-creation).
2. Add a real `POST /api/faculty/sessions` create route (doesn't exist yet — modal has nowhere to submit to).
3. Wire the "Schedule a Session" modal's fields to actual state and submit to that route.
4. Include the link field in the existing `GET /sessions` responses (`studentRoutes.js`, `facultyRoutes.js`) so the frontend's `joinUrl`/`startUrl` checks can actually succeed.
5. Decide whether to build real Zoom API auto-creation (needs Zoom app credentials + OAuth/JWT setup, more work) or just use a manual paste-a-link field (near-zero work, matches Mentor Calls).

---

## 3. Concrete logic bugs

- **Admin "Subject Faculty — Apex only" panel writes data nobody reads.** `AdminContent.jsx:857,1028` shows a panel titled "Subject Faculty — Apex only" that lets an admin assign per-subject faculty to an Apex student, saved via `PUT /api/admin/student/:id/subject-faculty`. But every place that actually *matches* faculty to students (`facultyRoutes.js`, ~5 call sites) only reads `subjectFaculty` for **Anchor** students — Apex students are matched by grade + exam-target subject lookup instead, and never consult `subjectFaculty`. So the admin panel is mislabeled and silently no-ops for its stated purpose. (Also: Anchor students, who actually need this data, have no equivalent admin UI shown for them.)
- **`GET /api/student/resources` has no plan gate at all.** `studentRoutes.js:482` comments the endpoint as being for "Forge, Apex, Anchor," but the handler filters by subject/exam only — any plan, including Free/Spark, can fetch resources such as "Session Notes," which the notification system (`adminRoutes.js:547-561`, `APEX_ONLY_RESOURCE_TYPES`) treats as Apex-exclusive. The gate that exists is only on the *notification* sent when a resource is approved, not on *fetching* the resource itself.

---

## Suggested priority order

1. **Build live-class/Zoom flow** — biggest genuinely-missing feature, and the one you already flagged. Start with a manual meet-link field (copy the `MentorCall` pattern) rather than full Zoom API integration, to unblock faculty scheduling quickly.
2. **Build an admin flow to assign a student to the Apex plan** — there's still no way to actually provision a student into Apex post-registration.
3. Fix the Subject-Faculty-panel/Apex mismatch (§3) — quick, low-risk fix once you know whether Apex or Anchor should own that admin UI.
4. Add a plan gate to `/api/student/resources` if "Session Notes" should really stay Apex/Anchor-exclusive (§3).
