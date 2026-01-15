# API Spec (Next.js Route Handlers)

Base URL: `/api`

All write operations require a claimed username (session cookie).

## Identity
### POST /api/claim
Body:
```json
{ "username": "required" }
```
Response:
```json
{ "username": "errlmember" }
```

---

## Announcements
### POST /api/timeline
Form data:
- `title`
- `body`

---

## Forum
### POST /api/threads
Form data:
- `title`
- `body`

---

## Events
### POST /api/events
Form data:
- `title`
- `starts_at` (datetime-local)
- `body` (optional details)

---

## Admin
### POST /api/admin/reset-users
Headers:
- `x-admin-token: ADMIN_RESET_TOKEN`

Clears all usernames and user content.

---

## Error Format
Errors return:
```json
{ "error": "Human readable message" }
```
