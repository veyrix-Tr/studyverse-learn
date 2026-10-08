// Subject matching for the admin assign modals. Tolerant of label variants
// (Maths / Mathematics / Math, Biology / Zoology / Botany) and of faculty whose
// computed subjects array came back empty.

const ALIASES = {
  physics: ['phys'],
  chemistry: ['chem'],
  maths: ['math'],
  mathematics: ['math'],
  biology: ['bio', 'zoology', 'botany'],
  zoology: ['zoology', 'bio'],
  botany: ['botany', 'bio'],
};

export const facultySubjects = (f) => {
  const list = Array.isArray(f.subjects) && f.subjects.length ? f.subjects : [f.subject];
  return list.filter(Boolean);
};

export const teachesSubject = (f, target) => {
  const key = String(target || '').toLowerCase();
  const keys = ALIASES[key] || [key];
  return facultySubjects(f).some(s => {
    const l = s.toLowerCase();
    return keys.some(k => l.includes(k));
  });
};

export const isActiveFaculty = (f) => f.isActive !== false;

// Faculty with no grade history yet (just created, never scheduled) stay
// eligible for every grade — only faculty with known grades are filtered out.
export const gradeEligible = (f, grade) => {
  if (!grade || grade === 'all') return true;
  const list = (f.grades || []).map(String);
  return list.length === 0 || list.includes(String(grade));
};
