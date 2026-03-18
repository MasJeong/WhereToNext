# AGENTS.md
Agent guide for the `SooGo` repository.
Scope: entire repository.

## 1) Working Contract
- Follow: user request > system/developer constraints > this file.
- Verify behavior against real files/scripts before acting.
- Keep changes focused, minimal, and consistent with nearby code.
- Do not invent commands, routes, schema shapes, or workflows.
- Use the repo’s existing helpers instead of duplicating logic.
- For technology stack questions, consult `docs/tech-stack.md` first.
- For recurring bugs, incidents, or previously solved implementation issues, consult `docs/issue-resolution-log.md` before debugging.
- Treat `main` as the production deployment branch and `dev` as the integration branch.
- Do not use `main` for in-progress feature work.
- Create feature work on `feature/*` branches, even for solo development.
- Merge feature work into `dev` first, continue verification there, and promote `dev` to `main` only when ready to deploy.
- Deploy production only from merged `main`.
- After resolving a non-trivial issue through investigation, append a concise verified entry to `docs/issue-resolution-log.md` so future work can reuse it.

## 2) Repository Snapshot
- App: `SooGo`
- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Zod
- Data: Drizzle ORM + Postgres, with local PGlite fallback in runtime code
- Testing: Vitest (unit) + Playwright (e2e)
- Package manager: npm

## 3) Agent / Editor Rule Files
Checked and currently absent:
- `.cursorrules`
- `.cursor/rules/`
- `.github/copilot-instructions.md`
- nested `AGENTS.md`

If any of those appear later, follow them and update this file.

## 4) Important Paths
- App routes: `src/app/`
- API routes: `src/app/api/**/route.ts`
- Restore/share pages: `src/app/s/[snapshotId]/page.tsx`, `src/app/compare/[snapshotId]/page.tsx`
- Components: `src/components/trip-compass/`
- Domain/business logic: `src/lib/`
- Database runtime/schema: `src/lib/db/`
- Recommendation engine: `src/lib/recommendation/engine.ts`
- Snapshot logic: `src/lib/snapshots/service.ts`
- Shared presentation: `src/lib/trip-compass/presentation.ts`
- Global styles: `src/app/globals.css`
- Middleware: `middleware.ts`
- Migrations: `drizzle/`

## 5) Install / Run Commands
Install dependencies:
```bash
npm install
```

Run dev server:
```bash
npm run dev
```

Build and start:
```bash
npm run build
npm run start
```

Lint:
```bash
npm run lint
```

Database:
```bash
npm run db:generate
npm run db:seed
```

## 6) Test Commands
Run all unit tests:
```bash
npm run test:unit
```

Run all e2e tests:
```bash
npm run test:e2e
```

Run smoke verification:
```bash
npm run test:smoke
```

### Single-Test Guidance
There is no dedicated single-test npm script. Use the installed tools directly.

Run one Vitest file:
```bash
npx vitest run tests/unit/snapshots/service.spec.ts
```

Run one Vitest test by name:
```bash
npx vitest run tests/unit/recommendation/golden-cases.spec.ts -t "keeps the top recommendations stable"
```

Run one Playwright file:
```bash
npx playwright test tests/e2e/recommendation-flow.spec.ts
```

Run one Playwright test by title:
```bash
npx playwright test -g "restores a saved recommendation snapshot"
```

Minimum validation before finishing work:
```bash
npm run lint
npm run test:unit
npm run build
```

Run `npm run test:e2e` for user-visible flow changes.

## 7) TypeScript and Schemas
- `tsconfig.json` is strict; preserve strict typing.
- Prefer narrow types and Zod-derived types.
- Avoid `any`, `as any`, `@ts-ignore`, and `@ts-expect-error`.
- Keep runtime validation and TS types aligned.
- Prefer schema-first modeling in `src/lib/domain/contracts.ts`.
- Use discriminated unions for variant payloads like snapshots.

## 8) Imports
- Use `@/*` alias imports for internal modules.
- Group imports in this order:
  1. framework / external
  2. internal `@/` imports
  3. type-only imports when useful
- Prefer `import type` for type-only imports.
- Remove unused imports.

## 9) Naming Conventions
- React component exports: PascalCase
- Component/lib filenames: usually kebab-case
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE only for true constants
- Route files: framework defaults like `page.tsx`, `route.ts`
- Test IDs: keep them centralized in `src/lib/test-ids.ts`

## 10) React / Next.js Conventions
- Default to Server Components in `src/app/`.
- Add `"use client"` only when interactivity/browser APIs are required.
- Keep API handlers in `src/app/api/**/route.ts`.
- Follow the existing async params pattern for dynamic App Router pages.
- Do not add auth/session assumptions; the product is anonymous-first.

## 11) UI / Styling Conventions
- Follow existing Next.js + ESLint formatting; do not assume Prettier.
- Use Tailwind utilities plus shared tokens from `src/app/globals.css`.
- Reuse the existing visual primitives:
  - `compass-panel`
  - `compass-card`
  - `compass-pill`
  - `instagram-card`
- Avoid one-off inline styles unless necessary.
- Keep cards and result views summary-first and easy to scan.

## 12) Validation and API Behavior
- Validate all external input with Zod via `src/lib/security/validation.ts`.
- Return structured JSON errors from API routes.
- Existing route convention uses stable `code` values such as:
  - `INVALID_QUERY`
  - `RATE_LIMITED`
  - `SNAPSHOT_NOT_FOUND`
- Keep user-facing errors safe and generic.
- Never leak stack traces or internal details.
- Preserve rate-limit headers where already used.

## 13) Security and Middleware
- Treat query params, request bodies, headers, and snapshot IDs as untrusted.
- Preserve `middleware.ts` security headers and API `X-Robots-Tag` behavior.
- Keep anonymous-first behavior intact.
- Do not add scraping-based Instagram behavior; current design is curated/official-safe.

## 14) Persistence and Snapshot Rules
- Use `src/lib/db/runtime.ts` instead of creating ad hoc DB clients.
- Respect the runtime split:
  - remote Postgres when `DATABASE_URL` exists
  - local PGlite fallback otherwise
- Snapshot restore must fail closed, not silently degrade.
- If snapshot shape changes, update schema, storage, restore logic, and tests together.
- Do not bypass immutable saved payload behavior.

## 15) Recommendation / Evidence Rules
- Keep recommendation logic deterministic and explainable.
- Do not move ranking into freeform AI or opaque heuristics.
- Preserve the split between ranking logic and Instagram/evidence mood layer.
- Evidence may enrich the result, but must not override hard filters.
- If weights, filters, or contracts change, update tests in the same change set.

## 16) JSDoc and Comments
- This repo consistently uses JSDoc; continue that pattern.
- Add a JSDoc block above every new or materially changed function.
- Keep docs concise and useful.
- Match the surrounding language style:
  - core/business files often use Korean JSDoc
  - UI files often use English JSDoc
- Avoid comments that merely restate the code.

## 17) Tests and Selectors
- Unit tests: `tests/unit/**`
- E2E tests: `tests/e2e/**`
- When changing interactive UI, add or reuse stable selectors in `src/lib/test-ids.ts`.
- Do not scatter raw `data-testid` strings if a helper exists.
- If UI copy changes break tests, update tests deliberately rather than weakening assertions.

## 18) Documentation Updates
When commands, behavior, or contracts change, update docs in the same change set:
- `README.md`
- `AGENTS.md` when workflow/conventions changed
- `.env.example` when env vars change

## 19) Quick Checklist
- Did I use only real commands from `package.json` or installed tools?
- Did I preserve strict typing and avoid suppression shortcuts?
- Did I validate input with existing schema patterns?
- Did I preserve anonymous-first behavior?
- Did I update tests if routes, contracts, selectors, or restore behavior changed?
- Did I run `npm run lint`, `npm run test:unit`, and `npm run build`?
- Did I run `npm run test:e2e` for user-facing flow changes?
