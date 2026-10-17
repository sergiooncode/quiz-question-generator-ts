# AGENTS.md

Guidance for AI agents working in this repository.

## Initiative

`quiz-question-generator-ts` is an internal tool for producing and quality-gating
multiple-choice quiz question banks with LLMs. It is a greenfield TypeScript
project — a pipeline that generates candidate questions, judges them against a
rubric, persists both to Postgres, and exposes the results through a CLI, a REST
API, and a small Vue dashboard.

**End goal: publish a curated set of 1000+ geography quiz questions as a book on
Amazon KDP.** The tooling exists to make that set trustworthy at volume. Every
design decision should be traced back to whether it improves the published book.

The defining constraint: **generated content is not trusted until it is judged.**
Generation and evaluation are separate stages with separate models and separate
tables, so question quality is measurable rather than assumed.

## Mission

Produce quiz questions at volume without letting quality drift silently.

Concretely, the project aims to:

- Generate topically-scoped questions with explanations and supporting sources.
- Score every question on a four-dimension rubric (AK, CL, OD, TS) and derive a
  difficulty label from it.
- Flag invalid questions, style violations, factual concerns, and topic mismatch
  rather than discarding them — bad output is diagnostic data.
- Keep the full judge output (`rawJudgeOutput`) so prompt and rubric changes can
  be evaluated retroactively.
- Surface aggregate quality over time via `/api/stats` and the dashboard.
- Qualify questions for publication and assemble a balanced 1000+ question set.

**Difficulty is not quality.** The AK/CL/OD/TS rubric measures how *hard* a
question is; a 5/5/5/5 question is the hardest possible, not the best. The only
existing quality signals are `is_valid`, `topic_mismatch`, `style_violations`,
and `factual_concerns`. Use the rubric to bucket questions into difficulty
bands — never to rank them for selection.

## Audience

There are two distinct audiences, and conflating them causes bad decisions.

**Audience of the code: the developer (single operator).** The CLI and dashboard
are internal tooling, not a product.

- Optimize for inspectability over polish. Clear output, readable errors, and
  queryable data beat UI refinement.
- No end-user auth, multi-tenancy, or content moderation layer is needed.
- Breaking changes are cheap. Prefer fixing a design over preserving a bad
  interface for backwards compatibility.
- Assume the reader of any tool output already understands the pipeline.

**Audience of the questions: buyers of a quiz book on Amazon KDP.** A curated set
of 1000+ questions is the eventual deliverable. This is a paying, non-technical,
general audience — and print is unpatchable.

- A factual error is a refund and a one-star review, not a bug ticket. Accuracy
  outranks volume, difficulty, and cleverness.
- Every published question needs a correct answer, a clear explanation, and a
  real source.
- Questions are consumed as a *set*, not individually. Answer-position balance,
  difficulty spread, topic variety, and non-repetition are properties of the
  collection and must be evaluated at collection level.
- Engagement matters. Maximally hard is not the goal; a good spread is.

When the two audiences conflict, the book wins.

## Scope

**Question generation** — `backend/libs/llm/src/question-generator/`. Zod-validated
structured output (`QuestionResponseSchema`). Model: `LLM_MODEL`, default
`gpt-4.1-mini`.

**Question judging** — `backend/libs/llm/src/judge/`. Rubric scoring and validation
(`JudgeResponseSchema`). Model: `LLM_JUDGE_MODEL`, default `gpt-4.1`. Deliberately
a stronger model than generation.

**Persistence** — Prisma 7 over Postgres 16. Two models in
[schema.prisma](backend/libs/db/prisma/schema.prisma): `Question` and
`QuestionReview` (many reviews per question, cascade delete).

**CLI** — [quiz.ts](backend/apps/cli/src/quiz.ts) via Commander:
`generate-question`, `review-question`, `list`, `export-csv`, `import-csv`.

**REST API** — Koa 3 + `@koa/router`, mounted in [app.ts](backend/apps/api/src/app.ts):

| Method | Route                          |
| ------ | ------------------------------ |
| GET    | `/api/questions`               |
| GET    | `/api/questions/:uuid`         |
| POST   | `/api/questions/generate`      |
| POST   | `/api/questions/:uuid/review`  |
| GET    | `/api/questions/:uuid/reviews` |
| GET    | `/api/stats`                   |

**Frontend** — Vue 3 + Vite, no state library or component framework. Plain SFCs
in `frontend/src/components/`.

**Local orchestration** — Docker Compose: `postgres` (5432), `api` (3000),
`app` (3002), `frontend` (5173).

## Out of Scope

- **Serving quizzes to end users digitally.** No quiz-taking flow, scoring,
  sessions, or user accounts. The delivery medium is a printed/Kindle book; the
  software's output is a curated question set, not a quiz app.
- **Book layout and typesetting.** Manuscript formatting, cover design, and KDP
  upload are out of band. The pipeline's job ends at an exported, qualified set.
- **Authentication and authorization.** Every endpoint is open by design.
- **Multi-provider LLM abstraction.** OpenAI only, via
  [clients/openai.ts](backend/libs/llm/src/clients/openai.ts). Do not introduce a
  provider-abstraction layer without being asked.
- **Non-geography topics as a hard requirement.** Topic is parameterized, but
  prompts and the judge's `topic_mismatch` check are geography-oriented today.
- **Deployment and hosting.** Local Docker Compose only. No CI/CD, no cloud infra.
- **Automated test suite.** None exists. Do not scaffold one unprompted; verify by
  running the CLI or hitting the API.
- **Message queues.** `KAFKA_BROKERS` and `PUBSUB_EMULATOR_HOST` appear in
  [docker-compose.yml](docker-compose.yml) but no broker service or consumer code
  exists. Treat them as vestigial, not as an integration point.

## Languages

| Language        | Where                        | Notes                                             |
| --------------- | ---------------------------- | ------------------------------------------------- |
| TypeScript      | `backend/`, `frontend/src/`  | ESM, strict. `tsx` for dev, `tsc` for build.       |
| Vue 3 SFC       | `frontend/src/components/`   | `<script setup>` + Composition API.               |
| Prisma schema   | `backend/libs/db/prisma/`    | `snake_case` DB columns via `@map`.               |
| SQL             | ad hoc                       | Postgres 16. Prisma-generated; raw SQL is rare.   |
| CSS             | `frontend/src/style.css`     | Hand-written. No Tailwind, no CSS framework.      |

Conventions worth preserving:

- Zod schemas define every LLM boundary. Never parse model output by hand.
- LLM-facing field names are `snake_case` (matching prompts); TypeScript and
  Prisma client fields are `camelCase`. The mapping is intentional — keep it.
- Paths use the `backend/apps/*` (deployables) and `backend/libs/*` (shared)
  split. Put reusable logic in `libs`.

## Reference Projects

None — this is greenfield with no upstream port or template.

In-repo documentation, which should be updated alongside behavior changes:

- [README.md](README.md) — currently a stub.
- [COMMANDS.md](COMMANDS.md) — command reference.
- [QUIZ-GENERATOR-EXAMPLES.md](QUIZ-GENERATOR-EXAMPLES.md) — CLI usage examples.
- [PRISMA.md](PRISMA.md) — schema and migration workflow.

## Working Notes

- **Env:** secrets live in `.env.local` (`OPENAI_API_KEY`). `.env` holds
  non-secret defaults. Never commit either.
- **DB access:** `npm run db:shell`, or
  `docker exec quiz-postgres psql -U quiz_user -d quiz_db`.
- **After schema edits:** `npm run db:migrate` then `npm run db:generate`.
- **Before finishing:** `npm run type-check` and `npm run lint`.
- **Inside Compose** the DB host is `postgres`; **from the host machine** it is
  `localhost`. Mixing these up is the most common local failure.
