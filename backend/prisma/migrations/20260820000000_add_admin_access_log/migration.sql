-- CreateTable
CREATE TABLE "AdminAccessLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" INTEGER,

    CONSTRAINT "AdminAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminAccessLog_adminId_idx" ON "AdminAccessLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminAccessLog_createdAt_idx" ON "AdminAccessLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AdminAccessLog" ADD CONSTRAINT "AdminAccessLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;