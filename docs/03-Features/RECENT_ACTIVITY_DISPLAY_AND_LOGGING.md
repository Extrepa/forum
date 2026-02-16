# Recent Activity: Display and Logging Consistency

**Date:** 2026-02-16  
**Scope:** Profile "Recent activity" and system logs — same level of detail and a single logging shape for all activity types.

---

## 1. Goal

- **Profile:** When viewing your profile (Edit Profile > Activity tab), every activity entry shows the **same amount of detail** whether you replied to the **post itself** or replied to a **reply** (nested comment).
- **System logs:** All such activity is **logged in the same way** (one consistent schema) so admin/system logs can filter, search, and export uniformly.

---

## 2. Profile Recent Activity — Required Detail (Same for All Entry Types)

Each row in "Recent activity" must include:

| Field | Description | Example |
|-------|-------------|--------|
| **Action type** | What the user did | "Replied to", "Posted" |
| **Target content** | Thread/post title (or clear identifier) | "Sunday Squad Chat - Camp Errl #1 2026" |
| **Context** | Section/category when applicable | "in Development", "in Lobby" |
| **Timestamp** | Date and time | "2/18/2026, 1:27 PM" |

**Reply-to-post vs reply-to-reply:**

- **Replied to post:** e.g. "Replied to [Thread title] at [timestamp]".
- **Replied to reply:** Same format. Optionally include that it was a reply to a comment (e.g. "Replied to a comment in [Thread title] at [timestamp]" or keep "Replied to [Thread title]" and ensure the link goes to the specific comment when applicable). The **amount of visible detail** (action, target, context, time) must be **equal**; only the wording may distinguish "reply to thread" vs "reply to reply" if desired.

**Posted:**

- "Posted [Post title] in [Section] at [timestamp]" (already matches the desired detail level).

No activity type should appear with less info (e.g. missing section or timestamp) on the profile.

---

## 3. System Logging — Unified Activity Schema

All user activity that appears in profile "Recent activity" should be written to system/audit logs using a **single schema** so that:

- The same fields are present for every activity type.
- Admins can filter by user, action type, section, and time.
- Export and archive formats stay consistent.

**Recommended log entry shape (conceptual):**

| Field | Type | Description |
|-------|------|-------------|
| `createdAt` | ISO timestamp | When the action occurred |
| `actor` | user id / username | Who performed the action |
| `actionType` | string | e.g. `post_created`, `reply_to_post`, `reply_to_reply` |
| `targetType` | string | e.g. `thread`, `post`, `reply` |
| `targetId` | id | ID of the thread, post, or reply |
| `targetTitle` | string | Human-readable title (thread/post title) |
| `sectionKey` | string | Section/category (e.g. `development`, `lobby_general`) |
| `parentId` | id (optional) | For reply-to-reply: the parent reply/post id |
| `source` | string | Component or API that produced the log (e.g. `posts`, `forum`) |

**Consistency rules:**

- **Reply to post:** `actionType` = `reply_to_post` (or equivalent); `targetType` = `thread` (or `post`); `targetId` = thread/post id; `targetTitle` = thread title; `sectionKey` = section.
- **Reply to reply:** Same fields; `actionType` = `reply_to_reply` (or equivalent); `parentId` = the reply being replied to; `targetTitle` still = thread title so display and logs stay aligned.
- **Posted:** `actionType` = `post_created`; `targetType` = `post`; `targetId`, `targetTitle`, `sectionKey` set.

All such events should be logged through the **same code path** (e.g. shared audit helper) so format and fields cannot drift.

---

## 4. Implementation Notes

- **Profile feed:** Ensure the query that builds "Recent activity" returns enough data (thread title, section, timestamp, and whether the action was reply-to-post vs reply-to-reply) so the UI can render the same detail for both.
- **Links:** For "Replied to [Thread title]", the link should go to the thread; if we support deep-linking to a specific reply, the same log entry can store `targetId` (thread) and `parentId` (reply) so the UI can build the correct URL.
- **Admin/System log:** Use the same `actionType` and field set for filtering and export (e.g. filter by `reply_to_reply` vs `reply_to_post` if needed).

---

## 5. Verification

- [ ] Profile Activity tab: "Replied to" entries (whether to post or to reply) show thread title, section (when applicable), and timestamp.
- [ ] Profile Activity tab: "Posted" entries show post title, section, and timestamp.
- [ ] No activity type on the profile has fewer fields than another.
- [ ] System/audit logs record all of these with the same schema (actor, actionType, targetType, targetId, targetTitle, sectionKey, timestamp; parentId when reply-to-reply).
- [ ] Admin console system log can filter/export by user and action type using this schema.
