# Integrating With the Main Portal

Goal: The portal has a "Forum" page/button that opens this service.

## Option A: Link Out (simplest)
Portal nav button opens:
- `https://forum.YOURDOMAIN.com`

Pros:
- simplest
- clean deployment boundary
Cons:
- feels like a context switch (can be visually minimized with shared styling)

## Option B: Embed (iframe)
Portal page `/portal/forum` renders an iframe:
- `src="https://forum.YOURDOMAIN.com/forum"`

Pros:
- feels integrated
Cons:
- iframe sizing considerations
- cookie/auth behaviors depend on domain setup

## Option C: Reverse Proxy (advanced)
Serve forum under:
- `https://YOURDOMAIN.com/portal/forum`
by proxying requests to the Pages deployment.

Pros:
- single origin (nice for cookies)
Cons:
- more configuration

## Recommended MVP
Option A now.
Option B later if you want "in-portal" vibes.

## Shared Design System
To match your portal look:
- implement theme CSS variables in forum app
- optionally accept `?theme=errl`
- or load a shared CSS file hosted on the portal domain
