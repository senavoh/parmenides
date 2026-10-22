#!/bin/sh
# Repo checks: the installer, the plugin manifests, the skill file,
# and the committed demo-shop report against the drifts planted in it.
set -eu
cd "$(dirname "$0")/.."
fail=0
ok()  { echo "ok    $1"; }
bad() { echo "FAIL  $1"; fail=1; }

# installer
sh -n install.sh && ok "install.sh parses" || bad "install.sh does not parse"
if command -v shellcheck >/dev/null 2>&1; then
  shellcheck install.sh && ok "shellcheck install.sh" || bad "shellcheck install.sh"
else
  echo "skip  shellcheck (not installed)"
fi

# plugin manifests
for f in .claude-plugin/plugin.json .claude-plugin/marketplace.json; do
  python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$f" && ok "$f is valid JSON" || bad "$f is not valid JSON"
done

# skill frontmatter
skill=skills/parmenides/SKILL.md
head -1 "$skill" | grep -q '^---$' && grep -q '^name: parmenides$' "$skill" && grep -q '^description: ' "$skill" \
  && ok "$skill has name and description" || bad "$skill frontmatter is missing name or description"

# the example report finds every planted drift
report=examples/demo-shop-report.md
grep -v '^#' tests/demo-shop.expected | grep -v '^$' | while IFS= read -r pattern; do
  grep -Eq -- "$pattern" "$report" || { echo "FAIL  report is missing planted drift: $pattern"; exit 1; }
done && ok "report covers every planted drift" || fail=1

# and never leaks a secret value from the fixture
if grep -q 'placeholder-' "$report"; then bad "report prints a secret value from the fixture"; else ok "report prints no secret values"; fi

exit $fail
