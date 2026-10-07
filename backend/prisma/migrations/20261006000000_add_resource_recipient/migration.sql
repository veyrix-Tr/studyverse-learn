-- CreateTable
CREATE TABLE "ResourceRecipient" (
    "id" SERIAL NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResourceRecipient_resourceId_studentId_key" ON "ResourceRecipient"("resourceId", "studentId");

-- CreateIndex
CREATE INDEX "ResourceRecipient_studentId_idx" ON "ResourceRecipient"("studentId");

-- CreateIndex
CREATE INDEX "ResourceRecipient_resourceId_idx" ON "ResourceRecipient"("resourceId");

-- AddForeignKey
ALTER TABLE "ResourceRecipient" ADD CONSTRAINT "ResourceRecipient_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceRecipient" ADD CONSTRAINT "ResourceRecipient_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
