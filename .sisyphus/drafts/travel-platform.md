# Draft: Travel Destination Recommendation Platform

## Requirements (confirmed)
- [project goal]: "여행지를 제안해주는 플랫폼을 만들어보려고 해. 나랑 같이 대화하며 계획을 세워보자."
- [workspace root]: The new app should live at `C:\jihun_roject\trip-compass`.
- [primary audience]: Couples and small groups traveling together.
- [recommendation output]: Recommend countries/cities/regions based on user input.
- [trend context]: Show recent Instagram-style trend context and currently popular signals alongside recommendations.
- [data approach]: Use a mixed data strategy for MVP.
- [test strategy]: Include test infrastructure and write tests after implementation.
- [market scope]: Korean-origin outbound travel only for V1.
- [instagram priority]: Prefer direct Instagram integration if feasible.
- [post-result actions]: Support save/share and side-by-side comparison of destinations.
- [result card density]: Keep recommendation cards summary-first.
- [release bar]: V1 must achieve both recommendation quality and trend credibility.
- [auth scope]: No signup or login is needed for MVP.
- [instagram workstream]: Include 1) Instagram integration MVP structure, 2) Green/Yellow/Red prioritization, and 3) detailed results-screen Instagram UX.

## Technical Decisions
- [planning mode]: Use Prometheus planning flow and produce a decision-complete implementation plan after interview and repo grounding.
- [workspace direction]: Plan as a new app rather than extending `jikmuping/` or `project1/`.
- [interaction model]: V1 should use a hybrid experience combining guided conversation and explicit filters.
- [conversation scope]: Treat conversation as structured preference capture/parsing, not as freeform AI-generated recommendation logic in MVP.
- [recommendation model]: Use deterministic eligibility filters plus weighted ranking with explainable outputs.
- [trend policy]: Keep trend context separate from core ranking; use it for evidence, freshness, confidence, and light tie-breaking only.
- [instagram policy]: Do not promise broad Instagram trending discovery; use official-safe curated hashtags, curated professional accounts, and embed-only display where allowed.
- [sharing model]: Use persisted shareable snapshots rather than in-memory-only state.
- [access model]: Anonymous-first product; recommendations, share links, and comparison work without authentication.
- [instagram architecture]: Use a three-tier Instagram strategy: Green = oEmbed + professional accounts, Yellow = approved destination hashtag capsules, Red = unsupported broad destination/trending feed discovery.

## Research Findings
- [workspace]: `C:\jihun_roject` contains two Next.js apps: `jikmuping/` and `project1/`.
- [candidate base 1]: `jikmuping/` already has `.sisyphus/`, multiple recommendation APIs, and a scoring-oriented product structure.
- [candidate base 2]: `project1/` is a smaller Next.js app focused on a short card/share flow.
- [verification baseline]: Both existing apps have `lint` and `build`, but no test runner or CI pipeline is configured.
- [reference pattern - recommendation]: `jikmuping/src/app/api/recommendations/route.ts` already models heuristic scoring plus explainable outputs.
- [reference pattern - guided UX]: `jikmuping/src/components/scenario-explorer.tsx` shows a guided interaction pattern that can inspire the hybrid travel flow.
- [reference pattern - sharing]: `jikmuping/src/app/api/snapshots/route.ts` and `jikmuping/src/lib/share-snapshots.ts` show state snapshot and share-link patterns.
- [reference pattern - trend ingestion]: `jikmuping/src/lib/live-role-trends.ts` demonstrates external-data fetch plus fallback normalization.
- [instagram docs]: Official Meta APIs do not offer a general public trending-travel feed; safe surfaces are hashtag recent/top media, business discovery for professional accounts, and oEmbed for specific public posts.
- [oracle review]: Must lock a canonical `DestinationProfile`, split hard filters from weighted ranking, snapshot exact result context, and keep trend evidence separate from core recommendation order.

## Open Questions
- [none]: Interview complete; ready for plan generation.

## Scope Boundaries
- INCLUDE: product planning, repo grounding, requirement clarification, decision-complete implementation planning.
- EXCLUDE: source code implementation during planning.
