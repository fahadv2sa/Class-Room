-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ALERT', 'INSIGHT', 'REPORT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('DASHBOARD', 'EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'READY', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReportDefinitionType" AS ENUM ('DAILY_SUMMARY', 'WEEKLY_SUMMARY', 'MONTHLY_SUMMARY');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('PDF', 'EXCEL');

-- AlterTable
ALTER TABLE "school_settings" ADD COLUMN "dashboard_notifications_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "school_settings" ADD COLUMN "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "school_settings" ADD COLUMN "whatsapp_notifications_enabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "alerts_id_school_id_key" ON "alerts"("id", "school_id");

-- CreateIndex
CREATE UNIQUE INDEX "insights_id_school_id_key" ON "insights"("id", "school_id");

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "alert_id" TEXT,
    "insight_id" TEXT,
    "notification_type" "NotificationType" NOT NULL,
    "notification_channel" "NotificationChannel" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "source_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_definitions" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "report_type" "ReportDefinitionType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "period" "SummaryPeriod" NOT NULL,
    "data_sources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_definitions" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "report_definition_id" TEXT NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notifications_source_key_key" ON "notifications"("source_key");

-- CreateIndex
CREATE INDEX "notifications_school_id_idx" ON "notifications"("school_id");

-- CreateIndex
CREATE INDEX "notifications_alert_id_idx" ON "notifications"("alert_id");

-- CreateIndex
CREATE INDEX "notifications_insight_id_idx" ON "notifications"("insight_id");

-- CreateIndex
CREATE INDEX "notifications_notification_type_idx" ON "notifications"("notification_type");

-- CreateIndex
CREATE INDEX "notifications_notification_channel_idx" ON "notifications"("notification_channel");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "report_definitions_school_id_report_type_key" ON "report_definitions"("school_id", "report_type");

-- CreateIndex
CREATE UNIQUE INDEX "report_definitions_id_school_id_key" ON "report_definitions"("id", "school_id");

-- CreateIndex
CREATE INDEX "report_definitions_school_id_idx" ON "report_definitions"("school_id");

-- CreateIndex
CREATE INDEX "report_definitions_report_type_idx" ON "report_definitions"("report_type");

-- CreateIndex
CREATE INDEX "report_definitions_period_idx" ON "report_definitions"("period");

-- CreateIndex
CREATE INDEX "report_definitions_is_active_idx" ON "report_definitions"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "export_definitions_school_id_report_definition_id_format_key" ON "export_definitions"("school_id", "report_definition_id", "format");

-- CreateIndex
CREATE INDEX "export_definitions_school_id_idx" ON "export_definitions"("school_id");

-- CreateIndex
CREATE INDEX "export_definitions_report_definition_id_idx" ON "export_definitions"("report_definition_id");

-- CreateIndex
CREATE INDEX "export_definitions_format_idx" ON "export_definitions"("format");

-- CreateIndex
CREATE INDEX "export_definitions_is_active_idx" ON "export_definitions"("is_active");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_alert_id_school_id_fkey" FOREIGN KEY ("alert_id", "school_id") REFERENCES "alerts"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_insight_id_school_id_fkey" FOREIGN KEY ("insight_id", "school_id") REFERENCES "insights"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_definitions" ADD CONSTRAINT "report_definitions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_definitions" ADD CONSTRAINT "export_definitions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_definitions" ADD CONSTRAINT "export_definitions_report_definition_id_school_id_fkey" FOREIGN KEY ("report_definition_id", "school_id") REFERENCES "report_definitions"("id", "school_id") ON DELETE CASCADE ON UPDATE CASCADE;
