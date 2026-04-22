# Responsive and Compatibility Audit - 2026-04-21

## Scope

Wrap-up audit focused on display responsiveness and best-effort legacy iOS behavior for key shared surfaces:

- `src/app/globals.css`
- `src/components/SiteHeader.js`
- `src/components/AdminConsole.js`
- `src/components/CreatePostModal.js`
- `src/components/ProfileTabsClient.js`
- `src/app/account/AccountTabsClient.js`
- `src/components/boombox/BoomboxWidget.js`
- `src/components/UserPopover.js`

## Compatibility matrix (wrap-up baseline)

- **Desktop (modern Chromium/Firefox/Safari):** baseline supported; no blocking issues found from lint/build and smoke pass.
- **Tablet (modern Safari/Chromium):** baseline supported; verify dense admin table and tab-scroll usability per release checks.
- **Modern mobile (iOS/Android current):** baseline supported with known stress points in modal sizing, drag surfaces, and heavy blur effects.
- **Older iOS Safari (best effort):** graceful degradation targeted; advanced visual effects and some pointer behaviors may degrade but should not block core navigation/auth flows.

## Risks found

1. **Legacy media query events**
   - `window.matchMedia(...).addEventListener('change', ...)` used in shared surfaces.
   - Risk: older Safari may require `addListener/removeListener`.

2. **Dynamic viewport unit behavior**
   - Modal sizing relied on `dvh` in `CreatePostModal`.
   - Risk: old iOS Safari may ignore dynamic viewport units, causing clipped modal layouts.

3. **Pointer-heavy interactions**
   - Drag flows (`BoomboxWidget`, feed easter-egg interactions) are pointer-first.
   - Risk: partial pointer support can reduce drag reliability on older touch browsers.

4. **Heavy visual effects**
   - `backdrop-filter` and modern selector usage (`:has`, `text-wrap: balance`) appear frequently in global styles.
   - Risk: visual inconsistency or performance degradation on low-end/older devices.

## Fallbacks implemented in this wrap-up

1. **Media query listener fallback**
   - Added `src/lib/mediaQueryListener.js`.
   - Updated `SiteHeader` and `AdminConsole` to subscribe via helper using:
     - `addEventListener/removeEventListener` when available.
     - `addListener/removeListener` on legacy browsers.

2. **Modal viewport fallback**
   - Updated `CreatePostModal` to detect `CSS.supports('height', '100dvh')`.
   - If unsupported, modal height now falls back to pixel viewport sizing from `window.innerHeight`.

## Best-effort backup plan (no large redesign)

- Keep fallback-first behavior for shared primitives (media query subscriptions, modal sizing) and avoid adding new strict modern-only dependencies.
- Treat blur-heavy styling as decorative; if performance regresses on older devices, prefer disabling blur in targeted media-query overrides rather than redesigning layouts.
- For pointer-based drag interactions, maintain non-drag controls as the primary usable path.
- Preserve auth and content access as top priority over visual parity on legacy devices.

## Known limitations accepted at freeze

- Some advanced CSS polish (`:has`, balanced text wrapping, blur effects) may render differently on older iOS.
- Drag UX may be less smooth on pointer-limited browsers.
- Further hardening for extreme legacy mobile browsers is deferred unless project resumes active development.
