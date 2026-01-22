# Errl Portal Forum - Development Update

Hey everyone! I've been working on a bunch of improvements and fixes since the initial release. Here's what's new and what's been improved.

## New Features

### Development Posts - Markdown File Upload
- You can now upload a Markdown file directly when creating development posts
- Just click "Upload Markdown file" in the form and select your `.md` or `.markdown` file
- The content will automatically populate the body field - perfect for longer posts!

### Enhanced Home Page
- Expanded from 6 to 11 section cards on the home page
- Added cards for Art & Nostalgia, Bugs & Rants, Development, Lore, and Memories
- Some sections are only visible when signed in (Development, Lore, Memories)

### Landing Page Preferences
- New users default to the Feed page instead of the home page
- You can change your landing page preference in account settings
- Choose between Home and Feed as your default landing page

### Browser-Based Login Detection
- The sign-up form now detects if your browser supports modern authentication APIs
- UI adapts based on what authentication methods are available
- Better experience for users with different browser capabilities

## Improvements

### Navigation & Discovery
- **Fixed navigation links**: Expanded menu links now navigate correctly (no more broken clicks!)
- **Mobile navigation**: Horizontal scrolling on small screens instead of wrapping
- **Wrapped layout**: Navigation menu now uses a wrapped layout showing all options in ~3 rows
- **Desktop search**: Search icon now appears in the desktop header
- **No duplicates**: Removed duplicate navigation buttons and search icons

### Thread Layout & Replies
- **Unified thread layout**: Forum threads now use a Reddit-style unified layout where the original post and replies are in a single card
- **Better reply hierarchy**: Author and timestamp now appear at the top of each reply
- **Form at bottom**: Reply form moved to the bottom of the thread (standard forum convention)
- **Visual separation**: Clear borders separate replies from the form

### Header & Welcome
- **Personalized welcome**: Welcome message now includes your username ("Welcome back [username]")
- **Larger logo**: Errl SVG logo is now 28% larger on desktop and 27% larger on mobile for better visibility
- **Icon-only search**: Search button converted to a clean icon-only design
- **Cleaner header**: Removed "Posting as" badge for a cleaner look

### Events
- **Calendar icon**: Events now display a calendar icon for visual clarity
- **Larger dates**: Event dates are more prominent and easier to read
- **Photo uploads**: You can now upload photos/flyers for events
- **RSVP integration**: RSVP checkbox integrated directly into the comment form
- **Smart date display**: Shows "Today", "Tomorrow", or relative dates for upcoming events
- **Compact attendee list**: See who's attending in a clean, compact format

### Post Cards & Layout
- **Fully clickable**: Entire post cards are now clickable (not just titles)
- **More condensed**: Reduced padding and compact metadata for better information density
- **Better hover states**: Improved visual feedback when hovering over cards

### Page Organization
- **Lore & Memories combined**: These two sections are now combined into a single "Lore & Memories" page
- **Lobby renamed**: "Lobby" section is now called "General" for clarity
- **Better navigation**: Improved navigation structure throughout

### Admin Features
- **Edit any post**: Admins can now edit any post (not just their own)
- **Proper authorization**: All admin endpoints have proper authorization checks
- **Moderation tools**: Better tools for keeping content organized

### Timezone & Dates
- **PST/PDT timezone**: All timestamps now display correctly in Pacific timezone (automatically handles daylight saving time)
- **Centralized formatting**: Date/time formatting utility for consistency across the app
- **Better relative time**: Improved display ("2 hours ago", etc.)

## Responsive Design

### Mobile (< 640px)
- **Touch-friendly**: All interactive elements meet the 44px minimum touch target
- **Better layout**: Header stacks vertically, navigation wraps properly
- **Formatting toolbar**: Moved below textarea for better mobile experience
- **Responsive images**: Images scale properly and maintain aspect ratios
- **Full-width buttons**: Buttons take full width on mobile for easier tapping

### Tablet (641px - 1024px)
- **Optimized padding**: Better use of space with adjusted padding
- **Compact toolbar**: Formatting toolbar is more compact
- **Balanced layout**: Optimized spacing for medium-sized screens

### Large Screens (1025px+)
- **More breathing room**: Increased padding for better use of large screens
- **Better spacing**: Optimized layout for desktop viewing

## Technical Improvements

### Code Quality
- All changes follow existing code patterns
- Proper error handling throughout
- Rollout-safe database queries with fallbacks
- No linter errors
- Backward compatible with existing content

### Date Formatting
- Centralized date/time formatting utility (`src/lib/dates.js`)
- Consistent PST/PDT timezone handling across the entire application
- Automatic daylight saving time handling

## Known Issues & Feedback

I'm aware of some user interface display issues that still need attention. I'm prioritizing functionality right now, but the look and feel is important to me too. If you notice anything that looks off or doesn't work as expected, please let me know! You can:

- Post in the **Bugs** section if you find any problems
- Let me know if something doesn't work as expected
- Share any UI/UX feedback you have

I'm learning a lot building this, and it's been a lot of fun! If any of you want to get involved or learn more about how this works, I'm happy to teach you. Just reach out!

## What's Possible Now

With all these improvements, here's what you can do:

- **Create development posts** with markdown file uploads for longer content
- **Navigate more easily** with fixed navigation and better mobile experience
- **See timestamps** in your local timezone (PST/PDT)
- **RSVP to events** directly from the comment form
- **Upload event photos** to make your events more engaging
- **Customize your landing page** to start where you want
- **Enjoy a cleaner interface** with improved layouts and spacing
- **Use the forum on any device** with comprehensive responsive design

Thanks for being part of this! Let me know if you run into any problems or have suggestions for improvements.
