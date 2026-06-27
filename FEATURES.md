# Features Implemented — Mentor & Anchor Program

---

## Admin

- **Assign Mentor** — Admin can assign any faculty as a mentor to a student (or remove them). Done from the "Assign Faculty & Mentor" page in sidebar.
- **Assign Subject Faculty** — For Apex-plan students, admin can assign a specific faculty per subject (Physics, Chemistry, etc.) from the same page.

---

## Faculty

- **My Mentees** — Faculty sees all assigned mentees (any plan). First student auto-selected. Student cards show today's report status and next call date.
- **Write Weekly Note** — Faculty writes a weekly note for a mentee. Appears on student's dashboard. Student is notified.
- **Schedule Mentor Call** — Faculty picks date/time (stored as IST), duration, optional agenda. Student is notified automatically.
- **Mark Call Done** — Button appears on past/overdue calls. Faculty marks complete with optional post-call notes.
- **Daily Reports View** — Faculty reads each mentee's daily reports with focus score bar, study hours, and notes to mentor. Filler entries ("nothing", "no", etc.) are hidden automatically.

---

## Student (Anchor Plan)

- **Mentor Card in Topbar** — Centred mentor chip in the topbar shows mentor's initial, name, and a pulsing green online dot. Clicking it navigates to Mentor Notes. Shows "No mentor yet" state if unassigned.
- **Mentor Card on Dashboard** — Full profile card in the dashboard hero area: large gold-ring avatar, mentor name, live status dot, latest weekly note quote, and 3 stats (reports, streak, month rate). "View all mentor notes" CTA at the bottom.
- **Mentor Notes Page** — Student sees all weekly notes written by their mentor, newest first, with week labels.
- **Weekly Calls Page** — Student sees upcoming and past 1-on-1 calls with their mentor, with date, time, duration, and call notes.
- **Notification Bell** — Bell icon in topbar turns gold and shows unread count when new notifications arrive. Self-generated activity messages (own report submissions, diagnostic) are excluded.
- **Notifications Page** — Student sees all notifications (mentor note posted, call scheduled, etc.) with filter for unread. Can mark individual or all as read.

---

## Student (Non-Anchor — Forge / Apex)

- **Mentor Card on Home** — Shows assigned mentor's name and initial. Shows "Studyverse Admin / Your team is with you" if no mentor.
- **Mentor Profile Card** — Mentor page shows mentor's name, initial, correct plan label (Forge/Apex/Anchor), sessions count, marks delta, weeks active.
- **Mentor Notes (live)** — Fetches real notes from `/mentor-notes`. Shows latest note with week label and "View all" link. Empty state if no notes yet.
- **Mentor Calls (live)** — Fetches real calls from `/mentor-calls`. Shows up to 3 calls with date/time, duration, agenda, and status badge (Upcoming/Done/Overdue) with colored left border. Empty state if none scheduled.
- **Subject Faculty Display** — Shows subject-faculty map for Apex students. Each entry shows faculty initial, name, and subject.
