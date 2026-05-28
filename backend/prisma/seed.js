const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const studentPass = await bcrypt.hash('test1234', 10);
  const adminPass   = await bcrypt.hash('admin1234', 10);

  // Clear existing data first (order matters due to foreign keys)
  await prisma.weeklyScore.deleteMany();
  await prisma.doubt.deleteMany();
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

  await prisma.user.create({
    data: {
      name: 'Ishaan Gupta',
      email: 'ishaan@test.com',
      password: studentPass,
      role: 'student',
      studentProfile: {
        create: {
          plan: 'premium',
          examTarget: 'JEE Mains',
          targetYear: '2027',
          grade: '12',
          parentPhone: '9876543211',
          planEndDate: new Date('2026-12-31'),
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
          subject: 'Maths',
          department: 'Science',
          qualification: 'M.Sc',
        },
      },
    },
  });

  // ── Super Admin ───────────────────────────────────
  await prisma.user.create({
    data: {
      name: 'Chirag Goyal',
      email: 'superadmin@studyverse.com',
      password: adminPass,
      role: 'superadmin',
      adminProfile: { create: { department: 'Platform' } },
    },
  });

  // ── Admins ────────────────────────────────────────
  await prisma.user.create({
    data: {
      name: 'Meera Krishnan',
      email: 'admin1@studyverse.com',
      password: adminPass,
      role: 'admin',
      adminProfile: { create: { department: 'Operations' } },
    },
  });

  await prisma.user.create({
    data: {
      name: 'Sanjay Pillai',
      email: 'admin2@studyverse.com',
      password: adminPass,
      role: 'admin',
      adminProfile: { create: { department: 'Finance' } },
    },
  });

  // ── Fetch created profiles ────────────────────────
  const kavitaProfile = await prisma.facultyProfile.findFirst({ where: { user: { email: 'kavita@test.com' } } });
  const amitProfile   = await prisma.facultyProfile.findFirst({ where: { user: { email: 'amit@test.com'   } } });
  const priyaProfile  = await prisma.studentProfile.findFirst({ where: { user: { email: 'priya@test.com'  } } });
  const ishaanProfile = await prisma.studentProfile.findFirst({ where: { user: { email: 'ishaan@test.com' } } });

  // ── Sessions — upcoming (June 2026) ──────────────
  // Grade 12 → JEE students (Ishaan): Physics, Chemistry, Maths
  // Dropper  → NEET students (Priya): Physics, Chemistry, Biology
  await prisma.session.createMany({ data: [
    { title: 'Electrostatics & Gauss\'s Law',  subject: 'Physics',   grade: '12',      dayOfWeek: 'Tuesday',   scheduledAt: new Date('2026-06-02T07:00:00'), duration: 60, facultyId: kavitaProfile.id },
    { title: 'Atomic Structure & Orbitals',    subject: 'Chemistry', grade: '12',      dayOfWeek: 'Thursday',  scheduledAt: new Date('2026-06-04T09:00:00'), duration: 60, facultyId: kavitaProfile.id },
    { title: 'Calculus — Integration',         subject: 'Maths',     grade: '12',      dayOfWeek: 'Monday',    scheduledAt: new Date('2026-06-01T18:00:00'), duration: 60, facultyId: amitProfile.id   },
    { title: 'Thermodynamics — Laws & Cycles', subject: 'Physics',   grade: 'Dropper', dayOfWeek: 'Wednesday', scheduledAt: new Date('2026-06-03T09:00:00'), duration: 60, facultyId: kavitaProfile.id },
    { title: 'Human Physiology — Circulation', subject: 'Biology',   grade: 'Dropper', dayOfWeek: 'Friday',    scheduledAt: new Date('2026-06-05T09:00:00'), duration: 90, facultyId: kavitaProfile.id },
    { title: 'Organic Reactions — Mechanisms', subject: 'Chemistry', grade: 'Dropper', dayOfWeek: 'Saturday',  scheduledAt: new Date('2026-06-06T10:00:00'), duration: 60, facultyId: amitProfile.id   },
  ]});

  // ── Sessions — older past (early May 2026) ────────
  await prisma.session.createMany({ data: [
    { title: 'Kinematics & Projectile Motion', subject: 'Physics',   grade: '12',      dayOfWeek: 'Tuesday',   scheduledAt: new Date('2026-05-05T07:00:00'), duration: 60, facultyId: kavitaProfile.id },
    { title: 'Chemical Bonding & VSEPR',       subject: 'Chemistry', grade: '12',      dayOfWeek: 'Thursday',  scheduledAt: new Date('2026-05-07T09:00:00'), duration: 60, facultyId: kavitaProfile.id },
    { title: 'Sequences & Series',             subject: 'Maths',     grade: '12',      dayOfWeek: 'Monday',    scheduledAt: new Date('2026-05-04T18:00:00'), duration: 60, facultyId: amitProfile.id   },
    { title: 'Work, Energy & Power',           subject: 'Physics',   grade: 'Dropper', dayOfWeek: 'Wednesday', scheduledAt: new Date('2026-05-06T09:00:00'), duration: 60, facultyId: kavitaProfile.id },
    { title: 'Genetics & Evolution',           subject: 'Biology',   grade: 'Dropper', dayOfWeek: 'Friday',    scheduledAt: new Date('2026-05-08T09:00:00'), duration: 90, facultyId: kavitaProfile.id },
    { title: 'Chemical Equilibrium',           subject: 'Chemistry', grade: 'Dropper', dayOfWeek: 'Saturday',  scheduledAt: new Date('2026-05-09T10:00:00'), duration: 60, facultyId: amitProfile.id   },
  ]});

  // ── Sessions — recent past (last 7 days, May 22–27 2026) ──────────
  await prisma.session.createMany({ data: [
    { title: 'Newton\'s Laws & Friction',      subject: 'Physics',   grade: '12',      dayOfWeek: 'Friday',    scheduledAt: new Date('2026-05-22T07:00:00'), duration: 60, facultyId: kavitaProfile.id },
    { title: 'Limits & Derivatives',           subject: 'Maths',     grade: '12',      dayOfWeek: 'Monday',    scheduledAt: new Date('2026-05-25T18:00:00'), duration: 60, facultyId: amitProfile.id   },
    { title: 'Ray Optics & Lenses',            subject: 'Physics',   grade: 'Dropper', dayOfWeek: 'Wednesday', scheduledAt: new Date('2026-05-27T09:00:00'), duration: 60, facultyId: kavitaProfile.id },
  ]});

  // ── Doubts (premium students only: Priya + Ishaan) ───────────────
  // Kavita (Physics) also teaches Chemistry + Biology for Dropper grade → handles those doubts too
  // Amit (Maths) handles Maths doubts for grade 12
  await prisma.doubt.createMany({ data: [
    // Priya (NEET, Dropper) — 2 answered, 2 open
    {
      question: 'Can you share notes on Snell\'s Law and total internal reflection?',
      subject: 'Physics',
      answer: 'Snell\'s Law: n₁ sin θ₁ = n₂ sin θ₂. Total internal reflection occurs when light travels from denser to rarer medium and the angle of incidence exceeds the critical angle (sin θc = n₂/n₁). Used in optical fibres.',
      answeredAt: new Date('2026-05-10T09:00:00'), createdAt: new Date('2026-05-09T21:00:00'),
      studentId: priyaProfile.id, facultyId: kavitaProfile.id,
    },
    {
      question: 'How do I differentiate between SN1 and SN2 reactions quickly in MCQs?',
      subject: 'Chemistry',
      answer: 'SN1: favoured by tertiary substrates, polar protic solvents, weak nucleophiles — proceeds via carbocation intermediate. SN2: favoured by primary substrates, polar aprotic solvents, strong nucleophiles — single-step with inversion of configuration.',
      answeredAt: new Date('2026-05-17T16:00:00'), createdAt: new Date('2026-05-16T10:00:00'),
      studentId: priyaProfile.id, facultyId: kavitaProfile.id,
    },
    {
      question: 'What is the difference between NTA NEET UG exam pattern and previous years\' pattern?',
      subject: 'Biology',
      answer: null, answeredAt: null, createdAt: new Date('2026-05-22T14:00:00'),
      studentId: priyaProfile.id, facultyId: kavitaProfile.id,
    },
    {
      question: 'I am confused about the difference between osmosis and diffusion — how to remember for NEET?',
      subject: 'Biology',
      answer: null, answeredAt: null, createdAt: new Date('2026-05-25T20:00:00'),
      studentId: priyaProfile.id, facultyId: kavitaProfile.id,
    },

    // Ishaan (JEE Mains, grade 12) — 1 answered, 1 open
    {
      question: 'Can you explain why the range of a projectile is maximum at 45 degrees? I understand the formula but not the intuition.',
      subject: 'Physics',
      answer: 'At 45°, the horizontal and vertical components of velocity are equal. The range formula R = u²sin2θ/g is maximised when sin2θ = 1, i.e. 2θ = 90°, so θ = 45°. Intuitively — less than 45° gives good horizontal speed but not enough height; more than 45° gives too much height but poor horizontal reach. 45° is the perfect balance.',
      answeredAt: new Date('2026-05-20T10:00:00'), createdAt: new Date('2026-05-19T22:00:00'),
      studentId: ishaanProfile.id, facultyId: kavitaProfile.id,
    },
    {
      question: 'How do I approach integer type questions in JEE Mains where I have to fill in a single digit answer?',
      subject: 'Maths',
      answer: null, answeredAt: null, createdAt: new Date('2026-05-26T17:00:00'),
      studentId: ishaanProfile.id, facultyId: amitProfile.id,
    },
  ]});

  // ── Weekly Scores (premium students only: Priya + Ishaan) ──────────
  // Free students (Aarav, Rohan) have no weekly tests — that is a premium feature
  await prisma.weeklyScore.createMany({ data: [
    { studentId: priyaProfile.id, weekNumber: 1, subject: 'Biology',   score: 75, totalMarks: 100, testDate: new Date('2026-05-05') },
    { studentId: priyaProfile.id, weekNumber: 1, subject: 'Physics',   score: 62, totalMarks: 100, testDate: new Date('2026-05-05') },
    { studentId: priyaProfile.id, weekNumber: 1, subject: 'Chemistry', score: 58, totalMarks: 100, testDate: new Date('2026-05-05') },
    { studentId: priyaProfile.id, weekNumber: 2, subject: 'Biology',   score: 80, totalMarks: 100, testDate: new Date('2026-05-12') },
    { studentId: priyaProfile.id, weekNumber: 2, subject: 'Physics',   score: 67, totalMarks: 100, testDate: new Date('2026-05-12') },
    { studentId: priyaProfile.id, weekNumber: 2, subject: 'Chemistry', score: 63, totalMarks: 100, testDate: new Date('2026-05-12') },
    { studentId: priyaProfile.id, weekNumber: 3, subject: 'Biology',   score: 84, totalMarks: 100, testDate: new Date('2026-05-19') },
    { studentId: priyaProfile.id, weekNumber: 3, subject: 'Physics',   score: 71, totalMarks: 100, testDate: new Date('2026-05-19') },
    { studentId: priyaProfile.id, weekNumber: 3, subject: 'Chemistry', score: 68, totalMarks: 100, testDate: new Date('2026-05-19') },
    { studentId: priyaProfile.id, weekNumber: 4, subject: 'Biology',   score: 88, totalMarks: 100, testDate: new Date('2026-05-26') },
    { studentId: priyaProfile.id, weekNumber: 4, subject: 'Physics',   score: 76, totalMarks: 100, testDate: new Date('2026-05-26') },
    { studentId: priyaProfile.id, weekNumber: 4, subject: 'Chemistry', score: 73, totalMarks: 100, testDate: new Date('2026-05-26') },

    // Ishaan (JEE Mains): Physics + Maths + Chemistry × 4 weeks
    { studentId: ishaanProfile.id, weekNumber: 1, subject: 'Physics',   score: 54, totalMarks: 100, testDate: new Date('2026-05-05') },
    { studentId: ishaanProfile.id, weekNumber: 1, subject: 'Maths',     score: 58, totalMarks: 100, testDate: new Date('2026-05-05') },
    { studentId: ishaanProfile.id, weekNumber: 1, subject: 'Chemistry', score: 55, totalMarks: 100, testDate: new Date('2026-05-05') },
    { studentId: ishaanProfile.id, weekNumber: 2, subject: 'Physics',   score: 60, totalMarks: 100, testDate: new Date('2026-05-12') },
    { studentId: ishaanProfile.id, weekNumber: 2, subject: 'Maths',     score: 65, totalMarks: 100, testDate: new Date('2026-05-12') },
    { studentId: ishaanProfile.id, weekNumber: 2, subject: 'Chemistry', score: 60, totalMarks: 100, testDate: new Date('2026-05-12') },
    { studentId: ishaanProfile.id, weekNumber: 3, subject: 'Physics',   score: 65, totalMarks: 100, testDate: new Date('2026-05-19') },
    { studentId: ishaanProfile.id, weekNumber: 3, subject: 'Maths',     score: 70, totalMarks: 100, testDate: new Date('2026-05-19') },
    { studentId: ishaanProfile.id, weekNumber: 3, subject: 'Chemistry', score: 66, totalMarks: 100, testDate: new Date('2026-05-19') },
    { studentId: ishaanProfile.id, weekNumber: 4, subject: 'Physics',   score: 69, totalMarks: 100, testDate: new Date('2026-05-26') },
    { studentId: ishaanProfile.id, weekNumber: 4, subject: 'Maths',     score: 74, totalMarks: 100, testDate: new Date('2026-05-26') },
    { studentId: ishaanProfile.id, weekNumber: 4, subject: 'Chemistry', score: 70, totalMarks: 100, testDate: new Date('2026-05-26') },
  ]});

  console.log('Seeded: 4 students (2 free, 2 premium), 2 faculty, 1 superadmin + 2 admins, 15 sessions, 6 doubts (premium only), 24 weekly scores (premium only)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
