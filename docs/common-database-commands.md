# Common D1 Database Commands (Forum)

Below are D1/SQL commands you can keep handy for the forum. Replace table names/columns if your schema changes.

## User totals
- **Count all users:**  
  ```sql
  SELECT COUNT(*) AS total_users FROM users;
  ```
- **List every username:**  
  ```sql
  SELECT username FROM users ORDER BY username;
  ```

## User diagnostics
- **Find recent signups (last 30 days):**  
  ```sql
  SELECT id, username, created_at
  FROM users
  WHERE created_at >= datetime('now', '-30 days')
  ORDER BY created_at DESC;
  ```
- **Lookup by email:**  
  ```sql
  SELECT * FROM users WHERE email = '<target@example.com>';
  ```
- **Check for duplicate usernames:**  
  ```sql
  SELECT username, COUNT(*) AS duplicates
  FROM users
  GROUP BY username
  HAVING duplicates > 1;
  ```

## Moderation / state
- **Count banned/flagged users:**  
  ```sql
  SELECT moderation_status, COUNT(*) AS total
  FROM users
  GROUP BY moderation_status;
  ```
- **List users with a specific role (e.g., moderator):**  
  ```sql
  SELECT id, username, role
  FROM users
  WHERE role = 'moderator'
  ORDER BY username;
  ```

## Posts / activity
- **Total posts:**  
  ```sql
  SELECT COUNT(*) AS total_posts FROM posts;
  ```
- **Posts per user (top 10):**  
  ```sql
  SELECT users.username, COUNT(posts.id) AS post_count
  FROM posts
  JOIN users ON posts.user_id = users.id
  GROUP BY posts.user_id
  ORDER BY post_count DESC
  LIMIT 10;
  ```
- **Recent activity (last week):**  
  ```sql
  SELECT user_id, action, created_at
  FROM activity_log
  WHERE created_at >= datetime('now', '-7 days')
  ORDER BY created_at DESC;
  ```

## Maintenance
- **Vacuum / analyze (if supported):** run via your tooling to keep indexes healthy.
- **Backup snapshot:** export via `wrangler d1 export` or the dashboard before major schema changes.

> ⚠️ Always double-check table/column names, and run `SELECT * FROM sqlite_master` or your schema migration files if you need the latest structure before executing commands.
