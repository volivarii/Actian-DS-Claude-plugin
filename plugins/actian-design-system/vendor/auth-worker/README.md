# Auth Worker — GitHub OAuth Broker

A tiny Cloudflare Worker that brokers the GitHub OAuth authorization-code exchange for the Knowledge Editor. The editor SPA cannot perform the exchange itself (GitHub's token endpoint requires `client_secret` and lacks CORS even after the July 2025 PKCE update). The Worker holds the secret server-side, completes the exchange, and posts the token back to the SPA via origin-locked `postMessage`.

Vendored from [sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) (MIT). See `src/index.js` for the pinned upstream SHA and any local modifications.

## Architecture

```
[Editor SPA] → <worker>/auth?provider=github&site_id=<origin>
                       ↓
                Worker → github.com/login/oauth/authorize (302 with CSRF cookie)
                       ↓ (user approves)
                Worker /callback?code&state
                       ↓
                Worker → github.com/login/oauth/access_token (with client_secret)
                       ↓
                Worker → postMessage `authorization:github:success:<json>` → SPA
```

Protocol is the Decap/Sveltia CMS handshake — see `src/index.js` for details.

## Current deployment

- **Worker URL:** `https://actian-ds-knowledge-auth.volivari.workers.dev`
- **OAuth App:** Actian DS Knowledge Editor (registered on the `volivarii` personal account, at `https://github.com/settings/developers`)
- **Client ID:** `Ov23liYDsOZj1NuD1sKR` (public — appears in the OAuth authorize URL)
- **Cloudflare account:** owned by Vincent (volivari)
- **Last deployed:** 2026-05-24

## Initial deploy runbook

1. **Register the OAuth App** at https://github.com/settings/developers → New OAuth App
   - Name: `Actian DS Knowledge Editor`
   - Homepage: `https://volivarii.github.io/actian-ds-knowledge/editor/`
   - Authorization callback URL: `https://actian-ds-knowledge-auth.volivari.workers.dev/callback`
   - Save the Client ID. Generate a new client secret and copy it immediately (only shown once).
2. **Authenticate wrangler** (one-time per machine):
   ```bash
   cd auth-worker && npx wrangler login
   ```
3. **Set Worker secrets** (interactive — paste each value when prompted):
   ```bash
   cd auth-worker
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   ```
4. **Deploy the Worker:**
   ```bash
   cd auth-worker && npx wrangler deploy
   ```
5. **Update the OAuth App** to match the deployed Worker URL if it changed.

## Secret rotation

GitHub OAuth client secrets should be rotated annually or on suspected compromise.

1. https://github.com/settings/developers → app → **Generate a new client secret**.
2. `cd auth-worker && npx wrangler secret put GITHUB_CLIENT_SECRET` (paste the new secret).
3. `npx wrangler deploy`.
4. Verify by signing in to the editor in an incognito window.
5. Revoke the old secret on github.com.

## Ownership transfer (volivarii → Actian org)

When the knowledge repo moves to an Actian-owned GitHub org, the OAuth App and the Cloudflare Worker should follow:

1. **Recreate the OAuth App** on the Actian org's developer settings (same name + callback). Copy the new Client ID + Secret.
2. **Deploy the Worker** under the Actian Cloudflare account (or transfer the existing Worker via Cloudflare's account-transfer flow). Set the new secrets.
3. **Update the editor's `WORKER_ORIGIN` and `CLIENT_ID` constants** in `editor/src/auth/oauth.ts` and ship a single PR.
4. **Update the OAuth App callback URL** to the new Worker URL.
5. **Revoke** the old OAuth App on the `volivarii` account.

Estimated transfer time: ~30 minutes plus an editor PR.

## Modifying the Worker

Re-pulling upstream:

```bash
curl -sL https://raw.githubusercontent.com/sveltia/sveltia-cms-auth/main/src/index.js > /tmp/upstream.js
diff /tmp/upstream.js src/index.js  # review changes before applying
```

Document any local divergence in the file header comment of `src/index.js`.

## Local development

```bash
cd auth-worker && npx wrangler dev
```

Spins up a local Worker on `http://localhost:8787`. Note: full OAuth round-trip needs the deployed Worker since GitHub's callback URL is pinned. Use `manual-test.html` against the deployed Worker for the round-trip; use `wrangler dev` for log-debugging.
