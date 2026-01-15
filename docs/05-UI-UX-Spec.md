# UI/UX Spec (Forum + Announcements)

## Routes
- `/` Home + claim username
- `/timeline` Announcements
- `/forum` Threads
- `/events` Events list

## Main Layout
Header:
- Logo/title
- Nav links
- Session badge (guest vs claimed username)

### Announcements
- Composer form (requires username)
- List of announcement cards

### Forum
- Thread composer form
- Thread list

### Events
- Event composer form
- List of upcoming events

## Design Constraints
- Keep it clean and portal-compatible
- Make styles themeable:
  - CSS variables: background, surface, text, accent
- Make embeddable:
  - avoid hard full-screen assumptions
  - container-friendly layout

## Components (suggested)
- `<ClaimUsernameForm />`
- `<SessionBadge />`
- `<PostForm />`
- `<AnnouncementFeed />`
- `<ThreadList />`
- `<EventsList />`

## MVP Accessibility
- visible focus states
- keyboard navigation for forms/buttons
- inline form validation messages
