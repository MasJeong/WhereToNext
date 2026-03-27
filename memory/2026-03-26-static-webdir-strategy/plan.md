# Static WebDir Strategy

## Goal
- Build a truthful static `webDir` path for future iOS Capacitor packaging without changing the current hosted Next.js app into a static-export app.

## Scope
- `apps/ios-shell/` companion app scaffold
- Shared shell-safe contract extraction
- Static shell routes for `/`, `/destinations/[slug]`, `/restore`, `/compare`
- Hosted-web handoff policy for unsupported flows
- Shell build/test/docs and Capacitor handoff notes

## Out of Scope
- Root web UI redesign unrelated to iOS shell packaging
- Auth/account/history support inside shell v1
- Native Capacitor iOS scaffolding, universal links, or simulator shipping proof in this work item

## Plan
1. Verify the route scope matrix already drafted under `docs/` against the real app surface.
2. Scaffold `apps/ios-shell/` with standalone static export settings and build scripts.
3. Extract shell-safe boundaries so the shell app can reuse UI/contracts without server-only imports.
4. Implement shell routes for home, destination detail, restore, and compare.
5. Add unsupported-route handoff behavior, shell verification, and packaging docs.
6. Run full validation and review wave before calling the plan ready.

## Risks
- Shared components may still import server-only modules transitively.
- Next.js static export constraints may force boundary reshaping around route/search param usage.
- We must preserve the current hosted web behavior while introducing shell-only entrypoints.
