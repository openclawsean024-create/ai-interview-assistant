#!/usr/bin/env bash
# scripts/check-credentials.sh — GOAL AC-010 憑證掃描
# 用法：
#   bash scripts/check-credentials.sh            掃描目前 git 追蹤的檔案（CI 預設）
#   bash scripts/check-credentials.sh --history  另外掃描所有 commit 的歷史版本
#
# 規則：
#   - 逐一檢查「每個命中的字串」，不是整行過濾：同一行有佔位字串（sk-xxxx、sk-test-xxxx）
#     也不會讓同一行的真實 key 被略過。
#   - 只排除 lockfile（套件完整性雜湊不是憑證）。
#   - 命中時只印出「檔案:行號」與遮罩後的前綴，不把 key 本身印進 log。
set -uo pipefail

PATTERN='sk-[A-Za-z0-9_-]{20,}|(sk|pk|rk)_live_[A-Za-z0-9]{10,}'
PLACEHOLDER='^sk-(x+|test-[x-]+)$'

mask() {
  # 讀「位置:token」，輸出「位置:前 6 碼…（長度 N）」；佔位字串略過。
  awk -v ph="$PLACEHOLDER" '{
    n = split($0, parts, ":"); token = parts[n];
    loc = substr($0, 1, length($0) - length(token) - 1);
    if (token ~ ph) next;
    printf "%s: %s…（長度 %d）\n", loc, substr(token, 1, 6), length(token);
  }'
}

HITS=$(git grep -noE "$PATTERN" -- . ':!*lock*' 2>/dev/null | mask)

if [ "${1:-}" = "--history" ]; then
  # 每個 commit 都掃一次（輸出以 commit 開頭）；同一位置在多個 commit 出現時只列一次。
  HIST=$(git rev-list --all | while read -r rev; do
    git grep -noE "$PATTERN" "$rev" -- . ':!*lock*' 2>/dev/null
  done | mask | sed -E 's/^[0-9a-f]{40}://' | sort -u)
  if [ -n "$HIST" ]; then
    HITS=$(printf '%s\n%s' "$HITS" "$HIST" | sed '/^$/d' | sort -u)
  fi
fi

if [ -n "$HITS" ]; then
  echo "❌ 疑似憑證（只顯示位置與遮罩後的前綴）："
  echo "$HITS"
  exit 1
fi
echo "✅ 未發現真實憑證樣式（佔位字串除外）"
