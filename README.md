# quiz-question-generator-ts

Generates multiple-choice geography quiz questions with an LLM, scores them with an LLM judge, and stores them in Postgres. The goal is a 1000+ question book, so the project also covers deciding which questions are good enough to publish.

## What's in here

- **CLI** (`backend/apps/cli`): generate, judge and export questions.
- **API** (`backend/apps/api`): Koa REST API for listing, generating and reviewing questions, plus stats.
- **Frontend** (`frontend/`): Vue app with a question list and a dashboard.
- **Libraries** (`backend/libs`):
  - `llm`: question generator and judge (OpenAI).
  - `db`: Prisma client and schema.
  - `qualification`: deterministic checks for whether a question is publishable (see [QUALIFICATION.md](QUALIFICATION.md)).

## Getting started

```bash
cp .env.example .env        # add OPENAI_API_KEY (required by the LLM client)
make up                     # start Postgres, API, frontend
make db-migrate-deploy      # apply migrations
make quiz ARGS="generate-question --count 5 --save-to-db --judge"
```

See [COMMANDS.md](COMMANDS.md) for all Make targets and [PRISMA.md](PRISMA.md) for database workflow.

## Development

```bash
npm ci
npm run db:generate   # generate the Prisma client
npm run type-check
npm test              # Vitest; no database or API key needed
```

Tests mock the LLM and database. CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs type-check and tests on every push and pull request.

## Qualification roadmap

Not every generated question belongs in the book. Qualification is a funnel, cheapest stage first; the full design is in [QUALIFICATION.md](QUALIFICATION.md).

**Stage 0: mechanical gates (done, not yet wired in).** `runMechanicalGates` in [backend/libs/qualification](backend/libs/qualification/src/mechanical-gates.ts) is a pure function with no LLM and no database. It checks that a question has text, an explanation and at least one source, exactly four non-empty and distinct options, and a `correct_option` that is a/b/c/d and points to a real option. It reports every failure in one pass and has unit tests. Nothing calls it yet: there is no `qualify` command and no table to store results.

**Coming next:**

| Stage | What it does |
| ----- | ------------ |
| 0 (remaining) | Near-duplicate detection across the question bank; the `QuestionQualification` table and a `qualify` CLI command to run the gates over the bank |
| 1 | Judge review for every question, so none is left unreviewed |
| 2 | Reject on the judge's free signals: `is_valid`, `topic_mismatch`, and non-empty `factual_concerns` or `style_violations` |
| 3 | Independent LLM fact-check, only for questions the judge flagged |
| 4 | Balance the whole set: answer position (~25% each of a/b/c/d), difficulty (250 per band), topic spread, and no repeated facts |

## Configuration

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | Postgres connection string |
| `OPENAI_API_KEY` | Required for generating and judging |
| `LLM_MODEL` / `LLM_JUDGE_MODEL` | Override the generator (`gpt-4.1-mini`) and judge (`gpt-4.1`) models |
| `BRAINTRUST_API_KEY` | Optional; enables tracing |
