#!/usr/bin/env bash
# scripts/verify-mvp.sh — v3.0 SPEC §18.2 自動驗證契約
# 用法：bash scripts/verify-mvp.sh [host]
# 預設 host = https://ai-interview-assistant.vercel.app
set -uo pipefail

HOST="${1:-https://ai-interview-assistant.vercel.app}"
PASS=0
FAIL=0
WARN=()

ok() { echo "  ✅ $1"; PASS=$((PASS+1)); }
no() { echo "  ❌ $1"; FAIL=$((FAIL+1)); }
wn() { echo "  ⚠️  $1"; WARN+=("$1"); }

echo "============================================================"
echo "  v3.0 MVP Verification — $HOST"
echo "  $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "============================================================"

echo ""
echo "[1/4] Production HTTP 200"
CODE=$(curl -sI -o /dev/null -w "%{http_code}" --max-time 15 "$HOST/" || echo "000")
if [ "$CODE" = "200" ]; then
  ok "GET / → HTTP 200"
else
  no "GET / → HTTP $CODE"
fi

echo ""
echo "[2/4] v3.0 banner present in HTML"
HTML=$(curl -sS --max-time 15 "$HOST/" || echo "")
if echo "$HTML" | grep -q "v3.0"; then
  ok "HTML contains 'v3.0'"
else
  no "HTML missing 'v3.0' banner"
fi
if echo "$HTML" | grep -q "Mock"; then
  ok "HTML references Mock mode"
else
  no "HTML missing Mock reference"
fi

echo ""
echo "[3/4] Mock default — /api/interview/start works without API key"
RESP=$(curl -sSL --max-time 30 -X POST -H "Content-Type: application/json" \
  -d '{"jobType":"software-engineer","jobLevel":"mid"}' \
  "$HOST/api/interview/start" 2>/dev/null || echo '{"error":"curl_failed"}')
if echo "$RESP" | grep -q '"success":true'; then
  ok "/api/interview/start returned success:true"
else
  no "/api/interview/start failed: $(echo "$RESP" | head -c 200)"
fi
if echo "$RESP" | grep -q '"mode":"mock"'; then
  ok "response includes mode:'mock' (AC-011)"
else
  no "response missing mode:'mock' (AC-011): $(echo "$RESP" | head -c 300)"
fi
if echo "$RESP" | grep -q '"firstQuestion"'; then
  ok "response includes firstQuestion"
else
  no "response missing firstQuestion"
fi

echo ""
echo "[4/4] /api/interview/answer works without API key (Mock mode)"
RESP=$(curl -sSL --max-time 30 -X POST -H "Content-Type: application/json" \
  -d '{"sessionId":"smoke","questionId":"q1","questionText":"STAR question","answerText":"我曾經在期限內完成一個專案","jobType":"software-engineer","jobLevel":"mid"}' \
  "$HOST/api/interview/answer" 2>/dev/null || echo '{"error":"curl_failed"}')
if echo "$RESP" | grep -q '"score"'; then
  ok "/api/interview/answer returned score"
else
  no "/api/interview/answer failed: $(echo "$RESP" | head -c 200)"
fi
if echo "$RESP" | grep -q '"mode":"mock"'; then
  ok "answer response includes mode:'mock'"
else
  no "answer response missing mode:'mock'"
fi

echo ""
echo "============================================================"
echo "  Result: $PASS passed / $FAIL failed"
echo "============================================================"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "❌ v3.0 MVP verification FAILED"
  exit 1
fi
echo ""
echo "✅ v3.0 MVP verification PASSED"
