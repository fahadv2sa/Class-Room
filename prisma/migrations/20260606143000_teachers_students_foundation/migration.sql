-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "TeacherStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED');

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "employee_number" TEXT NOT NULL,
    "full_name_ar" TEXT NOT NULL,
    "full_name_en" TEXT NOT NULL,
    "national_id" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "gender" "Gender" NOT NULL,
    "status" "TeacherStatus" NOT NULL DEFAULT 'ACTIVE',
    "hire_date" TIMESTAMP(3),
    "profile_photo_url" TEXT,
    "card_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "teachers_employee_number_format_check" CHECK ("employee_number" <> ''),
    CONSTRAINT "teachers_card_code_format_check" CHECK ("card_code" ~ '^TCH-[0-9]{8}$')
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "student_number" TEXT NOT NULL,
    "full_name_ar" TEXT NOT NULL,
    "full_name_en" TEXT NOT NULL,
    "national_id" TEXT,
    "gender" "Gender" NOT NULL,
    "birth_date" TIMESTAMP(3),
    "guardian_name" TEXT,
    "guardian_phone" TEXT,
    "guardian_email" TEXT,
    "profile_photo_url" TEXT,
    "card_code" TEXT NOT NULL,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "students_student_number_format_check" CHECK ("student_number" <> ''),
    CONSTRAINT "students_card_code_format_check" CHECK ("card_code" ~ '^STD-[0-9]{8}$')
);

-- CreateIndex
CREATE UNIQUE INDEX "teachers_card_code_key" ON "teachers"("card_code");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_school_id_employee_number_key" ON "teachers"("school_id", "employee_number");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_school_id_national_id_key" ON "teachers"("school_id", "national_id");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_school_id_email_key" ON "teachers"("school_id", "email");

-- CreateIndex
CREATE INDEX "teachers_school_id_idx" ON "teachers"("school_id");

-- CreateIndex
CREATE INDEX "teachers_school_id_status_idx" ON "teachers"("school_id", "status");

-- CreateIndex
CREATE INDEX "teachers_full_name_ar_idx" ON "teachers"("full_name_ar");

-- CreateIndex
CREATE INDEX "teachers_full_name_en_idx" ON "teachers"("full_name_en");

-- CreateIndex
CREATE UNIQUE INDEX "students_card_code_key" ON "students"("card_code");

-- CreateIndex
CREATE UNIQUE INDEX "students_school_id_student_number_key" ON "students"("school_id", "student_number");

-- CreateIndex
CREATE UNIQUE INDEX "students_school_id_national_id_key" ON "students"("school_id", "national_id");

-- CreateIndex
CREATE INDEX "students_school_id_idx" ON "students"("school_id");

-- CreateIndex
CREATE INDEX "students_classroom_id_idx" ON "students"("classroom_id");

-- CreateIndex
CREATE INDEX "students_school_id_status_idx" ON "students"("school_id", "status");

-- CreateIndex
CREATE INDEX "students_school_id_classroom_id_idx" ON "students"("school_id", "classroom_id");

-- CreateIndex
CREATE INDEX "students_full_name_ar_idx" ON "students"("full_name_ar");

-- CreateIndex
CREATE INDEX "students_full_name_en_idx" ON "students"("full_name_en");

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
