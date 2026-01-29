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
    try {
      const adminUser = await db
        .prepare(
          'SELECT users.username, users.preferred_username_color_index FROM admin_sessions JOIN users ON users.id = admin_sessions.user_id WHERE admin_sessions.token = ?'
        )
        .bind(token)
        .first();
      if (adminUser) {
        return (
          <div className="muted">
            Posting as <Username 
              name={adminUser.username} 
              colorIndex={getUsernameColorIndex(adminUser.username, { preferredColorIndex: adminUser.preferred_username_color_index })} 
            />
          </div>
        );
      }
    } catch (error) {
      // Ignore if admin_sessions table doesn't exist yet.
    }
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
