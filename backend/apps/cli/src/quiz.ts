import 'dotenv/config';
import { Command, Option } from 'commander';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { prisma, DifficultyLevel } from '../../../libs/db/src';
import { generate_question, judgeQuestion, GeneratedQuestion } from '../../../libs/llm/src';

/** Escape a value for CSV (wrap in quotes if needed, escape inner quotes) */
function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Parse a single CSV line (handles quoted fields with commas and escaped quotes) */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

const program = new Command();

program
  .name('quiz-generator')
  .description('CLI for generating quiz questions')
  .version('1.0.0');

program
  .command('generate-question')
  .description('Generate geography quiz questions using GPT-4o-mini')
  .option(
    '--count <number>',
    'How many questions to generate (default: 10)',
    '10'
  )
  .option(
    '--save-to-db',
    'Save generated questions to the database',
    false
  )
  .option(
    '--judge',
    'Judge questions after generation (requires --save-to-db)',
    false
  )
  .addOption(
    new Option('--target-difficulty <level>', 'Target difficulty level for generated questions (default: INTERMEDIATE)')
      .choices(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
      .default('EXPERT')
  )
  .action(async (options) => {
    const count = parseInt(options.count, 10);
    const saveToDb = options.saveToDb || false;
    const judge = options.judge || false;
    const targetDifficulty = options.targetDifficulty || 'EXPERT';

    // Validation: --judge requires --save-to-db
    if (judge && !saveToDb) {
      console.error('ERROR: --judge requires --save-to-db. Use both flags together.');
      process.exit(1);
    }

    console.log(`Generating ${count} quiz questions...`);

    const questions: GeneratedQuestion[] = [];
    const dbQuestions = [];

    try {
      // Fetch recent topics to avoid repetition
      const recentQuestions = await prisma.question.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        select: { topic: true },
      });
      const recentTopics = recentQuestions.map(q => q.topic);

      for (let i = 0; i < count; i++) {
        // Build list of topics to avoid (recent DB topics + topics from current batch)
        const topicsToAvoid = [...recentTopics, ...questions.map(q => q.topic)];

        // Generate question with topic tracking
        const q = await generate_question(targetDifficulty, topicsToAvoid);
        questions.push(q);
        console.log(`\x1b[32m[${i + 1}/${count}] ✔ ${q.question}\x1b[0m`); // Green color for success

        if (saveToDb) {
          // Save to database
          const questionObj = await prisma.question.create({
            data: {
              questionText: q.question,
              options: q.options,
              correctOption: q.correct_option,
              topic: q.topic,
              targetDifficultyLabel: targetDifficulty as DifficultyLevel,
            },
          });
          dbQuestions.push(questionObj);

          if (judge) {
            // Judge the question
            try {
              const result = await judgeQuestion({
                questionText: questionObj.questionText,
                options: questionObj.options as string[],
                correctOption: questionObj.correctOption,
                topic: questionObj.topic,
                targetDifficultyLabel: questionObj.targetDifficultyLabel,
              });

              // Save review to QuestionReview model
              await prisma.questionReview.create({
                data: {
                  questionId: questionObj.id,
                  ak: result.scores.AK,
                  cl: result.scores.CL,
                  od: result.scores.OD,
                  ts: result.scores.TS,
                  difficultyScore: result.difficulty_score,
                  difficultyLabel: result.difficulty_label as DifficultyLevel,
                  isValid: result.feedback.is_valid,
                  topicMismatch: result.feedback.topic_mismatch,
                  styleViolations: result.feedback.style_violations,
                  factualConcerns: result.feedback.factual_concerns,
                  rawJudgeOutput: result,
                },
              });

              const difficultyLabel = result.difficulty_label;
              const difficultyScore = result.difficulty_score;
              const validIcon = result.feedback.is_valid ? '✓' : '✗';
              console.log(
                `\x1b[32m  → Judged: ${difficultyLabel} (${difficultyScore.toFixed(1)}) [${validIcon}]\x1b[0m`
              );
            } catch (error) {
              console.log(
                `\x1b[33m  ⚠ Could not judge question: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
              );
            }
          }
        }
      }

      if (saveToDb) {
        console.log(
          `\x1b[32m\nSaved ${dbQuestions.length} questions to database\x1b[0m`
        );
      }
    } catch (error) {
      console.error(
        `\x1b[31mError: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      );
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

program
  .command('review-question')
  .description('Judge and score quiz questions for difficulty and quality')
  .option(
    '--all',
    'Review all questions that haven\'t been reviewed yet',
    false
  )
  .option(
    '--question-id <uuid>',
    'Review a specific question by UUID'
  )
  .option(
    '--count <number>',
    'Review the first N unreviewed questions'
  )
  .action(async (options) => {
    try {
      if (options.questionId) {
        // Review specific question
        const question = await prisma.question.findUnique({
          where: { uuid: options.questionId },
          include: { reviews: true },
        });

        if (!question) {
          console.error(`\x1b[31mERROR: Question with ID ${options.questionId} not found\x1b[0m`);
          process.exit(1);
        }

        await reviewQuestion(question);
      } else if (options.all) {
        // Review all unreviewed questions
        const questions = await prisma.question.findMany({
          where: {
            reviews: {
              none: {},
            },
          },
          include: { reviews: true },
        });

        const count = questions.length;
        console.log(`\x1b[36mReviewing ${count} unreviewed questions...\x1b[0m`);

        for (let i = 0; i < questions.length; i++) {
          await reviewQuestion(questions[i], i + 1, count);
        }
      } else if (options.count) {
        // Review first N unreviewed questions
        const numToReview = parseInt(options.count, 10);
        const questions = await prisma.question.findMany({
          where: {
            reviews: {
              none: {},
            },
          },
          include: { reviews: true },
          take: numToReview,
        });

        const count = questions.length;
        console.log(`\x1b[36mReviewing ${count} questions...\x1b[0m`);

        for (let i = 0; i < questions.length; i++) {
          await reviewQuestion(questions[i], i + 1, count);
        }
      } else {
        console.error(
          '\x1b[31mERROR: Please specify --all, --question-id, or --count. Use --help for more information.\x1b[0m'
        );
        process.exit(1);
      }
    } catch (error) {
      console.error(
        `\x1b[31mError: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      );
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

program
  .command('list')
  .description('List existing questions')
  .option('-t, --topic <topic>', 'Filter by topic')
  .action(async (options) => {
    // List questions logic
  });

program
  .command('export-csv')
  .description('Export quiz questions from the database to a CSV file')
  .option('-o, --output <path>', 'Output file path', 'questions.csv')
  .option('-t, --topic <topic>', 'Filter by topic')
  .option(
    '--target-difficulty <level>',
    'Filter by target difficulty (BEGINNER, INTERMEDIATE, ADVANCED, EXPERT)'
  )
  .action(async (options) => {
    try {
      const where: { topic?: string; targetDifficultyLabel?: DifficultyLevel } = {};
      if (options.topic) where.topic = options.topic;
      if (options.targetDifficulty) where.targetDifficultyLabel = options.targetDifficulty as DifficultyLevel;

      const questions = await prisma.question.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          reviews: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      const headers = [
        'id',
        'uuid',
        'question_text',
        'options',
        'correct_option',
        'topic',
        'target_difficulty',
        'difficulty_score',
        'difficulty_label',
        'is_valid',
        'created_at',
      ];

      const rows = questions.map((q) => {
        const options = Array.isArray(q.options) ? q.options : JSON.parse(String(q.options || '[]'));
        const latestReview = q.reviews[0];
        return [
          q.id,
          q.uuid,
          q.questionText,
          options.join(' | '),
          q.correctOption,
          q.topic,
          q.targetDifficultyLabel,
          latestReview?.difficultyScore ?? '',
          latestReview?.difficultyLabel ?? '',
          latestReview?.isValid ?? '',
          q.createdAt.toISOString(),
        ].map(String).map(escapeCsv);
      });

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      writeFileSync(options.output, csv, 'utf-8');

      console.log(`\x1b[32mExported ${questions.length} questions to ${options.output}\x1b[0m`);
    } catch (error) {
      console.error(
        `\x1b[31mError: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      );
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

program
  .command('import-csv')
  .description('Import quiz questions from a CSV file into the database')
  .option('-i, --input <path>', 'Input CSV file path', 'questions.csv')
  .option('--no-skip-header', 'First row is data (no header row)')
  .action(async (options) => {
    try {
      if (!existsSync(options.input)) {
        console.error(`\x1b[31mError: File not found: ${options.input}\x1b[0m`);
        process.exit(1);
      }

      const content = readFileSync(options.input, 'utf-8');
      const lines = content.split(/\r?\n/).filter((l) => l.trim());

      if (lines.length === 0) {
        console.error(`\x1b[31mError: CSV file is empty\x1b[0m`);
        process.exit(1);
      }

      const rows = lines.map(parseCsvLine);
      const headerRow = rows[0];
      const skipHeader = options.skipHeader !== false;
      const dataRows = skipHeader ? rows.slice(1) : rows;

      // Find column indices (support both export format and minimal format)
      const col = (name: string) => {
        const idx = headerRow.findIndex((h) => h.toLowerCase().replace(/[- ]/g, '_') === name.toLowerCase().replace(/[- ]/g, '_'));
        return idx >= 0 ? idx : -1;
      };

      const questionTextIdx = col('question_text') >= 0 ? col('question_text') : col('question');
      const optionsIdx = col('options');
      const correctOptionIdx = col('correct_option') >= 0 ? col('correct_option') : col('correct');
      const topicIdx = col('topic');
      const targetDifficultyIdx = col('target_difficulty') >= 0 ? col('target_difficulty') : col('target_difficulty_label');

      if (questionTextIdx < 0 || optionsIdx < 0 || correctOptionIdx < 0 || topicIdx < 0) {
        console.error(
          '\x1b[31mError: CSV must have columns: question_text, options, correct_option, topic. Optional: target_difficulty\x1b[0m'
        );
        console.error(`Found headers: ${headerRow.join(', ')}`);
        process.exit(1);
      }

      const validDifficulties: DifficultyLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
      let imported = 0;
      let skipped = 0;

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const questionText = (row[questionTextIdx] ?? '').trim();
        const optionsStr = (row[optionsIdx] ?? '').trim();
        const correctOption = (row[correctOptionIdx] ?? '').trim().toLowerCase().charAt(0);
        const topic = (row[topicIdx] ?? '').trim();
        const targetDifficulty =
          targetDifficultyIdx >= 0 && row[targetDifficultyIdx]
            ? (row[targetDifficultyIdx].trim().toUpperCase() as DifficultyLevel)
            : 'INTERMEDIATE';

        if (!questionText || !topic) {
          skipped++;
          continue;
        }

        if (!validDifficulties.includes(targetDifficulty)) {
          skipped++;
          continue;
        }

        const options = optionsStr ? optionsStr.split(/\s*\|\s*/).map((o) => o.trim()).filter(Boolean) : [];
        if (options.length === 0) {
          skipped++;
          continue;
        }

        const correctIdx = 'abcd'.indexOf(correctOption);
        if (correctIdx < 0 || correctIdx >= options.length) {
          skipped++;
          continue;
        }

        await prisma.question.create({
          data: {
            questionText,
            options,
            correctOption,
            topic: topic.slice(0, 200),
            targetDifficultyLabel: targetDifficulty,
          },
        });
        imported++;
        console.log(`\x1b[32m[${imported}] Imported: ${questionText.slice(0, 50)}...\x1b[0m`);
      }

      console.log(`\x1b[32mImported ${imported} questions. Skipped ${skipped} rows.\x1b[0m`);
    } catch (error) {
      console.error(
        `\x1b[31mError: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      );
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

program.parse();

/**
 * Helper function to review a single question
 */
async function reviewQuestion(
  question: any,
  current?: number,
  total?: number
) {
  try {
    const prefix = current && total ? `[${current}/${total}] ` : '';
    const questionPreview = question.questionText.substring(0, 50);
    console.log(
      `\x1b[36m${prefix}Reviewing question ${question.id}: ${questionPreview}...\x1b[0m`
    );

    const result = await judgeQuestion({
      questionText: question.questionText,
      options: question.options as string[],
      correctOption: question.correctOption,
      topic: question.topic,
      targetDifficultyLabel: question.targetDifficultyLabel,
    });

    // Save review to database
    await prisma.questionReview.create({
      data: {
        questionId: question.id,
        ak: result.scores.AK,
        cl: result.scores.CL,
        od: result.scores.OD,
        ts: result.scores.TS,
        difficultyScore: result.difficulty_score,
        difficultyLabel: result.difficulty_label as DifficultyLevel,
        isValid: result.feedback.is_valid,
        topicMismatch: result.feedback.topic_mismatch,
        styleViolations: result.feedback.style_violations,
        factualConcerns: result.feedback.factual_concerns,
        rawJudgeOutput: result,
      },
    });

    const validIcon = result.feedback.is_valid ? '✓' : '✗';
    console.log(
      `\x1b[32m  ✓ Difficulty: ${result.difficulty_label} (${result.difficulty_score.toFixed(1)}) | ` +
      `Valid: ${validIcon} | ` +
      `Scores: AK=${result.scores.AK} CL=${result.scores.CL} OD=${result.scores.OD} TS=${result.scores.TS}\x1b[0m`
    );

    if (!result.feedback.is_valid) {
      const reasons: string[] = [];
      if (result.feedback.topic_mismatch) {
        reasons.push('topic mismatch');
      }
      if (result.feedback.style_violations.length > 0) {
        reasons.push(`style violations: ${result.feedback.style_violations.join(', ')}`);
      }
      if (result.feedback.factual_concerns.length > 0) {
        reasons.push(`factual concerns: ${result.feedback.factual_concerns.join(', ')}`);
      }
      if (reasons.length > 0) {
        console.log(`\x1b[33m  ⚠ Reasons: ${reasons.join(' | ')}\x1b[0m`);
      }
    }
  } catch (error) {
    console.error(
      `\x1b[31m  ✗ Error reviewing question ${question.id}: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
    );
  }
}
