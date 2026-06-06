-- CreateEnum
CREATE TYPE "ClassroomDeviceStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('ONLINE', 'OFFLINE', 'UNKNOWN');

-- CreateTable
CREATE TABLE "classroom_devices" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "device_code" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "firmware_version" TEXT NOT NULL,
    "hardware_version" TEXT NOT NULL,
    "status" "ClassroomDeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "connection_status" "ConnectionStatus" NOT NULL DEFAULT 'UNKNOWN',
    "capabilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "installed_at" TIMESTAMP(3) NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3),
    "retired_at" TIMESTAMP(3),
    "notes" TEXT,
    "provisioned_at" TIMESTAMP(3),
    "provisioned_by" TEXT,
    "pairing_token_hash" TEXT,
    "pairing_token_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classroom_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "classroom_devices_device_code_key" ON "classroom_devices"("device_code");

-- CreateIndex
CREATE UNIQUE INDEX "classroom_devices_serial_number_key" ON "classroom_devices"("serial_number");

-- CreateIndex
CREATE INDEX "classroom_devices_school_id_idx" ON "classroom_devices"("school_id");

-- CreateIndex
CREATE INDEX "classroom_devices_classroom_id_idx" ON "classroom_devices"("classroom_id");

-- CreateIndex
CREATE INDEX "classroom_devices_school_id_status_idx" ON "classroom_devices"("school_id", "status");

-- CreateIndex
CREATE INDEX "classroom_devices_school_id_connection_status_idx" ON "classroom_devices"("school_id", "connection_status");

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_id_school_id_key" ON "classrooms"("id", "school_id");

-- Enforce one active integrated Class-Room Device per classroom while preserving retired history.
CREATE UNIQUE INDEX "classroom_devices_one_active_per_classroom_key"
ON "classroom_devices"("classroom_id")
WHERE "status" = 'ACTIVE';

-- Enforce the permanent human-readable device code format.
ALTER TABLE "classroom_devices"
ADD CONSTRAINT "classroom_devices_device_code_format_check"
CHECK ("device_code" ~ '^CRD-[0-9]{8}$');

-- Device codes are permanent and must not change after creation.
CREATE OR REPLACE FUNCTION prevent_classroom_device_code_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."device_code" IS DISTINCT FROM NEW."device_code" THEN
    RAISE EXCEPTION 'device_code is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "classroom_devices_device_code_immutable"
BEFORE UPDATE ON "classroom_devices"
FOR EACH ROW
EXECUTE FUNCTION prevent_classroom_device_code_update();

-- AddForeignKey
ALTER TABLE "classroom_devices" ADD CONSTRAINT "classroom_devices_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_devices" ADD CONSTRAINT "classroom_devices_classroom_id_school_id_fkey" FOREIGN KEY ("classroom_id", "school_id") REFERENCES "classrooms"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;
