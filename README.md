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

## Configuration

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | Postgres connection string |
| `OPENAI_API_KEY` | Required for generating and judging |
| `LLM_MODEL` / `LLM_JUDGE_MODEL` | Override the generator (`gpt-4.1-mini`) and judge (`gpt-4.1`) models |
| `BRAINTRUST_API_KEY` | Optional; enables tracing |
