# Agent Instructions

## Verification

After code or configuration changes, run the relevant builds and tests, start the affected application, verify its primary page or endpoint, and fix runtime errors before reporting completion. Keep the final report brief and state any unavailable verification explicitly.

## Commits

When the user explicitly asks for a commit, every agent-authored commit must follow Conventional Commits as documented in `CONTRIBUTING.md`.

Use one of these types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`, `chore`, `style`, or `revert`.

Examples:

```text
feat(booking): add slot selection
fix(api): prevent overlapping bookings
ci(release): configure release-please
```

Never create a commit unless the user explicitly requests it.
