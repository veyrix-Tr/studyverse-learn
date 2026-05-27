-- CreateTable
CREATE TABLE "AdminMessage" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Announcement',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL,

    CONSTRAINT "AdminMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AdminMessage" ADD CONSTRAINT "AdminMessage_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminMessage" ADD CONSTRAINT "AdminMessage_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
