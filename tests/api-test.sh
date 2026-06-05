#!/bin/bash
# API-level tests for FarmaWatch
# Tests the backend flows directly via Supabase REST API
# Requires .env.local with valid Supabase keys

set -e
cd "$(dirname "$0")/.."
source .env.local

SVC="apikey: $SUPABASE_SERVICE_ROLE_KEY"
AUTH="Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
CT="Content-Type: application/json"
BASE="$NEXT_PUBLIC_SUPABASE_URL/rest/v1"
PASS=0
FAIL=0

check() {
    local desc="$1" expected="$2" actual="$3"
    if echo "$actual" | grep -q "$expected"; then
        echo "  PASS: $desc"
        PASS=$((PASS+1))
    else
        echo "  FAIL: $desc (expected '$expected')"
        echo "    got: $(echo "$actual" | head -c 200)"
        FAIL=$((FAIL+1))
    fi
}

echo "=== 1. Categories ==="
CATS=$(curl -s "$BASE/ticket_categories" -H "$SVC" -H "$AUTH")
check "Categories exist" "Penyalahgunaan" "$CATS"

echo ""
echo "=== 2. Anonymous ticket ==="
ANON=$(curl -s -X POST "$BASE/tickets" -H "$SVC" -H "$AUTH" -H "$CT" \
  -H "Prefer: return=representation" \
  -d '{"is_anonymous":true,"category_id":"435d4b4b-1390-4d22-9c8c-5fe06d5c458b","province":"Jawa Barat","city":"Kota Bandung","description":"API test - obat keras tanpa resep","status":"submitted"}')
check "Anonymous ticket created" "submitted" "$ANON"
ANON_ID=$(echo "$ANON" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null)

echo ""
echo "=== 3. Reject ticket ==="
REJ=$(curl -s -X PATCH "$BASE/tickets?id=eq.$ANON_ID" -H "$SVC" -H "$AUTH" -H "$CT" \
  -H "Prefer: return=representation" \
  -d '{"status":"rejected","rejection_reason_id":"658f434a-5e88-42c6-838d-ba3c0f0eb64f"}')
check "Ticket rejected" "rejected" "$REJ"

echo ""
echo "=== 4. Authenticated ticket ==="
# Create profile + submit as user
PROF=$(curl -s -X POST "$BASE/profiles" -H "$SVC" -H "$AUTH" -H "$CT" \
  -H "Prefer: return=representation" \
  -d '{"id":"00000000-0000-0000-0000-000000000001","email":"apitest@farmawatch.id","role":"user","status":"approved"}')
AUTH_TICKET=$(curl -s -X POST "$BASE/tickets" -H "$SVC" -H "$AUTH" -H "$CT" \
  -H "Prefer: return=representation" \
  -d '{"submitted_by":"00000000-0000-0000-0000-000000000001","category_id":"b125c256-436e-48e4-b619-ec075defaf51","province":"Bali","city":"Denpasar","description":"API test auth user ticket","status":"submitted"}')
check "Auth ticket created" "submitted" "$AUTH_TICKET"
AUTH_ID=$(echo "$AUTH_TICKET" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null)

echo ""
echo "=== 5. Full lifecycle: accept -> review -> resolve ==="
ACCEPT=$(curl -s -X PATCH "$BASE/tickets?id=eq.$AUTH_ID" -H "$SVC" -H "$AUTH" -H "$CT" \
  -H "Prefer: return=representation" \
  -d '{"status":"accepted","accepted_by":"00000000-0000-0000-0000-000000000001","accepted_at":"2026-06-05T10:00:00Z"}')
check "Ticket accepted" "accepted" "$ACCEPT"

REVIEW=$(curl -s -X PATCH "$BASE/tickets?id=eq.$AUTH_ID" -H "$SVC" -H "$AUTH" -H "$CT" \
  -H "Prefer: return=representation" \
  -d '{"status":"under_review"}')
check "Ticket under review" "under_review" "$REVIEW"

RESOLVE=$(curl -s -X PATCH "$BASE/tickets?id=eq.$AUTH_ID" -H "$SVC" -H "$AUTH" -H "$CT" \
  -H "Prefer: return=representation" \
  -d '{"status":"resolved","resolved_by":"00000000-0000-0000-0000-000000000001","resolved_at":"2026-06-05T11:00:00Z"}')
check "Ticket resolved" "resolved" "$RESOLVE"

echo ""
echo "=== 6. Dashboard stats ==="
TOTAL=$(curl -s "$BASE/tickets?select=id&limit=1" -H "$SVC" -H "$AUTH" -H "Prefer: count=exact")
check "Tickets readable" "id" "$TOTAL"

echo ""
echo "=== 7. Image URLs update ==="
IMG=$(curl -s -X PATCH "$BASE/tickets?id=eq.$ANON_ID" -H "$SVC" -H "$AUTH" -H "$CT" \
  -H "Prefer: return=representation" \
  -d '{"image_urls":["https://supabase.co/storage/v1/object/public/ticket-images/test.jpg"]}')
check "Image URLs updated" "test.jpg" "$IMG"

echo ""
echo "=============================="
echo "Results: $PASS passed, $FAIL failed"
exit $FAIL
