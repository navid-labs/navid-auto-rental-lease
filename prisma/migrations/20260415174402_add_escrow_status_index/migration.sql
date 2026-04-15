-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "EscrowPayment_status_createdAt_idx"
ON "escrow_payments"("status", "created_at");
