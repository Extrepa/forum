import { getDb } from '../lib/db';
import { getSessionToken } from '../lib/session';
import Username from './Username';
import { getUsernameColorIndex } from '../lib/usernameColor';

export default async function SessionBadge() {
  const token = await getSessionToken();
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
    .prepare('SELECT username, preferred_username_color_index FROM users WHERE session_token = ?')
    .bind(token)
    .first();

  if (!user) {
    return <div className="muted">Guest reader</div>;
  }

  return (
    <div className="muted">
      Posting as <Username 
        name={user.username} 
        colorIndex={getUsernameColorIndex(user.username, { preferredColorIndex: user.preferred_username_color_index })} 
      />
    </div>
  );
}
