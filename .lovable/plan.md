# Deployment Readiness Plan — Self-Hosted Docker

## Current snapshot
- TypeScript type check: **passed** (`npx tsc --noEmit` exit 0).
- Dependency audit: **clean** (no high/critical vulnerabilities).
- Security scan: **no critical findings**.
- Lighthouse/accessibility: previously flagged as low, but that was from the Lovable-hosted preview; self-hosting will be re-evaluated after the production build is live.

## Blockers that must be fixed first
1. **Destructive Supabase migration** — `supabase/migrations/20260530030820_my_schema.sql` drops every public table, type, function and trigger and does not recreate them. Deploying this would wipe the production database.
2. **Missing `GRANT` statements** — every public table created in earlier migrations lacks the Data-API grants that Supabase now requires. Without them the frontend will hit permission errors.
3. **ESLint hard error** — `src/lib/integrations.ts:78` has an empty `catch {}` block (`no-empty`), which causes `npm run lint` to fail.
4. **Placeholder environment values** — `.env` still has `VITE_APP_URL=https://yourdomain.com` and `VITE_TERMINAL_WS_URL=ws://localhost:4000/terminal`.
5. **Terminal server is not containerized** — the Dockerfile only builds the React app; the real-time terminal WebSocket service (`server/terminal-server.js`) needs its own runtime environment on the server.
6. **No reverse-proxy / SSL orchestration** — for a real domain you need nginx/Caddy/Traefik with TLS termination and WebSocket upgrade support.

## Implementation steps

### 1. Fix the database migrations
- Remove or replace `supabase/migrations/20260530030820_my_schema.sql` so it cannot run in production.
- Add the required `GRANT` blocks immediately after each `CREATE TABLE` in:
  - `20260404084009_caca9acd-de16-4db6-b527-91d8398bde21.sql` (profiles, security_incidents, firewall_logs, threat_alerts, blocked_ips)
  - `20260414_enhanced_security_audit.sql` (security_logs)
  - `20260504123259_4c17cee4-21be-41a7-9e57-7dfda59702d1.sql` (user_roles)
  - `20260505141905_0da77eb4-9d33-436a-bb75-6c926c65bdeb.sql` (terminal_audit_log)
- Pattern for each table:
  ```sql
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated;
  GRANT ALL ON public.<table> TO service_role;
  ```
  (Drop the `authenticated` INSERT/UPDATE/DELETE grants where the RLS policy intentionally restricts writes.)

### 2. Fix the lint error
- In `src/lib/integrations.ts:78`, replace the empty `catch {}` with a comment body or an `eslint-disable-next-line no-empty` so `npm run lint` exits cleanly.

### 3. Configure production environment
- Replace placeholder values in `.env` (and create `.env.example` if missing):
  ```env
  VITE_APP_URL=https://<your-domain>
  VITE_TERMINAL_WS_URL=wss://<your-domain>/terminal
  ```
- Ensure the terminal server receives `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `TERMINAL_PORT`, `TERMINAL_SHELL`, `TERMINAL_ALLOWED_ROLES` at runtime.

### 4. Containerize the terminal server
- Add a `Dockerfile.terminal` (Node 20 slim, installs deps, runs `server/terminal-server.js`).
- Or extend the existing multi-service setup with a `docker-compose.yml` that includes:
  - `frontend` service (current nginx image)
  - `terminal` service (Node runtime for the WebSocket proxy)
  - shared environment via `.env`

### 5. Add reverse proxy / TLS orchestration
- Provide an nginx/Caddy config that:
  - Serves the static Vite build at `/`
  - Proxies `/terminal` to the terminal container with `proxy_http_version 1.1`, `Upgrade` and `Connection` headers
  - Redirects HTTP → HTTPS and serves the domain certificate
- Include a Certbot/Let's Encrypt step in the runbook.

### 6. Verification before go-live
- Run `npm run lint` and confirm 0 errors.
- Run `npm run build` and confirm a clean `dist/`.
- Run `deployment-checklist.sh` and confirm all checks pass.
- Apply migrations to a staging/test Supabase project first.
- Deploy the Docker image to the user's server, point the domain DNS A record to the server IP, and verify SSL + WebSocket connectivity.
- Re-run the security scan after all changes.

## What I need from you
- The domain name you bought, so I can set the correct `VITE_APP_URL` and `VITE_TERMINAL_WS_URL` values.
- Whether you want a single `docker-compose.yml` with nginx + certbot, or you prefer to use Caddy/Traefik, or your own existing reverse proxy.

## Outcome
After this plan is implemented, the project will build cleanly, the database schema will be safe and correctly permissioned, and you will have a repeatable Docker-based deployment you can run on your own server with your own domain and SSL.