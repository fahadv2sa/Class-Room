-- CreateEnum
CREATE TYPE "NoiseSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "NoiseEventStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "NoiseState" AS ENUM ('QUIET', 'MODERATE', 'LOUD');

-- AlterTable
ALTER TABLE "school_settings" ADD COLUMN "noise_duration_seconds" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "noise_events" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "classroom_device_id" TEXT NOT NULL,
    "teacher_id" TEXT,
    "attendance_session_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "duration_seconds" INTEGER,
    "average_db" INTEGER NOT NULL,
    "peak_db" INTEGER NOT NULL,
    "sample_count" INTEGER NOT NULL DEFAULT 1,
    "severity" "NoiseSeverity" NOT NULL,
    "status" "NoiseEventStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "noise_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_noise_summaries" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "summary_date" DATE NOT NULL,
    "total_events" INTEGER NOT NULL DEFAULT 0,
    "total_noise_seconds" INTEGER NOT NULL DEFAULT 0,
    "average_event_db" INTEGER NOT NULL DEFAULT 0,
    "peak_db" INTEGER NOT NULL DEFAULT 0,
    "low_events" INTEGER NOT NULL DEFAULT 0,
    "medium_events" INTEGER NOT NULL DEFAULT 0,
    "high_events" INTEGER NOT NULL DEFAULT 0,
    "quiet_score" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classroom_noise_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_noise_summaries" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "summary_date" DATE NOT NULL,
    "total_events" INTEGER NOT NULL DEFAULT 0,
    "total_noise_seconds" INTEGER NOT NULL DEFAULT 0,
    "average_event_db" INTEGER NOT NULL DEFAULT 0,
    "peak_db" INTEGER NOT NULL DEFAULT 0,
    "low_events" INTEGER NOT NULL DEFAULT 0,
    "medium_events" INTEGER NOT NULL DEFAULT 0,
    "high_events" INTEGER NOT NULL DEFAULT 0,
    "quiet_score" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_noise_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_noise_states" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "classroom_device_id" TEXT NOT NULL,
    "current_db" INTEGER NOT NULL DEFAULT 0,
    "current_state" "NoiseState" NOT NULL DEFAULT 'QUIET',
    "active_noise_event_id" TEXT,
    "threshold_exceeded_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classroom_noise_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "noise_events_id_school_id_key" ON "noise_events"("id", "school_id");
CREATE INDEX "noise_events_school_id_idx" ON "noise_events"("school_id");
CREATE INDEX "noise_events_classroom_id_idx" ON "noise_events"("classroom_id");
CREATE INDEX "noise_events_classroom_device_id_idx" ON "noise_events"("classroom_device_id");
CREATE INDEX "noise_events_teacher_id_idx" ON "noise_events"("teacher_id");
CREATE INDEX "noise_events_attendance_session_id_idx" ON "noise_events"("attendance_session_id");
CREATE INDEX "noise_events_status_idx" ON "noise_events"("status");
CREATE INDEX "noise_events_severity_idx" ON "noise_events"("severity");
CREATE INDEX "noise_events_started_at_idx" ON "noise_events"("started_at");

-- CreateIndex
CREATE UNIQUE INDEX "classroom_noise_summaries_school_id_classroom_id_summary_date_key" ON "classroom_noise_summaries"("school_id", "classroom_id", "summary_date");
CREATE INDEX "classroom_noise_summaries_school_id_idx" ON "classroom_noise_summaries"("school_id");
CREATE INDEX "classroom_noise_summaries_classroom_id_idx" ON "classroom_noise_summaries"("classroom_id");
CREATE INDEX "classroom_noise_summaries_summary_date_idx" ON "classroom_noise_summaries"("summary_date");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_noise_summaries_school_id_teacher_id_summary_date_key" ON "teacher_noise_summaries"("school_id", "teacher_id", "summary_date");
CREATE INDEX "teacher_noise_summaries_school_id_idx" ON "teacher_noise_summaries"("school_id");
CREATE INDEX "teacher_noise_summaries_teacher_id_idx" ON "teacher_noise_summaries"("teacher_id");
CREATE INDEX "teacher_noise_summaries_summary_date_idx" ON "teacher_noise_summaries"("summary_date");

-- CreateIndex
CREATE UNIQUE INDEX "classroom_noise_states_school_id_classroom_id_key" ON "classroom_noise_states"("school_id", "classroom_id");
CREATE INDEX "classroom_noise_states_school_id_idx" ON "classroom_noise_states"("school_id");
CREATE INDEX "classroom_noise_states_classroom_id_idx" ON "classroom_noise_states"("classroom_id");
CREATE INDEX "classroom_noise_states_classroom_device_id_idx" ON "classroom_noise_states"("classroom_device_id");
CREATE INDEX "classroom_noise_states_active_noise_event_id_idx" ON "classroom_noise_states"("active_noise_event_id");
CREATE INDEX "classroom_noise_states_school_id_current_state_idx" ON "classroom_noise_states"("school_id", "current_state");

-- AddForeignKey
ALTER TABLE "noise_events" ADD CONSTRAINT "noise_events_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "noise_events" ADD CONSTRAINT "noise_events_classroom_id_school_id_fkey" FOREIGN KEY ("classroom_id", "school_id") REFERENCES "classrooms"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "noise_events" ADD CONSTRAINT "noise_events_classroom_device_id_school_id_fkey" FOREIGN KEY ("classroom_device_id", "school_id") REFERENCES "classroom_devices"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "noise_events" ADD CONSTRAINT "noise_events_teacher_id_school_id_fkey" FOREIGN KEY ("teacher_id", "school_id") REFERENCES "teachers"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "noise_events" ADD CONSTRAINT "noise_events_attendance_session_id_school_id_fkey" FOREIGN KEY ("attendance_session_id", "school_id") REFERENCES "classroom_attendance_sessions"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_noise_summaries" ADD CONSTRAINT "classroom_noise_summaries_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "classroom_noise_summaries" ADD CONSTRAINT "classroom_noise_summaries_classroom_id_school_id_fkey" FOREIGN KEY ("classroom_id", "school_id") REFERENCES "classrooms"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_noise_summaries" ADD CONSTRAINT "teacher_noise_summaries_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_noise_summaries" ADD CONSTRAINT "teacher_noise_summaries_teacher_id_school_id_fkey" FOREIGN KEY ("teacher_id", "school_id") REFERENCES "teachers"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_noise_states" ADD CONSTRAINT "classroom_noise_states_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "classroom_noise_states" ADD CONSTRAINT "classroom_noise_states_classroom_id_school_id_fkey" FOREIGN KEY ("classroom_id", "school_id") REFERENCES "classrooms"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "classroom_noise_states" ADD CONSTRAINT "classroom_noise_states_classroom_device_id_school_id_fkey" FOREIGN KEY ("classroom_device_id", "school_id") REFERENCES "classroom_devices"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "classroom_noise_states" ADD CONSTRAINT "classroom_noise_states_active_noise_event_id_school_id_fkey" FOREIGN KEY ("active_noise_event_id", "school_id") REFERENCES "noise_events"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
