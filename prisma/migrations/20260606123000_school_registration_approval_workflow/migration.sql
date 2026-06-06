-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RegistrationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable: introduce lifecycle status and audit fields while preserving existing rows.
ALTER TABLE "schools" ADD COLUMN "status" "SchoolStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "schools" ADD COLUMN "approved_by" TEXT;
ALTER TABLE "schools" ADD COLUMN "approved_at" TIMESTAMP(3);
ALTER TABLE "schools" ADD COLUMN "rejected_by" TEXT;
ALTER TABLE "schools" ADD COLUMN "rejected_at" TIMESTAMP(3);
ALTER TABLE "schools" ADD COLUMN "suspended_by" TEXT;
ALTER TABLE "schools" ADD COLUMN "suspended_at" TIMESTAMP(3);

UPDATE "schools"
SET "status" = CASE
    WHEN "is_active" = true THEN 'ACTIVE'::"SchoolStatus"
    ELSE 'SUSPENDED'::"SchoolStatus"
END;

ALTER TABLE "schools" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "schools" DROP COLUMN "is_active";

-- CreateTable
CREATE TABLE "school_registration_requests" (
    "id" TEXT NOT NULL,
    "school_name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "admin_name" TEXT NOT NULL,
    "admin_email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "RegistrationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_registration_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schools_status_idx" ON "schools"("status");

-- CreateIndex
CREATE INDEX "school_registration_requests_status_idx" ON "school_registration_requests"("status");

-- CreateIndex
CREATE INDEX "school_registration_requests_admin_email_idx" ON "school_registration_requests"("admin_email");

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "super_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "super_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_suspended_by_fkey" FOREIGN KEY ("suspended_by") REFERENCES "super_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_registration_requests" ADD CONSTRAINT "school_registration_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "super_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_registration_requests" ADD CONSTRAINT "school_registration_requests_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "super_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
