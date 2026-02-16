import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

/** GET /api/messages/conversations - List conversations for current user */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  try {
    const { results } = await db
      .prepare(
        `SELECT c.id, c.type, c.subject, c.created_at, c.updated_at,
                (SELECT body FROM dm_messages WHERE conversation_id = c.id AND is_deleted = 0 ORDER BY created_at DESC LIMIT 1) AS last_message_preview,
                (SELECT created_at FROM dm_messages WHERE conversation_id = c.id AND is_deleted = 0 ORDER BY created_at DESC LIMIT 1) AS last_message_at,
                (SELECT author_user_id FROM dm_messages WHERE conversation_id = c.id AND is_deleted = 0 ORDER BY created_at DESC LIMIT 1) AS last_message_author_id
         FROM dm_conversations c
         JOIN dm_participants p ON p.conversation_id = c.id
         WHERE p.user_id = ? AND p.left_at IS NULL
         ORDER BY COALESCE(
           (SELECT MAX(created_at) FROM dm_messages WHERE conversation_id = c.id AND is_deleted = 0),
           c.updated_at
         ) DESC
         LIMIT 100`
      )
      .bind(user.id)
      .all();

    const conversations = results || [];
    const participantIds = new Set();
    for (const c of conversations) {
      participantIds.add(c.last_message_author_id);
    }

    // Fetch participant usernames for each conversation
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const { results: participants } = await db
          .prepare(
            `SELECT u.id, u.username, u.preferred_username_color_index
             FROM dm_participants p
             JOIN users u ON u.id = p.user_id
             WHERE p.conversation_id = ? AND p.left_at IS NULL AND u.id != ?`
          )
          .bind(conv.id, user.id)
          .all();

        const otherUsers = (participants || []).map((p) => ({
          id: p.id,
          username: p.username,
          preferred_username_color_index: p.preferred_username_color_index,
        }));

        let displayName = conv.subject || null;
        if (!displayName && conv.type === 'direct' && otherUsers.length === 1) {
          displayName = otherUsers[0].username;
        } else if (!displayName && otherUsers.length > 0) {
          displayName = otherUsers.map((u) => u.username).join(', ');
        }

        const lastAuthor = otherUsers.find((u) => u.id === conv.last_message_author_id)
          || (conv.last_message_author_id === user.id ? { username: user.username } : null);

        return {
          id: conv.id,
          type: conv.type,
          subject: conv.subject,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          last_message_preview: conv.last_message_preview,
          last_message_at: conv.last_message_at || conv.updated_at,
          last_message_author: lastAuthor?.username || 'Someone',
          participants: otherUsers,
          display_name: displayName,
        };
      })
    );

    return NextResponse.json({ conversations: enriched });
  } catch (e) {
    console.error('Error fetching conversations:', e);
    return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
  }
}
