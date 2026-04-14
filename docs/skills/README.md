# SooGo Project Skills

These files are supporting documentation for task-specific skills.

- `AGENTS.md` stays as the always-on repository policy.
- Primary checked-in skill path is `.claude/skills/`.
- OpenCode can use the Claude-compatible skill path, so this repo keeps a single checked-in skill source.
- Skills should stay focused on one responsibility and should not duplicate global rules from `AGENTS.md`.
- `docs/skills/` can hold reference copies or extended notes when needed.

Current skills:

- `.claude/skills/soogo-api-route/SKILL.md`
- `.claude/skills/soogo-recommendation-engine/SKILL.md`
- `.claude/skills/soogo-snapshot-restore/SKILL.md`

Recommended rule of thumb:

- Put always-on repo rules in `AGENTS.md`.
- Put repeatable task playbooks in the official skill discovery paths.

This directory is only a small index. Treat `.claude/skills/` as the primary source.
