# SooGo UI/UX Style Guide

## 1. Product stance

SooGo is not a search engine and not a booking-first OTA.
It is a `discovery-first destination recommendation service` for Korean outbound travelers.

The UI should therefore optimize for three moments:

1. `Fast discovery`
2. `Trust and understanding`
3. `Save and compare`

If a screen looks beautiful but makes destination choice slower, it is wrong for this product.

## 2. Core UX principle

The service should feel like:

- `magazine cover` at the top
- `decision workspace` in the middle
- `comparison board` at the bottom

The user should feel inspired first, then reassured, then ready to decide.

## 3. Who we are designing for

Primary users:

- Korean users in their 20s and 30s
- planning a short overseas trip such as `4 nights / 5 days`
- not sure where to go yet
- comparing mood, budget, season, and flight burden

This means the product must prioritize:

- departure airport
- trip length
- season fit
- budget feel
- flight fatigue
- companion fit

before long-form destination storytelling.

## 4. What we are not

Do not make SooGo feel like:

- a blank search page
- a map-first exploration tool
- an OTA with booking buttons everywhere
- a lifestyle feed with weak decision support
- a generic dashboard for account settings

## 5. Visual direction

Recommended aesthetic direction:

`Warm editorial planning desk`

Meaning:

- warm neutrals instead of cold SaaS blues
- premium but calm, not flashy-luxury
- tactile paper-like surfaces for decision areas
- one strong editorial hero, then lighter work surfaces

Current issue in the product:

- too many surfaces share the same dark glass treatment
- hero, form, result, and account sections feel too visually similar
- information hierarchy is flatter than it should be

Target correction:

- keep the top hero atmospheric
- make recommendation and compare surfaces brighter, clearer, and easier to scan

## 6. Color system

Use color with role clarity.

- `paper`: planning surface and readable content background
- `ink`: primary text and rational decision layers
- `sand`: metadata, section labels, secondary guidance
- `accent`: only for action, urgency, or standout partner modules

Rules:

- do not let accent dominate recommendation cards
- do not use Instagram-like mood colors to overpower trust information
- trust layers should feel cleaner and quieter than mood layers

## 7. Typography

Korean must be treated as first-class typography, not fallback text.

Rules:

- Korean headings should be strong, readable, and compact
- display typography can be expressive, but must not reduce Korean readability
- reduce unnecessary all-caps micro-labels in Korean-first screens
- mixed English labels should be removed unless they are brand language or unavoidable proper nouns

Bad examples to avoid:

- `Why Sign In`
- `Trust First`
- `Optional Identity`

Use Korean-first labels instead.

## 8. Information architecture

The main flow should always read as:

1. `Trip intent`
2. `Top 3 recommendations`
3. `Why this fits`
4. `Trust signals`
5. `Save / Compare`
6. `Mood evidence`
7. `More options or relax filters`

Feed logic should follow:

- `attract -> explain -> narrow -> compare`
- not `search -> list -> booking`

Important:

- mood is supporting proof, not ranking authority
- explanation must appear before the user needs to scroll far
- compare should feel central, not optional decoration

## 9. Home screen structure

The home page should have these zones in order:

### Hero
- one clear editorial proposition
- one-line explanation of how recommendations work
- optional identity card as a side module, not the hero itself

### Intent selection
- chips and guided steps, not a giant search bar
- quick-start prompts should feel like travel intent
- examples:
  - `첫 유럽 여행`
  - `커플 4박 5일`
  - `비행 짧은 도시 여행`
  - `휴양보다 도시 구경`

### Recommendation block
- top 3 cards only by default
- one clear “show more” action
- compare tray should become visible as soon as saved cards exist

### Discovery rails
- organize later expansion into themed rails, not generic lists
- examples:
  - `이번 달 서울 출발로 가기 좋은 곳`
  - `4박 5일 커플 여행`
  - `같은 분위기, 더 낮은 예산`
  - `짧은 비행으로 가는 도시 여행`

### Recovery / refinement
- empty state must suggest one-tap relaxations
- never leave the user with a dead-end “no results” message

## 10. Recommendation card structure

Each recommendation card should always follow this order:

1. destination identity
2. trust summary
3. recommendation reason
4. trip facts
5. mood evidence
6. watch-outs
7. next actions

The card should answer:

- Why is this here?
- Why should I trust it?
- What tradeoff should I know?
- What can I do next?

Recommendation mix rule for discovery surfaces:

- `70%` safe-fit
- `20%` adjacent stretch
- `10%` wildcard / unexpected but plausible

This keeps the product feeling like discovery, not rigid filtering.

## 11. Trust-first design rules

SooGo wins if users trust the recommendation before they admire the aesthetic.

Trust signals should include:

- score or match quality
- season fit
- flight fit
- evidence source type
- evidence freshness
- evidence count
- concise reason tags

Do not hide these behind taps.

Social or editorial evidence should come after trust is established.

## 12. Mood evidence rules

The “Instagram / YouTube-like” layer should attract attention, but remain clearly secondary.

Use it for:

- emotional imagination
- place vibe confirmation
- social proof texture

Do not use it for:

- ranking order explanation
- replacing recommendation logic
- overpowering trust signals visually

## 13. Compare-first behavior

Comparison is a core feature, not a utility.

Rules:

- saved cards should naturally feed comparison
- compare tray must remain obvious on mobile
- compare board should behave like aligned criteria rows, not stacked story cards
- every 4-6 cards in a longer feed should create a narrowing moment: save, skip, compare, or relax filters

Compare criteria should prioritize:

- budget feel
- flight burden
- best season
- trip vibe
- why this fits
- watch-outs
- mood summary

## 14. Account / identity UX

Identity is optional, memory is the value.

Therefore:

- do not present login as a barrier
- do present login as a way to keep travel memory
- account pages should feel like a “travel memory studio,” not a generic settings page

The message is:

- anonymous use is normal
- login only adds memory and personalization

## 15. UX writing rules

Based on product fit and the referenced UX writing guidance:

- write for action, not for explanation alone
- reduce anxiety, especially on auth, compare, and empty states
- every microcopy block should help users decide what to do next

### CTA writing
- use action-centered language
- prefer “what happens next” over feature names

Good:
- `이 조건으로 여행지 추천 받기`
- `저장하고 비교하기`
- `이 조건 조금 완화하기`

### Error writing
- never blame the user
- include recovery direction when possible

Good pattern:
- what happened
- how to recover

### Empty state writing
- acknowledge the gap
- offer one-tap next actions
- do not make the user rethink everything from zero

## 16. Mobile-first rules

This is a mobile web product first.

Prioritize:

- one-thumb actions
- sticky compare tray
- short card sections
- clear “next action” placement
- minimal horizontal scanning

Avoid:

- dense multi-column content above the fold
- hidden critical actions
- giant filter panels that feel like forms

## 17. What to remove or avoid

Avoid these common travel-app mistakes:

- giant global search as the main hero
- early map obsession
- booking CTAs before recommendation trust is formed
- too many filters in MVP
- review-score overload with weak explanation
- feed interruptions that look like ads
- “inspiration-only” visuals without decision support

## 18. Monetization-safe UX rules

Ads should not touch the recommendation core in MVP.

Later safe placements:

- one clearly labeled sponsored card below top organic recommendations
- one sponsored row on the compare page
- partner offer modules on destination detail or booking-intent surfaces

Ad placement posture:

- `adjacent, labeled, relevant`
- never `hidden, ranking-changing, interruptive`

Rules:

- always label with `Sponsored`, `Partner`, or equivalent Korean plain language
- never insert paid content into the top 1-3 organic recommendation slots
- never phrase sponsored inventory as SooGo’s neutral recommendation
- never let payment silently change ranking logic
- never break scroll rhythm with interstitial-style interruptions in the discovery feed

## 19. MVP screen list

Keep MVP to:

- Home / discovery
- Recommendation results
- Saved card restore
- Compare board
- Optional auth
- Travel profile / memory

Do not add yet:

- map-first search
- itinerary planner
- booking engine
- chat transcript UI
- review community
- loyalty or membership layers

## 20. Decision filter for future UI work

Before approving a UI change, ask:

1. Does this help users discover a destination faster?
2. Does this make the recommendation more trustworthy?
3. Does this make save/compare easier?
4. Does this keep the product discovery-first rather than search-first?

If the answer is no, the UI idea is probably off-strategy.
