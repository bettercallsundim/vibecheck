# Changelog

## 1.0.4 — 2026-06-03

- Fixed: `git diff HEAD` fallback chain — dropped redundant `--cached` step
- Fixed: session context detection now explicitly scans Write/Edit tool calls
- Fixed: conflicting context (session vs git) now resolved by trusting git as source of truth
- Fixed: quiz Q3 guard — falls back to edge case question if codebase connections can't be identified
- Added: security pattern checklist in Step 2b — systematic scan for hardcoded secrets, eval, CORS *, SQL injection, command injection
- Added: explicit caller search instruction for "What could break" — grep-based, no guessing
- Added: "Before you merge" checklist section — diff-derived, actionable items
- Added: quiz difficulty curve — Q1 comprehension, Q2 gotcha, Q3 connection
- Added: merge commit / rebase noise edge case
- Added: full social meta tags (og:title, og:description, twitter:card) to landing page
- Fixed: `--global` install now covers all 6 tool-specific paths (Claude Code, Cursor, Windsurf, Copilot, Codex CLI, Antigravity)

## 1.0.3 — 2026-06-03

- Added: cross-tool support — Claude Code, Cursor, Windsurf, GitHub Copilot, Codex CLI, Antigravity
- Added: universal install path `~/.agents/skills/` covers all tools
- Added: `npx vibecheck-skill --global` installs to all tool-specific paths at once
- Added: uninstall instructions
- Fixed: install URL placeholder replaced with real GitHub username

## 1.0.0 — 2026-06-02

- Initial release
- Core walkthrough: session context first, git diff fallback
- Argument support: `/vibecheck`, `/vibecheck main`, `/vibecheck src/path`
- Inline risk tags: 🔴 HIGH, 🟡 MEDIUM
- Quiz mode: `--quiz`
- "What could break" section
- 11 edge case rules
- Works with Claude Code
