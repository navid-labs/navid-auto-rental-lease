-- CreateEnum
CREATE TYPE "PenaltyLevel" AS ENUM ('NONE', 'WARNING', 'LIGHT', 'HEAVY', 'BAN');

-- AlterTable
ALTER TABLE "profiles"
  ADD COLUMN "violation_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "penalty_level" "PenaltyLevel" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "suspended_until" TIMESTAMP(3),
  ADD COLUMN "suspension_reason" TEXT,
  ADD COLUMN "banned_at" TIMESTAMP(3),
  ADD COLUMN "last_violation_at" TIMESTAMP(3);
