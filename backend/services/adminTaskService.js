// services/adminTaskService.js
// Single source of truth for admin "assignment tasks". Guarantees that the
// tasks the inbox should show actually exist, for every active admin. Used both
// when a payment/session event fires AND when an admin opens the inbox, so the
// list is always current even if a past upgrade was made before tasks existed.

const { EXAM_SUBJECTS } = require('./resourceAccess');

const coreSubjectsFor = (student) => {
  for (const key of Object.keys(EXAM_SUBJECTS)) {
    if ((student.examTarget || '').includes(key.split(' ')[0])) return EXAM_SUBJECTS[key];
  }
  return EXAM_SUBJECTS['JEE Mains'];
};

// Idempotent. Creates any missing pending tasks for all active admins.
// Returns the number of tasks created.
const ensureAssignmentTasks = async (prisma) => {
  const admins = await prisma.adminProfile.findMany({ where: { isActive: true }, select: { id: true } });
  if (!admins.length) return 0;

  const hasPending = async (studentId, type) =>
    (await prisma.adminNotification.count({ where: { studentId, type, status: 'pending' } })) > 0;

  const insert = async (type, content, studentId) => {
    if (studentId != null && (await hasPending(studentId, type))) return 0;
    await prisma.adminNotification.createMany({
      data: admins.map(a => ({ adminId: a.id, studentId, type, content })),
    });
    return 1;
  };

  let created = 0;

  // 1) Paid students (Anchor/Apex) need a mentor; Apex also needs subject faculty.
  const paid = await prisma.studentProfile.findMany({
    where: { plan: { in: ['apex', 'anchor'] } },
    include: { user: { select: { name: true } } },
  });
  for (const s of paid) {
    if (!s.mentorId) {
      created += await insert('mentor', `Assign a mentor to ${s.user.name} (${s.plan} plan)`, s.id);
    }
    if (s.plan === 'apex') {
      const sf = s.subjectFaculty || {};
      const missing = coreSubjectsFor(s).filter(sub => !sf[sub]);
      if (missing.length) {
        created += await insert('faculty', `Assign subject faculty (${missing.join(', ')}) to ${s.user.name} (apex plan)`, s.id);
      }
    }
  }

  // 2) Pending session requests need a faculty assigned.
  const pendingReqs = await prisma.sessionRequest.findMany({
    where: { status: 'pending' },
    include: { student: { include: { user: { select: { name: true } } } } },
  });
  for (const r of pendingReqs) {
    created += await insert('session', `Assign faculty for the new session request from ${r.student.user.name}`, r.studentId);
  }

  return created;
};

module.exports = { ensureAssignmentTasks, coreSubjectsFor };