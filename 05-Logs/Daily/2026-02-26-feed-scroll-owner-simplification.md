# Feed Scroll Owner Simplification (2026-02-26)

## Request
- Fix nested scroll behavior on `/feed` ("scroll within scroll within scroll").
- Simplify ownership so one place controls section-page vertical scrolling.

## What changed
- Updated `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/globals.css`:
  - Added one explicit scroll-owner guard for section stacks:
    - `main > .stack > .card`
    - `main > .stack > .card > .list`
  - These now force:
    - `height: auto !important`
    - `max-height: none !important`
    - `overflow-y: visible !important`
  - Removed overlapping rule:
    - `.card:has(> .list) { overflow-y: visible; max-height: none; }`

## Why
- There were multiple places expressing similar intent for section-card scroll behavior.
- Consolidating into one explicit rule for the stack/card/list path reduces cascade ambiguity and makes ownership clear: document/window is the vertical scroller for section pages.

## Verification pass
- Confirmed working tree scope:
  - `git status --short` shows only `src/app/globals.css` modified for code change.
- Confirmed selector ownership in `globals.css`:
  - Single stack-card/list scroll-owner block exists.
  - Removed old `.card:has(> .list)` block.
- Confirmed no additional generic `.list` or `.card` vertical-scroll constraints were introduced by this patch.

## Notes
- Intentional local scroll regions remain for specific UI components (for example, popovers/menus/modals/messages/activity lists) and were not changed in this pass.
