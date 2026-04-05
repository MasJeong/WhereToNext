# AGENTS.md
Agent guide for the `SooGo` repository.
Scope: entire repository.

## 1) Working Contract
- Follow this order: user request > system/developer instructions > this file.
- Verify behavior against real files, scripts, and configs before acting.
- Keep changes minimal, local, and consistent with nearby code.
- Do not invent routes, schema shapes, commands, or workflows.
- Prefer existing helpers and service layers over parallel abstractions.
- Read `docs/tech-stack.md` for stack questions before inferring from memory.
- Read `docs/korean-copy-guidelines.md` before changing user-facing Korean copy.
- Read `docs/issue-resolution-log.md` before debugging recurring or recent issues.
- After resolving a non-trivial issue, append a short verified note to `docs/issue-resolution-log.md`.
- For major or important work, create a visible audit trail under `memory/` so the user can inspect what was planned, changed, and verified without relying on hidden agent scratch files.
- Treat `.sisyphus/` as internal agent planning/scratch space only; it must not be the only record for major work.
- Use `memory/YYYY-MM-DD-short-slug/` for each major work item and keep at least `plan.md`, `changes.md`, and `verification.md` inside that folder.
- Write Markdown documentation in Korean by default when practical so repo-local audit notes and status documents stay easy for the user to review later.
- Do not put secrets, credentials, or bulky generated artifacts in `memory/`.

## 2) Active Rule Files and Overrides
- Active local instruction source today: root `AGENTS.md` only.
- Checked and currently absent: `.cursorrules`, `.cursor/rules/`, `.github/copilot-instructions.md`, nested `AGENTS.md`.
- If any of those appear later, follow them and update this file to reflect the new instruction stack.

## 3) Repository Snapshot
- Framework: `Next.js 16 App Router`, `React 19`.
- Language: `TypeScript 5` with `strict: true` in `tsconfig.json`.
- Styling: `Tailwind CSS 4`.
- Validation: `Zod`.
- Data: `Drizzle ORM` with `Postgres` when `DATABASE_URL` exists and `PGlite` fallback otherwise.
- Testing: `Vitest` for unit tests, `Playwright` for e2e.
- Linting: `ESLint 9` via `eslint.config.mjs`.

## 4) Important Paths
- App routes: `src/app/`
- API routes: `src/app/api/**/route.ts`
- Shared UI: `src/components/trip-compass/`
- Business/domain logic: `src/lib/`
- Visible work audit trail: `memory/`
- Domain contracts: `src/lib/domain/contracts.ts`
- DB runtime/schema: `src/lib/db/runtime.ts`, `src/lib/db/schema.ts`
- Validation: `src/lib/security/validation.ts`
- Recommendation engine: `src/lib/recommendation/engine.ts`
- Route orchestration/restore: `src/lib/trip-compass/route-data.ts`, `src/lib/trip-compass/restore.ts`
- Test selectors: `src/lib/test-ids.ts`
- Styles and middleware: `src/app/globals.css`, `middleware.ts`

## 5) Branch and Command Sources
- Treat `main` as production and `dev` as integration; prefer `feature/*` branches for work.
- Treat `package.json` as the canonical source for scripts.
- Treat `vitest.config.ts` as the source of truth for unit-test runner behavior.
- Treat `playwright.config.ts` as the source of truth for e2e runner behavior.
- Use `README.md`, `docs/deployment.md`, and `docs/ios-release-preflight.md` as supporting docs, not as substitutes for config files.

## 6) Build, Lint, and Test Commands
- Install dependencies: `npm install`
- Dev server: `npm run dev`
- Production build: `npm run build`
- Start production server locally: `npm run start`
- Lint entire repo: `npm run lint`
- Generate DB artifacts: `npm run db:generate`
- Seed DB: `npm run db:seed`
- Run all unit tests: `npm run test:unit`
- Run all e2e tests: `npm run test:e2e`
- Run smoke verification: `npm run test:smoke`

## 7) Single-Test Commands
- Run one Vitest file: `npx vitest run tests/unit/snapshots/service.spec.ts`
- Run one Vitest test by name: `npx vitest run tests/unit/recommendation/golden-cases.spec.ts -t "keeps the top recommendations stable"`
- Run one Playwright file: `npx playwright test tests/e2e/recommendation-flow.spec.ts`
- Run one Playwright test by title: `npx playwright test -g "restores a saved recommendation snapshot"`
- Run one iOS/WebKit e2e file: `npx playwright test tests/e2e/ios-acquisition-flow.spec.ts --project=webkit`
- Run one Mobile Safari e2e file: `npx playwright test tests/e2e/ios-acquisition-flow.spec.ts --project="Mobile Safari"`

## 8) Test Runner Notes
- Vitest is scoped to `tests/unit/**/*.spec.ts` and `tests/unit/**/*.spec.tsx` via `vitest.config.ts`.
- Playwright is scoped to `tests/e2e` via `playwright.config.ts`.
- Playwright uses `npm run start` on port `4010` through `webServer`; e2e assumes a production build exists.
- If you run e2e outside CI, prefer `npm run build && npm run test:e2e`.
- Playwright is configured with `workers: 1` and `fullyParallel: false`; do not assume high test parallelism.
- `test:smoke` already runs lint, one smoke unit test, and a full build.

## 9) Required Verification Before Finishing
- Minimum for code changes: `npm run lint && npm run test:unit && npm run build`.
- Run `npm run test:e2e` when the change affects user-visible flows, routing, or browser behavior.
- When touching a specific domain module, run the closest single-file or named test first, then the broader suite.

## 10) Formatting and General Style
- Follow existing ESLint + Next formatting; do not assume Prettier is active.
- Match the current style: double quotes, semicolons, trailing commas, and 2-space indentation.
- Keep diffs focused; avoid drive-by refactors during bug fixes.
- Prefer small pure helpers for domain logic and thin route handlers for transport concerns.
- Add concise JSDoc to every new or materially changed function.
- Match surrounding documentation language: core/business files often use Korean JSDoc, UI files often use English JSDoc.

## 11) Imports and Module Boundaries
- Use `@/*` alias imports for internal modules.
- Group imports in this order: framework/third-party, internal `@/`, then relative local imports.
- Prefer `import type` for type-only imports.
- Reuse helpers from `src/lib/` instead of re-implementing logic in routes or components.
- Keep route handlers thin; push business logic into `src/lib/`.

## 12) TypeScript and Data Contracts
- Preserve strict typing from `tsconfig.json`.
- Do not use `any`, `as any`, `@ts-ignore`, or `@ts-expect-error`.
- Prefer schema-driven types from `src/lib/domain/contracts.ts` and `z.infer`-based request typing.
- Keep runtime validation and static types aligned.
- When payload shapes change, update schema, service logic, API contract, and tests together.
- Preserve discriminated unions such as snapshot `kind` values and route-data `kind` branches.
- `allowJs` exists, but new repo code should still default to `.ts`/`.tsx`.

## 13) Naming Conventions
- React component exports: PascalCase.
- Functions, variables, hooks, and local helpers: camelCase.
- Constants: UPPER_SNAKE_CASE only for real constants.
- Component and utility filenames are usually kebab-case.
- Keep type aliases descriptive and local when they serve a single component or module.

## 14) Next.js and React Conventions
- Default to Server Components in `src/app/`.
- Add `"use client"` only when browser APIs, hooks, or interactivity are required.
- Client-heavy screens live in `src/components/trip-compass/` and are composed from server routes.
- Keep API handlers in `src/app/api/**/route.ts`.
- Follow the existing async params pattern for dynamic App Router pages and route handlers.
- Page example: `params: Promise<{ snapshotId: string }>`.
- Where needed, also match async `searchParams: Promise<...>` patterns in dynamic pages.

## 15) Validation, Errors, and API Behavior
- Validate all external input with Zod; prefer shared parsers in `src/lib/security/validation.ts`.
- Return structured JSON errors from API routes.
- Preserve stable error `code` values where a route already defines them.
- Keep user-facing errors safe and generic; never leak stack traces or internal details.
- Preserve rate-limit headers where already used.
- Catch blocks must end in an intentional fallback, null state, boolean failure, or safe user message.
- In route handlers, prefer early returns for auth, validation, and rate-limit failures.

## 16) Security, Persistence, and Recommendation Rules
- Treat query params, request bodies, headers, cookies, and snapshot IDs as untrusted.
- Preserve security headers and API `X-Robots-Tag` behavior in `middleware.ts`.
- Keep anonymous-first behavior intact unless the task explicitly changes auth flows.
- Use `src/lib/db/runtime.ts` instead of creating ad hoc DB clients.
- Respect the runtime split: `Postgres` with `DATABASE_URL`, `PGlite` fallback otherwise.
- Snapshot restore must fail closed; do not silently re-calculate or partially hydrate missing saved data.
- Keep recommendation logic deterministic and explainable.
- Do not replace ranking with opaque AI heuristics.
- Evidence can enrich results but must not override hard filters.

## 17) UI, Tests, and Documentation
- Reuse shared visual primitives and token classes from `src/app/globals.css`.
- Existing UI language is editorial, warm, and summary-first; keep new UI aligned with that direction.
- Prefer Tailwind utilities plus shared classes such as `compass-*` and `instagram-card`.
- Reuse existing shell/layout primitives such as `ExperienceShell` before adding new wrappers.
- Update or add tests when contracts, recommendation weights, snapshots, selectors, or restore behavior change.
- For interactive UI changes, add or reuse stable selectors from `src/lib/test-ids.ts`.
- Do not scatter raw `data-testid` strings when a helper or centralized ID already exists.
- Update `README.md`, `AGENTS.md`, or `.env.example` when commands, conventions, or environment variables change.
- For major work, also add a concise visible record under `memory/` and keep it focused on the plan, concrete file changes, and actual verification commands/results.
- Repo-local task-specific skills live in `.claude/skills/`; installed UI skill: `.claude/skills/ui-ux-pro-max/`.
- Current persisted design system output lives at `design-system/soogo/MASTER.md`.

## 18) Finish Checklist
- Did I use only real scripts and installed tools?
- Did I preserve strict typing and avoid suppression shortcuts?
- Did I validate external input through existing schema patterns?
- Did I preserve anonymous-first behavior and security headers?
- Did I update tests and selectors when behavior changed?
- Did I run `npm run lint`, `npm run test:unit`, and `npm run build`?
- Did I run `npm run test:e2e` if the change affects user-visible flows?
