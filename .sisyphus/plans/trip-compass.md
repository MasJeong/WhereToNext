# Trip Compass MVP Build Plan

## TL;DR
> **Summary**: Build a new standalone Next.js travel recommendation app at `C:\jihun_roject\trip-compass` for Korean outbound couples and small groups. The MVP uses a hybrid conversation + filters flow, deterministic destination ranking, persisted save/share/compare snapshots, and trend context from curated/official-safe sources.
> **Deliverables**:
> - New app workspace at `C:\jihun_roject\trip-compass` with migrated `.sisyphus` planning home
> - Deterministic recommendation engine with explainable results and gold-case regression suite
> - Trend evidence layer with freshness, confidence, and fallback labeling
> - Save/share/compare snapshot flow backed by Postgres
> - Agent-executable unit, API, and Playwright verification
> **Effort**: Large
> **Parallel**: YES - 3 waves
> **Critical Path**: 1 -> 2 -> 3 -> 4 -> 5 -> 7 -> 8 -> 9 -> 10 -> 11

## Context
### Original Request
- Build a travel destination recommendation platform and plan it collaboratively.
- Work in a newly created root folder under `C:\jihun_roject`.

### Interview Summary
- App root is fixed to `C:\jihun_roject\trip-compass`.
- Audience is Korean-origin outbound travelers, focused on couples and small groups.
- User experience is hybrid: guided conversation plus explicit filters.
- MVP outputs country/city/region recommendations with summary-first cards.
- Success bar is both recommendation quality and trustworthy trend context.
- Post-result actions must include save/share and side-by-side comparison.
- MVP is anonymous-first: no signup or login is required.
- Test strategy is `tests-after`, but test infrastructure must be added in the first engineering slice.

### Metis Review (gaps addressed)
- Default persistence is `Postgres + Drizzle`, not in-memory storage.
- Default launch catalog is `36` curated outbound destinations represented by one canonical `DestinationProfile` schema with `kind: country | region | city`.
- Default MVP exclusions are auth, booking, pricing, maps, multilingual content, push notifications, and admin CMS.
- Default trend policy is official-safe: curated Instagram hashtag/account inputs, oEmbed-only display, optional YouTube support, and non-Instagram fallback data.
- Default release rubric is a gold-case regression suite plus freshness/fallback checks, not subjective visual review.

### Instagram Integration Decision Matrix
- `Green`: show handpicked public Instagram posts through oEmbed, and media from approved tourism-board / hotel / airline / creator professional accounts.
- `Yellow`: show destination hashtag capsules only for a controlled list of approved hashtags that pass App Review and stay within Meta query limits.
- `Red`: do not implement place-wide trending discovery, arbitrary public search, scraping, or consumer-account-wide feed aggregation.
- Product rule: recommendations come from the app's own engine; Instagram only provides visual proof, mood, and freshness context.

## Work Objectives
### Core Objective
- Ship a transparent MVP that captures traveler preferences, ranks destinations deterministically, explains the match, and safely augments results with trend context.

### Deliverables
- `C:\jihun_roject\trip-compass` Next.js app with `src/app`, `src/components`, `src/lib`, and `.sisyphus`
- Postgres schema for destinations, trend snapshots, recommendation snapshots, comparison snapshots, and scoring versions
- Recommendation query contract, conversation mapper, ranking engine, and comparison-ready snapshot payloads
- Public routes for recommendations and snapshots with validation, rate limiting, and fallback-safe responses
- Home/query UI, result cards, empty/error states, save/share, and compare page
- `Vitest` unit suite, API contract tests, and `Playwright` end-to-end coverage

### Definition of Done (verifiable conditions with commands)
- `npm run lint` passes in `C:\jihun_roject\trip-compass`
- `npm run build` passes in `C:\jihun_roject\trip-compass`
- `npm run test:unit` passes and includes gold-case recommendation fixtures
- `npm run test:e2e` passes and covers query -> result -> save/share -> compare flows
- `curl` verification for recommendation and snapshot routes returns expected happy-path and failure-path shapes

### Must Have
- New app scaffolded in `C:\jihun_roject\trip-compass` before any feature work
- `.sisyphus` planning home recreated in the new app and existing planning artifacts migrated there during execution
- Deterministic filter-first ranking with explicit `reasons`, `scoreBreakdown`, `confidence`, `freshness`, and `source` fields
- DB-backed immutable snapshots for save/share and compare flows
- Trend context shown as evidence, freshness, and tie-break support only
- Anonymous recommendation, share, and compare flows that work without signup/login
- Clear fallback behavior when trend sources fail or are unavailable

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- No unofficial Instagram scraping or fake “platform-wide trending” claims
- No freeform LLM judgment inside ranking or eligibility
- No booking, payments, maps, auth, multi-device history, or admin backoffice in MVP
- No in-memory-only persistence for shared snapshots or destination catalog
- No acceptance criteria that require manual human judgment

### Instagram Result UX Spec
- Each result card has a dedicated `Instagram vibe` block under the core recommendation summary, not above the ranking reason.
- The block order is fixed: `why this fits -> trip facts -> instagram vibe -> watch out -> actions`.
- `Instagram vibe` shows up to `3` items only in MVP: one primary visual, one freshness/source badge, and one CTA (`인스타 감성 더보기`).
- Allowed sources inside the block are fixed to `embed`, `partner account`, `approved hashtag capsule`, or `fallback editorial`.
- Every Instagram-derived item must show a visible label such as `공식 계정`, `해시태그 기준`, `큐레이션`, or `대체 소스`.
- If no Instagram-safe source exists, the block stays visible and renders fallback editorial/travel imagery rather than collapsing.

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: `tests-after` with `Vitest` for unit/API logic and `Playwright` for end-to-end flows
- QA policy: Every task includes agent-executed happy-path and failure-path scenarios
- Evidence: `C:\jihun_roject\trip-compass\.sisyphus\evidence\task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave. Shared foundations are extracted early for safe parallelism.

Wave 1: foundation and contract lock (`1`, `2`, `3`, `4`, `6`)
Wave 2: engine and backend assembly (`5`, `7`, `8`)
Wave 3: experience and release polish (`9`, `10`, `11`)

### Dependency Matrix (full, all tasks)
- `1` blocks `2`, `3`, `4`, `6`
- `2` blocks `5`, `7`, `9`, `10`, `11`
- `3` blocks `5`, `7`, `9`, `10`
- `4` blocks `5`, `7`, `11`
- `5` blocks `7`, `9`, `10`
- `6` blocks `7`, `9`
- `7` blocks `9`, `10`, `11`
- `8` blocks `10`, `11`
- `9` blocks Final Verification Wave
- `10` blocks Final Verification Wave
- `11` blocks Final Verification Wave

### Agent Dispatch Summary (wave -> task count -> categories)
- Wave 1 -> 5 tasks -> `quick`, `unspecified-high`, `deep`
- Wave 2 -> 3 tasks -> `deep`, `unspecified-high`
- Wave 3 -> 3 tasks -> `visual-engineering`, `writing`
- Final Verification -> 4 tasks -> `oracle`, `unspecified-high`, `deep`

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [ ] 1. Create `trip-compass` workspace and migrate planning home

  **What to do**: Create `C:\jihun_roject\trip-compass` as a new Next.js 16 App Router app with TypeScript, Tailwind, `src/` layout, and `npm`. Recreate `C:\jihun_roject\trip-compass\.sisyphus\plans`, `C:\jihun_roject\trip-compass\.sisyphus\drafts`, and `C:\jihun_roject\trip-compass\.sisyphus\evidence`, then move the current planning artifacts from `jikmuping/.sisyphus/` into the new app so all further work happens inside the new root.
  **Must NOT do**: Do not keep the new app inside `jikmuping/`; do not choose Bun; do not start feature code before the new workspace and `.sisyphus` home exist.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: scaffold and file migration are mechanical and low-ambiguity.
  - Skills: `[]` - no extra skill is required.
  - Omitted: `playwright` - no browser automation is needed yet.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: `2`, `3`, `4`, `6` | Blocked By: none

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `jikmuping/package.json` - mirror the Next.js + npm script baseline.
  - Pattern: `jikmuping/src/` - keep the same `src/app`, `src/components`, `src/lib` split.
  - Pattern: `jikmuping/.sisyphus/plans/` - preserve the plan/evidence folder layout in the new app.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `C:\jihun_roject\trip-compass\package.json` exists and exposes `dev`, `build`, `start`, and `lint` scripts.
  - [ ] `C:\jihun_roject\trip-compass\.sisyphus\plans`, `C:\jihun_roject\trip-compass\.sisyphus\drafts`, and `C:\jihun_roject\trip-compass\.sisyphus\evidence` exist.
  - [ ] The active draft and plan files are present under `C:\jihun_roject\trip-compass\.sisyphus\` and no longer need `jikmuping/.sisyphus/` for future execution.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```text
  Scenario: Workspace scaffold exists
    Tool: Bash
    Steps: Run directory listing commands against `C:\jihun_roject\trip-compass` and `C:\jihun_roject\trip-compass\.sisyphus`; inspect `package.json` scripts.
    Expected: New root, app files, and `.sisyphus` subfolders all exist; `package.json` is npm-based.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-1-workspace.json

  Scenario: Migration path is clean
    Tool: Bash
    Steps: Verify the same plan filename exists under the new `.sisyphus\plans` path and confirm future commands can run from `C:\jihun_roject\trip-compass`.
    Expected: Planning artifacts resolve under the new app root without broken paths.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-1-migration.json
  ```

  **Commit**: YES | Message: `chore(app): scaffold trip-compass workspace` | Files: `C:\jihun_roject\trip-compass\*`

- [ ] 2. Install quality stack and stable verification scripts

  **What to do**: Add `Vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, and `Playwright`. Create `vitest.config.ts`, `playwright.config.ts`, shared test setup, and scripts `test:unit`, `test:e2e`, and `test:smoke` in `package.json`. Make `npm run test:smoke` execute lint + unit smoke + build, so agents have one fast gate before deeper flows.
  **Must NOT do**: Do not add Jest, Cypress, or duplicate test runners; do not postpone test tool installation until after feature work.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: tooling setup is bounded and mostly config work.
  - Skills: `[]` - no special skill is required.
  - Omitted: `frontend-ui-ux` - this is infrastructure, not design.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: `5`, `7`, `9`, `10`, `11` | Blocked By: `1`

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `jikmuping/package.json` - preserve script naming style and npm usage.
  - Pattern: `project1/package.json` - confirms a lean Next.js script baseline without extra test tools.
  - External: `https://vitest.dev/guide/` - use Vitest as the unit runner.
  - External: `https://playwright.dev/docs/intro` - use Playwright for browser verification.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npm run test:unit -- --runInBand` or equivalent project-supported unit command passes with at least one smoke spec.
  - [ ] `npm run test:e2e -- --list` enumerates Playwright specs without configuration errors.
  - [ ] `npm run test:smoke` succeeds and includes lint + build + unit smoke coverage.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```text
  Scenario: Unit stack works
    Tool: Bash
    Steps: Run `npm run test:unit` in `C:\jihun_roject\trip-compass` after adding a smoke spec.
    Expected: Vitest starts cleanly, discovers specs, and exits with status 0.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-2-vitest.txt

  Scenario: Browser stack works
    Tool: Bash
    Steps: Run `npm run test:e2e -- --list` and then one minimal Playwright smoke spec against the local app.
    Expected: Playwright config is valid and at least one browser spec passes.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-2-playwright.txt
  ```

  **Commit**: YES | Message: `test(setup): add vitest and playwright baseline` | Files: `C:\jihun_roject\trip-compass\package.json`, `C:\jihun_roject\trip-compass\vitest.config.ts`, `C:\jihun_roject\trip-compass\playwright.config.ts`, `C:\jihun_roject\trip-compass\tests\*`

- [ ] 3. Lock domain contracts, query schema, and selector contract

  **What to do**: Create canonical Zod + TypeScript contracts for `DestinationProfile`, `RecommendationQuery`, `RecommendationResult`, `TrendEvidenceSnapshot`, `RecommendationSnapshot`, `ComparisonSnapshot`, and `ScoringVersion`. Add a typed `EvidenceTier = 'green' | 'yellow' | 'fallback'` and `EvidenceSourceType = 'embed' | 'partner_account' | 'hashtag_capsule' | 'editorial'`. Freeze the MVP query fields to `partyType`, `partySize`, `budgetBand`, `tripLengthDays`, `departureAirport`, `travelMonth`, `pace`, `flightTolerance`, and up to two `vibes`. Publish a shared selector map in `src/lib/test-ids.ts` for UI and Playwright reuse.
  **Must NOT do**: Do not add auth/user-profile fields; do not let freeform conversation text bypass the typed query object; do not leave selector names ad hoc inside components.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: contract design affects every downstream module.
  - Skills: `[]` - direct implementation is enough.
  - Omitted: `playwright` - selectors are defined here, but browser work is later.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: `5`, `7`, `9`, `10` | Blocked By: `1`

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `jikmuping/src/lib/security/validation.ts:5` - follow the repo's Zod-first request contract style.
  - Pattern: `project1/src/lib/card-spec.ts:8` - follow versioned schema + encode/decode discipline for shareable payloads.
  - External: `https://zod.dev/` - use one schema source for runtime validation and TS inference.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Contract files compile with `tsc` through `npm run build`.
  - [ ] Unit tests prove invalid `RecommendationQuery` payloads fail and valid payloads infer the expected types.
  - [ ] `src/lib/test-ids.ts` exports selectors for query, result, snapshot, and compare flows, including `party-type-couple`, `submit-recommendation`, `result-card-0`, `instagram-vibe-0`, `save-snapshot`, and `compare-snapshot`.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```text
  Scenario: Query schema accepts supported payload
    Tool: Bash
    Steps: Run unit tests for contract parsing, including a payload with `partyType=couple`, `partySize=2`, `budgetBand=mid`, `tripLengthDays=5`, `departureAirport=ICN`, `travelMonth=10`, `pace=balanced`, `flightTolerance=medium`, and `vibes=['romance','food']`.
    Expected: The parser returns a typed object and strips/rejects unsupported fields.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-3-query-schema.json

  Scenario: Invalid payload is rejected safely
    Tool: Bash
    Steps: Run a unit test with `partySize=-1`, `travelMonth=13`, and three `vibes` values.
    Expected: Validation fails with a stable error shape and no uncaught exception.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-3-query-invalid.json
  ```

  **Commit**: YES | Message: `feat(domain): lock schemas and test id contract` | Files: `C:\jihun_roject\trip-compass\src\lib\domain\*`, `C:\jihun_roject\trip-compass\src\lib\test-ids.ts`

- [ ] 4. Add Postgres persistence, migrations, and the curated launch catalog

  **What to do**: Install `drizzle-orm`, `drizzle-kit`, and a Postgres driver. Create tables `destination_profiles`, `trend_snapshots`, `recommendation_snapshots`, and `scoring_versions`. Seed exactly `36` launch destinations with a mixed `kind` enum (`country | region | city`) covering: Tokyo, Osaka, Kyoto, Fukuoka, Sapporo, Okinawa, Taipei, Kaohsiung, Hong Kong, Macau, Bangkok, Chiang Mai, Phuket, Da Nang, Hoi An, Singapore, Bali, Cebu, Boracay, Guam, Saipan, Melbourne, Sydney, Gold Coast, Paris, Rome, Barcelona, Lisbon, Prague, Vienna, Zurich, Vancouver, Honolulu, Los Angeles, New York City, and Dubai. Each record must include Korean and English names, country code, budget band, flight band, best months, pace tags, vibe tags, summary, watch-outs, and `active` status.
  **Must NOT do**: Do not use SQLite or in-memory stores for snapshots; do not leave the launch catalog size unspecified; do not seed destinations outside the agreed 36-item scope.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: schema choices affect persistence, ranking, snapshots, and operations.
  - Skills: `[]` - no extra skill is required.
  - Omitted: `frontend-ui-ux` - this is backend/domain groundwork.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: `5`, `7`, `8`, `11` | Blocked By: `1`

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `jikmuping/src/app/api/snapshots/route.ts:11` - snapshots must be persisted behind an API, not held only in UI state.
  - Pattern: `project1/src/lib/card-spec.ts:16` - use explicit schema versioning for stored payloads.
  - External: `https://orm.drizzle.team/docs/overview` - use Drizzle migration and schema workflow.

  **Acceptance Criteria** (agent-executable only):
  - [ ] A migration can create all four tables in a clean Postgres database.
  - [ ] Seed execution inserts exactly `36` active destination rows and one active scoring version.
  - [ ] A readback test confirms each destination has non-empty Korean name, best months, vibe tags, and watch-out fields.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```text
  Scenario: Database boots cleanly
    Tool: Bash
    Steps: Run migrations against a fresh Postgres database, then run the seed script.
    Expected: All tables exist, the seed finishes without duplicates, and the active catalog count is 36.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-4-db-seed.json

  Scenario: Catalog contract is complete
    Tool: Bash
    Steps: Execute a unit/integration test that loads all seeded destination profiles and asserts required fields are populated.
    Expected: No destination profile is missing multilingual names, summary, watch-outs, best months, or classification data.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-4-catalog-audit.json
  ```

  **Commit**: YES | Message: `feat(data): add postgres schema and launch catalog` | Files: `C:\jihun_roject\trip-compass\drizzle\*`, `C:\jihun_roject\trip-compass\src\lib\db\*`, `C:\jihun_roject\trip-compass\src\lib\catalog\*`

- [ ] 5. Implement deterministic recommendation engine and gold-case regression suite

  **What to do**: Build the recommendation engine as `eligibility filters -> weighted scoring -> tie-breakers -> explanation assembly`. Use one active scoring version with these exact weight caps: `vibeMatch 25`, `budgetFit 18`, `tripLengthFit 15`, `seasonFit 14`, `flightToleranceFit 12`, `partyFit 8`, `paceFit 5`, `sourceConfidence 3`. Hard-exclude destinations when `flightTolerance=short` and `flightBand=long`, when `tripLengthDays <= 4` and `flightBand=long`, when `budgetBand=budget` and destination budget band is `premium`, or when `travelMonth` is outside `bestMonths` and not inside a single-month shoulder window. Trend evidence may adjust only `sourceConfidence` and a final tie-break delta capped at `3` total points.
  **Must NOT do**: Do not mix trend evidence into eligibility; do not use opaque AI scoring; do not let scoring weights drift outside the active version record.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: ranking logic is the core product differentiator and highest correctness risk.
  - Skills: `[]` - direct implementation is sufficient.
  - Omitted: `playwright` - engine verification is unit-first.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: `7`, `9`, `10` | Blocked By: `2`, `3`, `4`

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `jikmuping/src/app/api/recommendations/route.ts:224` - follow the explainable scoring and reason assembly style.
  - Pattern: `jikmuping/src/app/api/recommendations/route.ts:167` - keep confidence as an explicit computed output, not hidden UI logic.
  - Reference: `C:\jihun_roject\trip-compass\src\lib\catalog\*` - use only seeded destination profiles and active scoring version data.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npm run test:unit -- src/lib/recommendation/golden-cases.spec.ts` passes with at least `30` named traveler fixtures.
  - [ ] The engine returns `reasons`, `scoreBreakdown`, `confidence`, `whyThisFits`, and `watchOuts` for every recommendation.
  - [ ] Engine tests prove trend evidence never resurrects an ineligible destination.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```text
  Scenario: Gold cases stay stable
    Tool: Bash
    Steps: Run the gold-case unit suite including fixtures such as `anniversary-october-couple`, `friends-summer-budget`, and `winter-short-haul-couple`.
    Expected: Each fixture keeps its expected top-3 destination IDs and active `scoringVersion`.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-5-gold-cases.json

  Scenario: Ineligible destinations stay excluded
    Tool: Bash
    Steps: Run a unit test with `flightTolerance=short`, `tripLengthDays=3`, and a high-trend long-haul destination in the catalog.
    Expected: The long-haul destination never appears in the ranked output, even with strong trend evidence.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-5-hard-filter.json
  ```

  **Commit**: YES | Message: `feat(engine): add deterministic destination ranking` | Files: `C:\jihun_roject\trip-compass\src\lib\recommendation\*`

- [ ] 6. Build the trend evidence layer with official-safe sources and fallback rules

  **What to do**: Create a normalized evidence service that emits `mode`, `tier`, `sourceType`, `sourceLabel`, `sourceUrl`, `observedAt`, `freshnessState`, `confidence`, and `summary`. Support these adapters in priority order: `instagram_embed` (`Green`, handpicked public post URLs), `instagram_partner_account_recent` (`Green`, approved professional accounts only), `instagram_hashtag_capsule` (`Yellow`, approved hashtags only), `manual_editorial` (`fallback`, required), and `youtube_search_recent` (`fallback`, optional if key exists). Use `fresh` for `<72h`, `aging` for `72h-168h`, `stale` for `>168h`. Cache successful external reads for `12h`. If all external inputs fail, degrade to `mode='fallback'` with manual editorial summaries and keep recommendation ranking intact.
  **Must NOT do**: Do not scrape Instagram; do not claim platform-wide trending discovery; do not store oEmbed data for unauthorized analytics or derivative datasets; do not require a user to log in before seeing evidence content.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: external-source normalization and compliance boundaries are subtle.
  - Skills: `[]` - no extra skill is required.
  - Omitted: `frontend-ui-ux` - this task is data/service focused.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: `7`, `9` | Blocked By: `1`

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `jikmuping/src/lib/live-role-trends.ts:20` - follow the normalized result shape with `mode`, `source`, and `fetchedAt` semantics.
  - Pattern: `jikmuping/src/lib/live-role-trends.ts:35` - reuse the 12-hour cache TTL pattern for external fetches.
  - External: `https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/hashtag-search/` - approved hashtag-only Instagram surface.
  - External: `https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/business-discovery/` - professional-account-only lookup surface.
  - External: `https://developers.facebook.com/docs/instagram-platform/oembed/` - embed-only policy for public post display.
  - External: `https://developers.google.com/youtube/v3/docs/search/list` - optional recent-video support.

  **Acceptance Criteria** (agent-executable only):
  - [ ] A unit/integration suite proves every adapter returns the normalized evidence contract with the correct `tier` label.
  - [ ] External failures switch the service to `fallback` mode without throwing uncaught errors.
  - [ ] Freshness state and confidence values are present for every evidence block.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```text
  Scenario: Mixed sources normalize cleanly
    Tool: Bash
    Steps: Run evidence adapter tests with one manual editorial source, one mocked Instagram hashtag response, and one mocked YouTube response.
    Expected: The resulting blocks share one contract and include source URLs, timestamps, freshness, and confidence.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-6-normalization.json

  Scenario: Source outage degrades safely
    Tool: Bash
    Steps: Force all external adapters to fail while manual editorial data remains available.
    Expected: The service returns `mode='fallback'`, manual summaries still render, and no recommendation call fails because of evidence outage.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-6-fallback.json
  ```

  **Commit**: YES | Message: `feat(evidence): add trend adapters and fallback policy` | Files: `C:\jihun_roject\trip-compass\src\lib\evidence\*`

- [ ] 7. Implement validated API routes for recommendations and snapshots

  **What to do**: Add `GET /api/recommendations`, `POST /api/snapshots`, and `GET /api/snapshots/[snapshotId]`. The recommendations route must parse the typed query, resolve active scoring version + destination catalog + evidence snapshots, and return `query`, `recommendations`, `meta`, and `sourceSummary`. Snapshot creation must persist immutable payloads for both `recommendation` and `comparison` kinds; snapshot reads must return the exact stored payload and version metadata. Apply IP-based rate limiting at `30 requests / 60 seconds` and return stable JSON error codes.
  **Must NOT do**: Do not recompute live results inside snapshot retrieval; do not leak stack traces; do not return ad hoc error strings without a stable `code` field.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: route contracts sit between UI, engine, DB, and evidence modules.
  - Skills: `[]` - no extra skill is needed.
  - Omitted: `playwright` - route verification is API-first.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: `9`, `10`, `11` | Blocked By: `2`, `3`, `5`, `6`

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `jikmuping/src/lib/security/validation.ts:47` - keep query parsing as a standalone schema function.
  - Pattern: `jikmuping/src/app/api/snapshots/route.ts:11` - follow the snapshot POST route shape and explicit Zod error handling.
  - Pattern: `jikmuping/src/app/api/recommendations/route.ts:1` - follow Next.js route handler structure and safe JSON responses.
  - Pattern: `jikmuping/src/lib/security/rate-limit.ts` - reuse the repo's rate-limit concept and headers.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `GET /api/recommendations` returns `200` with ranked results for a valid query and `400` for invalid input.
  - [ ] `POST /api/snapshots` persists a snapshot record with immutable payload/version fields.
  - [ ] `GET /api/snapshots/[snapshotId]` reproduces the stored payload without live recomputation.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```text
  Scenario: Recommendation API happy path
    Tool: Bash
    Steps: Run `curl "http://localhost:3000/api/recommendations?partyType=couple&partySize=2&budgetBand=mid&tripLengthDays=5&departureAirport=ICN&travelMonth=10&pace=balanced&flightTolerance=medium&vibes=romance,food"`.
    Expected: `200` response with `recommendations[0].destinationId`, `recommendations[0].scoreBreakdown.total`, `recommendations[0].trendEvidence.mode`, and `meta.scoringVersion`.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-7-recommendations.json

  Scenario: Recommendation API invalid path
    Tool: Bash
    Steps: Run `curl "http://localhost:3000/api/recommendations?partyType=couple&partySize=-1&travelMonth=13"`.
    Expected: `400` response with a stable error code such as `INVALID_QUERY`; no internal stack or raw Zod dump is exposed.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-7-invalid-query.json
  ```

  **Commit**: YES | Message: `feat(api): add recommendations and snapshot routes` | Files: `C:\jihun_roject\trip-compass\src\app\api\*`, `C:\jihun_roject\trip-compass\src\lib\security\*`

- [ ] 8. Add immutable snapshot storage and comparison resolution logic

  **What to do**: Build snapshot services that store the exact normalized query, ranked destination IDs, scoring version, and referenced trend snapshot IDs. Add comparison resolution that accepts `2-4` snapshot IDs, loads their immutable recommendation payloads, and emits a normalized compare matrix with columns `budget`, `flight`, `bestMonths`, `vibes`, `whyThisFits`, `watchOuts`, and `trendSummary`. Save compare states as `snapshotKind='comparison'` using the same snapshot table.
  **Must NOT do**: Do not compare live recomputed data; do not allow more than four destinations in one compare state; do not mutate older snapshots after new scoring versions ship.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: snapshot determinism is a product promise and a correctness boundary.
  - Skills: `[]` - no special skill is required.
  - Omitted: `frontend-ui-ux` - this task is persistence and service logic.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: `10`, `11` | Blocked By: `4`, `5`

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `jikmuping/src/app/api/snapshots/route.ts:11` - snapshot creation contract.
  - Pattern: `project1/src/lib/card-spec.ts:31` - versioned payload encoding discipline for immutable shared state.
  - Pattern: `jikmuping/src/components/scenario-explorer.tsx:224` - restore-state UX depends on durable payload retrieval.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Snapshot persistence tests prove the stored result set remains stable after a newer scoring version is inserted.
  - [ ] Comparison resolution accepts `2-4` snapshot IDs and rejects `1` or `5+` IDs with `400`.
  - [ ] The compare matrix returns normalized fields for every selected destination.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```text
  Scenario: Snapshot stays immutable across scoring changes
    Tool: Bash
    Steps: Create a recommendation snapshot, insert a newer scoring version fixture, then reload the snapshot.
    Expected: The loaded payload still references the original ranked destination IDs and scoring version.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-8-snapshot-immutable.json

  Scenario: Compare bounds are enforced
    Tool: Bash
    Steps: Call the comparison resolver with one snapshot ID and then with five snapshot IDs.
    Expected: Both requests fail with `400` and a stable bounds error code; a valid two-snapshot call succeeds.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-8-compare-bounds.json
  ```

  **Commit**: YES | Message: `feat(snapshot): add immutable recommendation and comparison snapshots` | Files: `C:\jihun_roject\trip-compass\src\lib\snapshots\*`, `C:\jihun_roject\trip-compass\src\lib\compare\*`

- [ ] 9. Build the hybrid query experience and summary-first result cards

  **What to do**: Implement the main user flow on the home route with a hybrid guided conversation and explicit filters writing into the same typed query state. Use a five-step progression: `party`, `budget`, `trip`, `timing`, `vibe`. After the guided steps, expose editable chips/controls for `departureAirport`, `pace`, and `flightTolerance`. Render result cards with `destination name`, `kind`, `why this fits`, `best months`, `budget band`, `flight band`, `Instagram vibe`, and `watch out`. The `Instagram vibe` block must sit below trip facts and above watch-outs, show at most `3` tiles, and include source labels `공식 계정`, `해시태그 기준`, `큐레이션`, or `대체 소스`. Use stable selectors from `src/lib/test-ids.ts` and render only the top `3` cards by default with an explicit “show more” action.
  **Must NOT do**: Do not build a freeform chatbot transcript UI; do not bury key information inside expandable-only sections; do not invent selectors inline; do not gate core recommendations or Instagram vibe blocks behind login.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: this is the main UX surface and needs deliberate, non-boilerplate interaction design.
  - Skills: `[]` - no extra skill is required.
  - Omitted: `playwright` - browser verification happens in the QA section, not while styling.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: Final Verification Wave | Blocked By: `2`, `3`, `5`, `6`, `7`

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `jikmuping/src/components/scenario-explorer.tsx:186` - guided recomputation flow, restore behavior, and summary-first interaction structure.
  - Pattern: `jikmuping/src/components/scenario-explorer.tsx:221` - show a top recommendation first and gate the rest behind an intentional action.
  - Reference: `C:\jihun_roject\trip-compass\src\lib\test-ids.ts` - all interactive selectors must come from the shared contract.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Playwright can complete the guided flow using `data-testid` selectors only.
  - [ ] The initial result view shows exactly three recommendation cards and a visible expand control when more results exist.
  - [ ] Each visible card includes `whyThisFits`, `Instagram vibe`, visible source labeling, and `watchOut` content without requiring hidden developer tools or API inspection.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```text
  Scenario: Guided hybrid flow returns results
    Tool: Playwright
    Steps: Click `data-testid="party-type-couple"`, `budget-mid`, `trip-length-5`, `travel-month-10`, and `vibe-romance`; set `departure-airport-ICN`; submit via `data-testid="submit-recommendation"`.
    Expected: `data-testid="result-card-0"` appears, three cards render by default, and each card shows `data-testid="instagram-vibe-0"` plus a visible source label and watch-out block.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-9-hybrid-flow.png

  Scenario: No-result state degrades gracefully
    Tool: Playwright
    Steps: Select an intentionally impossible combination, such as `trip-length-3`, `flight-tolerance-short`, and a forced long-haul-only filter fixture.
    Expected: No crash occurs; `data-testid="empty-state"` appears with `relaxable-filters` guidance and no stale old cards remain.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-9-empty-state.png
  ```

  **Commit**: YES | Message: `feat(ui): add hybrid query flow and result cards` | Files: `C:\jihun_roject\trip-compass\src\app\page.tsx`, `C:\jihun_roject\trip-compass\src\components\*`

- [ ] 10. Add save/share/restore and side-by-side compare experience

  **What to do**: Let users save a recommendation result as a snapshot, copy a shareable URL, restore a shared recommendation state, and add `2-4` saved snapshots into comparison. Use `GET /s/[snapshotId]` for recommendation restores and `GET /compare/[snapshotId]` for saved compare views. Build a dedicated compare page that displays normalized columns for `budget`, `flight`, `best months`, `vibes`, `why this fits`, `watch outs`, and `instagram vibe summary`. The share URL must reference the immutable snapshot ID, not a live query string; comparison URLs must also resolve from stored snapshot IDs. All save/share/restore/compare actions must work anonymously with no account dependency.
  **Must NOT do**: Do not compare unsaved ephemeral results; do not use localStorage as the source of truth for cross-session share links; do not allow stale live recomputation when opening a shared URL; do not introduce login walls around save/share/compare.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: this combines UX, state restoration, and structured comparison presentation.
  - Skills: `[]` - no extra skill is required.
  - Omitted: `frontend-ui-ux` - category already covers the needed UI work.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: Final Verification Wave | Blocked By: `2`, `5`, `7`, `8`

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `jikmuping/src/components/scenario-explorer.tsx:224` - restore a shared state from an API-fetched snapshot ID.
  - Pattern: `jikmuping/src/app/api/snapshots/route.ts:11` - snapshot creation API contract.
  - Pattern: `project1/src/lib/card-spec.ts:31` - remember why immutable versioned share payloads are safer than ad hoc URL state.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Anonymous users can save a recommendation, copy a share link, reopen it in a clean session, and recover the same ranked destinations.
  - [ ] Users can compare exactly `2-4` saved snapshots in a structured compare view.
  - [ ] A corrupted or expired snapshot ID shows a safe error state instead of stale or recomputed results.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```text
  Scenario: Share link restores exact recommendation
    Tool: Playwright
    Steps: Submit a valid query, click `data-testid="save-snapshot"`, copy the generated URL, open it in a fresh browser context, and wait for restore.
    Expected: The restored page shows the same top destination IDs and visible recommendation summary as the original snapshot.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-10-share-restore.png

  Scenario: Invalid snapshot fails safely
    Tool: Playwright
    Steps: Open `/s/invalid-snapshot-id` with a fake ID.
    Expected: A visible error banner or empty state appears; no previous recommendations leak into the screen.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-10-invalid-snapshot.png
  ```

  **Commit**: YES | Message: `feat(compare): add snapshot sharing and compare flow` | Files: `C:\jihun_roject\trip-compass\src\app\compare\*`, `C:\jihun_roject\trip-compass\src\components\compare\*`

- [ ] 11. Harden release behavior, docs, and operator safeguards

  **What to do**: Add `README.md` instructions, `.env.example`, source-policy notes, freshness/fallback documentation, and operator runbooks for catalog seeding and trend data refresh. Add middleware and route-level safeguards for security headers, `noindex` on API endpoints if applicable, and rate-limit headers. Document the exact MVP exclusions, the anonymous-first access model, and the rule that the product must remain shippable without Instagram approvals.
  **Must NOT do**: Do not leave env vars undocumented; do not hide operational limitations; do not add a CI pipeline unless it fits cleanly into the new repo without delaying MVP scope.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: this task is documentation-heavy with some light hardening follow-through.
  - Skills: `[]` - no extra skill is required.
  - Omitted: `playwright` - no browser interaction is needed for the docs themselves.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: Final Verification Wave | Blocked By: `2`, `4`, `7`, `8`

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `jikmuping/README.md` - mirror the concise Korean product/runtime documentation structure.
  - Pattern: `jikmuping/SECURITY.md` - follow the repo's habit of documenting known security and resilience limitations.
  - Pattern: `jikmuping/middleware.ts` - preserve security-header and indexing guardrails in the new app.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `README.md` explains setup, environment variables, run commands, and verification commands.
  - [ ] `.env.example` includes every required key for Postgres and optional evidence adapters.
  - [ ] Middleware or route tests confirm security headers and public-route protections behave as documented.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```text
  Scenario: Operator docs match runtime
    Tool: Bash
    Steps: Follow `README.md` and `.env.example` on a clean environment, then run the documented install, migrate, seed, lint, build, and test commands.
    Expected: Commands succeed without undocumented variables or hidden steps.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-11-operator-docs.txt

  Scenario: Security headers stay present
    Tool: Bash
    Steps: Start the app locally and inspect response headers for `/` and `/api/recommendations`.
    Expected: Security headers are present and the API route remains safe/indexing-aware per the documented policy.
    Evidence: C:\jihun_roject\trip-compass\.sisyphus\evidence\task-11-security-headers.txt
  ```

  **Commit**: YES | Message: `docs(ops): add runtime guide and release safeguards` | Files: `C:\jihun_roject\trip-compass\README.md`, `C:\jihun_roject\trip-compass\.env.example`, `C:\jihun_roject\trip-compass\middleware.ts`, `C:\jihun_roject\trip-compass\docs\*`

## Final Verification Wave (4 parallel agents, ALL must APPROVE)
- [ ] F1. Plan Compliance Audit - oracle
- [ ] F2. Code Quality Review - unspecified-high
- [ ] F3. Real Agent QA - unspecified-high (+ playwright if UI)
- [ ] F4. Scope Fidelity Check - deep

## Commit Strategy
- Keep commits green and vertical: scaffold -> test stack -> contracts/data -> engine -> evidence -> routes -> UI -> compare/share -> hardening/docs.
- Never commit failing tests; use local red-green-refactor within each task, then commit once the slice is green.

## Success Criteria
- A traveler can submit a hybrid query and receive deterministic, explainable recommendations with trend evidence labels.
- Trend sources can fail without breaking the recommendation experience.
- Saved links reproduce the same recommendation/comparison context from immutable snapshots.
- Unit and end-to-end suites prove recommendation quality, snapshot determinism, and compare behavior.

## Post-MVP Roadmap
- [roadmap-1]: Refine Korean traveler-facing query options and helper copy for richer Korea-origin outbound planning scenarios.
- [roadmap-2]: Tighten Instagram and curation-source messaging so every evidence block feels more natural to Korean users.
- [roadmap-3]: Connect official Meta live adapters only where approvals and quotas make the signal trustworthy.
- [roadmap-4]: Move from local fallback-first development into a real remote Postgres deployment setup with production-ready `DATABASE_URL` usage.
- [roadmap-5]: Expand destination imagery and editorial curation depth so recommendation cards feel stronger before live social signals arrive.
