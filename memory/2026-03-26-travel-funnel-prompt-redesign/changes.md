# Travel funnel prompt redesign changes

## Files changed
- `package.json`
- `package-lock.json`
- `src/app/globals.css`
- `src/components/trip-compass/home-experience.tsx`
- `src/components/trip-compass/home/landing-page.tsx`
- `src/components/trip-compass/home/hero-animation.tsx`
- `src/components/trip-compass/home/step-question.tsx`
- `src/components/trip-compass/home/progress-bar.tsx`
- `src/components/trip-compass/home/result-page.tsx`
- `src/components/trip-compass/experience-shell.tsx`

## What changed
- Reworked the home funnel into a stricter white-first layout with the app shell header/topbar hidden on the homepage funnel.
- Simplified landing to a centered headline, short supporting sentence, hero visual, and a single primary CTA.
- Simplified question screens to a spacious one-question-per-screen flow with a compact progress bar and immediate next-step behavior on selection.
- Restructured result presentation so the primary destination leads the page and secondary recommendations appear below in a simpler list form.
- Removed extra explanatory density from the lead result area by replacing the heavier reason/evidence/day-flow grouping with a shorter memo-plus-actions block.
- Tightened mobile-first type scale across landing, question, and result stages after reviewing platform typography guidance; the funnel no longer leads with oversized headings.
- Preserved recommendation fetching, snapshot save/share, compare creation, fallback copy flow, and test-id wiring.
- Restored exact e2e-visible labels (`공유 페이지 보기`, `Day-flow`) after regression verification surfaced contract mismatches.
- Added `framer-motion` and wired minimal reduced-motion-aware transitions into landing, questions, results, hero visual, and progress bar.
- Added a request invalidation guard in `home-experience.tsx` so restart/reopen actions do not allow stale recommendation responses to overwrite newer state.
- Tightened funnel color tokens toward a stricter white-first presentation in `globals.css`.

## Review notes
- Oracle review judged the redesign structurally sound, and highlighted prompt-alignment gaps around motion, white-first styling, and stale async responses.
- Those gaps were closed before final verification.
