import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';
import { renderMarkdown } from '../../../lib/markdown';
import { formatDateTime } from '../../../lib/dates';
import { isAdminUser } from '../../../lib/admin';
import PageTopRow from '../../../components/PageTopRow';
import EditPostButtonWithPanel from '../../../components/EditPostButtonWithPanel';
import DeletePostButton from '../../../components/DeletePostButton';
import PostEditForm from '../../../components/PostEditForm';
import HidePostButton from '../../../components/HidePostButton';
import Username from '../../../components/Username';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../../lib/usernameColor';
import LikeButton from '../../../components/LikeButton';
import PostHeader from '../../../components/PostHeader';
import ViewTracker from '../../../components/ViewTracker';
import ReplyButton from '../../../components/ReplyButton';
import DeleteCommentButton from '../../../components/DeleteCommentButton';
import CollapsibleCommentForm from '../../../components/CollapsibleCommentForm';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MemoriesDetailPage({ params, searchParams }) {
  // Next.js 15: params is a Promise, must await
  const { id } = await params;
  
  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }

  const db = await getDb();

  let post = null;
  let comments = [];
  let dbUnavailable = false;

  try {
    post = await db
      .prepare(
        `SELECT posts.id, posts.author_user_id, posts.type, posts.title, posts.body, posts.image_key, posts.is_private,
                posts.created_at, posts.updated_at,
              COALESCE(posts.views, 0) AS views,
              COALESCE(posts.is_locked, 0) AS is_locked,
              COALESCE(posts.is_hidden, 0) AS is_hidden,
              COALESCE(posts.is_deleted, 0) AS is_deleted,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                users.avatar_key AS author_avatar_key,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'post' AND post_id = posts.id) AS like_count
         FROM posts
         JOIN users ON users.id = posts.author_user_id
         WHERE posts.id = ? AND posts.type = 'memories'`
      )
      .bind(id)
      .first();

    if (post) {
      const out = await db
        .prepare(
          `SELECT post_comments.id, post_comments.body, post_comments.created_at,
                  post_comments.author_user_id,
                  users.username AS author_name,
                  users.preferred_username_color_index AS author_color_preference,
                  (SELECT COUNT(*) FROM post_likes WHERE post_type = 'post_comment' AND post_id = post_comments.id) AS like_count,
                  (SELECT 1 FROM post_likes WHERE post_type = 'post_comment' AND post_id = post_comments.id AND user_id = ? LIMIT 1) AS liked
           FROM post_comments
           JOIN users ON users.id = post_comments.author_user_id
           WHERE post_comments.post_id = ?
             AND post_comments.is_deleted = 0
           ORDER BY post_comments.created_at ASC`
        )
        .bind(user?.id || '', id)
        .all();
      comments = out?.results || [];
    }
  } catch (e) {
    dbUnavailable = true;
    post = null;
    comments = [];
  }

  if (dbUnavailable) {
    return (
      <section className="card">
        <h2 className="section-title">Memories</h2>
        <p className="muted">Memories is not available yet on this environment. Apply migration 0017_shared_posts.sql.</p>
      </section>
    );
  }

  if (!post) {
    return (
      <section className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">This post does not exist.</p>
      </section>
    );
  }

  const isAdmin = isAdminUser(user);
  const canEdit = !!user && !!user.password_hash && (user.id === post.author_user_id || isAdmin);
  const canDelete = canEdit;
  const canToggleLock = isAdmin;
  const isLocked = post.is_locked ? Boolean(post.is_locked) : false;
  const isHidden = post.is_hidden ? Boolean(post.is_hidden) : false;
  const isDeleted = post.is_deleted ? Boolean(post.is_deleted) : false;

  if (isDeleted) {
    return (
      <section className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">This post does not exist.</p>
      </section>
    );
  }

  if (isHidden && !canEdit) {
    return (
      <section className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">This post does not exist.</p>
      </section>
    );
  }

  const error = searchParams?.error;
  const editNotice =
    error === 'claim'
      ? 'Log in to post.'
      : error === 'unauthorized'
      ? 'Only the post author can edit this.'
      : error === 'upload'
      ? 'Image upload is not allowed for this username.'
      : error === 'too_large'
      ? 'Image is too large (max 5MB).'
      : error === 'invalid_type'
      ? 'Only image files are allowed.'
      : error === 'missing'
      ? 'Title and body are required.'
      : error === 'notfound'
      ? 'This post does not exist.'
      : null;

  const commentNotice =
    error === 'password'
      ? 'Set your password to continue posting.'
      : error === 'missing'
      ? 'Comment text is required.'
      : error === 'locked'
      ? 'Comments are locked on this post.'
      : error === 'notready'
      ? 'Comments are not enabled yet (database updates still applying).'
      : null;

  // Build preferences map and assign unique colors to all usernames on this page
  const allUsernames = [
    post.author_name,
    ...comments.map(c => c.author_name)
  ].filter(Boolean);
  
  // Build map of username -> preferred color index
  const preferredColors = new Map();
  if (post.author_name && post.author_color_preference !== null && post.author_color_preference !== undefined) {
    preferredColors.set(post.author_name, Number(post.author_color_preference));
  }
  comments.forEach(c => {
    if (c.author_name && c.author_color_preference !== null && c.author_color_preference !== undefined) {
      preferredColors.set(c.author_name, Number(c.author_color_preference));
    }
  });
  
  const usernameColorMap = assignUniqueColorsForPage(allUsernames, preferredColors);

  // Check if current user has liked this post
  let userLiked = false;
  let likeCount = 0;
  try {
    const likeCheck = await db
      .prepare('SELECT id FROM post_likes WHERE post_type = ? AND post_id = ? AND user_id = ?')
      .bind('post', post.id, user.id)
      .first();
    userLiked = !!likeCheck;
    likeCount = post.like_count || 0;
  } catch (e) {
    // Table might not exist yet
    likeCount = post.like_count || 0;
  }

  return (
    <div className="stack">
      <PageTopRow
        items={[
          { href: '/', label: 'Home' },
          { href: '/memories', label: 'Memories' },
          { href: `/memories/${id}`, label: post.title || 'Untitled' },
        ]}
        right={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isAdmin ? <HidePostButton postId={id} postType="post" initialHidden={isHidden} /> : null}
            {canToggleLock ? (
              <form action={`/api/posts/${id}/lock`} method="post" style={{ margin: 0 }}>
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
            ) : null}
            {isAdmin ? (
              <>
                <EditPostButtonWithPanel 
                  buttonLabel="Edit Post" 
                  panelId="edit-post-panel"
                />
                {canDelete ? (
                  <DeletePostButton 
                    postId={id} 
                    postType="post"
                  />
                ) : null}
              </>
            ) : canEdit ? (
              <>
                <EditPostButtonWithPanel 
                  buttonLabel="Edit Post" 
                  panelId="edit-post-panel"
                />
                {canDelete ? (
                  <DeletePostButton 
                    postId={id} 
                    postType="post"
                  />
                ) : null}
              </>
            ) : null}
          </div>
        }
      />

      <ViewTracker contentType="posts" contentId={id} />
      
      <section className="card">
        <PostHeader
          title={post.title || 'Untitled'}
          author={post.author_name}
          authorColorIndex={usernameColorMap.get(post.author_name)}
          authorPreferredColorIndex={post.author_color_preference !== null && post.author_color_preference !== undefined ? Number(post.author_color_preference) : null}
          authorAvatarKey={post.author_avatar_key}
          createdAt={post.created_at}
          likeButton={
            <LikeButton 
              postType="post" 
              postId={id} 
              initialLiked={userLiked}
              initialCount={Number(likeCount)}
            />
          }
        />
        {post.is_private ? (
          <span className="muted" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
            Members-only
          </span>
        ) : null}
        {isHidden ? (
          <span className="muted" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
            Hidden
          </span>
        ) : null}
        {isLocked ? (
          <span className="muted" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
            Comments locked
          </span>
        ) : null}
        {post.body ? <div className="post-body" style={{ marginTop: '8px' }} dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} /> : null}
        {post.views !== undefined && post.views !== null && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            fontSize: '12px',
            marginTop: '12px'
          }}>
            <span className="muted">
              {post.views} {post.views === 1 ? 'view' : 'views'}
            </span>
          </div>
        )}
      </section>

      {canEdit ? (
        <div id="edit-post-panel" style={{ display: 'none' }}>
          <section className="card">
            <h3 className="section-title">Edit Post</h3>
            {editNotice ? <div className="notice">{editNotice}</div> : null}
            <PostEditForm
              action={`/api/posts/${id}`}
              initialData={{
                title: String(post.title || ''),
                body: String(post.body || ''),
                is_private: post.is_private ? 1 : 0,
                image_key: post.image_key ? String(post.image_key) : null
              }}
              titleLabel="Title"
              bodyLabel="Body"
              buttonLabel="Update Post"
              showImage={true}
            />
          </section>
        </div>
      ) : null}

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
              const replyLink = `/memories/${id}?replyTo=${encodeURIComponent(c.id)}#comment-form`;
              const formattedDate = c.created_at ? formatDateTime(c.created_at) : '';
              return (
                <div key={c.id} className="list-item comment-card" style={{ position: 'relative' }}>
                  <div className="comment-action-row">
                    <LikeButton postType="post_comment" postId={c.id} initialLiked={!!c.liked} initialCount={c.like_count || 0} size="sm" />
                    <DeleteCommentButton
                      inline
                      commentId={c.id}
                      parentId={id}
                      type="post"
                      authorUserId={c.author_user_id}
                      currentUserId={user?.id}
                      isAdmin={!!isAdmin}
                    />
                  </div>
                  <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.body) }} />
                  <div
                    className="list-meta"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontSize: '12px', marginTop: '8px' }}
                  >
                    <span>
                      <Username 
                        name={c.author_name} 
                        colorIndex={colorIndex}
                        preferredColorIndex={preferredColor}
                      />
                      {' · '}
                      <span suppressHydrationWarning>{formattedDate}</span>
                    </span>
                    <ReplyButton
                      replyId={c.id}
                      replyAuthor={c.author_name}
                      replyBody={c.body}
                      replyHref={replyLink}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
        {isLocked ? (
          <div className="muted" style={{ fontSize: 13, marginTop: '12px' }}>
            Comments are locked for this post.
          </div>
        ) : (
          <CollapsibleCommentForm
            action={`/api/posts/${id}/comments`}
            buttonLabel="Post comment"
            placeholder="Leave a comment"
            labelText="Say something"
          />
        )}
      </section>
    </div>
  );
}
