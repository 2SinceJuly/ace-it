-- CreateTable
CREATE TABLE "InterviewMessage" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewMessage_interviewId_createdAt_idx" ON "InterviewMessage"("interviewId", "createdAt");

-- AddForeignKey
ALTER TABLE "InterviewMessage" ADD CONSTRAINT "InterviewMessage_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
