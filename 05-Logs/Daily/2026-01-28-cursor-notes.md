# Cursor Notes - 2026-01-28

## Task: Avatar Customizer Mobile UX & Settings Panel Refinement

### Status Update
- Core avatar integration is stable and site-wide.
- Branch `feat/avatar-customizer` is ready for test deployment.
- Mobile UX for the settings panel has been significantly improved.
- **Thematic Hover Tips**: Updated 30+ tooltips across the Avatar Customizer and account tab to align with "errl" universe language (e.g., "Rewind", "Chaos Protocol", "Neural Representation").
- **Build Verified**: Successfully compiled with `npm run build` after fixing minor ESLint entity escaping issues.
- **Ready for Deployment**: All features and fixes are verified and stable.

### Key Improvements & Fixes

#### 1. Settings Panel Responsiveness & Layout
- **Fixed "Stretching" Bug**: Excluded `.avatar-customizer-panel` from global `.card` rules in `globals.css` that forced 100% width on mobile.
- **Stable Dimensions**: Enforced a strict `195px` width with dynamic height to prevent visual squishing.
- **Header Refinement**: Compacted the panel header and redesigned the "X" button (`22x12px`) to stay within the text height.

#### 2. Advanced Dragging & Positioning
- **Portal & Fixed Positioning**: Migrated the settings panel to a React Portal (`document.body`) and switched to `position: fixed`. This completely decouples it from the container's layout, preventing the panel from stretching the document or creating "blank space" when dragged to the edges.
- **Freedom of Movement**: The panel can now be dragged anywhere on the visible viewport without any "snapping" or page-stretching side effects.
- **Accurate Placement**: Position logic now uses pure viewport coordinates, making initial opening and dragging behavior much more robust.
- **Scroll Prevention**: Added `touchAction: 'none'` and `e.preventDefault()` to ensure page scrolling is locked while dragging the panel header on mobile.

#### 3. UX & Help System
- **Context Awareness**: Long-press on mobile now correctly triggers the customization panel at the touch point.
- **Clearer Instructions**: Updated the help (`?`) menu and the quick-tip overlay to explicitly separate **Desktop** (Arrows, shortcuts) vs **Mobile** (Long-press, Double-tap) controls.
- **Thematic Language**: Rewrote hover tips (`title` attributes) for all buttons and controls to use immersive, sci-fi/retro-futuristic terminology (e.g., "Sync changes to the network", "Purge", "Extract Border Hue").

#### 4. Account Interface Alignment
- **Cohesive Buttons**: Updated the "Edit Avatar", "Edit Username", and "Edit Socials" buttons in the account tab to use consistent styling and thematic tooltips.
- **Styling Sync**: Ensured the "Save Changes" button within the customizer matches the account tab's primary button aesthetic.

#### 5. Safety & Verification (Confirmation Dialogs)
- **Unsaved Changes Warning**: Implemented a `window.confirm` guard on the EXIT button. If the `historyIndex > 0` (indicating modifications were made), the system will warn the user before they abort and lose their progress.
- **Reset Confirmation**: Added a confirmation step to the "Restore Factory Defaults" (Reset) button to prevent accidental purging of custom progress.

### Technical Details
- **Clamping Math**: Uses `getBoundingClientRect` of the container vs `window.innerWidth/Height` to calculate local offsets for `absolute` positioning that feels like `fixed`.
- **CSS Hierarchy**: Balanced inline React styles with global CSS overrides for maximum control over mobile behavior.

### Next Steps
- Perform test deployment.
- Monitor user feedback on mobile interaction fluidity.
