-- CreateEnum
CREATE TYPE "FactCheckStatus" AS ENUM ('NOT_NEEDED', 'PENDING', 'CONFIRMED', 'REFUTED');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('CANDIDATE', 'QUALIFIED', 'REJECTED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "question_qualifications" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "question_id" INTEGER NOT NULL,
    "stage0_passed" BOOLEAN NOT NULL,
    "stage0_failures" JSONB NOT NULL DEFAULT '[]',
    "fact_check_status" "FactCheckStatus" NOT NULL DEFAULT 'NOT_NEEDED',
    "publication_status" "PublicationStatus" NOT NULL DEFAULT 'CANDIDATE',
    "rejection_reasons" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_qualifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "question_qualifications_uuid_key" ON "question_qualifications"("uuid");

-- CreateIndex
CREATE INDEX "question_qualifications_uuid_idx" ON "question_qualifications"("uuid");

-- CreateIndex
CREATE INDEX "question_qualifications_question_id_idx" ON "question_qualifications"("question_id");

-- CreateIndex
CREATE INDEX "question_qualifications_publication_status_idx" ON "question_qualifications"("publication_status");

-- CreateIndex
CREATE INDEX "question_qualifications_fact_check_status_idx" ON "question_qualifications"("fact_check_status");

-- AddForeignKey
ALTER TABLE "question_qualifications" ADD CONSTRAINT "question_qualifications_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
