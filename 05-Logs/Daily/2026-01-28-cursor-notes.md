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

#### 6. Profile Page Enhancements
- **Parallax Hero Avatar**: Implemented a new `ProfileAvatarHero` client component that adds a subtle parallax effect. The face and its background aura move independently based on mouse position, giving the "Neural Representation" a sense of depth and life.
- **Dynamic Background Aura**: Added a subtle radial gradient (aura) behind the avatar that dynamically matches the user's chosen username color, creating a cohesive visual identity.
- **Tightened Layout**: Optimized vertical spacing by reducing paddings above the avatar, between the face and username, and below the user role for a more compact and impactful header.
- **Integrated Layout**: Refined the profile layout to remove the nested box, allowing the avatar and large username to flow naturally between the "Profile" title and "Socials" links for a cleaner, more integrated look.
- **Prominent Username & Role**: Increased the profile username font size to 32px with heavy weights and text shadows that also match the user's signature color, followed by the "Errl Portal Resident" role for a clear visual hierarchy.
- **Clean Layout**: Explicitly suppressed the small avatar inside the `Username` component on profile pages to prevent redundancy.

## Feature Capability Audit: Avatar System

### 1. AvatarCustomizer (Frontend Interface)
- **Vector-Based Manipulation**: Real-time editing of SVG layers (Face, Eyes, Mouth, Frames).
- **Transformation Toolkit**:
    - **Precise Translation**: X/Y positioning for all elements.
    - **Dynamic Scaling**: Independent layer resizing.
    - **Rotational Control**: Full 360-degree rotation for accessories and expressions.
- **Advanced Aesthetics**:
    - **Curated & Custom Colors**: Choice between a themed palette or a precision hue-picker wheel.
    - **Animated Gradients**: Integrated SVG animation stops for "Rainbow", "Toxic", "Fire", and "Ocean" effects.
    - **Gradient Directionality**: 4-way direction control (L-R, T-B, Diagonal 1/2).
- **UX Infrastructure**:
    - **Undo/Redo Engine**: Deep history tracking (99,999 step buffer).
    - **Draggable Portal Panel**: Settings panel exists in a React Portal, allowing free movement across the entire viewport.
    - **Mobile Gestures**: Long-press to edit, double-tap to reset transforms, and touch-locked dragging.
- **Immersive Terminology**: Tooltips and UI labels utilize "errl" universe language (e.g., "Neural Representation", "Chaos Protocol").

### 2. AvatarFeature (Backend & Integration)
- **Cloud Persistence**: Automated SVG serialization and storage in R2-compatible buckets.
- **State Serialization**: Full layer data stored in database (`avatar_state`) to ensure edits can be resumed later.
- **System-Wide Deployment**: Integrated into headers, profile pages, and account settings.
- **Performance Optimized**: SVG rendering ensures lightweight, crisp visuals across all device resolutions.
- **Authorization Layer**: Strict user-specific access controls for editing and saving personal representations.

### Technical Details
- **Clamping Math**: Uses `getBoundingClientRect` of the container vs `window.innerWidth/Height` to calculate local offsets for `absolute` positioning that feels like `fixed`.
- **CSS Hierarchy**: Balanced inline React styles with global CSS overrides for maximum control over mobile behavior.

### Next Steps
- Perform test deployment.
- Monitor user feedback on mobile interaction fluidity.
