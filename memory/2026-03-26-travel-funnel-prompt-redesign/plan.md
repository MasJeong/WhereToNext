# Travel funnel prompt redesign plan

## Goal
- Align the SooGo homepage funnel with the external `travel_funnel_prompt.txt` spec.
- Preserve the existing recommendation engine, save/share/compare flows, and test-id contracts.

## Planned work
1. Read the external prompt and reference JSX from `/Users/jihun/Desktop/AI프롬프트/soogo/uiux/`.
2. Map the current funnel implementation in `home-experience.tsx` and related home components.
3. Redesign landing, question, and result presentation toward a strict white-first minimal funnel.
4. Keep recommendation query derivation and snapshot flows intact.
5. Verify with diagnostics, lint, targeted unit coverage, production build, and recommendation e2e flow.
6. Tighten any prompt mismatches found during review, especially motion and white-first styling.

## Constraints
- No gradients in the funnel experience.
- One primary CTA per screen.
- One question per screen with immediate forward movement.
- Result page should lead with one primary destination and simplified secondary recommendations.
- No `any`, suppression comments, or unrelated business-logic changes.
