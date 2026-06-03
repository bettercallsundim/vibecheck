---
name: vibecheck
description: >
  Use when the user runs /vibecheck or asks to understand recent code changes:
  "walk me through what changed", "explain this diff", "what did the AI write",
  "help me understand this PR", or "vibecheck my code". Produce a short,
  clickable reading path for AI-written or recently accepted code, with real
  risks and next checks. Trigger proactively when the user seems confused about
  recent code or wants a tour of what an AI agent wrote.
---

# VibeCheck

Turn recent changes into a concise reading path: what changed, where to start,
what matters, what could break, and how to verify understanding.

## Invocation

Parse flags first:

| Invocation | Scope |
|---|---|
| `/vibecheck` | local tracked + untracked changes; if clean, `git show HEAD` |
| `/vibecheck main` | branch diff: `git diff main...HEAD` |
| `/vibecheck path/to/file` | local diff scoped to path |
| `--quiz` | add 3-question comprehension check |
| `--redteam` | add adversarial attack-surface review |

No git repo and no visible files: ask which file, folder, or pasted diff to use.

## Workflow

1. **Prefer session context.** If the current conversation shows recent file
   writes/edits, use that intent for the narrative.
2. **Get a cheap file list before reading diffs.** Use `git status --short` to
   catch tracked and untracked files. For scoped/branch checks, use the matching
   `git diff --name-only` command. Read full diffs only for meaningful files.
3. **Fallbacks.** If local tree is clean, use `git show --name-only HEAD`, then
   read only the relevant commit diff. If branch name is missing, list available
   branches and ask.
4. **Ignore noise.** Group lock/generated/binary/import-only files unless they
   are the actual change.
5. **Analyze in execution order.** Prefer schema/model -> service -> route/job ->
   UI -> tests, not filesystem order.
6. **Security scan every changed file.** Look for secrets, auth/permission gaps,
   unsafe user input to DB/filesystem/shell/HTML, dangerous eval/injection, data
   deletion, wildcard CORS, disabled SSL, and world-readable permissions.
7. **Caller search.** For changed exports, function signatures, routes, env vars,
   schemas, or deleted/renamed files, search actual callers/importers. Report only
   what you find.

## Output

Default response is compact. Start immediately with:

```md
### 🔍 VibeCheck: [one-line summary]

**Context:** [Session intent | Git diff | Last commit]
**What this does:** [2 sentences max]

### 📖 Read in this order
1. **[Label]** [file:line](path#Lline)
   [1 sentence: what to notice and why] [risk tag if needed]
2. **[Label]** [file:start-end](path#Lstart-Lend)
   [1 sentence]
```

Then add only sections that have real content:

```md
### ⚠️ Risks
- 🔴/🟡 [specific risk + file:line]

### 💥 What Could Break
- [actual caller/importer/test found by search]

### ✅ Before You Merge
- [ ] [specific verification from this diff]

### ❓ Go Deeper
- [max 2 useful follow-up prompts]
```

## Risk Tags

- 🔴 HIGH: auth/security logic, secrets, data deletion, unsafe user input,
  privilege/permission changes, production-breaking config.
- 🟡 MEDIUM: missing tests for new logic, hardcoded values, breaking exported API,
  risky migration/config, caller not updated.
- No tag for routine low-risk changes.

Only flag real findings. Do not invent risks for completeness.

## Token Budget

- Never paste raw diffs.
- Default: 3-6 reading steps. For >500 changed lines, use 4-8 key stops and one
  grouped line for the rest.
- Each step: one sentence unless the risk truly needs two.
- Skip empty sections entirely.
- Prefer file/line links over explanation paragraphs.
- If the user asks for more detail, expand only the requested step or section.

## Red Team (`--redteam`)

After the normal walkthrough, add:

```md
### 🔴 Red Team
**Attack surface:** [new trust boundary or exposure]
**Exploitation scenarios:** [max 3 realistic scenarios tied to lines]
**What the walkthrough missed:** [only if something real]
**Hardening suggestions:** [max 2 concrete fixes]
```

Rules: realistic only, line-tied, direct technical tone. If nothing exploitable is
visible, say so plainly.

## Quiz (`--quiz`)

After the walkthrough, ask 3 questions and wait:

1. Comprehension: what changed and why?
2. Gotcha: risk, edge case, or non-obvious behavior in this diff.
3. Connection: relation to another caller/module, or an edge case if no real
   connection is visible.

Score inline: correct, close with one clarification, or wrong with a two-sentence
answer. End with `X/3`; no long recap.

## Edge Cases

- Config-only: explain what each var/config changes and what breaks if missing.
- Tests-only: read tests as the behavioral spec.
- Huge diff: ask whether to cover full feature or hottest changes.
- Merge/rebase noise: strip conflict markers and mechanical churn.
- Deleted files: explain deletion and search callers; 🟡 if callers remain.
- Renamed files: note old -> new; inspect content only if it changed.
- Monorepo: group by app/package.
- No git but files visible in conversation: use session context.
- `git` missing: ask for file/folder or pasted diff.
- User asks "explain what changed": treat as `/vibecheck`.
