# Designus Reference Notes

## Purpose

This note exists to make the Designus-inspired part of the 떠나볼래 redesign auditable.
The request was not only to improve the UI, but to research `https://ko.designus.design/` and reflect useful patterns.

This file records the specific UI/UX observations that were taken from that reference direction and how they were translated into 떠나볼래.

## Observed Designus-style patterns

The reference direction was useful not because 떠나볼래 should visually imitate Designus, but because it shows several product-level UI behaviors clearly.

### 1. Clear section framing with strong content grouping
- Information is chunked into clearly bounded sections.
- Long pages are still readable because each block has a distinct job.
- Sections do not compete equally for attention.

### 2. Editorial surface hierarchy
- Hero zones feel like an introduction, not a dashboard.
- Supporting blocks are calmer and more document-like.
- Reading rhythm is created through contrast between strong lead sections and quieter utility sections.

### 3. Dense information without visual chaos
- Multiple pieces of information can live on one page if they are grouped by role.
- The page does not rely on loud accent colors everywhere.
- Priority is communicated by spacing, surface treatment, and typographic contrast before decoration.

### 4. Action is separated from explanation
- The main action is visually obvious.
- Explanatory or trust blocks do not look clickable.
- “What to do” and “why to trust this” are visually different layers.

### 5. Calm premium tone
- The interface feels warm and intentional rather than loud.
- Premium impression comes from restraint and hierarchy, not from many decorative tricks.

## How these findings were applied to 떠나볼래

### Home / recommendation-start flow
- Applied pattern: clear section framing + editorial hero
- 떠나볼래 change:
  - Home was restructured into an editorial hero plus a guided recommendation-start flow.
  - The page now reads as a start surface, not as a filter-heavy workspace.
- Relevant files:
  - `src/components/trip-compass/home-experience.tsx`
  - `src/components/trip-compass/experience-shell.tsx`

### Recommendation card
- Applied pattern: action separated from explanation
- 떠나볼래 change:
  - Recommendation cards were changed to verdict-first hierarchy.
  - The strongest block is now the decision verdict, followed by concise reasons and trust signals.
  - Mood evidence was demoted into a later, supporting layer.
- Relevant files:
  - `src/components/trip-compass/recommendation-card.tsx`
  - `src/lib/trip-compass/presentation.ts`

### Compare board
- Applied pattern: dense information without visual chaos
- 떠나볼래 change:
  - Compare was redesigned into a row-based decision board instead of stacked story cards.
  - The user now scans by criterion, not by decorative card chunk.
  - Mobile 2-up compare and differences-only mode were added to reduce scanning burden.
- Relevant files:
  - `src/components/trip-compass/compare-board.tsx`
  - `src/app/compare/[snapshotId]/page.tsx`

### Color system
- Applied pattern: calm premium tone + role-first emphasis
- 떠나볼래 change:
  - Color tokens were redefined to express role, not mood.
  - White/ivory became reading surfaces, yellow became selected/decision emphasis, orange became action, brown became text/anchoring structure.
  - The same warm tone is no longer overloaded for CTA, selected state, trust summaries, and warnings.
- Relevant files:
  - `src/app/globals.css`
  - `docs/uiux-style-guide.md`

## What was intentionally NOT copied

- No attempt was made to visually clone Designus.
- 떠나볼래 did not adopt marketplace, commerce, or portfolio-style content structures.
- Decorative surface behavior was translated only where it improved recommendation clarity.

The rule was:

- keep the structural strengths
- discard anything that makes 떠나볼래 look like a content marketplace instead of a recommendation product

## Why this matters for 떠나볼래

떠나볼래 is not a booking-first service and not a search-first service.
It needs to feel trustworthy, compact, and deliberate.

Designus was useful as a reference because it demonstrates:

- how to separate hero from work surface
- how to make long content easier to scan
- how to make premium UI feel calm instead of loud

Those are exactly the behaviors 떠나볼래 needed.
