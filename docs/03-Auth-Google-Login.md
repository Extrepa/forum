# Identity: Claim-Once Usernames (No Login)

## Requirements
- Reading is public
- Posting requires a claimed username
- Each username can only be claimed once
- Usernames are locked to a private session token (cookie)

## Flow
1. User submits a username on the home page
2. Server validates and inserts into `users`
3. Server sets `errl_forum_session` HttpOnly cookie
4. Future posts look up the user by session token

## Username Rules
- 3 to 20 characters
- lowercase letters, numbers, underscore
- stored normalized in `users.username_norm`

## Resetting Usernames
If you need to clear all usernames:
- `POST /api/admin/reset-users` with header `x-admin-token` set to `ADMIN_RESET_TOKEN`
- This clears all user-generated content and usernames

## Security Note
Sessions are cookie-based, not tied to a real identity. If a browser loses its cookie,
that username remains claimed until the admin reset is run.
