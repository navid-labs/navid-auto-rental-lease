-- AlterTable
ALTER TABLE "chat_messages"
  ADD COLUMN "review_status" TEXT NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN "reviewed_by" UUID,
  ADD COLUMN "reviewed_at" TIMESTAMP(3),
  ADD COLUMN "ai_suspicion_score" DOUBLE PRECISION,
  ADD COLUMN "ai_reason" TEXT,
  ADD COLUMN "block_reason" TEXT;

-- CreateIndex
CREATE INDEX "chat_messages_review_status_created_at_idx" ON "chat_messages"("review_status", "created_at");
