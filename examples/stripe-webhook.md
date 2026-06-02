# Example: Stripe Webhook Handler

## Input

User prompt: `/vibecheck — claude just added a stripe webhook handler to my express app, i accepted it but have no idea what it does`

Diff summary: Added `src/routes/webhooks.ts` (new file, 67 lines), registered route in `src/app.ts:34`.

## Output

```
🔍 VibeCheck: Stripe webhook handler for payment events

What this does: Listens for Stripe events (payment success, failure, subscription updates)
at POST /webhooks/stripe. Verifies the request is actually from Stripe, then routes each
event type to a handler.

📖 Read it in this order:

1 — Route registration   src/app.ts:34
> One line: registers the webhook route before the JSON body parser. That order matters —
  see step 2. 🔴 HIGH — if this line is after app.use(express.json()), Stripe signature
  verification will always fail.

2 — Raw body requirement   src/routes/webhooks.ts:8
> express.raw({ type: 'application/json' }) — Stripe needs the raw bytes to verify the
  signature. A parsed JSON body won't match the signature hash.

3 — Signature verification   src/routes/webhooks.ts:18
> stripe.webhooks.constructEvent() — validates the request came from Stripe using the
  STRIPE_WEBHOOK_SECRET env var. Throws if tampered. 🟡 MEDIUM — STRIPE_WEBHOOK_SECRET
  must be the *endpoint* secret from the Stripe dashboard, not the API key.

4 — Event routing   src/routes/webhooks.ts:32
> Switch statement over event.type. Handles: payment_intent.succeeded,
  payment_intent.failed, customer.subscription.deleted. Any unhandled event type
  is silently ignored (intentional — Stripe sends many events).

5 — Handler functions   src/routes/webhooks.ts:48
> Three async functions, one per event type. Each updates your DB based on the event data.
  Returns 200 immediately — Stripe will retry if it doesn't get 200 within 30s.

⚠️ Risks
- 🔴 Route must be registered BEFORE express.json() middleware or signatures break
- 🟡 STRIPE_WEBHOOK_SECRET is the endpoint secret, not the API key — easy to mix up

💥 What could break
- src/app.ts — middleware order is load-bearing, any reorder breaks signature validation

❓ Go deeper
- "Why does Stripe need the raw request body for signature verification?"
- "What happens if my server takes more than 30 seconds to respond?"
```
