# Parmenides on demo-shop

This is the output of "is staging the same as prod?" run on [demo-shop](demo-shop/), a test fixture with eight drifts planted on purpose. The run was blind: the agent had only the skill and the fixture, not the list of planted drifts or any earlier report. The report below is unedited.

It found all eight planted drifts. It splits the HTTP timeout and retries into two rows, so the table has nine. It also flagged two problems shared by every environment, under "Wrong everywhere". One of them, Dockerfiles that ignore the lockfile, was a real mistake in the fixture.

---

# On the Nature of demo-shop
*The goddess showed two roads, staging and prod. Mortals believe they are one. They are not.*

**Compared:** staging vs production, with dev noted where it matters. Files read: `.parmenides.yml`, `.env.development`, `.env.staging`, `.env.production`, `.nvmrc`, `package.json`, `package-lock.json`, `Dockerfile`, `Dockerfile.production`, `docker-compose.staging.yml`, `docker-compose.production.yml`, `config/staging.json`, `config/production.json`, `.github/workflows/deploy-staging.yml`, `.github/workflows/deploy-production.yml`, `scripts/deploy.sh`, `scripts/migrate.js`, `server.js`, `README.md`.
**Verdict:** No, staging is not the same as prod. There are 5 High, 4 Medium and 0 Low drifts. The most urgent: `STRIPE_WEBHOOK_SECRET` is missing in production, so Stripe webhooks cannot be verified there.

## The Way of Truth
Both environments use the same dependencies: exact pins in `package.json` (express 4.21.2, pg 8.13.1, stripe 17.4.0), matched by the single shared `package-lock.json`. Apart from `STRIPE_WEBHOOK_SECRET`, they have the same env var keys. `NODE_ENV=production` is set in both. Some config values match: `guestCheckout: true`, `session.cookieSecure: true`, `session.maxAgeHours: 24` and `db.poolSize: 10`. Both images are built the same way apart from the base image (same `WORKDIR`, install step and `CMD`). Both pipelines check out with `actions/checkout@v4`, run `npm ci` and deploy through the same `scripts/deploy.sh`.

## The Way of Opinion
| Risk | What drifted | Where | staging | prod | Fix |
|---|---|---|---|---|---|
| High | `STRIPE_WEBHOOK_SECRET` env key | `.env.staging:7`, `.env.production` (absent) | present (dev too) | missing | Add `STRIPE_WEBHOOK_SECRET` to the production environment, set to prod's own webhook signing secret |
| High | Node runtime major version | `Dockerfile:1`, `Dockerfile.production:1` | `node:20-alpine` (`.nvmrc` = 20, `engines` >=20) | `node:18-alpine` | Change `Dockerfile.production:1` to `FROM node:20-alpine`, or use one Dockerfile for both |
| High | Postgres major version | `docker-compose.staging.yml:7`, `docker-compose.production.yml:7` | `postgres:16.4` | `postgres:15.8` | Pick one major and pin it in both. Testing against 15 in staging is safer than upgrading prod without a planned migration |
| High | Migrations and tests skipped before prod deploy | `.github/workflows/deploy-staging.yml:10-11`, `.github/workflows/deploy-production.yml:9-10` | `npm test` and `npm run migrate` run | neither runs | Add `- run: npm test` and `- run: npm run migrate` before the deploy step in `deploy-production.yml` |
| High | CORS weaker in prod | `config/staging.json:4`, `config/production.json:4` | `["https://staging.shop.example.test"]` | `["*"]` | Set prod `cors.origins` to `["https://shop.example.test"]` |
| Medium | Redis image tag | `docker-compose.staging.yml:9`, `docker-compose.production.yml:9` | `redis:7.4` | `redis:latest` | Pin prod to `redis:7.4` |
| Medium | Feature flag `newCheckout` | `config/staging.json:2`, `config/production.json:2` | `true` | `false` | If this is intended, add it to `.parmenides.yml`. If not, turn it on or off in both |
| Medium | HTTP timeout | `config/staging.json:3`, `config/production.json:3` | `timeoutMs: 10000` | `timeoutMs: 3000` | Use one timeout in both, so staging tests the behavior prod will have |
| Medium | HTTP retries | `config/staging.json:3`, `config/production.json:3` | `retries: 3` | `retries: 0` | Use one retry count in both. Prod's 0 retries combined with its shorter timeout means more hard failures |

Secrets (values not shown): `STRIPE_SECRET_KEY` differs, `SESSION_SECRET` differs, `STRIPE_WEBHOOK_SECRET` is present in staging and missing in prod. `DATABASE_URL` is `postgres://… (host differs)`.

**Wrong everywhere:**
- Both Dockerfiles (`Dockerfile:3-4`, `Dockerfile.production:3-4`) copy only `package.json` and run `npm install`, which ignores `package-lock.json`. Transitive dependencies can therefore resolve differently in each image build. Copy the lockfile and run `npm ci --omit=dev` instead.
- Env files are committed to the repo, all three of them. Every secret in them is an obvious placeholder (Low: no leak, but a risky habit). Move them to `.env.*.example` and gitignore the real files.

## Expected differences
- `LOG_LEVEL`: `info` (staging) vs `warn` (prod), listed in `.parmenides.yml`
- `APP_URL`, `DATABASE_URL`, `REDIS_URL`: hosts differ per environment (matches `*_URL`)
- `deploy.replicas`: 1 (staging) vs 3 (prod), listed in `.parmenides.yml`
- `EMAIL_FROM`: listed in `.parmenides.yml`. It is the same in staging and prod and differs only in dev.
- `STRIPE_SECRET_KEY` and `SESSION_SECRET` values differ per environment, which is normal for secrets.

## Make them one
1. Add `STRIPE_WEBHOOK_SECRET` to the production environment (`.env.production`, or better, prod's secret store) with prod's webhook signing secret.
2. In `.github/workflows/deploy-production.yml`, insert `- run: npm test` and `- run: npm run migrate` after `npm ci` (line 9) and before `./scripts/deploy.sh production`.
3. Change `Dockerfile.production:1` to `FROM node:20-alpine`, or delete `Dockerfile.production` and point `docker-compose.production.yml:3` at `Dockerfile`.
4. Align Postgres on one major version in `docker-compose.staging.yml:7` and `docker-compose.production.yml:7`, and pin `redis:7.4` in `docker-compose.production.yml:9`.
5. In `config/production.json:4`, replace `"*"` with `"https://shop.example.test"`. Then make `http.timeoutMs`, `http.retries` and `features.newCheckout` match staging, or list them in `.parmenides.yml` if the difference is intended.

> What is, is one. Until production agrees, it remains mere opinion.
