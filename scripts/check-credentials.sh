#!/usr/bin/env bash
# scripts/check-credentials.sh — GOAL AC-010 憑證掃描
# 用法：bash scripts/check-credentials.sh
# 掃描 git 追蹤的檔案（不含 lockfile），找出疑似真實憑證的字串。
# `sk-xxxx`、`sk-test-xxxx` 這類佔位字串，以及規格／掃描設定中寫出的「樣式」本身不算。
set -uo pipefail

PATTERN='sk-[A-Za-z0-9_-]{20,}|sk_live|pk_live'

HITS=$(git grep -nE "$PATTERN" -- . \
  ':!*lock*' \
  ':!GOAL.md' ':!SOP.md' ':!STATUS.md' \
  ':!scripts/check-credentials.sh' \
  ':!tests/unit/repo-hygiene.test.ts' \
  ':!.github/workflows/ci.yml' \
  | grep -vE 'sk-(x+|test-[x-]+)([^A-Za-z0-9_-]|$)' || true)

if [ -n "$HITS" ]; then
  echo "❌ 疑似憑證："
  echo "$HITS" | cut -c1-160
  exit 1
fi
echo "✅ 未發現真實憑證樣式（佔位字串除外）"
