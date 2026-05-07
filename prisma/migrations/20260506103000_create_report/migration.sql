-- CreateTable
CREATE TABLE "reports" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "reporter_id" UUID NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" UUID NOT NULL,
  "reason" TEXT NOT NULL,
  "description" TEXT,
  "evidence_keys" JSONB,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reviewed_by" UUID,
  "reviewed_at" TIMESTAMP(3),
  "resolution" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "reports_target_type_target_id_created_at_idx" ON "reports"("target_type", "target_id", "created_at");

-- CreateIndex
CREATE INDEX "reports_reporter_id_created_at_idx" ON "reports"("reporter_id", "created_at");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");
