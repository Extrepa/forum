## 2026-02-01

- **Profile player + embeds:** Unified ProfileSongPlayer rendering for YouTube/SoundCloud/Spotify (embed iframe support, compact/full styles, consistent sizing), added compact progress bar, and stabilized autoplay vs pause behavior (SoundCloud getPaused + YouTube state sync).
- **Public profile layout:** Ensured header order stays username → role → mood → song, kept player pinned top-right on desktop without overflow, and preserved stacked column layout on mobile.
- **Edit profile mini-preview:** Kept a compact bar preview only (no overflow), tightened play/pause visibility, and ensured long song/provider labels truncate cleanly.
- **Username hover/popup:** Tightened hover hitbox to avoid “ghost” hover far from the username; popover positioning remains fixed to anchor.
- **Notifications panel:** Stabilized popover width and alignment so it doesn’t shrink unexpectedly on mobile/desktop.
- **Follow-up UI fixes:** Removed double borders on profile player embeds, tightened notifications popover to content, and fixed username popover width to stay fixed-size.
- **Tabs + defaults:** Default profile tab behavior supports “no default selected” and pill indicator hides when none is set; tabs reordered alphabetically and padding tightened.
- **Stats + activity parity:** Account edit and public profile stats/labels now match (including total contribution); recent activity list and “5 then scroll” behavior verified.
- **Profile extras & persistence:** Mood/song/headline save + read-back via profile-extras GET/POST; rollout-safe fallbacks for missing columns (migration 0054).
- **Gallery & notes:** Gallery limited to 10 uploads with modal preview; “Guestbook” display renamed to “Notes” and delete button compacted.
- **UI polish:** Avatar glow overflow fixes, socials icons on profile tabs, and compact layout adjustments across breakpoints.
- **Profile mood/song layout:** Moved the song column into the header slot and updated flex behavior for desktop wrap.
- **Profile mood/song tweak:** Updated right-column flex/wrap defaults to match previewed layout adjustments.
- **Profile mood/song alignment:** Centered the song column within the desktop header for a more balanced layout.
