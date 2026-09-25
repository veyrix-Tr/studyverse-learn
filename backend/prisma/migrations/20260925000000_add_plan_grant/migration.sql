-- CreateTable
CREATE TABLE "PlanGrant" (
    "id" SERIAL NOT NULL,
    "plan" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "grantedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "studentId" INTEGER NOT NULL,

    CONSTRAINT "PlanGrant_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN "fallbackPlan" TEXT,
ADD COLUMN "fallbackEndDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PlanGrant_studentId_endDate_idx" ON "PlanGrant"("studentId", "endDate");

-- CreateIndex
CREATE INDEX "PlanGrant_status_idx" ON "PlanGrant"("status");

-- AddForeignKey
ALTER TABLE "PlanGrant" ADD CONSTRAINT "PlanGrant_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
