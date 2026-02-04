# 2026-02-04 edit controls

## Summary
- Introduced the `PostActionMenu` wrapper so that every thread/post/devlog/etc. detail page now renders the lock/hide/pin/delete controls in a floating overlay that only shows when hovering or tapping the edit button (and keeps delete pinned to the right). Each page now passes the extra actions through the new component instead of rendering separate buttons in the breadcrumb bar.
- Stylized the popover to keep the menu in line with the edit trigger, allow it to overflow above the breadcrumb row when needed, shrink gracefully on small screens, and animate the highlight when the menu is open while keeping a clean outline on the buttons. The breadcrumb row stays non-wrapping and visible to make room for the overlay.
- Added visual feedback to the pin/hide controls (active glow) and refined the hover/click handling so the menu stays open longer while you interact with the buttons and keeps the edit trigger highlighted when edit mode is active.

## Testing
- Not run (not requested).
