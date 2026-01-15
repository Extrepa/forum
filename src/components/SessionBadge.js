import { getDb } from '../lib/db';
import { getSessionToken } from '../lib/session';

export default async function SessionBadge() {
  const token = getSessionToken();
  if (!token) {
    return <div className="muted">Guest reader</div>;
  }

  let db;
  try {
    db = await getDb();
  } catch (error) {
    return <div className="muted">Guest reader</div>;
  }
  const user = await db
    .prepare('SELECT username FROM users WHERE session_token = ?')
    .bind(token)
    .first();

  if (!user) {
    return <div className="muted">Guest reader</div>;
  }

  return <div className="muted">Posting as {user.username}</div>;
}
