#!/usr/bin/env sh
# Parmenides installer: copies the skill into every agent skills folder it finds.
# Usage: curl -fsSL https://raw.githubusercontent.com/senavoh/parmenides/main/install.sh | sh
#    or: curl -fsSL https://raw.githubusercontent.com/senavoh/parmenides/main/install.sh | sh -s -- ~/.claude/skills ~/.codex/skills
#    or: ./install.sh [target-dir ...]
set -eu

REPO="https://github.com/senavoh/parmenides"
SRC=""
TMP=""

cleanup() { if [ -n "$TMP" ]; then rm -rf "$TMP"; fi; }
trap cleanup EXIT

# Use local files only when this script is run from a checkout (./install.sh).
# When piped (curl ... | sh), $0 is the shell, so always download from GitHub.
if [ -f "$0" ] && [ "$(basename "$0")" = "install.sh" ] && [ -d "$(dirname "$0")/skills/parmenides" ]; then
  SRC="$(cd "$(dirname "$0")" && pwd)/skills"
else
  command -v git >/dev/null 2>&1 || { echo "parmenides: git is required"; exit 1; }
  TMP="$(mktemp -d)"
  git clone --depth 1 --quiet "$REPO" "$TMP/parmenides"
  SRC="$TMP/parmenides/skills"
fi

# Targets stay in "$@" so paths with spaces survive.
if [ "$#" -eq 0 ]; then
  # Personal skills folders for agents that read SKILL.md files.
  for d in "$HOME/.claude" "$HOME/.codex" "$HOME/.gemini" "$HOME/.cursor" "$HOME/.config/opencode" "$HOME/.agents"; do
    if [ -d "$d" ]; then set -- "$@" "$d/skills"; fi
  done
  if [ "$#" -eq 0 ]; then set -- "$HOME/.agents/skills"; fi
fi

for t in "$@"; do
  mkdir -p "$t"
  for s in "$SRC"/*/; do
    name="$(basename "$s")"
    rm -rf "${t:?}/$name"
    cp -R "$s" "$t/$name"
  done
  echo "parmenides: installed into $t"
done

echo "parmenides: done. Open a project and ask your agent: \"is staging the same as prod?\""
