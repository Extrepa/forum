# Errl Portal Forum - Development Update #6

Hey everyone! This update is a big one: **Errl Avatars**, a **full notification system overhaul**, **account personalization**, **admin alerts**, and a ton of **UI stability fixes**. I am especially excited about the Errl Avatar feature, and I will post a full guide on how to use it soon. Here is everything that has landed since the last update.

## New Features

### Errl Avatars (Customizer + Site-Wide Display)
- **Errl Avatar system is live**: Upload or customize an Errl Avatar and it now appears across the forum (account, profile, header, username displays).
- **Avatar customizer**: Multi-layer SVG editor with drag, scale, rotate, randomize, and color/finish controls.
- **Layer tools**: Copy/paste, duplicate, delete, and right-click (or long-press on mobile) advanced controls.
- **Undo/redo history**: Deep history buffer for changes (safe experimentation).
- **Errl Avatar storage**: Avatar SVGs stored in R2, state serialized in D1 (`avatar_state`).

### Notification System Overhaul
- **New notification types**: Mentions, Likes, RSVPs, Project Updates, Replies, and Comments.
- **Mentions everywhere**: `@username` parsing works across all sections and links to profiles.
- **Outbound alerts**: Optional email + SMS delivery (Resend/Twilio) when configured.
- **Notification preferences**: New per-type toggles (RSVP, Like, Update, Mention, Reply, Comment).
- **Signup notification prefs**: Users choose email/SMS defaults during signup.

### Project Updates (Opt-In)
- **Per-project updates**: Authors can enable updates and post update entries.
- **Participant notifications**: Updates notify commenters/participants (respecting prefs).

### UI Color Settings
- **Theme controls**: Rainbow, Black & White, Custom Neon, plus optional Invert Colors.
- **Custom border color**: User-defined neon border color applied site-wide.

### Account Stats: Time Spent
- **Total minutes tracked**: New account stat showing total active minutes.
- **Heartbeat tracker**: Updates once per minute with multi-tab safeguards.

### Admin Notifications
- **Admin-only alert types**: New user signups and new forum threads.
- **Admin preferences card**: Separate admin-only notification toggles.

### Preview Environment Isolation
- **Preview vs production isolation**: Branch deployments now target a preview env, preventing accidental production overwrites.
- **New workflow doc**: Documented branch deploy process in `docs/02-Deployment/NEW-BRANCH-WORKFLOW.md`.

## Enhancements & Improvements

### Errl Avatar Customizer UX
- **Mobile-ready settings panel**: Portal + fixed positioning, no stretching or page growth.
- **Touch controls**: Long-press to edit, double-tap randomize, drag without scroll interference.
- **Help system**: Clear desktop vs mobile instructions in the help popover.
- **Safety guards**: Confirm dialogs for reset and exit if changes exist.
- **Cleaner UI**: Condensed action bar, improved spacing, and styled tooltips in Errl language.

### Profile Page Polish
- **Parallax hero avatar**: Subtle depth effect with aura matching username color.
- **Cleaner header layout**: Tighter spacing, larger username, role label with role-based colors.
- **No duplicate avatar**: Suppressed the small avatar in the Username component on profile pages.

### Account UI Refinements
- **Contact Info card**: Email + phone combined into one edit flow.
- **Notification preferences card**: Expanded, clearer defaults, and better sync after saving.
- **Edit button behavior**: Prevents accidental form submits and shows disabled inputs clearly.

### Feed & Meta Layout Improvements
- **Feed sorting fixed**: Now prioritizes most recent activity (not just created date).
- **Responsive PostMetaBar**: Two-row desktop layout, structured multi-row mobile layout.
- **Events on mobile**: Post time and stats align correctly, no missing time.

### Project Replies (Image Upload Flow)
- **Image-only replies supported**: Text optional when images are allowed.
- **Improved errors**: Distinguishes permission vs upload failures.
- **Better logging**: Clear server + client logs for debugging upload issues.

### Mobile Auth & Navigation
- **Sign-in default**: Login shown by default instead of signup.
- **Full-width inputs**: Mobile auth form no longer cuts off text or buttons.
- **Navigation padding**: More breathing room at the bottom of mobile menus.
- **Notifications popover**: Mobile positioning now stays fully on-screen.

### Username Popover
- **Sizing fixes**: No longer forced to full-width on mobile.
- **Color resolution**: Preferred username color now resolves consistently.
- **Touch support**: Tap to open/close, click-outside to close restored.

## Bug Fixes

### Replies & Events
- **Project replies respect locks**: Locked projects now block replies (matching comments).
- **Event time validation**: Malformed time strings are rejected instead of silently defaulting.

### Auth & Header
- **Header buttons after sign-in**: Auth state now refreshes immediately without needing navigation.

### UI Stability
- **Popover regressions**: Username popover positioning and width constraints stabilized.
- **Feed layout**: Mobile wrapping no longer breaks stats/date alignment.

## Technical Improvements

### Database Migrations
- **0042_notification_type_prefs.sql**: Notification type toggles.
- **0043_add_reply_comment_notification_prefs.sql**: Reply/comment toggles.
- **0044_add_project_updates_enabled.sql**: Project updates opt-in.
- **0045_add_ui_color_settings.sql**: UI color mode, border color, invert.
- **0046_add_user_avatar.sql**: Errl Avatar state + key storage.
- **0047_add_user_time_spent.sql**: Time spent tracking fields.
- **0048_add_admin_notification_prefs.sql**: Admin notification prefs.

### Notification Infrastructure
- **Outbound helper**: Shared delivery handler for email/SMS with preference gating.
- **Mentions library**: Centralized mention parsing + notification creation.

## Known Issues & Notes

- **Errl Avatar guide coming**: I will post a step-by-step guide for Errl Avatar creation and usage soon.
- **Popovers on tiny screens**: Positioning is much improved, but keep an eye out for edge cases on very small devices.

Thanks for testing and pushing the forum forward. If anything feels off, drop a note in Bugs or a dev post and I will prioritize it.
