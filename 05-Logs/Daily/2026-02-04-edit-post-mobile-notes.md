# 2026-02-04 edit post mobile fixes

## Summary
- Added layout tweaks for the edit form so every label/textfield spans the full width and wraps, preventing overflow on small screens; the toolbar now wraps and shrinks its buttons below 640px, while the textarea keeps long markdown chunks from forcing horizontal scroll (`.text-field`, `.formatting-toolbar`, `input`, `textarea`).
- Ensured the toolbar remains single-line and scrollable on larger screens but becomes multi-line on phones with smaller buttons, and slightly reduced font sizes so the whole form reflows cleanly on mobile without clipping.

## Testing
- Not run (not requested).
