// One place that decides who may see a Resource — the student feeds, the admin
// approval notifications and the faculty upload validation all use it, so they
// can never drift apart.
//
// Two distribution modes:
//   broadcast — no recipients: the original plan/subject/grade library rules.
//   targeted  — uploader named students: no subject/grade gate (validated at
//               pick time), plan/type paywall still applies.

const { getEffectivePlan } = require('./planAccessService');

const EXAM_SUBJECTS = {
  'JEE Mains':    ['Physics', 'Chemistry', 'Maths'],
  'JEE Advanced': ['Physics', 'Chemistry', 'Maths'],
  'NEET':         ['Physics', 'Chemistry', 'Biology'],
};

const QUESTION_BANK_TYPES = ['MCQ Bank', 'Previous Year Papers', 'Practice Set'];
const LIBRARY_TYPES       = ['Study Material', 'Formula Sheet'];
const RESOURCE_TYPES      = [...LIBRARY_TYPES, 'Session Notes'];

// Broadcast entitlements (unchanged from before targeting existed).
function broadcastTypes(plan) {
  if (plan === 'apex')  return [...RESOURCE_TYPES, ...QUESTION_BANK_TYPES];
  if (plan === 'forge') return [...LIBRARY_TYPES, ...QUESTION_BANK_TYPES];
  return []; // spark pays for nothing; anchor's content arrives targeted from its mentor
}

// Targeted — same paywall as broadcast (Session Notes stay Apex-only, the
// question bank stays Forge & above); Anchor's material only arrives targeted
// from its mentor, so it is listed here but never broadcast.
function targetedTypes(plan) {
  if (plan === 'apex' || plan === 'forge') return broadcastTypes(plan);
  if (plan === 'anchor') return LIBRARY_TYPES;
  return [];
}

// Types a student sees in one feed: pool 'library' or 'question-bank'.
function allowedTypes(plan, { targeted = false, pool = 'library' } = {}) {
  const types = targeted ? targetedTypes(plan) : broadcastTypes(plan);
  return types.filter(t => (pool === 'question-bank' ? QUESTION_BANK_TYPES : RESOURCE_TYPES).includes(t));
}

// Prisma grade filter (null = no gate, grade unset). Droppers revise 11 + 12
// plus dropper-tagged material; everyone else only their own grade.
function gradeFilterFor(studentGrade) {
  if (!studentGrade) return null;
  if (String(studentGrade) === 'Dropper') return ['11', '12', 'Dropper'];
  return [studentGrade];
}

function gradeAllows(studentGrade, resourceGrade) {
  const allowed = gradeFilterFor(studentGrade);
  return !allowed || !resourceGrade || allowed.map(String).includes(String(resourceGrade));
}

// A faculty "owns" an Apex student only when an admin assigned them for at
// least one subject via the student's subjectFaculty map.
function assignedFaculty(fp, sp) {
  const sf = sp.subjectFaculty;
  return !!sf && typeof sf === 'object' && Object.values(sf).includes(fp.id);
}

const poolFor = (type) => (QUESTION_BANK_TYPES.includes(type) ? 'question-bank' : 'library');

// Can this student see this resource right now? Used at notify time so an
// alert is never raised for something the feed will hide.
function canReceive(profile, { subject, grade, type, targeted }) {
  const plan = getEffectivePlan(profile);
  if (!allowedTypes(plan, { targeted, pool: poolFor(type) }).includes(type)) return false;
  if (targeted) return true; // named recipients skip subject/grade, like the feed
  return (EXAM_SUBJECTS[profile.examTarget] || []).includes(subject) && gradeAllows(profile.grade, grade);
}

// Upload-time gate for a targeted send: assignment + paywall + subject + grade.
function targetEligibility(fp, sp, { subject, grade, type }) {
  const plan = getEffectivePlan(sp);
  if (sp.mentorId !== fp.id && !(plan === 'apex' && assignedFaculty(fp, sp)))
    return { ok: false, reason: 'not on your student list' };
  if (!canReceive(sp, { subject, grade, type, targeted: true }))
    return { ok: false, reason: `${plan} plan can't receive ${type}` };
  if (!(EXAM_SUBJECTS[sp.examTarget] || []).includes(subject))
    return { ok: false, reason: `doesn't study ${subject}` };
  if (!gradeAllows(sp.grade, grade))
    return { ok: false, reason: `isn't a ${grade} student` };
  return { ok: true };
}

module.exports = {
  EXAM_SUBJECTS,
  QUESTION_BANK_TYPES,
  allowedTypes,
  gradeFilterFor,
  assignedFaculty,
  canReceive,
  targetEligibility,
};
