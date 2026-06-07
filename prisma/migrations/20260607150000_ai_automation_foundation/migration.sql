-- CreateEnum
CREATE TYPE "AIRecommendationType" AS ENUM ('CLASSROOM_PERFORMANCE_DECLINE', 'NOISE_INCREASE', 'MOVEMENT_INCREASE', 'ATTENDANCE_DROP', 'STUDENT_REQUIRES_ATTENTION', 'DEVICE_RELIABILITY');

-- CreateEnum
CREATE TYPE "AIRecommendationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AIRecommendationStatus" AS ENUM ('ACTIVE', 'DISMISSED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AISummaryType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'TERM', 'SCHOOL', 'CLASSROOM', 'TEACHER', 'STUDENT_ATTENTION');

-- CreateEnum
CREATE TYPE "AutomationTriggerType" AS ENUM ('ALERT_CREATED', 'INSIGHT_CREATED', 'KPI_DROPS', 'DEVICE_OFFLINE');

-- CreateEnum
CREATE TYPE "AutomationActionType" AS ENUM ('CREATE_NOTIFICATION', 'CREATE_RECOMMENDATION', 'CREATE_SUMMARY');

-- CreateTable
CREATE TABLE "ai_recommendations" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "recommendation_type" "AIRecommendationType" NOT NULL,
    "priority" "AIRecommendationPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "AIRecommendationStatus" NOT NULL DEFAULT 'ACTIVE',
    "subject_type" "ManagementSubjectType",
    "subject_id" TEXT,
    "title" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "data_sources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source_key" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_summaries" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "summary_type" "AISummaryType" NOT NULL,
    "period" "SummaryPeriod",
    "subject_type" "ManagementSubjectType",
    "subject_id" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "data_sources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source_key" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_definitions" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger_type" "AutomationTriggerType" NOT NULL,
    "condition" JSONB NOT NULL,
    "action_type" "AutomationActionType" NOT NULL,
    "action_config" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "source_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_recommendations_source_key_key" ON "ai_recommendations"("source_key");

-- CreateIndex
CREATE INDEX "ai_recommendations_school_id_idx" ON "ai_recommendations"("school_id");

-- CreateIndex
CREATE INDEX "ai_recommendations_recommendation_type_idx" ON "ai_recommendations"("recommendation_type");

-- CreateIndex
CREATE INDEX "ai_recommendations_priority_idx" ON "ai_recommendations"("priority");

-- CreateIndex
CREATE INDEX "ai_recommendations_status_idx" ON "ai_recommendations"("status");

-- CreateIndex
CREATE INDEX "ai_recommendations_subject_type_idx" ON "ai_recommendations"("subject_type");

-- CreateIndex
CREATE INDEX "ai_recommendations_subject_id_idx" ON "ai_recommendations"("subject_id");

-- CreateIndex
CREATE INDEX "ai_recommendations_generated_at_idx" ON "ai_recommendations"("generated_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_summaries_source_key_key" ON "ai_summaries"("source_key");

-- CreateIndex
CREATE INDEX "ai_summaries_school_id_idx" ON "ai_summaries"("school_id");

-- CreateIndex
CREATE INDEX "ai_summaries_summary_type_idx" ON "ai_summaries"("summary_type");

-- CreateIndex
CREATE INDEX "ai_summaries_period_idx" ON "ai_summaries"("period");

-- CreateIndex
CREATE INDEX "ai_summaries_subject_type_idx" ON "ai_summaries"("subject_type");

-- CreateIndex
CREATE INDEX "ai_summaries_subject_id_idx" ON "ai_summaries"("subject_id");

-- CreateIndex
CREATE INDEX "ai_summaries_generated_at_idx" ON "ai_summaries"("generated_at");

-- CreateIndex
CREATE UNIQUE INDEX "automation_definitions_source_key_key" ON "automation_definitions"("source_key");

-- CreateIndex
CREATE INDEX "automation_definitions_school_id_idx" ON "automation_definitions"("school_id");

-- CreateIndex
CREATE INDEX "automation_definitions_trigger_type_idx" ON "automation_definitions"("trigger_type");

-- CreateIndex
CREATE INDEX "automation_definitions_action_type_idx" ON "automation_definitions"("action_type");

-- CreateIndex
CREATE INDEX "automation_definitions_is_active_idx" ON "automation_definitions"("is_active");

-- AddForeignKey
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_summaries" ADD CONSTRAINT "ai_summaries_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_definitions" ADD CONSTRAINT "automation_definitions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
