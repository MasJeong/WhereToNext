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

## 2) Branch and Delivery Workflow
- Treat `main` as production and `dev` as integration.
- Do not use `main` for in-progress work.
- Create feature work on `feature/*` branches.
- Merge `feature/* -> dev` first, verify there, then promote `dev -> main` when ready.
- Deploy production only from merged `main`.

## 3) Rule Files and Overrides
- Active local instruction source today: root `AGENTS.md` only.
- Checked and currently absent: `.cursorrules`, `.cursor/rules/`, `.github/copilot-instructions.md`, nested `AGENTS.md`.
- If any of those appear later, follow them and update this file to reflect the new instruction stack.

## 4) Repository Snapshot
- Stack: `Next.js 16 App Router`, `React 19`, `TypeScript 5` strict, `Tailwind CSS 4`, `Zod`.
- Data: `Drizzle ORM` with `Postgres` when `DATABASE_URL` exists and `PGlite` fallback otherwise.
- Testing: `Vitest` for unit tests, `Playwright` for e2e.

## 5) Important Paths
- App routes: `src/app/`
- API routes: `src/app/api/**/route.ts`
- Shared UI: `src/components/trip-compass/`
- Business/domain logic: `src/lib/`
- Domain contracts: `src/lib/domain/contracts.ts`
- Runtime DB setup: `src/lib/db/runtime.ts`
- DB schema: `src/lib/db/schema.ts`
- Recommendation engine: `src/lib/recommendation/engine.ts`
- Test selectors: `src/lib/test-ids.ts`
- Global styles: `src/app/globals.css`
- Middleware/security headers: `middleware.ts`
- Migrations: `drizzle/`
- Korean UX copy guidance: `docs/korean-copy-guidelines.md`

## 6) Build, Lint, and Test Commands
- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Start production server: `npm run start`
- Lint: `npm run lint`
- Generate DB artifacts: `npm run db:generate`
- Seed DB: `npm run db:seed`
- Run all unit tests: `npm run test:unit`
- Run all e2e tests: `npm run test:e2e`
- Run smoke verification: `npm run test:smoke`
- Run one Vitest file: `npx vitest run tests/unit/snapshots/service.spec.ts`
- Run one Vitest test by name: `npx vitest run tests/unit/recommendation/golden-cases.spec.ts -t "keeps the top recommendations stable"`
- Run one Playwright file: `npx playwright test tests/e2e/recommendation-flow.spec.ts`
- Run one Playwright test by title: `npx playwright test -g "restores a saved recommendation snapshot"`
- Minimum verification before finishing code changes: `npm run lint && npm run test:unit && npm run build`

## 7) Formatting and General Style
- Follow existing ESLint + Next formatting; do not assume Prettier is active.
- Match the current style: double quotes, semicolons, trailing commas, and 2-space indentation.
- Keep diffs focused; avoid drive-by refactors during bug fixes.
- Prefer small pure helpers for domain logic and thin route handlers for transport concerns.
- Add concise JSDoc to every new or materially changed function.
- Match surrounding documentation language: core/business files often use Korean JSDoc, UI files often use English JSDoc.

## 8) Imports and Module Boundaries
- Use `@/*` alias imports for internal modules.
- Group imports in this order:
  1. framework and third-party packages
  2. internal `@/` modules
  3. relative imports when truly local
- Prefer `import type` for type-only imports.
- Reuse helpers from `src/lib/` instead of re-implementing logic in routes or components.

## 9) TypeScript and Data Contracts
- `tsconfig.json` is strict; preserve strict typing.
- Avoid `any`, `as any`, `@ts-ignore`, and `@ts-expect-error`.
- Prefer narrow unions and schema-driven types from `src/lib/domain/contracts.ts`.
- Keep runtime validation and static types aligned.
- When payload shapes change, update schema, service logic, API contract, and tests together.
- Preserve discriminated unions such as snapshot `kind` values.

## 10) Naming Conventions
- React component exports: PascalCase.
- Functions, variables, and hooks: camelCase.
- Constants: UPPER_SNAKE_CASE only for real constants.
- Component and utility filenames are usually kebab-case.

## 11) Next.js and React Conventions
- Default to Server Components in `src/app/`.
- Add `"use client"` only when browser APIs, hooks, or interactivity are required.
- Client-heavy screens live in `src/components/trip-compass/` and are composed from server routes.
- Keep API handlers in `src/app/api/**/route.ts`.
- Follow the existing async params pattern for dynamic App Router pages and route handlers.
- Page example: `params: Promise<{ snapshotId: string }>`.
- Route example: `context: { params: Promise<{ historyId: string }> }`.

## 12) UI and Styling Rules
- Reuse shared visual primitives and token classes from `src/app/globals.css`.
- Existing UI language is editorial, warm, and summary-first; keep new UI aligned with that direction.
- Prefer Tailwind utilities plus shared classes such as `compass-*` and `instagram-card`.
- Keep cards and comparison views easy to scan on both desktop and mobile.

## 13) Validation, Errors, and API Behavior
- Validate all external input with Zod via `src/lib/security/validation.ts`.
- Return structured JSON errors from API routes.
- Preserve stable error `code` values where a route already defines them.
- Keep user-facing errors safe and generic; never leak stack traces or internal details.
- Preserve rate-limit headers where already used.
- Catch blocks should end in an intentional fallback, null state, boolean failure, or safe user message.
- Do not swallow errors without a defined outcome.

## 14) Security and Middleware
- Treat query params, request bodies, headers, cookies, and snapshot IDs as untrusted.
- Preserve security headers and API `X-Robots-Tag` behavior in `middleware.ts`.
- Keep anonymous-first behavior intact unless the task explicitly changes auth flows.
- Do not add scraping-based Instagram behavior; evidence is curated/supporting, not the ranking engine.

## 15) Persistence and Recommendation Rules
- Use `src/lib/db/runtime.ts` instead of creating ad hoc DB clients.
- Respect the runtime split: `Postgres` with `DATABASE_URL`, `PGlite` fallback otherwise.
- Snapshot restore must fail closed; do not silently re-calculate or partially hydrate missing saved data.
- Keep recommendation logic deterministic and explainable.
- Do not replace ranking with opaque AI heuristics.
- Evidence can enrich results but must not override hard filters.

## 16) Tests and Selectors
- Update or add tests when contracts, recommendation weights, snapshots, selectors, or restore behavior change.
- For interactive UI changes, add or reuse stable selectors from `src/lib/test-ids.ts`.
- Do not scatter raw `data-testid` strings when a helper or centralized ID already exists.
- If UI copy changes break tests, update the assertions deliberately instead of weakening coverage.

## 17) Documentation Updates
- Update `README.md`, `AGENTS.md`, or `.env.example` when commands, conventions, or environment variables change.

## 18) Finish Checklist
- Did I use only real scripts and installed tools?
- Did I preserve strict typing and avoid suppression shortcuts?
- Did I validate external input through existing schema patterns?
- Did I preserve anonymous-first behavior and security headers?
- Did I update tests and selectors when behavior changed?
- Did I run `npm run lint`, `npm run test:unit`, and `npm run build`?
- Did I run `npm run test:e2e` if the change affects user-visible flows?
