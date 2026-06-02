# VibeCheck Evals

How to verify that changes to `SKILL.md` actually improve output quality.

## How to run

Evals are manual. For each case in `evals.json`:

1. Open Claude Code in any project
2. Paste the `prompt` exactly as written
3. Read the output
4. Score it against the rubric below

Run at minimum evals 1–3 before merging any `SKILL.md` change.

## Scoring rubric

Score each output on these 5 dimensions. Pass/fail per dimension.

### 1. Correct diff scope
- Did it read the right diff for the invocation? (`/vibecheck main` → branch diff, not HEAD)
- Did scoped paths (`/vibecheck src/auth`) stay scoped?

### 2. Logical reading order
- Steps follow causal order (schema before model, model before route, route before test)
- NOT alphabetical, NOT filesystem order
- A reader following the steps would understand each one before needing the next

### 3. Risk tags earn their place
- 🔴 only on genuinely dangerous changes (auth touched, no validation, data deletion)
- 🟡 only on real concerns (no tests, hardcoded value, breaking export)
- No tags on routine changes — no false alarms

### 4. Concise output
- Each step ≤ 2 sentences
- No raw diff repeated
- "What could break" section absent if nothing real to report
- Whole output readable in under 2 minutes

### 5. Quiz quality (eval 6 only)
- Questions test understanding, not recall
- Q2 references an actual risk from this diff
- Scoring is inline and brief (not a re-explanation essay)

## Scoring

| Score | Meaning |
|---|---|
| 5/5 | Ship it |
| 4/5 | Ship it — note which dimension failed |
| 3/5 | Fix before merge |
| ≤2/5 | Revert the SKILL.md change |

## Adding eval cases

Add to `evals.json`. The `expected_output` field describes what a good response **covers**,
not exact phrasing — vibecheck output will vary, that's fine. Score the substance.

Good `expected_output`:
> "Walkthrough covers: middleware order (load-bearing), raw body requirement, signature
> verification. Must flag 🔴 on middleware order. Should NOT flag risks on the handler
> functions themselves."

Bad `expected_output`:
> "A good walkthrough of the stripe webhook handler."
