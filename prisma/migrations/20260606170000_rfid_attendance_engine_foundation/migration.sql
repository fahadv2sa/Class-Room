-- CreateEnum
CREATE TYPE "CardHolderType" AS ENUM ('STUDENT', 'TEACHER');

-- CreateEnum
CREATE TYPE "CardCredentialStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOST', 'REVOKED');

-- CreateEnum
CREATE TYPE "RFIDActorType" AS ENUM ('STUDENT', 'TEACHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RFIDScanDirection" AS ENUM ('ENTRY', 'EXIT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RFIDScanStatus" AS ENUM ('ACCEPTED', 'DUPLICATE_IGNORED', 'UNKNOWN_CARD', 'INACTIVE_CARD', 'WRONG_SCHOOL', 'WRONG_CLASSROOM', 'NO_ACTIVE_SESSION');

-- CreateEnum
CREATE TYPE "AttendanceSessionStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "StudentAttendanceStatus" AS ENUM ('ABSENT', 'PRESENT', 'LATE', 'EXCUSED');

-- Add composite tenant keys required by Phase 2E school-scoped relations.
CREATE UNIQUE INDEX IF NOT EXISTS "academic_years_id_school_id_key" ON "academic_years"("id", "school_id");
CREATE UNIQUE INDEX IF NOT EXISTS "classroom_devices_id_school_id_key" ON "classroom_devices"("id", "school_id");
CREATE UNIQUE INDEX IF NOT EXISTS "teachers_id_school_id_key" ON "teachers"("id", "school_id");
CREATE UNIQUE INDEX IF NOT EXISTS "students_id_school_id_key" ON "students"("id", "school_id");

-- CreateTable
CREATE TABLE "card_credentials" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "card_code" TEXT NOT NULL,
    "holder_type" "CardHolderType" NOT NULL,
    "student_id" TEXT,
    "teacher_id" TEXT,
    "status" "CardCredentialStatus" NOT NULL DEFAULT 'ACTIVE',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivated_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfid_scan_events" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "classroom_device_id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "card_credential_id" TEXT,
    "card_code" TEXT NOT NULL,
    "actor_type" "RFIDActorType" NOT NULL DEFAULT 'UNKNOWN',
    "student_id" TEXT,
    "teacher_id" TEXT,
    "scan_direction" "RFIDScanDirection" NOT NULL DEFAULT 'UNKNOWN',
    "scan_status" "RFIDScanStatus" NOT NULL,
    "scanned_at" TIMESTAMP(3) NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_event_id" TEXT,
    "duplicate_of_event_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfid_scan_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_attendance_sessions" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "classroom_device_id" TEXT NOT NULL,
    "teacher_id" TEXT,
    "session_date" DATE NOT NULL,
    "status" "AttendanceSessionStatus" NOT NULL DEFAULT 'OPEN',
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classroom_attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_attendance_records" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "attendance_session_id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" "StudentAttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "first_entry_at" TIMESTAMP(3),
    "last_exit_at" TIMESTAMP(3),
    "scan_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "card_credentials_card_code_key" ON "card_credentials"("card_code");
CREATE INDEX "card_credentials_school_id_idx" ON "card_credentials"("school_id");
CREATE INDEX "card_credentials_school_id_status_idx" ON "card_credentials"("school_id", "status");
CREATE INDEX "card_credentials_student_id_idx" ON "card_credentials"("student_id");
CREATE INDEX "card_credentials_teacher_id_idx" ON "card_credentials"("teacher_id");

-- One active physical card per holder.
CREATE UNIQUE INDEX "card_credentials_one_active_student_key"
ON "card_credentials"("student_id")
WHERE "holder_type" = 'STUDENT' AND "status" = 'ACTIVE' AND "student_id" IS NOT NULL;

CREATE UNIQUE INDEX "card_credentials_one_active_teacher_key"
ON "card_credentials"("teacher_id")
WHERE "holder_type" = 'TEACHER' AND "status" = 'ACTIVE' AND "teacher_id" IS NOT NULL;

ALTER TABLE "card_credentials"
ADD CONSTRAINT "card_credentials_card_code_format_check"
CHECK ("card_code" ~ '^(STD|TCH)-[0-9]{8}$');

ALTER TABLE "card_credentials"
ADD CONSTRAINT "card_credentials_holder_match_check"
CHECK (
  ("holder_type" = 'STUDENT' AND "student_id" IS NOT NULL AND "teacher_id" IS NULL)
  OR
  ("holder_type" = 'TEACHER' AND "teacher_id" IS NOT NULL AND "student_id" IS NULL)
);

-- CreateIndex
CREATE INDEX "rfid_scan_events_school_id_idx" ON "rfid_scan_events"("school_id");
CREATE INDEX "rfid_scan_events_classroom_device_id_idx" ON "rfid_scan_events"("classroom_device_id");
CREATE INDEX "rfid_scan_events_classroom_id_idx" ON "rfid_scan_events"("classroom_id");
CREATE INDEX "rfid_scan_events_card_code_idx" ON "rfid_scan_events"("card_code");
CREATE INDEX "rfid_scan_events_scan_status_idx" ON "rfid_scan_events"("scan_status");
CREATE INDEX "rfid_scan_events_scanned_at_idx" ON "rfid_scan_events"("scanned_at");
CREATE INDEX "rfid_scan_events_source_event_id_idx" ON "rfid_scan_events"("source_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "classroom_attendance_sessions_id_school_id_key" ON "classroom_attendance_sessions"("id", "school_id");
CREATE INDEX "classroom_attendance_sessions_school_id_idx" ON "classroom_attendance_sessions"("school_id");
CREATE INDEX "classroom_attendance_sessions_academic_year_id_idx" ON "classroom_attendance_sessions"("academic_year_id");
CREATE INDEX "classroom_attendance_sessions_classroom_id_idx" ON "classroom_attendance_sessions"("classroom_id");
CREATE INDEX "classroom_attendance_sessions_classroom_device_id_idx" ON "classroom_attendance_sessions"("classroom_device_id");
CREATE INDEX "classroom_attendance_sessions_school_id_status_idx" ON "classroom_attendance_sessions"("school_id", "status");
CREATE INDEX "classroom_attendance_sessions_session_date_idx" ON "classroom_attendance_sessions"("session_date");

-- Allow only one open attendance session per classroom.
CREATE UNIQUE INDEX "classroom_attendance_sessions_one_open_per_classroom_key"
ON "classroom_attendance_sessions"("classroom_id")
WHERE "status" = 'OPEN';

-- CreateIndex
CREATE UNIQUE INDEX "student_attendance_records_attendance_session_id_student_id_key" ON "student_attendance_records"("attendance_session_id", "student_id");
CREATE INDEX "student_attendance_records_school_id_idx" ON "student_attendance_records"("school_id");
CREATE INDEX "student_attendance_records_classroom_id_idx" ON "student_attendance_records"("classroom_id");
CREATE INDEX "student_attendance_records_student_id_idx" ON "student_attendance_records"("student_id");
CREATE INDEX "student_attendance_records_school_id_status_idx" ON "student_attendance_records"("school_id", "status");

-- AddForeignKey
ALTER TABLE "card_credentials" ADD CONSTRAINT "card_credentials_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "card_credentials" ADD CONSTRAINT "card_credentials_student_id_school_id_fkey" FOREIGN KEY ("student_id", "school_id") REFERENCES "students"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "card_credentials" ADD CONSTRAINT "card_credentials_teacher_id_school_id_fkey" FOREIGN KEY ("teacher_id", "school_id") REFERENCES "teachers"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfid_scan_events" ADD CONSTRAINT "rfid_scan_events_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rfid_scan_events" ADD CONSTRAINT "rfid_scan_events_classroom_device_id_school_id_fkey" FOREIGN KEY ("classroom_device_id", "school_id") REFERENCES "classroom_devices"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rfid_scan_events" ADD CONSTRAINT "rfid_scan_events_classroom_id_school_id_fkey" FOREIGN KEY ("classroom_id", "school_id") REFERENCES "classrooms"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rfid_scan_events" ADD CONSTRAINT "rfid_scan_events_card_credential_id_fkey" FOREIGN KEY ("card_credential_id") REFERENCES "card_credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rfid_scan_events" ADD CONSTRAINT "rfid_scan_events_student_id_school_id_fkey" FOREIGN KEY ("student_id", "school_id") REFERENCES "students"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rfid_scan_events" ADD CONSTRAINT "rfid_scan_events_teacher_id_school_id_fkey" FOREIGN KEY ("teacher_id", "school_id") REFERENCES "teachers"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rfid_scan_events" ADD CONSTRAINT "rfid_scan_events_duplicate_of_event_id_fkey" FOREIGN KEY ("duplicate_of_event_id") REFERENCES "rfid_scan_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_attendance_sessions" ADD CONSTRAINT "classroom_attendance_sessions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "classroom_attendance_sessions" ADD CONSTRAINT "classroom_attendance_sessions_academic_year_id_school_id_fkey" FOREIGN KEY ("academic_year_id", "school_id") REFERENCES "academic_years"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "classroom_attendance_sessions" ADD CONSTRAINT "classroom_attendance_sessions_classroom_id_school_id_fkey" FOREIGN KEY ("classroom_id", "school_id") REFERENCES "classrooms"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "classroom_attendance_sessions" ADD CONSTRAINT "classroom_attendance_sessions_classroom_device_id_school_id_fkey" FOREIGN KEY ("classroom_device_id", "school_id") REFERENCES "classroom_devices"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "classroom_attendance_sessions" ADD CONSTRAINT "classroom_attendance_sessions_teacher_id_school_id_fkey" FOREIGN KEY ("teacher_id", "school_id") REFERENCES "teachers"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_attendance_records" ADD CONSTRAINT "student_attendance_records_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_attendance_records" ADD CONSTRAINT "student_attendance_records_attendance_session_id_school_id_fkey" FOREIGN KEY ("attendance_session_id", "school_id") REFERENCES "classroom_attendance_sessions"("id", "school_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_attendance_records" ADD CONSTRAINT "student_attendance_records_classroom_id_school_id_fkey" FOREIGN KEY ("classroom_id", "school_id") REFERENCES "classrooms"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_attendance_records" ADD CONSTRAINT "student_attendance_records_student_id_school_id_fkey" FOREIGN KEY ("student_id", "school_id") REFERENCES "students"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
