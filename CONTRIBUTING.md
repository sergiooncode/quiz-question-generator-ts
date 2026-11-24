# Contributing

## Running the tests

```bash
npm ci
npm run db:generate   # generate the Prisma client
npm run type-check
npm test              # unit tests; no database or API key needed
npm run test:mutation # optional locally; runs in CI on pull requests
```

## Pull requests

- Keep PRs small and focused on one change.
- Add or update tests for behaviour you change.
- CI must pass: type-check and tests on every push, plus mutation testing on pull requests.
- Never commit `.env`, `.env.local` or API keys.
