import { redirect } from 'next/navigation';
import { getDb } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';
import { getSessionUser } from '../../../lib/auth';
import { isAdminUser } from '../../../lib/admin';
import Breadcrumbs from '../../../components/Breadcrumbs';
import Username from '../../../components/Username';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../../lib/usernameColor';
import LikeButton from '../../../components/LikeButton';
import CommentFormWrapper from '../../../components/CommentFormWrapper';
import PostHeader from '../../../components/PostHeader';
import ViewTracker from '../../../components/ViewTracker';
import CommentActions from '../../../components/CommentActions';
import DeleteCommentButton from '../../../components/DeleteCommentButton';
import { formatDateTime } from '../../../lib/dates';

export const dynamic = 'force-dynamic';

function destUrlFor(type, id) {
  switch (type) {
    case 'forum_thread':
      return `/lobby/${id}`;
    case 'project':
      return `/projects/${id}`;
    case 'music_post':
      return `/music/${id}`;
    case 'timeline_update':
      return `/announcements/${id}`;
    case 'event':
      return `/events/${id}`;
    case 'dev_log':
      return `/devlog/${id}`;
    default:
      return null;
  }
}

export default async function AnnouncementDetailPage({ params, searchParams }) {
  // Next.js 15: params is a Promise, must await
  const { id } = await params;
  
  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }
  const db = await getDb();
  const isAdmin = isAdminUser(user);
  const update = await db
    .prepare(
        `SELECT timeline_updates.id, timeline_updates.title, timeline_updates.body,
              timeline_updates.created_at, timeline_updates.updated_at, timeline_updates.image_key,
              timeline_updates.moved_to_type, timeline_updates.moved_to_id,
              timeline_updates.author_user_id,
              COALESCE(timeline_updates.views, 0) AS views,
              COALESCE(timeline_updates.is_locked, 0) AS is_locked,
              users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference,
              (SELECT COUNT(*) FROM post_likes WHERE post_type = 'timeline_update' AND post_id = timeline_updates.id) AS like_count
       FROM timeline_updates
       JOIN users ON users.id = timeline_updates.author_user_id
       WHERE timeline_updates.id = ?`
    )
      .bind(id)
    .first();

  if (!update) {
    return (
      <section className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">This announcement does not exist.</p>
      </section>
    );
  }

  if (update.moved_to_id) {
    const to = destUrlFor(update.moved_to_type, update.moved_to_id);
    if (to) {
      redirect(to);
    }
  }

  const { results: comments } = await db
    .prepare(
      `SELECT timeline_comments.id, timeline_comments.body, timeline_comments.created_at,
              timeline_comments.author_user_id,
              users.username AS author_name,
              users.preferred_username_color_index AS author_color_preference
       FROM timeline_comments
       JOIN users ON users.id = timeline_comments.author_user_id
       WHERE timeline_comments.update_id = ? AND timeline_comments.is_deleted = 0
       ORDER BY timeline_comments.created_at ASC`
    )
      .bind(id)
    .all();

  // Check if current user has liked this update
  let userLiked = false;
  try {
    const likeCheck = await db
      .prepare('SELECT id FROM post_likes WHERE post_type = ? AND post_id = ? AND user_id = ?')
      .bind('timeline_update', update.id, user.id)
      .first();
    userLiked = !!likeCheck;
  } catch (e) {
    // Table might not exist yet
  }

  // Build preferences map and assign unique colors to all usernames on this page
  const allUsernames = [
    update.author_name,
    ...comments.map(c => c.author_name)
  ].filter(Boolean);
  
  // Build map of username -> preferred color index
  const preferredColors = new Map();
  if (update.author_name && update.author_color_preference !== null && update.author_color_preference !== undefined) {
    preferredColors.set(update.author_name, Number(update.author_color_preference));
  }
  comments.forEach(c => {
    if (c.author_name && c.author_color_preference !== null && c.author_color_preference !== undefined) {
      preferredColors.set(c.author_name, Number(c.author_color_preference));
    }
  });
  
  const usernameColorMap = assignUniqueColorsForPage(allUsernames, preferredColors);

  const canToggleLock = !!user && !!user.password_hash && (user.id === update.author_user_id || isAdmin);
  const isLocked = update.is_locked ? Boolean(update.is_locked) : false;

  const error = searchParams?.error;
  const commentNotice =
    error === 'claim'
      ? 'Log in to post.'
      : error === 'missing'
      ? 'Comment text is required.'
      : error === 'locked'
      ? 'Comments are locked on this update.'
      : null;

  return (
    <div className="stack">
      <Breadcrumbs
        items={[
          { href: '/', label: 'Home' },
          { href: '/announcements', label: 'Announcements' },
          { href: `/announcements/${update.id}`, label: update.title || 'Update' }
        ]}
      />

      {isAdmin ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <form action={`/api/timeline/${update.id}/lock`} method="post" style={{ margin: 0 }}>
            <input type="hidden" name="locked" value={isLocked ? '0' : '1'} />
            <button
              type="submit"
              className="button"
              style={{
                fontSize: '12px',
                padding: '6px 10px',
                minWidth: '90px',
                minHeight: '44px',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1.2,
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                boxSizing: 'border-box',
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                <span>{isLocked ? 'Unlock' : 'Lock'}</span>
                <span style={{ whiteSpace: 'nowrap' }}>comments</span>
              </span>
            </button>
          </form>
        </div>
      ) : null}

      <ViewTracker contentType="timeline" contentId={update.id} />
      
      <section className="card">
        <PostHeader
          title={update.title || 'Update'}
          author={update.author_name}
          authorColorIndex={usernameColorMap.get(update.author_name)}
          authorPreferredColorIndex={update.author_color_preference !== null && update.author_color_preference !== undefined ? Number(update.author_color_preference) : null}
          createdAt={update.created_at}
          likeButton={
            <LikeButton 
              postType="timeline_update" 
              postId={update.id} 
              initialLiked={userLiked}
              initialCount={Number(update.like_count || 0)}
            />
          }
          showUpdatedAt={true}
          updatedAt={update.updated_at}
        />
        {update.image_key ? <img src={`/api/media/${update.image_key}`} alt="" className="post-image" loading="lazy" /> : null}
        {isLocked ? (
          <span className="muted" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
            Comments locked
          </span>
        ) : null}
        <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(update.body) }} />
        {update.views !== undefined && update.views !== null && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            fontSize: '12px',
            marginTop: '12px'
          }}>
            <span className="muted">
              {update.views} {update.views === 1 ? 'view' : 'views'}
            </span>
          </div>
        )}
      </section>

      <section className="card">
        <h3 className="section-title">Comments</h3>
        {commentNotice ? <div className="notice">{commentNotice}</div> : null}
        <div className="list">
          {comments.length === 0 ? (
            <p className="muted">No comments yet.</p>
          ) : (
            comments.map((c) => {
              const preferredColor = c.author_color_preference !== null && c.author_color_preference !== undefined ? Number(c.author_color_preference) : null;
              const colorIndex = usernameColorMap.get(c.author_name) ?? getUsernameColorIndex(c.author_name, { preferredColorIndex: preferredColor });
              const formattedDate = c.created_at ? formatDateTime(c.created_at) : '';
              return (
                <div key={c.id} className="list-item" style={{ position: 'relative' }}>
                  <DeleteCommentButton
                    commentId={c.id}
                    parentId={update.id}
                    type="timeline"
                    authorUserId={c.author_user_id}
                    currentUserId={user?.id}
                    isAdmin={!!isAdmin}
                  />
                  <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.body) }} />
                  <div className="list-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span>
                    <Username name={c.author_name} colorIndex={colorIndex} preferredColorIndex={preferredColor} />
                    {' · '}
                    <span suppressHydrationWarning>{formattedDate}</span>
                    </span>
                  </div>
                  <CommentActions
                    commentId={c.id}
                    commentAuthor={c.author_name}
                    commentBody={c.body}
                    replyHref={`/announcements/${update.id}?replyTo=${encodeURIComponent(c.id)}#comment-form`}
                  />
                </div>
              );
            })
          )}
        </div>
        {isLocked ? (
          <div className="muted" style={{ fontSize: 13, marginTop: '12px' }}>
            Comments are locked for this update.
          </div>
        ) : (
          <CommentFormWrapper
            action={`/api/timeline/${update.id}/comments`}
            buttonLabel="Post comment"
            placeholder="Drop your thoughts into the goo..."
            labelText="What would you like to say?"
          />
        )}
      </section>
    </div>
  );
}

