# FarmaWatch Tests

## Prerequisites
- Node.js 18+
- Playwright: `npx playwright install chromium`
- Dev server running: `npm run dev`

## API-Level Tests
```bash
# These test the Supabase backend directly
# Requires .env.local with valid keys
bash tests/api-test.sh
```

## UI Tests (Playwright)
```bash
python3 tests/with_server.py --server "npm run dev" --port 3000 -- python3 tests/anonymous-ticket.py
python3 tests/with_server.py --server "npm run dev" --port 3000 -- python3 tests/user-flow.py
```

## Test Users
- test@farmawatch.id / Test123!@# (superadmin on Supabase)
