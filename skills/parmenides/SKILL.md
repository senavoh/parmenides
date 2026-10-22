---
name: parmenides
description: Find drift between environments (dev, staging, production) or between branches, and rank every difference by risk. Compares env var keys, dependency and runtime versions, container images, configs, infrastructure files and feature flags, without ever printing secret values. Use when someone asks "is staging the same as prod?", "why does it work in staging but not prod?", "find config drift", "compare my environments", "what's different between dev and prod", or before a release.
---

# Parmenides

Parmenides held that what truly is, is one and unchanging, and that change is an illusion of mortal opinion. Your environments are supposed to be one thing too. This skill finds where they are not.

The voice frames the report. The report itself is plain, precise and scannable, because people act on it.

**Read only. Never change files, run deploys, run the app, or touch any real environment.** Never print a secret value (see Secrets below).

## 1. Find the environments

Work in the current repo unless the user names another (then shallow-clone it into a temp folder, as `dir="$(mktemp -d)/repo" && git clone --depth 1 --quiet <url> "$dir" && echo "$dir"`, and delete it when done).

Environments usually show up as one of these. Check them all:

- **Per-environment files:** `.env.development` / `.env.staging` / `.env.production`, `.env.example`, `config/{env}.yml|json|ts`, `settings/{env}.py`, `appsettings.{Env}.json`.
- **Containers:** `docker-compose.{env}.yml`, `Dockerfile.{env}`, image tags and `FROM` lines.
- **Kubernetes and Helm:** kustomize `overlays/{env}`, `values-{env}.yaml`.
- **Infrastructure:** Terraform `envs/{env}`, `{env}.tfvars`, workspaces; Pulumi stack files; serverless stages.
- **Deploy pipelines:** CI workflows or jobs per environment (`deploy-staging.yml`, `environment:` keys).
- **Branches:** if environments live on branches (`main` = prod, `staging`, `develop`), compare those branches with `git diff <a> <b> -- <config paths>`. Fetch them first if needed.

If you find only one environment, say so and ask what to compare (two branches, two folders, or a lockfile across services). Don't invent a comparison.

If the repo has a `.parmenides.yml`, read it first. It lists differences that are intended. It only covers differing *values*: a key that is missing, and secret handling, are always checked, even when the key matches an expected pattern.

```yaml
expected:
  - LOG_LEVEL          # an env key whose value may differ
  - replicas           # a config key
  - "*_URL"            # a pattern
```

## 2. Compare what matters

For each environment pair, build a table of differences across:

1. **Env var keys:** present in one environment, missing in another. A key missing in production that exists in staging is the classic outage.
2. **Runtime versions:** language runtime (`.nvmrc`, `.python-version`, `.tool-versions`, `engines`, Dockerfile `FROM`), base images, OS packages.
3. **Dependencies:** lockfile or pinned versions that differ between environments, services or branches.
4. **Container images and tags:** databases, caches and queues (`postgres:15` vs `postgres:16`), and anything pinned to `latest`.
5. **Config values that change behavior:** feature flags, timeouts, retries, pool sizes, CORS, cookie and TLS settings, auth providers, rate limits.
6. **Infrastructure:** instance sizes, regions, backups, encryption, public access, autoscaling.
7. **Pipeline:** steps run before one deploy and skipped before another (migrations, tests, security scans).

## 3. Secrets

Env files often hold real secrets. Compare **keys**, not values.

- Never print a value of anything that looks like a secret: names containing `KEY`, `SECRET`, `TOKEN`, `PASSWORD`, `PASS`, `PRIVATE`, `CREDENTIAL`, `DSN`, `DATABASE_URL`, or values that look like keys or connection strings.
- To say whether two secret values differ, compare them silently and report only `same` / `differs` / `missing`. If you need to show shape, use a description like `postgres://… (host differs)` with no credentials.
- If you find a real secret committed to the repo, flag it as High risk in the report, without the value. Obvious placeholders (`placeholder`, `changeme`, `xxx`, test keys) are Low: the risk is the habit of committing env files, not a leak.

## 4. Rank by risk

- **High:** likely to break or endanger production. A key missing in prod, a major runtime or database version mismatch, a security setting weaker in prod, migrations skipped in one pipeline, or a committed secret.
- **Medium:** behaves differently and will surprise someone. Minor version drift, feature flags out of sync, different timeouts or pool sizes, images on `latest`.
- **Low:** cosmetic or probably harmless.
- **Expected:** intended differences such as URLs, hostnames, replica counts, log levels, and anything listed in `.parmenides.yml`. List these separately, briefly. Don't count them as drift.

Before calling something High, re-open the files to confirm it. Every row names the file and, where possible, the line.

Problems that are not drift but affect every environment the same way (a pipeline that runs `npm ci` with no lockfile, a dependency on `latest` everywhere) go in a short **Wrong everywhere** list after the table. They are real, but they are not drift.

## 5. Output

Reply in Markdown, in exactly this shape:

```markdown
# On the Nature of <repo name>
*<one line in character: the goddess, the two roads, Being being one>*

**Compared:** <environments or branches, and the files read>
**Verdict:** <one plain sentence: how many High / Medium / Low drifts, and the one that matters most>

## The Way of Truth
<one short paragraph: what is identical across environments, so the user knows what was checked and is fine>

## The Way of Opinion
| Risk | What drifted | Where | dev | staging | prod | Fix |
|---|---|---|---|---|---|---|
| High | ... | `path:line` | ... | ... | ... | ... |

(Use one column per environment you compared. If the user asked about two environments, compare those two, but mention a third in the cell when it matters, e.g. "present (dev too)". Secrets show as same / differs / missing.)

**Wrong everywhere:** <short list, only if any>

## Expected differences
<a short list, or "None found">

## Make them one
1. <the most important fix, concrete: the file and exactly what to change>
2. ...
3. ...

> <one closing line in character>
```

Keep the in-character lines to the title, the subtitle and the closing line. Everything else is plain English.

After the report, offer once to save it as `PARMENIDES.md`, and to draft a `.parmenides.yml` that lists the expected differences you found. Don't write either unless the user says yes.
