const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const studentPass = await bcrypt.hash('test1234', 10);
  const adminPass   = await bcrypt.hash('admin1234', 10);

  // Clear existing data first (order matters due to foreign keys)
  await prisma.weeklyScore.deleteMany();
  await prisma.doubt.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.session.deleteMany();
  await prisma.otp.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.facultyProfile.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.user.deleteMany();

  // ── Students ──────────────────────────────────────
  await prisma.user.create({
    data: {
      name: 'Aarav Sharma',
      email: 'aarav@test.com',
      password: studentPass,
      role: 'student',
      studentProfile: {
        create: {
          plan: 'free',
          examTarget: 'JEE Mains',
          targetYear: '2027',
          grade: '12',
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      name: 'Priya Mehta',
      email: 'priya@test.com',
      password: studentPass,
      role: 'student',
      studentProfile: {
        create: {
          plan: 'premium',
          examTarget: 'NEET',
          targetYear: '2027',
          grade: 'Dropper',
          parentPhone: '9876543210',
          planEndDate: new Date('2026-12-31'),
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      name: 'Rohan Verma',
      email: 'rohan@test.com',
      password: studentPass,
      role: 'student',
      studentProfile: {
        create: {
          plan: 'free',
          examTarget: 'JEE Advanced',
          targetYear: '2028',
          grade: '11',
        },
      },
    },
  });

  // ── Faculty ───────────────────────────────────────
  await prisma.user.create({
    data: {
      name: 'Dr. Kavita Rao',
      email: 'kavita@test.com',
      password: studentPass,
      role: 'faculty',
      facultyProfile: {
        create: {
          subject: 'Physics',
          department: 'Science',
          qualification: 'Ph.D',
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      name: 'Amit Joshi',
      email: 'amit@test.com',
      password: studentPass,
      role: 'faculty',
      facultyProfile: {
        create: {
          subject: 'Mathematics',
          department: 'Science',
          qualification: 'M.Sc',
        },
      },
    },
  });

  // ── Admin ─────────────────────────────────────────
  await prisma.user.create({
    data: {
      name: 'Chirag Goyal',
      email: 'admin@studyverse.com',
      password: adminPass,
      role: 'admin',
      adminProfile: {
        create: {
          department: 'Platform',
        },
      },
    },
  });

  // ── Fetch created profiles ────────────────────────
  const kavitaProfile = await prisma.facultyProfile.findFirst({ where: { user: { email: 'kavita@test.com' } } });
  const amitProfile   = await prisma.facultyProfile.findFirst({ where: { user: { email: 'amit@test.com'   } } });
  const aaravProfile  = await prisma.studentProfile.findFirst({ where: { user: { email: 'aarav@test.com'  } } });
  const priyaProfile  = await prisma.studentProfile.findFirst({ where: { user: { email: 'priya@test.com'  } } });
  const rohanProfile  = await prisma.studentProfile.findFirst({ where: { user: { email: 'rohan@test.com'  } } });

  // ── Sessions (class schedule) ─────────────────────
  const s1 = await prisma.session.create({ data: { title: 'Laws of Motion', subject: 'Physics',     dayOfWeek: 'Monday',    scheduledAt: new Date('2026-06-02T07:00:00'), duration: 60, planRequired: 'free',    facultyId: kavitaProfile.id } });
  const s2 = await prisma.session.create({ data: { title: 'Thermodynamics', subject: 'Physics',     dayOfWeek: 'Wednesday', scheduledAt: new Date('2026-06-04T09:00:00'), duration: 60, planRequired: 'free',    facultyId: kavitaProfile.id } });
  const s3 = await prisma.session.create({ data: { title: 'Optics Advanced', subject: 'Physics',    dayOfWeek: 'Friday',    scheduledAt: new Date('2026-06-06T07:00:00'), duration: 90, planRequired: 'premium', facultyId: kavitaProfile.id } });
  const s4 = await prisma.session.create({ data: { title: 'Quadratic Equations', subject: 'Maths', dayOfWeek: 'Tuesday',   scheduledAt: new Date('2026-06-03T18:00:00'), duration: 60, planRequired: 'free',    facultyId: amitProfile.id   } });
  const s5 = await prisma.session.create({ data: { title: 'Calculus - Integration', subject: 'Maths', dayOfWeek: 'Thursday', scheduledAt: new Date('2026-06-05T18:00:00'), duration: 60, planRequired: 'free',    facultyId: amitProfile.id   } });
  const s6 = await prisma.session.create({ data: { title: 'Vectors & 3D Geometry', subject: 'Maths', dayOfWeek: 'Saturday', scheduledAt: new Date('2026-06-07T10:00:00'), duration: 90, planRequired: 'premium', facultyId: amitProfile.id   } });

  // ── Enrollments ───────────────────────────────────
  // Aarav (free) → free sessions only
  await prisma.enrollment.createMany({ data: [
    { studentId: aaravProfile.id, sessionId: s1.id },
    { studentId: aaravProfile.id, sessionId: s2.id },
    { studentId: aaravProfile.id, sessionId: s4.id },
    { studentId: aaravProfile.id, sessionId: s5.id },
  ]});

  // Priya (premium) → all sessions
  await prisma.enrollment.createMany({ data: [
    { studentId: priyaProfile.id, sessionId: s1.id },
    { studentId: priyaProfile.id, sessionId: s2.id },
    { studentId: priyaProfile.id, sessionId: s3.id },
    { studentId: priyaProfile.id, sessionId: s4.id },
    { studentId: priyaProfile.id, sessionId: s5.id },
    { studentId: priyaProfile.id, sessionId: s6.id },
  ]});

  // Rohan (free) → free sessions only
  await prisma.enrollment.createMany({ data: [
    { studentId: rohanProfile.id, sessionId: s1.id },
    { studentId: rohanProfile.id, sessionId: s4.id },
    { studentId: rohanProfile.id, sessionId: s5.id },
  ]});

  // ── Doubts ────────────────────────────────────────
  await prisma.doubt.createMany({ data: [
    { question: 'Can you explain the difference between static and kinetic friction?', answer: 'Static friction acts on a body at rest, while kinetic friction acts on a moving body. Static friction is always greater than kinetic friction.', answeredAt: new Date('2026-05-20T10:30:00'), studentId: aaravProfile.id, facultyId: kavitaProfile.id },
    { question: 'How do I solve integration by parts problems?', answer: 'Use the ILATE rule to choose u and dv. Differentiate u and integrate dv, then apply the formula: ∫u dv = uv - ∫v du.', answeredAt: new Date('2026-05-21T14:00:00'), studentId: aaravProfile.id, facultyId: amitProfile.id   },
    { question: 'What is the difference between NTA NEET and AIIMS exam pattern?', answer: null, answeredAt: null, studentId: priyaProfile.id, facultyId: kavitaProfile.id },
    { question: 'Can you share notes on Snell\'s Law?', answer: 'Snell\'s Law: n1 sin θ1 = n2 sin θ2. The ratio of sines of angles equals the ratio of refractive indices.', answeredAt: new Date('2026-05-22T09:00:00'), studentId: priyaProfile.id, facultyId: kavitaProfile.id },
    { question: 'Is there a shortcut for solving quadratic equations in MCQs?', answer: null, answeredAt: null, studentId: rohanProfile.id, facultyId: amitProfile.id },
  ]});

  // ── Weekly Scores ─────────────────────────────────
  await prisma.weeklyScore.createMany({ data: [
    { studentId: aaravProfile.id, weekNumber: 1, subject: 'Physics', score: 72, totalMarks: 100, testDate: new Date('2026-05-05') },
    { studentId: aaravProfile.id, weekNumber: 2, subject: 'Physics', score: 78, totalMarks: 100, testDate: new Date('2026-05-12') },
    { studentId: aaravProfile.id, weekNumber: 3, subject: 'Maths',   score: 65, totalMarks: 100, testDate: new Date('2026-05-19') },
    { studentId: aaravProfile.id, weekNumber: 4, subject: 'Maths',   score: 80, totalMarks: 100, testDate: new Date('2026-05-26') },

    { studentId: priyaProfile.id, weekNumber: 1, subject: 'Biology', score: 88, totalMarks: 100, testDate: new Date('2026-05-05') },
    { studentId: priyaProfile.id, weekNumber: 2, subject: 'Biology', score: 91, totalMarks: 100, testDate: new Date('2026-05-12') },
    { studentId: priyaProfile.id, weekNumber: 3, subject: 'Physics', score: 84, totalMarks: 100, testDate: new Date('2026-05-19') },
    { studentId: priyaProfile.id, weekNumber: 4, subject: 'Physics', score: 89, totalMarks: 100, testDate: new Date('2026-05-26') },

    { studentId: rohanProfile.id, weekNumber: 1, subject: 'Maths',   score: 55, totalMarks: 100, testDate: new Date('2026-05-05') },
    { studentId: rohanProfile.id, weekNumber: 2, subject: 'Maths',   score: 62, totalMarks: 100, testDate: new Date('2026-05-12') },
    { studentId: rohanProfile.id, weekNumber: 3, subject: 'Physics', score: 70, totalMarks: 100, testDate: new Date('2026-05-19') },
    { studentId: rohanProfile.id, weekNumber: 4, subject: 'Physics', score: 74, totalMarks: 100, testDate: new Date('2026-05-26') },
  ]});

  console.log('Seeded: 3 students, 2 faculty, 1 admin, 6 sessions, enrollments, doubts, weekly scores');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
