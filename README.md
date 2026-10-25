<p align="center">
  <img src="assets/parmenides-600.png" alt="Parmenides as a Greek floor mosaic, eyes closed, unbothered" width="260">
</p>

<h1 align="center">Parmenides</h1>

<p align="center"><b>What is, is one.</b><br>
An agent skill that finds drift between dev, staging and production, ranks every difference by risk, and tells you how to make them one again. It never prints a secret.</p>

<p align="center">
  <a href="https://parmenides.dev">parmenides.dev</a> ·
  <a href="examples/demo-shop-report.md">Example report</a> ·
  <a href="#install">Install</a> ·
  <a href="#what-it-checks">What it checks</a>
</p>

```bash
npx skills add senavoh/parmenides
```

Then open a project and ask your agent:

> Is staging the same as prod?

Works with **Claude Code, Codex, Cursor, Gemini CLI, OpenCode**, and any agent that reads `SKILL.md` files. No API key, no account, nothing to host.

---

## Why

"It works in staging" is the most expensive sentence in software. Production is missing an env var, runs an older Node, talks to a different Postgres major, or skips the migration step, and nobody notices until it breaks.

Parmenides, the Greek philosopher, held that what truly is, is one and unchanging, and that change is an illusion of mortal opinion. Your environments are supposed to be one thing too. This skill finds where they are not.

## Example

A blind run on [demo-shop](examples/demo-shop/), a fixture with eight drifts planted on purpose. It found all eight (the HTTP timeout and retries get a row each, so the table has nine), plus two problems shared by every environment:

> **Verdict:** No, staging is not the same as prod. There are 5 High, 4 Medium and 0 Low drifts. The most urgent: `STRIPE_WEBHOOK_SECRET` is missing in production, so Stripe webhooks cannot be verified there.
>
> | Risk | What drifted | Where | staging | prod |
> |---|---|---|---|---|
> | High | `STRIPE_WEBHOOK_SECRET` env key | `.env.production` | present | missing |
> | High | Node runtime major version | `Dockerfile.production:1` | `node:20-alpine` | `node:18-alpine` |
> | High | Postgres major version | `docker-compose.production.yml:7` | `postgres:16.4` | `postgres:15.8` |
> | High | Migrations and tests skipped before prod deploy | `deploy-production.yml` | run | neither runs |
> | High | CORS weaker in prod | `config/production.json:4` | one origin | `*` |
> | Medium | Redis image tag | `docker-compose.production.yml:9` | `redis:7.4` | `redis:latest` |

[Read the full, unedited report](examples/demo-shop-report.md), including what matched, the expected differences, what's wrong everywhere, and the fixes.

## What it checks

- **Env var keys** present in one environment and missing in another
- **Runtime versions:** `.nvmrc`, `.python-version`, `.tool-versions`, `engines`, Dockerfile `FROM`
- **Dependencies** that differ between environments, services or branches
- **Container images:** database, cache and queue versions, and anything on `latest`
- **Config that changes behavior:** feature flags, timeouts, retries, pool sizes, CORS, cookie and TLS settings
- **Infrastructure:** Terraform, Kubernetes overlays, Helm values, Pulumi stacks
- **Pipelines:** steps that run before one deploy and are skipped before another

It finds environments in per-environment files (`.env.production`, `config/staging.yml`, `docker-compose.prod.yml`, `values-prod.yaml`, `prod.tfvars`) or in branches (`staging` vs `main`).

**Secrets stay secret.** It compares keys, not values, and reports secret values only as `same`, `differs` or `missing`.

**Intended differences** (URLs, replica counts, log levels) go in a `.parmenides.yml`, so they stop showing up as drift:

```yaml
expected:
  - LOG_LEVEL
  - "*_URL"
  - replicas
```

It's read only. It never changes files, runs deploys or touches a real environment.

## Install

**Any agent (recommended)**

```bash
npx skills add senavoh/parmenides
```

The `skills` installer needs Node.js 22 or newer. On older versions, use the install script.

**Claude Code plugin**

```text
/plugin marketplace add senavoh/parmenides
/plugin install parmenides@parmenides
```

**Install script.** Copies the skill into every agent skills folder it finds:

```bash
curl -fsSL https://raw.githubusercontent.com/senavoh/parmenides/main/install.sh | sh
```

**Manual.** Copy `skills/parmenides` into your agent's skills folder.

## Roadmap

- [x] Drift skill for any agent
- [ ] GitHub Action that fails a PR when environments drift
- [ ] Drift between live environments (read-only cloud APIs), not just the repo

## License

[MIT](LICENSE)
