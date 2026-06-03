---
name: vibecheck
description: >
  Use this skill when the user runs /vibecheck or asks to understand recent code changes,
  a new feature they just built, a bug fix they just accepted from AI, or anything like
  "walk me through what just changed", "explain this diff", "what did the AI write",
  "help me understand this PR", "vibecheck my code", or "what does this new module do".
  This skill is for vibe coders — developers who use AI coding tools but want to actually
  understand the code they just accepted. It analyzes git diffs and produces a sequential,
  clickable, plain-English walkthrough of exactly what changed and how to read it.
  Trigger proactively whenever the user seems confused about recent code or wants a tour
  of what an AI agent just wrote for them.
---

# VibeCheck

Turn recent code changes into a sequential, clickable walkthrough. Goal: dev understands
what changed and why in under 5 minutes.

## Arguments

Parse the invocation before doing anything:

| Invocation | What to diff |
|---|---|
| `/vibecheck` | `git diff HEAD` → if empty: `git show HEAD` |
| `/vibecheck main` | `git diff main...HEAD` |
| `/vibecheck src/auth` | `git diff HEAD -- src/auth` (scoped to path) |
| `/vibecheck --quiz` | Normal walkthrough, then quiz mode |
| `/vibecheck main --quiz` | Branch diff + quiz |
| `/vibecheck src/auth --quiz` | Scoped diff + quiz |

No git repo / clean tree → ask: "Which file or folder should I walk you through?"

## Step 1 — Get the diff

**Before anything else: scan the current conversation history.**
Look for your own recent Write/Edit tool calls. Extract the list of files you created or modified.

- **YES — session context found:** Use session context for the walkthrough narrative (you know
  the intent behind the change). Then run `git diff HEAD --name-only` to get the complete list
  of modified files — use it only to catch files you touched but didn't explicitly mention, and
  to run the security scan (Step 2b). If git and session context disagree on what changed
  (e.g. user also manually edited a file), trust git — it reflects the actual state on disk.
- **NO — cold start:** Run `git diff HEAD`. If empty, run `git show HEAD`.
  Get `--name-only` first. Read full diff only for the changed files — don't dump the entire
  repo diff.

## Step 2a — Analyze before writing

Identify:
- Purpose (new feature / bug fix / refactor / config)
- Entry point (where execution or reading starts)
- Logical reading order (schema → model → service → route → test — not filesystem order)
- Strip before analyzing: merge commit noise, rebase artifacts, conflict markers, lock file
  changes, auto-generated files — these waste reader attention

## Step 2b — Security scan (always run, even with session context)

For every new or modified file, scan for security risks. Adapt to the language in the diff — don't apply JS patterns to Python code. Look for:

- Hardcoded credentials or secrets anywhere in the file
- Dangerous eval/injection patterns for the language in use
- User input reaching sensitive operations without validation (DB, filesystem, shell, HTML output)
- Missing auth guards on routes or handlers that touch user data
- Overly permissive config (wildcard CORS, disabled SSL checks, world-readable permissions)

Flag anything found as 🔴 HIGH in ⚠️ Risks, with exact file and line.

## Step 2c — Caller search for "What could break"

Don't guess. Search the codebase for callers of any changed exports or function signatures.
Only report what you actually find — never hypothetical callers.

## Step 3 — Output

**Default output** — lean. No filler. Every word earns its place.

---

### 🔍 VibeCheck: [one-line description]

**What this does:** [2-3 sentences max. Plain English. What problem does it solve?]

---

### 📖 Read it in this order:

**1 — [Label]** [path/to/file.ts:42-55](path/to/file.ts#L42-L55)
> [1-2 sentences: what to notice and why] [🔴 HIGH / 🟡 MEDIUM risk tag if applicable]

**2 — [Label]** [path/to/file.ts:87-102](path/to/file.ts#L87-L102)
> [1-2 sentences]

... (4–8 steps. Group trivial files: "these 3 files just update imports — skip them.")

Line ranges: use the actual start+end of the relevant block (function body, class, if-block).
Link format: [filename.ts:start-end](relative/path/from/project/root/filename.ts#Lstart-Lend)
Single line fallback (no obvious block end): [filename.ts:42](path/to/file.ts#L42)

---

### ⚠️ Risks
[Only include if risks found. Bullet list, max 5. Skip entire section if nothing real.]
- 🔴 [specific risk + file:line]
- 🟡 [specific risk + file:line]

---

### 💥 What could break
[Only callers/importers you found via search. Max 3 bullets. Skip if you found nothing.]
- `path/to/caller.ts` — imports X which changed, may need update
- `path/to/test.ts` — test exists but doesn't cover the new branch

---

### ✅ Before you merge
[Derive from this specific diff. Concrete, actionable items — not generic advice. Skip if nothing specific applies.]
- [ ] [specific thing to verify, e.g. "STRIPE_WEBHOOK_SECRET is set in production"]
- [ ] [specific thing to test, e.g. "middleware order in app.ts hasn't changed"]

---

### ❓ Go deeper
[2 follow-up prompts max. Only ones actually useful given this specific diff.]

---

## Risk tagging rules

- 🔴 **HIGH** — auth/security logic changed, secrets detected, data deletion, no input validation on user-facing input
- 🟡 **MEDIUM** — no tests for new logic, hardcoded value, breaking change to exported API
- (no tag) — everything looks fine, skip

Only flag real issues. Don't cry wolf on routine changes.

## Token rules (enforce these)

- Never repeat the raw diff in output
- Steps: 1-2 sentences each, hard limit
- "What could break": only callers found via actual search
- "Go deeper": max 2 prompts
- If diff is >500 lines: focus on 6-8 most important stops, group the rest in one line
- No preamble — start with the `### 🔍 VibeCheck:` line

## Quiz mode (`--quiz`)

After the walkthrough, add:

---

### 🧠 Quick check — did it land?

Difficulty curve — always follow this order:
**Q1:** Comprehension — "What does X do and why?" (straightforward, tests basic understanding)
**Q2:** Gotcha — a risk, edge case, or non-obvious behavior specific to this diff
**Q3:** Connection — how this change relates to another part of the codebase. If you can't
identify a real connection, replace with: a question about an edge case or failure mode in the diff.

Wait for answers. Score inline:
- Correct → "✅ Exactly."
- Partially right → "🟡 Close — [one sentence clarification]"
- Wrong → "❌ [correct answer in 2 sentences max]"

Final score: **X/3** — no lengthy recap.

---

## Edge cases

**Config-only diff:** Still walk through it. Env vars and schema changes are what AI writes
that devs ignore and get burned by later.

**Test files only:** Walk tests as spec — what behavior they verify is often more useful
than the implementation.

**Huge diff (>500 lines):** Ask "Full feature walkthrough or just the hottest changes?"
Then scope accordingly — don't produce a 30-step essay.

**Merge commit / rebase noise:** Strip merge commits, conflict resolution markers, and
rebase artifacts before analyzing. They're not meaningful to the reader.

**Branch name doesn't exist** (e.g. `/vibecheck main` but no `main` branch): Say:
"No branch named `main` found. Available branches: [list them]. Which one?"

**Binary files in diff:** Note and skip. "X also changed binary files — skipped."

**Generated or lock files** (package-lock.json, yarn.lock, *.min.js, *.pb.go):
Group in one line: "Lock/generated files updated — skip these."

**Deleted files:** Flag explicitly. Explain what it did and grep for callers.
🟡 MEDIUM if callers still exist.

**Renamed files:** One step noting old and new path. Only walk content if it changed
beyond the rename.

**Monorepo:** Group steps by app/package. Don't intermix `apps/web` and `packages/api`.

**No git repo, files visible in conversation:** Use session context directly.

**User asks "explain what changed" without `/vibecheck`:** Treat as `/vibecheck`.
