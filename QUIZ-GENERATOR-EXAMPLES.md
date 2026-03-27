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

**Docker (using Make):**

```bash
make quiz ARGS="<command> [options]"
```

**Docker (direct):**

```bash
docker compose run --rm app node dist/apps/cli/quiz.js <command> [options]
```

> **Note:** Use `--` before flags to pass them to the script (e.g. `npm run quiz -- generate-question --count 5`).

---

## Commands

### 1. Generate questions (`generate-question`)

Generate geography quiz questions using GPT-4o-mini.


| Option                        | Description                                                | Default |
| ----------------------------- | ---------------------------------------------------------- | ------- |
| `--count <number>`            | Number of questions to generate                            | 10      |
| `--save-to-db`                | Save questions to the database                             | false   |
| `--judge`                     | Judge questions after generation (requires `--save-to-db`) | false   |
| `--target-difficulty <level>` | Difficulty: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT       | EXPERT  |


**Examples:**

```bash
# Local
npm run quiz -- generate-question --count 5
npm run quiz -- generate-question --save-to-db
npm run quiz -- generate-question --count 3 --save-to-db --judge --target-difficulty ADVANCED

# Docker
make quiz ARGS="generate-question --count 5"
make quiz ARGS="generate-question --count 10 --save-to-db --judge"

```

---

### 2. Review questions (`review-question`)

Judge and score existing questions for difficulty and quality.


| Option                 | Description                             |
| ---------------------- | --------------------------------------- |
| `--all`                | Review all unreviewed questions         |
| `--question-id <uuid>` | Review a specific question by ID        |
| `--count <number>`     | Review the first N unreviewed questions |


**Examples:**

```bash
# Local
npm run quiz -- review-question --all
npm run quiz -- review-question --count 10

# Docker
make quiz ARGS="review-question --all"
make quiz ARGS="review-question --count 10"
make quiz ARGS="review-question --question-id 550e8400-e29b-41d4-a716-446655440000"
```

---

### 3. List questions (`list`)

List existing questions from the database.


| Option                | Description     |
| --------------------- | --------------- |
| `-t, --topic <topic>` | Filter by topic |


**Examples:**

```bash
# Local
npm run quiz -- list
npm run quiz -- list --topic "Capitals"

# Docker
make quiz ARGS="list"
make quiz ARGS="list --topic Capitals"
```

---

### 4. Export to CSV (`export-csv`)

Export quiz questions from the database to a CSV file.


| Option                        | Description                               |
| ----------------------------- | ----------------------------------------- |
| `-o, --output <path>`         | Output file path (default: questions.csv) |
| `-t, --topic <topic>`         | Filter by topic                           |
| `--target-difficulty <level>` | Filter by target difficulty               |


**Examples:**

```bash
# Local
npm run quiz -- export-csv
npm run quiz -- export-csv -o my-questions.csv
npm run quiz -- export-csv --topic "Capitals" -o capitals.csv

# Docker (use -o /app/apps/<file>.csv to write to host via mounted volume)
make quiz ARGS="export-csv -o /app/apps/questions.csv"
make quiz ARGS="export-csv --topic Capitals -o /app/apps/capitals.csv"
make quiz ARGS="export-csv --target-difficulty ADVANCED -o /app/apps/advanced.csv"
```

---

### 5. Import from CSV (`import-csv`)

Import quiz questions from a CSV file into the database.


| Option               | Description                                  |
| -------------------- | -------------------------------------------- |
| `-i, --input <path>` | Input CSV file path (default: questions.csv) |
| `--no-skip-header`   | First row is data (no header)                |


**CSV format:** Must have columns: `question_text`, `options` (pipe-separated), `correct_option` (a/b/c/d), `topic`. Optional: `target_difficulty` (BEGINNER, INTERMEDIATE, ADVANCED, EXPERT).

**Examples:**

```bash
# Local
npm run quiz -- import-csv
npm run quiz -- import-csv -i my-questions.csv

# Docker (use -i /app/apps/<file>.csv for file on host)
make quiz ARGS="import-csv -i /app/apps/questions.csv"
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

