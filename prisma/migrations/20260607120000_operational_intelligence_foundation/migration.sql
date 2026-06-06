-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('STUDENT_LATE', 'STUDENT_ABSENT', 'EXCESSIVE_STUDENT_EXITS', 'HIGH_NOISE_EVENT', 'DEVICE_OFFLINE');

-- CreateEnum
CREATE TYPE "AlertSourceType" AS ENUM ('ATTENDANCE', 'MOVEMENT', 'NOISE', 'DEVICE');

-- CreateEnum
CREATE TYPE "InsightSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "InsightStatus" AS ENUM ('ACTIVE', 'DISMISSED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('RECURRING_STUDENT_LATENESS', 'EXCESSIVE_STUDENT_MOVEMENT', 'CHRONIC_CLASSROOM_NOISE', 'DEVICE_RELIABILITY_ISSUE');

-- AlterTable
ALTER TABLE "school_settings"
ADD COLUMN "late_student_threshold" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN "movement_threshold" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "noise_event_threshold" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "device_offline_threshold" INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "classroom_id" TEXT,
    "teacher_id" TEXT,
    "student_id" TEXT,
    "device_id" TEXT,
    "alert_type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source_type" "AlertSourceType" NOT NULL,
    "source_key" TEXT,
    "acknowledged_by" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insights" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "classroom_id" TEXT,
    "teacher_id" TEXT,
    "student_id" TEXT,
    "insight_type" "InsightType" NOT NULL,
    "severity" "InsightSeverity" NOT NULL,
    "status" "InsightStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "score" INTEGER,
    "source_key" TEXT,
    "first_detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alerts_source_key_key" ON "alerts"("source_key");

-- CreateIndex
CREATE INDEX "alerts_school_id_idx" ON "alerts"("school_id");

-- CreateIndex
CREATE INDEX "alerts_classroom_id_idx" ON "alerts"("classroom_id");

-- CreateIndex
CREATE INDEX "alerts_teacher_id_idx" ON "alerts"("teacher_id");

-- CreateIndex
CREATE INDEX "alerts_student_id_idx" ON "alerts"("student_id");

-- CreateIndex
CREATE INDEX "alerts_device_id_idx" ON "alerts"("device_id");

-- CreateIndex
CREATE INDEX "alerts_alert_type_idx" ON "alerts"("alert_type");

-- CreateIndex
CREATE INDEX "alerts_severity_idx" ON "alerts"("severity");

-- CreateIndex
CREATE INDEX "alerts_status_idx" ON "alerts"("status");

-- CreateIndex
CREATE INDEX "alerts_source_type_idx" ON "alerts"("source_type");

-- CreateIndex
CREATE INDEX "alerts_created_at_idx" ON "alerts"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "insights_source_key_key" ON "insights"("source_key");

-- CreateIndex
CREATE INDEX "insights_school_id_idx" ON "insights"("school_id");

-- CreateIndex
CREATE INDEX "insights_classroom_id_idx" ON "insights"("classroom_id");

-- CreateIndex
CREATE INDEX "insights_teacher_id_idx" ON "insights"("teacher_id");

-- CreateIndex
CREATE INDEX "insights_student_id_idx" ON "insights"("student_id");

-- CreateIndex
CREATE INDEX "insights_insight_type_idx" ON "insights"("insight_type");

-- CreateIndex
CREATE INDEX "insights_severity_idx" ON "insights"("severity");

-- CreateIndex
CREATE INDEX "insights_status_idx" ON "insights"("status");

-- CreateIndex
CREATE INDEX "insights_last_detected_at_idx" ON "insights"("last_detected_at");

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_classroom_id_school_id_fkey" FOREIGN KEY ("classroom_id", "school_id") REFERENCES "classrooms"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_teacher_id_school_id_fkey" FOREIGN KEY ("teacher_id", "school_id") REFERENCES "teachers"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_student_id_school_id_fkey" FOREIGN KEY ("student_id", "school_id") REFERENCES "students"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_device_id_school_id_fkey" FOREIGN KEY ("device_id", "school_id") REFERENCES "classroom_devices"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_classroom_id_school_id_fkey" FOREIGN KEY ("classroom_id", "school_id") REFERENCES "classrooms"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_teacher_id_school_id_fkey" FOREIGN KEY ("teacher_id", "school_id") REFERENCES "teachers"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_student_id_school_id_fkey" FOREIGN KEY ("student_id", "school_id") REFERENCES "students"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
