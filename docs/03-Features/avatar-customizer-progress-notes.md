# Avatar Customizer Progress Notes

Date: 2026-01-29
Branch: `feat/avatar-customizer`

## Current Status
- Build: `npm run build` passes (latest run completed successfully).
- UI/UX stable; this is a working checkpoint before QoL tweaks.

## Avatar Customizer Updates
- Scale/rotate controls simplified to +/- and left/right buttons.
- Outline thickness max increased to 15.
- Gradient fills now supported for outlines and fills.
- Glitter effect animated.
- Reset defaults updated: black face with white outlines; black eyes/mouth with white outlines.
- Action buttons (Random/Reset/Import/Save/Close) downsized and compacted.
- Hint text moved above action buttons.
- Scrollbars removed from the customizer panel (content now fits).
- Save/Close button styling now matches the Save/Cancel styling from profile edits.
- Import renamed to Accessories with “Coming Soon” text and disabled styling.
- Added image fill mode (supports GIFs) and gradient direction controls.
- Added glow intensity control row (when glow selected).
- Added mirror controls (flip/mirror) and kept button rows compact.
- Added neon rainbow palette (3 rows, 4 columns).
- Added question-mark help button (gray by default, glows on hover) with popover help text.
- Tooltip/hint now overlays canvas and auto-hides unless hovering empty canvas (or tapping on mobile); hides over bottom controls.
- Undo/redo hover glow added.
- Right-click on desktop / long-press on mobile opens settings; double-click/double-tap randomizes.
- Panel width behavior: settings panel stays fixed width on small viewports; canvas can scroll when needed.
- Removed extra nested box around the customizer so there’s a single rainbow outline.
- Save output viewBox tightened (no extra padding) to fix avatar centering; main + mini previews now centered.

## Account Profile Tab (Own Profile)
- Profile and Stats are separate cards; pink header underline removed.
- Avatar preview condensed (no large outer box when not editing).
- Mini preview displayed beside main avatar with label “Mini preview.”
- Three edit buttons: Edit Avatar / Edit Username / Edit Socials.
- Buttons aligned to their respective rows without resizing the card.
- Edit Avatar opens a full-width editor panel below the avatar row (no clipping).
- Edit Username opens only username + color controls.
- Edit Socials opens only socials editor.
- Username link disabled on account profile tab to avoid self-link.

## Public Profile Page (Viewing Others)
- Username label removed; now just avatar + username + socials.
- Profile/Stats presented as separate cards.
- Header underline removed.

## Notes
- All changes currently live only on `feat/avatar-customizer`.
- If needed, run `./deploy.sh --preview` for a preview deploy.
- Switched avatar previews back to `next/image` (unoptimized) after save centering fix.
