# Contributing to vibecheck

## What helps most

1. **Example outputs** — real walkthroughs for common AI-generated patterns
2. **Eval cases** — prompts + expected outputs to test skill quality
3. **Risk rules** — patterns that should trigger 🔴/🟡 tags
4. **Bug reports** — paste the output that was wrong and what it should have said

## Adding examples

Drop a `.md` file in `examples/`. Name it after the pattern: `stripe-webhook.md`,
`jwt-auth.md`, `prisma-migration.md`, etc.

Format:

```markdown
## Input
[describe the diff or context]

## Output
[paste the actual vibecheck output]
```

## Adding eval cases

Edit `evals/evals.json`. Each case needs:

```json
{
  "id": 4,
  "prompt": "/vibecheck [realistic user prompt]",
  "expected_output": "[what a good response covers — not exact text, just key elements]",
  "files": []
}
```

## Improving the skill

The entire skill is `SKILL.md`. Edit it directly. Keep the token rules in mind — every
line of instruction costs tokens on every invocation. Earn your lines.

## Pull request checklist

- [ ] SKILL.md changes: tested with at least 2 real diffs
- [ ] New examples: include actual diff context so others can verify
- [ ] New eval cases: expected_output describes *what to cover*, not exact phrasing

## What we won't add (for now)

- Integrations that require API keys beyond Claude itself
- Output longer than ~40 lines for a typical diff
- Features that break the "under 5 minutes" promise
