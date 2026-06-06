-- CreateEnum
CREATE TYPE "StudentCurrentState" AS ENUM ('INSIDE_CLASSROOM', 'OUTSIDE_CLASSROOM', 'ABSENT');

-- CreateEnum
CREATE TYPE "TeacherCurrentState" AS ENUM ('INSIDE_CLASSROOM', 'OUTSIDE_CLASSROOM');

-- CreateEnum
CREATE TYPE "MovementStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "TeacherMovementStatus" AS ENUM ('INSIDE', 'OUTSIDE');

-- AlterTable
ALTER TABLE "school_settings" ADD COLUMN "late_threshold_minutes" INTEGER NOT NULL DEFAULT 10;

ALTER TABLE "school_settings"
ADD CONSTRAINT "school_settings_late_threshold_minutes_check"
CHECK ("late_threshold_minutes" BETWEEN 0 AND 60);

-- CreateTable
CREATE TABLE "student_presence_states" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "attendance_session_id" TEXT NOT NULL,
    "current_state" "StudentCurrentState" NOT NULL DEFAULT 'ABSENT',
    "entered_at" TIMESTAMP(3),
    "exited_at" TIMESTAMP(3),
    "total_exits" INTEGER NOT NULL DEFAULT 0,
    "last_scan_event_id" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_presence_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_presence_states" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "current_state" "TeacherCurrentState" NOT NULL DEFAULT 'OUTSIDE_CLASSROOM',
    "entered_at" TIMESTAMP(3),
    "exited_at" TIMESTAMP(3),
    "last_scan_event_id" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_presence_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_movement_records" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "attendance_session_id" TEXT NOT NULL,
    "exit_scan_event_id" TEXT NOT NULL,
    "return_scan_event_id" TEXT,
    "exited_at" TIMESTAMP(3) NOT NULL,
    "returned_at" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "status" "MovementStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_movement_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_movement_records" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "entry_scan_event_id" TEXT,
    "exit_scan_event_id" TEXT,
    "entered_at" TIMESTAMP(3),
    "exited_at" TIMESTAMP(3),
    "status" "TeacherMovementStatus" NOT NULL DEFAULT 'OUTSIDE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_movement_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_presence_states_attendance_session_id_student_id_key" ON "student_presence_states"("attendance_session_id", "student_id");
CREATE INDEX "student_presence_states_school_id_idx" ON "student_presence_states"("school_id");
CREATE INDEX "student_presence_states_classroom_id_idx" ON "student_presence_states"("classroom_id");
CREATE INDEX "student_presence_states_student_id_idx" ON "student_presence_states"("student_id");
CREATE INDEX "student_presence_states_school_id_current_state_idx" ON "student_presence_states"("school_id", "current_state");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_presence_states_classroom_id_teacher_id_key" ON "teacher_presence_states"("classroom_id", "teacher_id");
CREATE INDEX "teacher_presence_states_school_id_idx" ON "teacher_presence_states"("school_id");
CREATE INDEX "teacher_presence_states_classroom_id_idx" ON "teacher_presence_states"("classroom_id");
CREATE INDEX "teacher_presence_states_teacher_id_idx" ON "teacher_presence_states"("teacher_id");
CREATE INDEX "teacher_presence_states_school_id_current_state_idx" ON "teacher_presence_states"("school_id", "current_state");

-- CreateIndex
CREATE INDEX "student_movement_records_school_id_idx" ON "student_movement_records"("school_id");
CREATE INDEX "student_movement_records_classroom_id_idx" ON "student_movement_records"("classroom_id");
CREATE INDEX "student_movement_records_student_id_idx" ON "student_movement_records"("student_id");
CREATE INDEX "student_movement_records_attendance_session_id_idx" ON "student_movement_records"("attendance_session_id");
CREATE INDEX "student_movement_records_school_id_status_idx" ON "student_movement_records"("school_id", "status");

-- CreateIndex
CREATE INDEX "teacher_movement_records_school_id_idx" ON "teacher_movement_records"("school_id");
CREATE INDEX "teacher_movement_records_classroom_id_idx" ON "teacher_movement_records"("classroom_id");
CREATE INDEX "teacher_movement_records_teacher_id_idx" ON "teacher_movement_records"("teacher_id");
CREATE INDEX "teacher_movement_records_school_id_status_idx" ON "teacher_movement_records"("school_id", "status");

-- AddForeignKey
ALTER TABLE "student_presence_states" ADD CONSTRAINT "student_presence_states_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_presence_states" ADD CONSTRAINT "student_presence_states_classroom_id_school_id_fkey" FOREIGN KEY ("classroom_id", "school_id") REFERENCES "classrooms"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_presence_states" ADD CONSTRAINT "student_presence_states_student_id_school_id_fkey" FOREIGN KEY ("student_id", "school_id") REFERENCES "students"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_presence_states" ADD CONSTRAINT "student_presence_states_attendance_session_id_school_id_fkey" FOREIGN KEY ("attendance_session_id", "school_id") REFERENCES "classroom_attendance_sessions"("id", "school_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_presence_states" ADD CONSTRAINT "student_presence_states_last_scan_event_id_fkey" FOREIGN KEY ("last_scan_event_id") REFERENCES "rfid_scan_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_presence_states" ADD CONSTRAINT "teacher_presence_states_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_presence_states" ADD CONSTRAINT "teacher_presence_states_classroom_id_school_id_fkey" FOREIGN KEY ("classroom_id", "school_id") REFERENCES "classrooms"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_presence_states" ADD CONSTRAINT "teacher_presence_states_teacher_id_school_id_fkey" FOREIGN KEY ("teacher_id", "school_id") REFERENCES "teachers"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_presence_states" ADD CONSTRAINT "teacher_presence_states_last_scan_event_id_fkey" FOREIGN KEY ("last_scan_event_id") REFERENCES "rfid_scan_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_movement_records" ADD CONSTRAINT "student_movement_records_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_movement_records" ADD CONSTRAINT "student_movement_records_classroom_id_school_id_fkey" FOREIGN KEY ("classroom_id", "school_id") REFERENCES "classrooms"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_movement_records" ADD CONSTRAINT "student_movement_records_student_id_school_id_fkey" FOREIGN KEY ("student_id", "school_id") REFERENCES "students"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_movement_records" ADD CONSTRAINT "student_movement_records_attendance_session_id_school_id_fkey" FOREIGN KEY ("attendance_session_id", "school_id") REFERENCES "classroom_attendance_sessions"("id", "school_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_movement_records" ADD CONSTRAINT "student_movement_records_exit_scan_event_id_fkey" FOREIGN KEY ("exit_scan_event_id") REFERENCES "rfid_scan_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_movement_records" ADD CONSTRAINT "student_movement_records_return_scan_event_id_fkey" FOREIGN KEY ("return_scan_event_id") REFERENCES "rfid_scan_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_movement_records" ADD CONSTRAINT "teacher_movement_records_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_movement_records" ADD CONSTRAINT "teacher_movement_records_classroom_id_school_id_fkey" FOREIGN KEY ("classroom_id", "school_id") REFERENCES "classrooms"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_movement_records" ADD CONSTRAINT "teacher_movement_records_teacher_id_school_id_fkey" FOREIGN KEY ("teacher_id", "school_id") REFERENCES "teachers"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_movement_records" ADD CONSTRAINT "teacher_movement_records_entry_scan_event_id_fkey" FOREIGN KEY ("entry_scan_event_id") REFERENCES "rfid_scan_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "teacher_movement_records" ADD CONSTRAINT "teacher_movement_records_exit_scan_event_id_fkey" FOREIGN KEY ("exit_scan_event_id") REFERENCES "rfid_scan_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
