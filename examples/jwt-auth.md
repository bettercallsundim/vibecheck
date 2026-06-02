# Example: JWT Auth Module

## Input

User prompt: `/vibecheck — codex just built out a full auth module (jwt login + refresh tokens). can you walk me through what it wrote so i actually understand it`

Diff summary: New files — `src/types/auth.ts`, `src/lib/tokens.ts`, `src/routes/auth.ts` (login + refresh endpoints), `src/middleware/auth.ts`.

## Output

```
🔍 VibeCheck: JWT auth with access + refresh tokens

What this does: Adds stateless authentication. Login returns a short-lived access token
(15min) for API calls and a long-lived refresh token (7d) to get new access tokens without
re-logging in. Refresh tokens are stored in the DB so they can be revoked.

📖 Read it in this order:

1 — Token types   src/types/auth.ts:1
> Defines AccessTokenPayload and RefreshTokenPayload. The exp field is a Unix timestamp
  (seconds, not ms) — this trips people up when comparing to Date.now().

2 — Token generation   src/lib/tokens.ts:12
> createAccessToken signs a JWT with 15m expiry. createRefreshToken signs one AND saves
  a hash to the DB — that's how revocation works. The raw token goes to the client,
  only the hash lives in DB.

3 — Login   src/routes/auth.ts:24
> POST /auth/login validates credentials, calls both generators. Access token in response
  body, refresh token in httpOnly cookie. 🔴 HIGH — httpOnly cookie won't work if your
  frontend is on a different domain without correct CORS + credentials config.

4 — Auth middleware   src/middleware/auth.ts:8
> Runs on every protected route. Decodes access token, attaches user to req.user.
  Returns 401 (not 403) on expiry — that's the signal to the client to call /auth/refresh.

5 — Refresh endpoint   src/routes/auth.ts:78
> POST /auth/refresh reads the httpOnly cookie, hashes it, checks DB, issues new pair,
  deletes old refresh token. One-time use — stolen tokens can't be reused.

⚠️ Risks
- 🔴 Cross-origin cookie setup needed if frontend ≠ backend domain
- 🟡 No refresh token cleanup job — expired tokens stay in DB forever

💥 What could break
- Any existing route using the old session-based auth needs the new middleware swapped in

❓ Go deeper
- "Why store a hash of the refresh token instead of the token itself?"
- "What does the client do when it gets a 401 vs a 403?"
```
