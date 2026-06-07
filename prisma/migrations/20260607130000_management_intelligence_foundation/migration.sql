-- CreateEnum
CREATE TYPE "ManagementSubjectType" AS ENUM ('SCHOOL', 'LEVEL', 'CLASSROOM', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "ManagementKpiType" AS ENUM ('ATTENDANCE_RATE', 'LATE_RATE', 'NOISE_SCORE', 'MOVEMENT_SCORE', 'TEACHER_PUNCTUALITY', 'CLASSROOM_PERFORMANCE_SCORE', 'STUDENT_ATTENTION_SCORE');

-- CreateTable
CREATE TABLE "management_kpi_snapshots" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "subject_type" "ManagementSubjectType" NOT NULL,
    "subject_id" TEXT,
    "kpi_type" "ManagementKpiType" NOT NULL,
    "period" "SummaryPeriod" NOT NULL DEFAULT 'DAILY',
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "score_version" INTEGER NOT NULL DEFAULT 1,
    "source_key" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "management_kpi_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "management_kpi_snapshots_source_key_key" ON "management_kpi_snapshots"("source_key");

-- CreateIndex
CREATE INDEX "management_kpi_snapshots_school_id_idx" ON "management_kpi_snapshots"("school_id");

-- CreateIndex
CREATE INDEX "management_kpi_snapshots_subject_type_idx" ON "management_kpi_snapshots"("subject_type");

-- CreateIndex
CREATE INDEX "management_kpi_snapshots_subject_id_idx" ON "management_kpi_snapshots"("subject_id");

-- CreateIndex
CREATE INDEX "management_kpi_snapshots_kpi_type_idx" ON "management_kpi_snapshots"("kpi_type");

-- CreateIndex
CREATE INDEX "management_kpi_snapshots_period_idx" ON "management_kpi_snapshots"("period");

-- CreateIndex
CREATE INDEX "management_kpi_snapshots_period_start_idx" ON "management_kpi_snapshots"("period_start");

-- CreateIndex
CREATE INDEX "management_kpi_snapshots_period_end_idx" ON "management_kpi_snapshots"("period_end");

-- AddForeignKey
ALTER TABLE "management_kpi_snapshots" ADD CONSTRAINT "management_kpi_snapshots_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
