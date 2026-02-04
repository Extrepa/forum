# 2026-02-04 Notification & Feed Refresh Notes

## Highlights

- **Notifications panel refresh**
  - Removed the tagline/“fresh transmissions” row so the header now just reads “Hey, <username>” with the new inline “Sign out” link in the top-right. The list of account/edit/profile buttons stays directly below the greeting for a tighter layout.
  - Rebuilt the notification list container so items touch edge-to-edge (`gap: 0`) while keeping a subtle divider/border between them; each card only needs its neon outline to separate it now.
  - Simplified the footer controls into one action button that toggles between “Mark all as read” and “Clear” (with the “Are you sure?” confirmation built into the handler) plus the Close button.

- **Feed “Latest” section tweaks**
  - Added a `.list--tight` modifier so the feed rows stack with zero grid gap, relying on their neon outlines for separation while leaving the rest of the list styles intact.
  - Staggered the outline animation durations for each of the 15 latest cards by assigning a per-row `--list-outline-anim-duration`, which keeps the pulsing neon outlines from syncing up and makes the feed feel more kinetic.

## Verified Files

- `src/components/NotificationsMenu.js`
- `src/app/feed/page.js`
- `src/app/globals.css`

