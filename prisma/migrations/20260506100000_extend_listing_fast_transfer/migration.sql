-- AlterTable
ALTER TABLE "listings"
  ADD COLUMN "estimated_market_price" INTEGER,
  ADD COLUMN "dealer_note" TEXT,
  ADD COLUMN "is_fast_transfer" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "registration_document_key" TEXT,
  ADD COLUMN "capital_guide_acknowledged_at" TIMESTAMP(3),
  ADD COLUMN "proposal_sent_at" TIMESTAMP(3),
  ADD COLUMN "follow_up_attempted_at" TIMESTAMP(3),
  ADD COLUMN "review_reason" TEXT;

-- RenameColumn
ALTER TABLE "listings" RENAME COLUMN "inspection_report_url" TO "inspection_report_key";

-- CreateIndex
CREATE INDEX "listings_status_is_fast_transfer_created_at_idx" ON "listings"("status", "is_fast_transfer", "created_at" DESC);

-- CreateIndex
CREATE INDEX "listings_proposal_pending_idx" ON "listings"("proposal_sent_at") WHERE "follow_up_attempted_at" IS NULL;
