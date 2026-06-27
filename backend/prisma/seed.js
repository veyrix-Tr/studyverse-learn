const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const studentPass = await bcrypt.hash('test1234', 10);
  const adminPass   = await bcrypt.hash('admin1234', 10);

  // Clear in dependency order (most specific first)
  await prisma.weeklyReport.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.adminMessage.deleteMany();
  await prisma.facultyAlert.deleteMany();
  await prisma.mentorCall.deleteMany();
  await prisma.mentorNote.deleteMany();
  await prisma.facultyNotification.deleteMany();
  await prisma.habitLog.deleteMany();
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
        create: { plan: 'spark', examTarget: 'JEE Mains', targetYear: '2027', grade: '12' },
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
          plan: 'apex',
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
        create: { plan: 'spark', examTarget: 'JEE Advanced', targetYear: '2028', grade: '11' },
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
          plan: 'apex',
          examTarget: 'JEE Mains',
          targetYear: '2027',
          grade: '12',
          parentPhone: '9876543211',
          planEndDate: new Date('2026-12-31'),
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      name: 'Arjun Nair',
      email: 'arjun@test.com',
      password: studentPass,
      role: 'student',
      studentProfile: {
        create: { plan: 'forge', examTarget: 'JEE Mains', targetYear: '2027', grade: '12', planEndDate: new Date('2026-12-31') },
      },
    },
  });

  // ── Faculty ───────────────────────────────────────
  // Physics — teaches Dropper + Grade 12 Physics
  await prisma.user.create({
    data: {
      name: 'Dr. Kavita Rao',
      email: 'kavita@test.com',
      password: studentPass,
      role: 'faculty',
      facultyProfile: {
        create: { subject: 'Physics', department: 'Science', qualification: 'Ph.D' },
      },
    },
  });

  // Chemistry — teaches Dropper + Grade 12 Chemistry
  await prisma.user.create({
    data: {
      name: 'Dr. Neha Sharma',
      email: 'neha@test.com',
      password: studentPass,
      role: 'faculty',
      facultyProfile: {
        create: { subject: 'Chemistry', department: 'Science', qualification: 'Ph.D' },
      },
    },
  });

  // Biology — teaches Dropper Biology (NEET only)
  await prisma.user.create({
    data: {
      name: 'Dr. Suresh Iyer',
      email: 'suresh@test.com',
      password: studentPass,
      role: 'faculty',
      facultyProfile: {
        create: { subject: 'Biology', department: 'Science', qualification: 'Ph.D' },
      },
    },
  });

  // Maths — teaches Grade 12 Maths (JEE students)
  await prisma.user.create({
    data: {
      name: 'Amit Joshi',
      email: 'amit@test.com',
      password: studentPass,
      role: 'faculty',
      facultyProfile: {
        create: { subject: 'Maths', department: 'Science', qualification: 'M.Sc' },
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
  const nehaProfile   = await prisma.facultyProfile.findFirst({ where: { user: { email: 'neha@test.com'   } } });
  const sureshProfile = await prisma.facultyProfile.findFirst({ where: { user: { email: 'suresh@test.com' } } });
  const amitProfile   = await prisma.facultyProfile.findFirst({ where: { user: { email: 'amit@test.com'   } } });
  const priyaProfile  = await prisma.studentProfile.findFirst({ where: { user: { email: 'priya@test.com'  } } });
  const ishaanProfile = await prisma.studentProfile.findFirst({ where: { user: { email: 'ishaan@test.com' } } });
  const arjunProfile  = await prisma.studentProfile.findFirst({ where: { user: { email: 'arjun@test.com'  } } });
  const superAdmin    = await prisma.adminProfile.findFirst({   where: { user: { email: 'superadmin@studyverse.com' } } });

  // ── Sessions — upcoming (June 2026) ──────────────
  // Grade 12 → JEE students (Ishaan): Physics=Kavita, Chemistry=Neha, Maths=Amit
  // Dropper  → NEET students (Priya): Physics=Kavita, Chemistry=Neha, Biology=Suresh
  await prisma.session.createMany({ data: [
    { title: 'Electrostatics & Gauss\'s Law',  subject: 'Physics',   grade: '12',      dayOfWeek: 'Tuesday',   scheduledAt: new Date('2026-06-02T07:00:00'), duration: 60, facultyId: kavitaProfile.id },
    { title: 'Atomic Structure & Orbitals',    subject: 'Chemistry', grade: '12',      dayOfWeek: 'Thursday',  scheduledAt: new Date('2026-06-04T09:00:00'), duration: 60, facultyId: nehaProfile.id   },
    { title: 'Calculus — Integration',         subject: 'Maths',     grade: '12',      dayOfWeek: 'Monday',    scheduledAt: new Date('2026-06-01T18:00:00'), duration: 60, facultyId: amitProfile.id   },
    { title: 'Thermodynamics — Laws & Cycles', subject: 'Physics',   grade: 'Dropper', dayOfWeek: 'Wednesday', scheduledAt: new Date('2026-06-03T09:00:00'), duration: 60, facultyId: kavitaProfile.id },
    { title: 'Organic Reactions — Mechanisms', subject: 'Chemistry', grade: 'Dropper', dayOfWeek: 'Saturday',  scheduledAt: new Date('2026-06-06T10:00:00'), duration: 60, facultyId: nehaProfile.id   },
    { title: 'Human Physiology — Circulation', subject: 'Biology',   grade: 'Dropper', dayOfWeek: 'Friday',    scheduledAt: new Date('2026-06-05T09:00:00'), duration: 90, facultyId: sureshProfile.id },
  ]});

  // ── Sessions — older past (early May 2026) ────────
  await prisma.session.createMany({ data: [
    { title: 'Kinematics & Projectile Motion', subject: 'Physics',   grade: '12',      dayOfWeek: 'Tuesday',   scheduledAt: new Date('2026-05-05T07:00:00'), duration: 60, facultyId: kavitaProfile.id },
    { title: 'Chemical Bonding & VSEPR',       subject: 'Chemistry', grade: '12',      dayOfWeek: 'Thursday',  scheduledAt: new Date('2026-05-07T09:00:00'), duration: 60, facultyId: nehaProfile.id   },
    { title: 'Sequences & Series',             subject: 'Maths',     grade: '12',      dayOfWeek: 'Monday',    scheduledAt: new Date('2026-05-04T18:00:00'), duration: 60, facultyId: amitProfile.id   },
    { title: 'Work, Energy & Power',           subject: 'Physics',   grade: 'Dropper', dayOfWeek: 'Wednesday', scheduledAt: new Date('2026-05-06T09:00:00'), duration: 60, facultyId: kavitaProfile.id },
    { title: 'Chemical Equilibrium',           subject: 'Chemistry', grade: 'Dropper', dayOfWeek: 'Saturday',  scheduledAt: new Date('2026-05-09T10:00:00'), duration: 60, facultyId: nehaProfile.id   },
    { title: 'Genetics & Evolution',           subject: 'Biology',   grade: 'Dropper', dayOfWeek: 'Friday',    scheduledAt: new Date('2026-05-08T09:00:00'), duration: 90, facultyId: sureshProfile.id },
  ]});

  // ── Sessions — recent past (late May 2026) ────────
  await prisma.session.createMany({ data: [
    { title: 'Newton\'s Laws & Friction',      subject: 'Physics',   grade: '12',      dayOfWeek: 'Friday',    scheduledAt: new Date('2026-05-22T07:00:00'), duration: 60, facultyId: kavitaProfile.id },
    { title: 'Limits & Derivatives',           subject: 'Maths',     grade: '12',      dayOfWeek: 'Monday',    scheduledAt: new Date('2026-05-25T18:00:00'), duration: 60, facultyId: amitProfile.id   },
    { title: 'Ray Optics & Lenses',            subject: 'Physics',   grade: 'Dropper', dayOfWeek: 'Wednesday', scheduledAt: new Date('2026-05-27T09:00:00'), duration: 60, facultyId: kavitaProfile.id },
    { title: 'Electrochemistry Basics',        subject: 'Chemistry', grade: 'Dropper', dayOfWeek: 'Thursday',  scheduledAt: new Date('2026-05-28T10:00:00'), duration: 60, facultyId: nehaProfile.id   },
    { title: 'Plant Physiology & Transport',   subject: 'Biology',   grade: 'Dropper', dayOfWeek: 'Friday',    scheduledAt: new Date('2026-05-29T09:00:00'), duration: 90, facultyId: sureshProfile.id },
  ]});

  // ── Doubts (premium students only: Priya + Ishaan) ─────────────────
  // Each doubt goes to the faculty who teaches that subject for that student
  await prisma.doubt.createMany({ data: [
    // Priya (NEET, Dropper)
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
      studentId: priyaProfile.id, facultyId: nehaProfile.id,
    },
    {
      question: 'What is the difference between NTA NEET UG exam pattern and previous years\' pattern?',
      subject: 'Biology',
      answer: null, answeredAt: null, createdAt: new Date('2026-05-22T14:00:00'),
      studentId: priyaProfile.id, facultyId: sureshProfile.id,
    },
    {
      question: 'I am confused about the difference between osmosis and diffusion — how to remember for NEET?',
      subject: 'Biology',
      answer: null, answeredAt: null, createdAt: new Date('2026-05-25T20:00:00'),
      studentId: priyaProfile.id, facultyId: sureshProfile.id,
    },

    // Ishaan (JEE Mains, grade 12)
    {
      question: 'Can you explain why the range of a projectile is maximum at 45 degrees?',
      subject: 'Physics',
      answer: 'At 45°, horizontal and vertical components of velocity are equal. Range R = u²sin2θ/g is maximised when sin2θ = 1, i.e. θ = 45°. Less than 45° gives good horizontal speed but not enough height; more than 45° gives too much height but poor horizontal reach.',
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
  await prisma.weeklyScore.createMany({ data: [
    // Priya (NEET): Biology, Physics, Chemistry × 4 weeks
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

    // Ishaan (JEE Mains): Physics, Maths, Chemistry × 4 weeks
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

    // Arjun (Forge, JEE Mains): Physics, Maths, Chemistry × 4 weeks
    { studentId: arjunProfile.id, weekNumber: 1, subject: 'Physics',   score: 48, totalMarks: 100, testDate: new Date('2026-05-05') },
    { studentId: arjunProfile.id, weekNumber: 1, subject: 'Maths',     score: 55, totalMarks: 100, testDate: new Date('2026-05-05') },
    { studentId: arjunProfile.id, weekNumber: 1, subject: 'Chemistry', score: 42, totalMarks: 100, testDate: new Date('2026-05-05') },
    { studentId: arjunProfile.id, weekNumber: 2, subject: 'Physics',   score: 56, totalMarks: 100, testDate: new Date('2026-05-12') },
    { studentId: arjunProfile.id, weekNumber: 2, subject: 'Maths',     score: 61, totalMarks: 100, testDate: new Date('2026-05-12') },
    { studentId: arjunProfile.id, weekNumber: 2, subject: 'Chemistry', score: 50, totalMarks: 100, testDate: new Date('2026-05-12') },
    { studentId: arjunProfile.id, weekNumber: 3, subject: 'Physics',   score: 63, totalMarks: 100, testDate: new Date('2026-05-19') },
    { studentId: arjunProfile.id, weekNumber: 3, subject: 'Maths',     score: 68, totalMarks: 100, testDate: new Date('2026-05-19') },
    { studentId: arjunProfile.id, weekNumber: 3, subject: 'Chemistry', score: 57, totalMarks: 100, testDate: new Date('2026-05-19') },
    { studentId: arjunProfile.id, weekNumber: 4, subject: 'Physics',   score: 70, totalMarks: 100, testDate: new Date('2026-05-26') },
    { studentId: arjunProfile.id, weekNumber: 4, subject: 'Maths',     score: 74, totalMarks: 100, testDate: new Date('2026-05-26') },
    { studentId: arjunProfile.id, weekNumber: 4, subject: 'Chemistry', score: 63, totalMarks: 100, testDate: new Date('2026-05-26') },
  ]});

  // ── Weekly Reports — Priya (6 reports across 2 weeks, all 3 subjects each) ──
  // Week 21: May 18–24 → sent (approved by superAdmin, visible to Priya + superAdmin)
  // Week 22: May 25–31 → submitted (pending admin review — admins can approve to test workflow)
  await prisma.weeklyReport.createMany({ data: [

    // ── Week 21 — sent ──
    {
      weekNumber: 202621, weekStartDate: '2026-05-18',
      studentId: priyaProfile.id, facultyId: kavitaProfile.id,
      overallRating: 4,
      strengths: 'Strong grasp of Newton\'s Laws. Ray optics problems solved with good accuracy. Speed has improved significantly.',
      improvements: 'Numerical problems in electrostatics still take too long. Need to practice circuit-based questions.',
      mentorNote: 'Priya is making steady progress in Physics. Her conceptual understanding is solid and her accuracy in optics has crossed 80%. The focus for the coming week should be electrostatics numericals.',
      nextWeekPlan: 'Complete 30 electrostatics numericals. Revise electric field and potential formulas. Attempt 1 full-length Physics mock.',
      testScore: 71, testTotalMarks: 100, testSubject: 'Physics',
      status: 'sent',
      submittedAt: new Date('2026-05-23T10:00:00'),
      approvedAt:  new Date('2026-05-24T14:00:00'),
      sentAt:      new Date('2026-05-24T06:30:00'),
      approvedById: superAdmin.id,
    },
    {
      weekNumber: 202621, weekStartDate: '2026-05-18',
      studentId: priyaProfile.id, facultyId: nehaProfile.id,
      overallRating: 3,
      strengths: 'Good understanding of atomic structure and periodic trends. Mole concept calculations are improving.',
      improvements: 'Organic chemistry fundamentals are shaky — IUPAC naming and isomerism need revision. Reaction mechanisms take too long.',
      mentorNote: 'Priya is building a solid foundation in inorganic Chemistry. This week\'s focus should shift to organic basics — the gap there needs to be closed before we move to advanced topics.',
      nextWeekPlan: 'Revise IUPAC naming and isomerism. Complete GOC (General Organic Chemistry) chapter. Attempt 20 MCQs on organic basics.',
      testScore: 64, testTotalMarks: 100, testSubject: 'Chemistry',
      status: 'sent',
      submittedAt: new Date('2026-05-23T11:30:00'),
      approvedAt:  new Date('2026-05-24T14:00:00'),
      sentAt:      new Date('2026-05-24T06:30:00'),
      approvedById: superAdmin.id,
    },
    {
      weekNumber: 202621, weekStartDate: '2026-05-18',
      studentId: priyaProfile.id, facultyId: sureshProfile.id,
      overallRating: 5,
      strengths: 'Excellent retention of Genetics topics. Plant physiology diagrams drawn accurately. Scored highest in Biology this week — 84/100.',
      improvements: 'Ecology section needs more attention. Biodiversity classification still confusing.',
      mentorNote: 'Priya\'s Biology performance this week has been outstanding. She has clearly put in extra effort with Genetics and it shows in her score. I am very pleased with the consistency. Keep it up!',
      nextWeekPlan: 'Focus on Ecology and Biodiversity chapters. Attempt previous-year NEET Biology questions from 2020–2023.',
      testScore: 84, testTotalMarks: 100, testSubject: 'Biology',
      status: 'sent',
      submittedAt: new Date('2026-05-23T12:00:00'),
      approvedAt:  new Date('2026-05-24T14:00:00'),
      sentAt:      new Date('2026-05-24T06:30:00'),
      approvedById: superAdmin.id,
    },

    // ── Week 22 — sent ──
    {
      weekNumber: 202622, weekStartDate: '2026-05-25',
      studentId: priyaProfile.id, facultyId: kavitaProfile.id,
      overallRating: 4,
      strengths: 'Electrostatics numericals have improved noticeably. Thermodynamics concepts are clear. Time management in mock tests has improved.',
      improvements: 'Wave optics derivations still weak. Need to revisit Huygens principle.',
      mentorNote: 'Great week for Priya in Physics. The extra practice on electrostatics paid off — she attempted 3 more problems correctly compared to last week. The trajectory is on track for the June milestone.',
      nextWeekPlan: 'Complete wave optics module. Practice Huygens principle problems. Attempt 2 chapter-wise Physics tests.',
      testScore: 76, testTotalMarks: 100, testSubject: 'Physics',
      status: 'sent',
      submittedAt: new Date('2026-05-30T10:00:00'),
      approvedAt:  new Date('2026-05-31T08:00:00'),
      sentAt:      new Date('2026-06-01T06:30:00'),
      approvedById: superAdmin.id,
    },
    {
      weekNumber: 202622, weekStartDate: '2026-05-25',
      studentId: priyaProfile.id, facultyId: nehaProfile.id,
      overallRating: 3,
      strengths: 'Electrochemistry basics understood well. Good recall of redox reactions and oxidation states.',
      improvements: 'Organic reaction mechanisms still need work — especially named reactions (Aldol, Cannizzaro). Chemical kinetics numericals are slow.',
      mentorNote: 'Priya\'s Chemistry score is improving week over week, which is encouraging. However, we need to give more time to organic mechanisms. I have prepared a focused sheet of 15 named reactions that she should memorise and practise.',
      nextWeekPlan: 'Memorise 15 key named reactions. Complete chemical kinetics problem set. Attempt 1 Organic Chemistry mock.',
      testScore: 73, testTotalMarks: 100, testSubject: 'Chemistry',
      status: 'sent',
      submittedAt: new Date('2026-05-30T11:00:00'),
      approvedAt:  new Date('2026-05-31T08:00:00'),
      sentAt:      new Date('2026-06-01T06:30:00'),
      approvedById: superAdmin.id,
    },
    {
      weekNumber: 202622, weekStartDate: '2026-05-25',
      studentId: priyaProfile.id, facultyId: sureshProfile.id,
      overallRating: 4,
      strengths: 'Ecology chapter completed with good accuracy. Biodiversity classification much cleaner than last week. Animal kingdom revision solid.',
      improvements: 'Reproduction in plants chapter has gaps — especially double fertilisation and embryo development.',
      mentorNote: 'Priya has addressed the Ecology gaps from last week very well. Her Biology score of 88 this week is excellent. The next focus area is plant reproduction — a topic with high NEET weightage.',
      nextWeekPlan: 'Complete Plant Reproduction chapter. Practice 40 NEET-level Biology MCQs. Revise animal kingdom one more time.',
      testScore: 88, testTotalMarks: 100, testSubject: 'Biology',
      status: 'sent',
      submittedAt: new Date('2026-05-30T12:00:00'),
      approvedAt:  new Date('2026-05-31T08:00:00'),
      sentAt:      new Date('2026-06-01T06:30:00'),
      approvedById: superAdmin.id,
    },
  ]});

  // Seed one ParentFeedback for week 21 Physics — so week 21 shows 1 submitted + 2 locked
  const physicsW21 = await prisma.weeklyReport.findFirst({
    where: { studentId: priyaProfile.id, weekNumber: 202621, testSubject: 'Physics' },
  });
  if (physicsW21) {
    await prisma.parentFeedback.create({
      data: {
        reportId: physicsW21.id,
        studentId: priyaProfile.id,
        rating: 5,
        comment: 'Very detailed and helpful report. Thank you for the clear plan for next week!',
        createdAt: new Date('2026-05-28T18:45:00'),
      },
    });
  }

  console.log('Seeded: 4 students, 4 faculty, 1 superadmin + 2 admins, 17 sessions, 6 doubts, 24 weekly scores, 6 weekly reports (week 21 + week 22 sent), 1 weekly feedback');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
