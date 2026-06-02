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
| `/vibecheck` | `git diff HEAD` (uncommitted) → fallback: `git diff --cached` → fallback: `git show HEAD` |
| `/vibecheck main` | `git diff main...HEAD` |
| `/vibecheck src/auth` | `git diff HEAD -- src/auth` (scoped to path) |
| `/vibecheck --quiz` | Normal walkthrough, then quiz mode |
| `/vibecheck main --quiz` | Branch diff + quiz |
| `/vibecheck src/auth --quiz` | Scoped diff + quiz |

No git repo / clean tree → ask: "Which file or folder should I walk you through?"

## Step 1 — Get the diff (token-efficient)

**Before anything else: scan the current conversation history.**
Look back at this session. Did you (the AI) write, edit, or create any files in this conversation?
Check for: Write tool calls, Edit tool calls, file content you generated, code blocks you produced.

- **YES — session context found:** Use it directly. List the files you touched, what you changed,
  and why. Skip all git commands. This produces the richest output at zero extra token cost.
- **NO — cold start:** Run the appropriate git command from the table above.
  Only request `--name-only` first. Read full diff only for changed files — don't dump
  the entire repo diff if only 2 files changed.

## Step 2 — Analyze before writing

Identify:
- Purpose (new feature / bug fix / refactor / config)
- Entry point (where execution or reading starts)
- Logical reading order (schema → model → service → route → test — not filesystem order)
- Risks: missing error handling, auth/security logic touched, no tests for new logic,
  hardcoded secrets/values, breaking API changes

## Step 3 — Output (keep it tight)

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
- 🔴 [specific risk + which line]
- 🟡 [specific risk + which line]

---

### 💥 What could break
[Only include if you can identify actual cross-file impact. Max 3 bullets. Skip if speculative.]
- `path/to/caller.ts` — calls the function that changed, may need update
- `path/to/test.ts` — test exists but doesn't cover the new branch

---

### ❓ Go deeper
[2 follow-up prompts max. Only ones that are actually useful given this specific diff.]

---

## Risk tagging rules

Tag inline on the step, not in a separate section:

- 🔴 **HIGH** — auth/security logic changed, secrets detected, data deletion, no input validation on user-facing input
- 🟡 **MEDIUM** — no tests for new logic, hardcoded value, breaking change to exported API
- (no tag) — everything looks fine, skip

Only flag real issues. Don't cry wolf on routine changes — it trains devs to ignore the tags.

## Token rules (enforce these)

- Never repeat the raw diff in output
- Steps: 1-2 sentences each, hard limit
- "What could break": only real cross-file callers/importers you can identify — not hypotheticals
- "Go deeper": max 2 prompts
- If diff is >500 lines: focus on the 6-8 most important stops, group the rest in one line
- No preamble ("Sure! Let me walk you through...") — start with the `### 🔍 VibeCheck:` line

## Quiz mode (`--quiz`)

After the walkthrough, add:

---

### 🧠 Quick check — did it land?

**Q1:** [Conceptual question about the core change — tests understanding, not recall]
**Q2:** [Question about a risk or gotcha from this specific diff]
**Q3:** [Question about how this connects to the rest of the codebase]

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

**Staged + unstaged changes both present:** Run `git diff HEAD` to catch everything — don't
split the walkthrough into two passes. Note if some changes are staged and some aren't.

**Branch name doesn't exist** (e.g. `/vibecheck main` but no `main` branch): Don't error
silently. Say: "No branch named `main` found. Available branches: [list them]. Which one?"

**Binary files in diff:** Skip them in the walkthrough. Note: "X also changed binary files
(images/fonts/compiled assets) — skipped, nothing to walk through there."

**Generated or lock files** (package-lock.json, yarn.lock, *.min.js, *.pb.go, migrations
auto-generated): Group in one line: "Lock/generated files updated — skip these." Don't walk
through them step by step.

**Deleted files:** Flag explicitly. "X was deleted" is meaningful — explain what it did and
whether anything still imports/calls it. 🟡 MEDIUM if callers exist.

**Renamed files:** Treat as "moved, not rewritten" — one step noting old and new path. Only
walk the content if it actually changed beyond the rename.

**Monorepo (multiple apps/packages changed):** Group steps by app/package. Don't intermix
`apps/web` and `packages/api` changes — readers lose track of which system they're in.

**No git repo, but files visible in conversation:** Use session context directly. Walk the
files that were shared or written — no git needed.

**User asks "explain what changed" without typing `/vibecheck`:** Treat it as `/vibecheck`.
The skill description covers this — just run the normal flow.
