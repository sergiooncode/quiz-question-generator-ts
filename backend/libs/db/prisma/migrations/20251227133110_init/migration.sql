-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateTable
CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "options" JSONB NOT NULL DEFAULT '[]',
    "correct_option" VARCHAR(1) NOT NULL,
    "topic" VARCHAR(200) NOT NULL,
    "target_difficulty_label" "DifficultyLevel" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_reviews" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "question_id" INTEGER NOT NULL,
    "ak" SMALLINT NOT NULL,
    "cl" SMALLINT NOT NULL,
    "od" SMALLINT NOT NULL,
    "ts" SMALLINT NOT NULL,
    "difficulty_score" DOUBLE PRECISION NOT NULL,
    "difficulty_label" "DifficultyLevel" NOT NULL,
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "topic_mismatch" BOOLEAN NOT NULL DEFAULT false,
    "style_violations" JSONB NOT NULL DEFAULT '[]',
    "factual_concerns" JSONB NOT NULL DEFAULT '[]',
    "raw_judge_output" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "questions_uuid_key" ON "questions"("uuid");

-- CreateIndex
CREATE INDEX "questions_uuid_idx" ON "questions"("uuid");

-- CreateIndex
CREATE INDEX "questions_topic_idx" ON "questions"("topic");

-- CreateIndex
CREATE INDEX "questions_target_difficulty_label_idx" ON "questions"("target_difficulty_label");

-- CreateIndex
CREATE INDEX "questions_created_at_idx" ON "questions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "question_reviews_uuid_key" ON "question_reviews"("uuid");

-- CreateIndex
CREATE INDEX "question_reviews_uuid_idx" ON "question_reviews"("uuid");

-- CreateIndex
CREATE INDEX "question_reviews_question_id_idx" ON "question_reviews"("question_id");

-- CreateIndex
CREATE INDEX "question_reviews_difficulty_label_idx" ON "question_reviews"("difficulty_label");

-- CreateIndex
CREATE INDEX "question_reviews_is_valid_idx" ON "question_reviews"("is_valid");

-- AddForeignKey
ALTER TABLE "question_reviews" ADD CONSTRAINT "question_reviews_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
