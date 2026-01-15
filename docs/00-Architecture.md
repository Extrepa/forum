# Architecture

## Overview
This is a standalone Forum + Timeline service that can be:
- linked from the main portal as `/portal/forum`
- embedded via iframe
- reverse-proxied under the portal domain

The service handles:
- claimed usernames (no login required)
- database persistence for content
- API endpoints for announcements, threads, events
- optional moderation utilities

## Key Concepts
### Announcements
A curated feed authored by trusted users.

### Forum
User-generated threads with replies.
Basic features in MVP:
- create thread
- reply
- like thread/reply
- lock thread (admin/mod)
- soft delete reply/comment (admin/mod)

### Events
Lightweight list of upcoming plans.

## Tech Choices
### Next.js App Router
- Pages and API live in one app
- Route Handlers for API endpoints
- Easy Cloudflare Pages deployment

### Guest Identity
- Username claimed once per browser
- Stored in D1 with `session_token`
- Cookie ties posts to a user row

### Cloudflare D1
- Lightweight SQLite
- Great for MVP + modest scale
- Easy binding in Workers/Pages

### Optional: R2
- For image uploads later
- Use signed uploads; do not stream through server

## Data Flows
### Claim username
1. User submits a username
2. Server validates and inserts into `users`
3. Server sets a session cookie

### Creating Content
- Route handler checks session token
- Insert into D1
- Redirect back to page

## Roles & Permissions (Later)
- public: read-only
- user: create thread/reply, like, report
- mod: can delete replies/comments, lock threads, resolve reports
- admin: all mod privileges + announcements posting + pinning

## AI-Ready Later
Store:
- clean plain text bodies
- timestamps
- author IDs
- content type and canonical IDs

Later can add:
- `content_index` table or view
- tagging/categories
- embeddings/index pipeline
