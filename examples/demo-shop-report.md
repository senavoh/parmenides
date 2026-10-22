# Parmenides on demo-shop

This is the output of "is staging the same as prod?" run on [demo-shop](demo-shop/), a test fixture with drift planted on purpose. The run was blind: the agent had only the skill, not the list of planted drifts. It found all eight, ranked them correctly, and kept the expected differences out of the drift count. The only edit is one typo in a table cell (`retries 3`).

---

# On the Nature of demo-shop
*The goddess showed two roads, staging and production. They should be one Being, but here they have split into many.*

**Compared:** staging vs production (dev read only for env keys). Files read: `.env.staging`, `.env.production`, `.env.development`, `Dockerfile`, `Dockerfile.production`, `docker-compose.staging.yml`, `docker-compose.production.yml`, `config/staging.json`, `config/production.json`, `.github/workflows/deploy-staging.yml`, `.github/workflows/deploy-production.yml`, `.nvmrc`, `package.json`, `.parmenides.yml`
**Verdict:** No, staging is not the same as prod. There are 5 High, 3 Medium and 1 Low drifts. The one that matters most is that production is missing `STRIPE_WEBHOOK_SECRET`, so Stripe webhook verification in prod will fail.

## The Way of Truth
Both environments run with `NODE_ENV=production` and both define `DATABASE_URL`, `REDIS_URL`, `STRIPE_SECRET_KEY` and `SESSION_SECRET` (the values differ per environment, as they should). They share one `package.json`, so the direct dependencies are identical: express 4.21.2, pg 8.13.1 and stripe 17.4.0. The `guestCheckout` flag, the session cookie settings (`cookieSecure: true`, `maxAgeHours: 24`) and the DB pool size (10) also match. Both pipelines run `npm ci` before deploying.

## The Way of Opinion
| Risk | What drifted | Where | staging | prod | Fix |
|---|---|---|---|---|---|
| High | `STRIPE_WEBHOOK_SECRET` missing in prod (dev has it too) | `.env.production` (absent); `.env.staging:7` | present | missing | Add `STRIPE_WEBHOOK_SECRET` to the production environment |
| High | Node runtime major version | `Dockerfile.production:1` vs `Dockerfile:1` | `node:20-alpine` | `node:18-alpine` | Change prod to `FROM node:20-alpine`. Prod currently violates `engines.node >=20` (`package.json:4`) and `.nvmrc` (20) |
| High | Postgres major version | `docker-compose.production.yml:7` vs `docker-compose.staging.yml:7` | `postgres:16.4` | `postgres:15.8` | Use one major on both. Staging is testing against a database that prod does not run |
| High | Prod deploy skips tests and migrations | `.github/workflows/deploy-production.yml:7-10` vs `deploy-staging.yml:10-11` | `npm test`, `npm run migrate` | skipped | Add `npm test` and `npm run migrate` before `deploy.sh production` |
| High | CORS weaker in prod | `config/production.json:4` vs `config/staging.json:4` | `["https://staging.shop.example.test"]` | `["*"]` | Set prod origins to `["https://shop.example.test"]` |
| Medium | Redis image pinned to `latest` in prod | `docker-compose.production.yml:9` vs `docker-compose.staging.yml:9` | `redis:7.4` | `redis:latest` | Pin prod to `redis:7.4` |
| Medium | Feature flag `newCheckout` out of sync | `config/*.json:2` | `true` | `false` | Decide deliberately: either staging stops testing the new checkout, or prod enables it on release. If the split is intended, list it in `.parmenides.yml` |
| Medium | HTTP timeout and retries | `config/*.json:3` | `timeoutMs 10000`, `retries 3` | `timeoutMs 3000`, `retries 0` | Align the values. Staging's generous retry and timeout settings will hide failures that prod will hit |
| Low | Env files with secret keys are committed (values are placeholders, per README) | `.env.staging`, `.env.production`, `.env.development` | committed | committed | Keep real values out of the repo. Commit only `.env.example` and load real values from the deploy environment |

Secret values: `STRIPE_SECRET_KEY` differs, `SESSION_SECRET` differs, `STRIPE_WEBHOOK_SECRET` is missing in prod, and `DATABASE_URL` differs (host differs).

## Expected differences
- `LOG_LEVEL`: `info` in staging, `warn` in prod (`.parmenides.yml`)
- `APP_URL`, `DATABASE_URL`, `REDIS_URL`: hosts differ per environment (matches `*_URL`)
- `EMAIL_FROM`: listed as expected, but staging and prod actually have the same value
- `replicas`: 1 in staging, 3 in prod (`docker-compose.*.yml:5`)

## Make them one
1. `.env.production` (or the prod secret store): add `STRIPE_WEBHOOK_SECRET`.
2. `Dockerfile.production:1`: change `FROM node:18-alpine` to `FROM node:20-alpine`, or delete the file and point `docker-compose.production.yml:3` at the shared `Dockerfile`.
3. `.github/workflows/deploy-production.yml`: insert `- run: npm test` and `- run: npm run migrate` between `npm ci` and the deploy step.
4. `config/production.json:4`: replace `["*"]` with `["https://shop.example.test"]`.
5. `docker-compose.production.yml:7` and `:9`: align Postgres with staging (plan the 15 to 16 upgrade, or move staging back to 15.x), and pin Redis to `redis:7.4`.
6. `config/production.json:2-3`: settle `newCheckout`, `timeoutMs` and `retries` with staging, or record the intended differences in `.parmenides.yml`.

> What is, is one. Make production what staging already believes it to be.
