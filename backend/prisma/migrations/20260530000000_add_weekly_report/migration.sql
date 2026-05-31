-- CreateTable
CREATE TABLE "WeeklyReport" (
    "id" SERIAL NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "weekStartDate" TEXT NOT NULL,
    "overallRating" INTEGER,
    "strengths" TEXT,
    "improvements" TEXT,
    "mentorNote" TEXT,
    "nextWeekPlan" TEXT,
    "testScore" INTEGER,
    "testTotalMarks" INTEGER,
    "testSubject" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "rejectedReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" INTEGER NOT NULL,
    "facultyId" INTEGER NOT NULL,
    "approvedById" INTEGER,

    CONSTRAINT "WeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReport_studentId_facultyId_weekNumber_key" ON "WeeklyReport"("studentId", "facultyId", "weekNumber");

-- AddForeignKey
ALTER TABLE "WeeklyReport" ADD CONSTRAINT "WeeklyReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyReport" ADD CONSTRAINT "WeeklyReport_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "FacultyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyReport" ADD CONSTRAINT "WeeklyReport_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "AdminProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
