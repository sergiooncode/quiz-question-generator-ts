-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "answer_explanation" TEXT,
ADD COLUMN     "answer_sources" JSONB NOT NULL DEFAULT '[]';
