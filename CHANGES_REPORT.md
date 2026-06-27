# Changes Report — Mentor & Anchor Program

---

## 1. DATABASE (schema.prisma)

**New fields on StudentProfile:**
- `mentorId` — links a student to one Faculty as their mentor
- `subjectFaculty` — JSON map storing which faculty teaches which subject to that student e.g. `{ "Physics": 3, "Chemistry": 7 }`

**Two new tables added:**
- `MentorNote` — a faculty member (as mentor) writes a weekly note for a student. Stores `content`, `weekOf` (Monday date), linked to both student and mentor.
- `MentorCall` — records a scheduled 1-on-1 call between mentor and student. Stores `scheduledAt`, `durationMin` (default 45), `notes`, `completed` flag.

**New relations:**
- `FacultyProfile` now has `mentorStudents` (all students where this faculty is their mentor), plus `mentorNotes` and `mentorCalls`.
- `StudentProfile` now has `mentorNotes` and `mentorCalls`.

---

## 2. BACKEND — Admin Routes (`adminRoutes.js`)

**New endpoints:**

| Endpoint | What it does |
|---|---|
| `PUT /student/:studentUserId/mentor` | Admin assigns (or removes) a mentor for a student. Saves `mentorId` on StudentProfile. |
| `PUT /student/:studentUserId/subject-faculty` | Admin assigns which faculty teaches a specific subject to a student. Updates `subjectFaculty` JSON field. |

---

## 3. BACKEND — Faculty Routes (`facultyRoutes.js`)

**New endpoints:**

| Endpoint | What it does |
|---|---|
| `GET /mentor-students` | Faculty sees all students where they are the assigned mentor. |
| `GET /mentor-student/:studentId` | Faculty gets full detail for one of their mentees including notes and calls. |
| `POST /mentor-student/:studentId/note` | Faculty writes a weekly note for a student. |
| `POST /mentor-student/:studentId/call` | Faculty schedules a call with a student. |
| `PUT /mentor-call/:callId` | Faculty marks a call done and optionally adds call notes. |

**Bug fixes:**

- `GET /mentor-students` — `reportCount` was capped at 30 due to `take: 30` on the dailyReports include. Fixed by using Prisma `_count` for the real total, and fetching only 1 report (latest) to check `reportedToday`.
- `GET /mentor-student/:studentId` — `n.mentor.user.name` and `c.mentor.user.name` crashed with TypeError if a mentor faculty was deleted. Fixed with optional chaining (`?.`).
- `POST /mentor-student/:studentId/note` and `/call` — Notifications used `findMany({ isActive: true })` creating one `AdminMessage` per admin (duplicates). If no active admin existed, notification was silently dropped. Fixed with `findFirst()` (no filter) + single `create`.
- `PUT /mentor-call/:callId` — No `try/catch` on the frontend; network errors failed silently. Fixed.
- `GET /mentor-students` — Had `plan: 'anchor'` filter — only Anchor-plan students appeared even if other-plan students had this faculty as mentor. Filter removed.

---

## 4. BACKEND — Student Routes (`studentRoutes.js`)

**New endpoints:**

| Endpoint | What it does |
|---|---|
| `GET /mentor-notes` | Student fetches all mentor notes written for them. |
| `GET /mentor-calls` | Student fetches all scheduled/past calls with their mentor. |

**Bug fixes:**

- `GET /notifications` — Was returning system-generated AdminMessage records (report submissions, diagnostic completions) meant for admins only, inflating student unread count. Fixed with content-prefix filter.
- `GET /mentor-notes` and `GET /mentor-calls` — Had redundant `requireAuth` + `validateUrlUser` middleware applied inline (already applied at router mount). Removed duplicates.
- `GET /mentor-notes` and `GET /mentor-calls` — `n.mentor.user.name` / `c.mentor.user.name` crashed with TypeError if mentor was deleted. Fixed with optional chaining.

---

## 5. ADMIN PANEL

### AdminContent — Assign Faculty page (updated)
- Admin sees all non-spark students with plan badges (forge/apex/anchor/spark) with color coding.
- Stats bar: total assignable students, how many have no mentor, how many need assignment.
- **Mentor assignment**: Admin clicks a student → drawer opens → dropdown to pick any faculty as mentor → save.
- **Subject-faculty assignment** (Apex plan only): For each NEET/JEE subject, admin picks a faculty who teaches that subject → saved per subject instantly.
- Students who still need mentor or subject-faculty assigned are flagged visually.

### AdminLMS page
- Passes two new callbacks down to AdminContent:
  - `onStudentMentorUpdated` — updates student list in memory when mentor is saved
  - `onStudentSubjectFacultyUpdated` — updates student list in memory when subject-faculty is saved

---

## 6. FACULTY PANEL

### FacultySidebar — new nav item
- Added **"My Mentees"** nav item (renamed from "My Anchor Students") with a group icon. Routes to `mentor` page.

### FacultyContent — new page: My Mentees
- Two-panel layout: student list on left (296px), detail pane on right (full height, no padding).
- First student is auto-selected on load.
- Shows all assigned mentees regardless of plan (Anchor, Forge, Apex).
- Student cards show green left-border accent if they reported today, tags for today/next call/report count.
- **Write note**: Textarea with character counter. Sends to student, updates UI immediately. Network errors show toast.
- **Schedule call**: Date + time inputs treated as IST (timezone-safe). Duration + optional agenda. Student notified on schedule.
- **Mark call done**: Button appears on past/overdue calls. Updates UI immediately with error handling.
- Daily report cards show focus bar (colored by score), study hours, and filter out filler entries ("nothing", "no", "n/a", etc.).
- Legend row explains ↑/↓/note symbols above reports.
- Tabs use underline style (Daily Reports / Calls / Notes Sent).
- Call cards have 4px colored left stripe: gold = upcoming, green = done, red = overdue.

### FacultyLMS page
- Fetches `mentor-students` list on load, passes it to FacultyContent.
- On mentor student update (note sent or call scheduled), updates the local list.

---

## 7. STUDENT / ANCHOR PANEL

### AnchorSidebar
- Added **"Mentor Notes"** nav item.
- Added **"Notifications"** nav item with unread badge (gold, shows count, caps at 9+).
- Props updated: now accepts `profile` (for mentor name), `reportDoneToday`, `unreadCount`.

### AnchorTopbar
- Page title map extended with: `report`, `calls`, `notes`, `habits`, `diagnostic`, `topics`, `guidance`, `history`, `parent`, `notif`.
- Small page icon added next to title for key pages (dashboard, report, habits, notes).
- Sage-green accent bar added to the left of the page title.
- **Notification bell** added to topbar. Bell stroke turns gold when there are unread notifications. Badge shows unread count (caps at 9+).
- **Mentor chip** centred in topbar — shows mentor initial + name + pulsing green online dot when mentor assigned; shows anchor emoji + "No mentor yet" when unassigned. Gold border applied when mentor exists.
- **Submit Report button** updated with pencil icon.
- Props updated: now accepts `unreadCount`.
- Bug fix: removed unused dead variable `reportDone`.

### AnchorContent — new pages added

**Home page (existing, updated):**
- Shows greeting with time of day (morning/afternoon/evening) using IST.
- Mentor card block showing mentor initial, name, online dot.
- "Note from mentor" block — shows latest mentor note content, or "no note yet this week" if empty.
- Next upcoming call card — shows date, time, duration. Links to Calls page.
- If no call scheduled, shows placeholder card.
- Daily report status bar.
- Stats row now includes mentor notes count.

**Calls page (new):**
- Split into "Upcoming" and "Past" sections.
- Each call card shows: date, time, duration, mentor name, call notes if any.
- Empty state with message when no calls exist.
- Description: "45-minute honest conversations — not teaching sessions."

**Mentor Notes page (new):**
- Lists all weekly notes from mentor, newest first.
- Each note card shows: mentor initial, mentor name, week label (e.g. "Week note · Mon, 23 Jun 2025").
- Note body with left gold border, italic.
- Empty state: different message depending on whether mentor is assigned or not.
- Description: "Your mentor writes a note at the end of each week."

**Notifications page (new):**
- Filter tabs: "All" / "Unread".
- Each notification shows type, title, body, time ago (e.g. "3h ago").
- Unread notifications have a subtle highlight. Click to mark read.
- "Mark all read" button at top right.
- Empty state for no notifications / no unread.

**Habits page (existing, updated):**
- Note updated: mentions mentor reads habit history before every weekly call.
- Dot grid showing 7-day habit streaks per category.

**Report History page (existing, updated):**
- Empty state added.

**Parent View page (existing):**
- Updated description copy.

### AnchorStyles.css — new styles added
- `.mentor-note`, `.mn-week`, `.mentor-note-empty` — note display styles
- `.mentor-note-card`, `.mnc-header`, `.mnc-av`, `.mnc-name`, `.mnc-week`, `.mnc-body` — note card layout
- `.ac-empty-card`, `.ac-empty-icon`, `.ac-empty-title`, `.ac-empty-sub` — empty state card styles
- `@keyframes mnSlideIn` — slide-in animation for note cards

### AnchorLMS page
- Fetches `mentor-notes`, `mentor-calls`, and `notifications` on load.
- Polls notifications, mentor notes, and mentor calls every 15 seconds so student sees new notes and notifications without refreshing.
- `markNotifRead` — marks a single notification read (API call + local state update).
- `markAllNotifRead` — marks all unread read in parallel.
- Passes `unreadCount` to both `AnchorSidebar` and `AnchorTopbar`.
- Passes `reportDoneToday` to `AnchorSidebar`.

### StudentContent (student LMS, not anchor)
- **Home page**: mentor card shows mentor name/initial or "Studyverse Admin" fallback.
- **Mentor page**: shows mentor profile card with correct plan label (reads from `profile.studentProfile.plan`, not hardcoded "Apex").
- **Mentor Notes (live)**: fetches real notes from `/mentor-notes` via `StudentLMS`. Shows latest note with week label and "View all" link. Empty state if no notes.
- **Mentor Calls (live)**: fetches real calls from `/mentor-calls` via `StudentLMS`. Shows up to 3 calls with date, time, duration, status badge (Upcoming/Done/Overdue) and colored left border. Empty state if none.
- **Subject Faculty**: displays per-subject faculty for Apex students from resolved `subjectFaculty` map.
- Bug fix: removed hardcoded fake mentor note quote that showed placeholder text as if it were a real note.
- Bug fix: removed fake "Book a Call" button from call history that triggered a no-op toast.

---

## Summary of what mentor system does end-to-end

1. Admin assigns a mentor (faculty) to a student via the **Assign Faculty** page.
2. Admin can also assign subject-specific faculty to Apex students from the same page.
3. The assigned faculty sees the student in "My Anchor Students" on their faculty panel.
4. Faculty writes weekly notes and schedules 45-min calls from their panel.
5. Student sees their mentor's name in the topbar chip and on the dashboard mentor card.
6. Student sees all mentor notes on the "Mentor Notes" page.
7. Student sees upcoming and past calls on the "Calls" page.
8. Student gets notified (via existing notification system) when a note is written or call is scheduled.

---

## Bug Fixes

| # | Severity | File | Bug | Fix |
|---|----------|------|-----|-----|
| 1 | Critical | `studentRoutes.js` `/notifications` | Student saw their own activity (daily report submission, diagnostic) as unread notifications — these `AdminMessage` records were created for admin visibility but were also returned to the student, showing admin-directed language like "View their report in the Students tab." | Filter out messages matching known system-generated content prefixes before returning to student. |
| 2 | Critical | `facultyRoutes.js` note & call routes | Mentor note and call notifications used `adminProfile.findFirst` — if no active admin existed in the DB, the student never received the notification about their new note or scheduled call. | Switched to `adminProfile.findMany` + `adminMessage.createMany`, matching the pattern used in all other notification routes. |
| 3 | Medium | `studentRoutes.js` `/daily-reports` | `take: 30` caused day 1 of any 31-day month to be silently missing from the fetched data. The month consistency grid showed it as "missed" even when a report was submitted. | Increased to `take: 62` (covers two full calendar months). |
| 4 | Low | `AnchorTopbar.jsx` | Dead variable `const reportDone = false` was declared but never used. | Removed. |
