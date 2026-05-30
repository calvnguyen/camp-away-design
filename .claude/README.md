# `.claude/` — project-scoped Claude Code config for camp-away-design

This directory holds Claude Code configuration that lives **with this subproject** (versioned alongside the app), separate from the repo-root `.claude/`.

| Path | Purpose | Tracked in git? |
|---|---|---|
| `settings.json` | Shared, team-wide settings (permission allowlist for this app's dev commands). | ✅ Yes |
| `settings.local.json` | Personal overrides — machine-specific permissions/env. | ❌ Git-ignored |
| `agents/` | Project-scoped subagent definitions (`*.md`). Empty for now (`.gitkeep`). | ✅ Yes |
| `commands/` | Project-scoped slash commands / skills (`*.md`). Empty for now (`.gitkeep`). | ✅ Yes |

**Project guide:** the authoritative "how we build" doc is `../CLAUDE.md` (project root), and the full product spec is `../../../docs/prd.md`. This folder configures the tooling; `CLAUDE.md` documents the conventions.

To add a subagent, drop a `name.md` with frontmatter into `agents/`. To add a slash command, drop `name.md` into `commands/`.
