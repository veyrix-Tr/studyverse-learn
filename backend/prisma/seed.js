const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear existing data first (order matters due to foreign keys)
  await prisma.studentProfile.deleteMany();
  await prisma.facultyProfile.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.user.deleteMany();

  // ── Students ──────────────────────────────────────
  await prisma.user.create({
    data: {
      name: 'Aarav Sharma',
      email: 'aarav@test.com',
      password: 'test1234',
      role: 'student',
      studentProfile: {
        create: {
          plan: 'free',
          examTarget: 'JEE Mains',
          targetYear: '2026',
          grade: '12',
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      name: 'Priya Mehta',
      email: 'priya@test.com',
      password: 'test1234',
      role: 'student',
      studentProfile: {
        create: {
          plan: 'premium',
          examTarget: 'NEET',
          targetYear: '2026',
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
      password: 'test1234',
      role: 'student',
      studentProfile: {
        create: {
          plan: 'free',
          examTarget: 'JEE Advanced',
          targetYear: '2027',
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
      password: 'test1234',
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
      password: 'test1234',
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
      password: 'admin1234',
      role: 'admin',
      adminProfile: {
        create: {
          department: 'Platform',
        },
      },
    },
  });

  console.log('Seeded: 3 students, 2 faculty, 1 admin');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
