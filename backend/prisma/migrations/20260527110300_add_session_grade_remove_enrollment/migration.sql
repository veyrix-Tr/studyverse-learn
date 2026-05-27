/*
  Warnings:

  - You are about to drop the column `planRequired` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the `Enrollment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `grade` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_studentId_fkey";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "planRequired",
ADD COLUMN     "grade" TEXT NOT NULL;

-- DropTable
DROP TABLE "Enrollment";
