# Quiz Generator CLI — Command Examples

This document provides examples for running the quiz-generator CLI.

## Running the CLI

**Development (with hot reload):**
```bash
npm run dev -- <command> [options]
```

**Development (one-off run):**
```bash
npm run quiz -- <command> [options]
```

**Production (after build):**
```bash
npm start -- <command> [options]
```

**Docker:**
```bash
docker compose exec app node dist/apps/cli/quiz.js <command> [options]
```

> **Note:** Use `--` before flags to pass them to the script (e.g. `npm run quiz -- generate-question --count 5`).

---

## Commands

### 1. Generate questions (`generate-question`)

Generate geography quiz questions using GPT-4o-mini.

| Option | Description | Default |
|--------|-------------|---------|
| `--count <number>` | Number of questions to generate | 10 |
| `--save-to-db` | Save questions to the database | false |
| `--judge` | Judge questions after generation (requires `--save-to-db`) | false |
| `--target-difficulty <level>` | Difficulty: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT | EXPERT |

**Examples:**

```bash
# Generate 5 questions (output only, no DB)
npm run quiz -- generate-question --count 5

# Generate 10 questions and save to database
npm run quiz -- generate-question --save-to-db

# Generate 3 ADVANCED questions, save and judge
npm run quiz -- generate-question --count 3 --save-to-db --judge --target-difficulty ADVANCED

# Generate 20 BEGINNER questions and save
npm run quiz -- generate-question --count 20 --save-to-db --target-difficulty BEGINNER

# Full example with all options
npm run quiz -- generate-question --count 15 --save-to-db --judge --target-difficulty INTERMEDIATE
```

---

### 2. Review questions (`review-question`)

Judge and score existing questions for difficulty and quality.

| Option | Description |
|--------|-------------|
| `--all` | Review all unreviewed questions |
| `--question-id <uuid>` | Review a specific question by ID |
| `--count <number>` | Review the first N unreviewed questions |

**Examples:**

```bash
# Review all unreviewed questions
npm run quiz -- review-question --all

# Review first 10 unreviewed questions
npm run quiz -- review-question --count 10

# Review a specific question by ID
npm run quiz -- review-question --question-id 550e8400-e29b-41d4-a716-446655440000
```

---

### 3. List questions (`list`)

List existing questions from the database.

| Option | Description |
|--------|-------------|
| `-t, --topic <topic>` | Filter by topic |

**Examples:**

```bash
# List all questions
npm run quiz -- list

# List questions filtered by topic
npm run quiz -- list --topic "Capitals"
```

---

## Help

Get help for any command:

```bash
npm run quiz -- --help
npm run quiz -- generate-question --help
npm run quiz -- review-question --help
npm run quiz -- list --help
```

---

## Environment

Ensure these are set (in `.env`, `.env.local`, or your environment):

- `OPENAI_API_KEY` — Required for question generation and judging
- `DATABASE_URL` — Required for database operations (e.g. `postgresql://quiz_user:quiz_password@localhost:5432/quiz_db`)
