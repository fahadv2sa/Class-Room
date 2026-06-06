-- CreateEnum
CREATE TYPE "Language" AS ENUM ('AR', 'EN');

-- CreateTable
CREATE TABLE "school_settings" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "language" "Language" NOT NULL DEFAULT 'AR',
    "noise_threshold_db" INTEGER NOT NULL DEFAULT 70,
    "student_exit_limit_minutes" INTEGER NOT NULL DEFAULT 10,
    "noise_alerts_enabled" BOOLEAN NOT NULL DEFAULT true,
    "movement_alerts_enabled" BOOLEAN NOT NULL DEFAULT true,
    "attendance_alerts_enabled" BOOLEAN NOT NULL DEFAULT true,
    "device_alerts_enabled" BOOLEAN NOT NULL DEFAULT true,
    "daily_report_enabled" BOOLEAN NOT NULL DEFAULT false,
    "school_name_override" TEXT,
    "contact_phone" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "school_settings_noise_threshold_db_check" CHECK ("noise_threshold_db" BETWEEN 40 AND 100),
    CONSTRAINT "school_settings_student_exit_limit_minutes_check" CHECK ("student_exit_limit_minutes" BETWEEN 5 AND 30)
);

-- CreateIndex
CREATE UNIQUE INDEX "school_settings_school_id_key" ON "school_settings"("school_id");

-- CreateIndex
CREATE INDEX "school_settings_language_idx" ON "school_settings"("language");

-- AddForeignKey
ALTER TABLE "school_settings" ADD CONSTRAINT "school_settings_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
