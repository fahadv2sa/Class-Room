-- CreateEnum
CREATE TYPE "SummaryPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'TERM', 'YEARLY');

-- AlterTable
ALTER TABLE "classroom_noise_summaries" ADD COLUMN "period" "SummaryPeriod" NOT NULL DEFAULT 'DAILY';
ALTER TABLE "classroom_noise_summaries" ADD COLUMN "period_start" DATE;
ALTER TABLE "classroom_noise_summaries" ADD COLUMN "period_end" DATE;
ALTER TABLE "classroom_noise_summaries" ADD COLUMN "score_version" INTEGER NOT NULL DEFAULT 1;

-- Backfill current daily summaries.
UPDATE "classroom_noise_summaries"
SET
  "period_start" = "summary_date",
  "period_end" = "summary_date" + 1
WHERE "period_start" IS NULL OR "period_end" IS NULL;

ALTER TABLE "classroom_noise_summaries" ALTER COLUMN "period_start" SET NOT NULL;
ALTER TABLE "classroom_noise_summaries" ALTER COLUMN "period_end" SET NOT NULL;

-- AlterTable
ALTER TABLE "teacher_noise_summaries" ADD COLUMN "period" "SummaryPeriod" NOT NULL DEFAULT 'DAILY';
ALTER TABLE "teacher_noise_summaries" ADD COLUMN "period_start" DATE;
ALTER TABLE "teacher_noise_summaries" ADD COLUMN "period_end" DATE;
ALTER TABLE "teacher_noise_summaries" ADD COLUMN "score_version" INTEGER NOT NULL DEFAULT 1;

-- Backfill current daily summaries.
UPDATE "teacher_noise_summaries"
SET
  "period_start" = "summary_date",
  "period_end" = "summary_date" + 1
WHERE "period_start" IS NULL OR "period_end" IS NULL;

ALTER TABLE "teacher_noise_summaries" ALTER COLUMN "period_start" SET NOT NULL;
ALTER TABLE "teacher_noise_summaries" ALTER COLUMN "period_end" SET NOT NULL;

-- Replace daily-only unique keys with period-aware unique keys.
DROP INDEX "classroom_noise_summaries_school_id_classroom_id_summary_date_key";
DROP INDEX "teacher_noise_summaries_school_id_teacher_id_summary_date_key";

CREATE UNIQUE INDEX "classroom_noise_summaries_school_id_classroom_id_period_period_start_key" ON "classroom_noise_summaries"("school_id", "classroom_id", "period", "period_start");
CREATE UNIQUE INDEX "teacher_noise_summaries_school_id_teacher_id_period_period_start_key" ON "teacher_noise_summaries"("school_id", "teacher_id", "period", "period_start");

-- Add period indexes for future aggregations.
CREATE INDEX "classroom_noise_summaries_period_idx" ON "classroom_noise_summaries"("period");
CREATE INDEX "classroom_noise_summaries_period_start_idx" ON "classroom_noise_summaries"("period_start");
CREATE INDEX "classroom_noise_summaries_period_end_idx" ON "classroom_noise_summaries"("period_end");
CREATE INDEX "teacher_noise_summaries_period_idx" ON "teacher_noise_summaries"("period");
CREATE INDEX "teacher_noise_summaries_period_start_idx" ON "teacher_noise_summaries"("period_start");
CREATE INDEX "teacher_noise_summaries_period_end_idx" ON "teacher_noise_summaries"("period_end");
