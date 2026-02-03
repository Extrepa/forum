# Errl Portal Forum - Development Update #8

Hey everyone! This update is all about **Profile Customization**. The goal was to make your profile feel more personal and interactive. You can still edit your username and avatar like before, but now you have a lot more ways to express yourself—including setting a **mood**, a **profile song**, a **headline**, and even curating a **photo gallery**. We also added a **Guestbook** so you can leave notes on each other's profiles. Here’s what’s new.

## New Features

### Profile Customization
- **Mood & Song**: You can now set a current mood (with an emoji/theme) and a profile song (Spotify, SoundCloud, or YouTube links). The song player appears right on your profile.
- **Headline**: Set a short custom status or headline separate from your bio.
- **Gallery**: You can now upload or link up to 10 photos to a personal Gallery tab on your profile.
- **Guestbook**: A new tab on every profile where other users can leave public notes or messages for you.
- **Default Tab Preference**: You can now choose which tab visitors see first when they land on your profile (Feed, About, Guestbook, or Gallery).
- **Display Settings**: Added granular controls for what shows up on your profile—for example, you can now toggle the visibility of your User Role.

### Interactive UI
- **Avatar & Username Interactions**: Added animated reactions when you hover over avatars or usernames on desktop, or tap them on mobile.
- **Tabbed Interface**: Profiles now use a clean, tabbed layout to organize your Feed, About info, Guestbook, and Gallery.
- **Socials & Stats**: Your linked social accounts and forum stats (posts, time spent, etc.) remain easily accessible.

### Easter Eggs
- **Bubble Header**: A fun little visual treat added to the header (look for the bubbles!).

## Enhancements & Improvements

### UI/UX Polish
- **Avatar Customizer**: The flow for updating your avatar has been refined.
- **Mobile/Desktop Layouts**: Significant styling updates to `globals.css` to support the new profile layouts across different screen sizes.
- **Notifications**: Updates to the Notifications menu to better handle the new types of interactions (guestbook entries, etc.).

## Bug Fixes

- **Profile Navigation**: Fixed issues with deep-linking to specific profile tabs.
- **Song Player**: Improved embed handling for various music providers.

## Technical Improvements

### Database Migrations
- **0054_add_profile_mood_song_headline.sql**: Adds mood, song, and headline fields to users.
- **0055_add_default_profile_tab.sql**: Adds preference for default profile landing tab.
- **0056_guestbook_entries.sql**: Creates table for profile guestbook entries.
- **0057_user_gallery_images.sql**: Creates table for user gallery images.
- **0058_add_profile_cover_mode.sql**: Adds support for different profile cover display modes.
- **0059_add_profile_display_settings.sql**: Adds toggle for showing/hiding user role.

### API
- **New Routes**: Added endpoints for `profile-extras`, `profile-show-role`, `guestbook`, and `gallery` to handle the new data requirements.
- **Notifications**: Updated notification logic to support new interaction types.

## Known Issues & Notes

- **Visual Inconsistencies**: You may notice some layout differences between desktop and mobile versions of the profile. I'm working on smoothing these out.
- **GIF Avatars**: Animated avatars (GIFs) might not always play correctly in every location across the forum. This is on the radar.
- **Easter Egg Fix**: If you tried to find the Easter egg on the home page or sign-in page while signed out and it wasn't working—that's been fixed. It should be working correctly now.

---

Thanks for checking out the new profiles! Go set your mood, pick a song, and sign some guestbooks. If you spot any weirdness or bugs, drop a note in the Bugs section or a dev post.
