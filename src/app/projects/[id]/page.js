import ProjectForm from '../../../components/ProjectForm';
import { redirect } from 'next/navigation';
import { getDb } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';
import { getSessionUser } from '../../../lib/auth';
import { isAdminUser } from '../../../lib/admin';
import { formatDateTime } from '../../../lib/dates';
import PageTopRow from '../../../components/PageTopRow';
import Username from '../../../components/Username';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../../lib/usernameColor';
import LikeButton from '../../../components/LikeButton';
import ReplyFormWrapper from '../../../components/ReplyFormWrapper';
import DeletePostButton from '../../../components/DeletePostButton';
import EditPostButtonWithPanel from '../../../components/EditPostButtonWithPanel';

export const dynamic = 'force-dynamic';

function quoteMarkdown({ author, body }) {
  const safeAuthor = String(author || 'Someone').trim() || 'Someone';
  const text = String(body || '').trim();
  if (!text) return `> @${safeAuthor} said:\n>\n\n`;
  const lines = text.split('\n').slice(0, 8); // keep it short by default
  const quoted = lines.map((l) => `> ${l}`).join('\n');
  return `> @${safeAuthor} said:\n${quoted}\n\n`;
}

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

export default async function ProjectDetailPage({ params, searchParams }) {
  try {
    if (!params?.id) {
      return (
        <div className="card">
          <h2 className="section-title">Error</h2>
          <p className="muted">Invalid project ID.</p>
        </div>
      );
    }
    const db = await getDb();
    if (!db) {
      return (
        <div className="card">
          <h2 className="section-title">Error</h2>
          <p className="muted">Database connection failed. Please try again later.</p>
        </div>
      );
    }
    let project = null;
  try {
    project = await db
      .prepare(
        `SELECT projects.id, projects.author_user_id, projects.title, projects.description, projects.status,
                projects.github_url, projects.demo_url, projects.image_key,
                projects.created_at, projects.updated_at,
                projects.moved_to_type, projects.moved_to_id,
                users.username AS author_name
         FROM projects
         JOIN users ON users.id = projects.author_user_id
         WHERE projects.id = ? AND (projects.is_deleted = 0 OR projects.is_deleted IS NULL)`
      )
      .bind(params.id)
      .first();
  } catch (e) {
    // Rollout compatibility if moved columns aren't migrated yet.
    try {
      project = await db
        .prepare(
          `SELECT projects.id, projects.author_user_id, projects.title, projects.description, projects.status,
                  projects.github_url, projects.demo_url, projects.image_key,
                  projects.created_at, projects.updated_at,
                  users.username AS author_name,
                  0 AS like_count
           FROM projects
           JOIN users ON users.id = projects.author_user_id
           WHERE projects.id = ? AND (projects.is_deleted = 0 OR projects.is_deleted IS NULL)`
        )
        .bind(params.id)
        .first();
      if (project) {
        project.moved_to_id = null;
        project.moved_to_type = null;
      }
    } catch (e2) {
      // Final fallback: remove is_deleted filter in case column doesn't exist
      try {
        project = await db
          .prepare(
            `SELECT projects.id, projects.author_user_id, projects.title, projects.description, projects.status,
                    projects.github_url, projects.demo_url, projects.image_key,
                    projects.created_at, projects.updated_at,
                    users.username AS author_name,
                    0 AS like_count
             FROM projects
             JOIN users ON users.id = projects.author_user_id
             WHERE projects.id = ?`
          )
          .bind(params.id)
          .first();
        if (project) {
          project.moved_to_id = null;
          project.moved_to_type = null;
        }
      } catch (e3) {
        project = null;
      }
    }
  }

  if (!project) {
    return (
      <div className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">This project does not exist.</p>
      </div>
    );
  }

  if (project.moved_to_id) {
    const to = destUrlFor(project.moved_to_type, project.moved_to_id);
    if (to) {
      redirect(to);
    }
  }

  // Project replies (forum-style). Rollout-safe: if table isn't migrated yet, fall back to none.
  let replies = [];
  let repliesEnabled = true;
  try {
    const out = await db
      .prepare(
        `SELECT project_replies.id, project_replies.body, project_replies.created_at, project_replies.reply_to_id,
                project_replies.author_user_id,
                COALESCE(users.username, 'Deleted User') AS author_name
         FROM project_replies
         LEFT JOIN users ON users.id = project_replies.author_user_id
         WHERE project_replies.project_id = ? AND (project_replies.is_deleted = 0 OR project_replies.is_deleted IS NULL)
         ORDER BY project_replies.created_at ASC`
      )
      .bind(params.id)
      .all();
    replies = (out?.results || []).filter(r => r && r.id && r.body); // Filter out invalid replies
  } catch (e) {
    console.error('Error fetching project replies:', e, { projectId: params.id });
    // Fallback if is_deleted column doesn't exist
    try {
      const out = await db
        .prepare(
          `SELECT project_replies.id, project_replies.body, project_replies.created_at, project_replies.reply_to_id,
                  project_replies.author_user_id,
                  COALESCE(users.username, 'Deleted User') AS author_name
           FROM project_replies
           LEFT JOIN users ON users.id = project_replies.author_user_id
           WHERE project_replies.project_id = ?
           ORDER BY project_replies.created_at ASC`
        )
        .bind(params.id)
        .all();
      replies = (out?.results || []).filter(r => r && r.id && r.body); // Filter out invalid replies
    } catch (e2) {
      console.error('Error fetching project replies (fallback 1):', e2, { projectId: params.id });
      // Final fallback: try without JOIN if users table has issues
      try {
        const out = await db
          .prepare(
            `SELECT project_replies.id, project_replies.body, project_replies.created_at, project_replies.reply_to_id,
                    project_replies.author_user_id
             FROM project_replies
             WHERE project_replies.project_id = ?
             ORDER BY project_replies.created_at ASC`
          )
          .bind(params.id)
          .all();
        replies = (out?.results || []).map(r => ({
          ...r,
          author_name: 'Unknown User' // Default if user lookup fails
        })).filter(r => r && r.id && r.body);
      } catch (e3) {
        console.error('Error fetching project replies (fallback 2):', e3, { projectId: params.id });
        replies = [];
        repliesEnabled = false;
      }
    }
  }

  const user = await getSessionUser();
  const isAdmin = isAdminUser(user);
  const canEdit =
    !!user &&
    !user.must_change_password &&
    !!user.password_hash &&
    (user.id === project.author_user_id || isAdmin);
  const canDelete = canEdit;
  
  // Check if current user has liked this project
  let userLiked = false;
  if (user) {
    try {
      const likeCheck = await db
        .prepare('SELECT id FROM post_likes WHERE post_type = ? AND post_id = ? AND user_id = ?')
        .bind('project', String(project.id), String(user.id))
        .first();
      userLiked = !!likeCheck;
    } catch (e) {
      console.error('Error checking project like status:', e, { projectId: project?.id, userId: user?.id });
      // Table might not exist yet
    }
  }

  // Safely extract searchParams
  let errorParam = null;
  let replyToId = null;
  try {
    if (searchParams && typeof searchParams === 'object') {
      if ('error' in searchParams) {
        errorParam = String(searchParams.error || '');
      }
      if ('replyTo' in searchParams) {
        const replyTo = String(searchParams.replyTo || '').trim();
        replyToId = replyTo || null;
      }
    }
  } catch (e) {
    console.error('Error reading searchParams:', e);
    errorParam = null;
    replyToId = null;
  }
  
  const editNotice =
    errorParam === 'claim'
      ? 'Sign in before editing.'
      : errorParam === 'password'
      ? 'Set your password to continue.'
      : errorParam === 'unauthorized'
      ? 'Only the project author can edit this.'
      : errorParam === 'upload'
      ? 'Image upload is not allowed for this username.'
      : errorParam === 'too_large'
      ? 'Image is too large (max 5MB).'
      : errorParam === 'invalid_type'
      ? 'Only image files are allowed.'
      : errorParam === 'missing'
      ? 'Title, description, and status are required.'
      : errorParam === 'notfound'
      ? 'This project does not exist.'
      : null;
  
  const commentNotice =
    errorParam === 'claim'
      ? 'Sign in before commenting.'
      : errorParam === 'password'
      ? 'Set your password to continue posting.'
      : errorParam === 'notready'
      ? 'Replies are not enabled yet (database updates still applying).'
      : errorParam === 'missing'
      ? 'Comment text is required.'
      : null;

  // Fully serialize all data before rendering
  const safeProjectId = project?.id ? String(project.id) : '';
  const safeProjectTitle = project?.title ? String(project.title) : 'Untitled';
  const safeProjectDescription = project?.description ? String(project.description) : '';
  const safeProjectStatus = project?.status ? String(project.status) : '';
  const safeProjectAuthorName = project?.author_name ? String(project.author_name) : 'Unknown';
  const safeProjectCreatedAt = project?.created_at ? Number(project.created_at) : null;
  const safeProjectUpdatedAt = project?.updated_at ? Number(project.updated_at) : null;
  const safeProjectImageKey = project?.image_key ? String(project.image_key) : null;
  const safeProjectGithubUrl = project?.github_url ? String(project.github_url) : null;
  const safeProjectDemoUrl = project?.demo_url ? String(project.demo_url) : null;
  const safeProjectLikeCount = project?.like_count ? Number(project.like_count) : 0;
  
  // Serialize replies array
  const safeReplies = Array.isArray(replies)
    ? replies
        .filter(r => r && r.id && r.body)
        .map(r => ({
          id: String(r.id || ''),
          author_name: String(r.author_name || 'Unknown'),
          body: String(r.body || ''),
          created_at: r.created_at ? Number(r.created_at) : Date.now(),
          reply_to_id: r.reply_to_id ? String(r.reply_to_id) : null,
          author_user_id: String(r.author_user_id || '')
        }))
    : [];
  
  // Find and serialize replyingTo from safeReplies
  const replyingTo = replyToId ? safeReplies.find((r) => r && r.id && r.id === replyToId) : null;
  const replyPrefill = replyingTo ? quoteMarkdown({ author: replyingTo.author_name, body: replyingTo.body }) : '';
  
  // Assign unique colors to all usernames on this page
  const allUsernames = [
    safeProjectAuthorName,
    ...safeReplies.map(r => r.author_name)
  ].filter(Boolean).filter(name => name && typeof name === 'string');
  
  let usernameColorMap = new Map();
  try {
    if (allUsernames.length > 0) {
      usernameColorMap = assignUniqueColorsForPage(allUsernames);
    }
  } catch (e) {
    console.error('Error assigning username colors:', e);
    usernameColorMap = new Map();
  }
  
  // Pre-render markdown
  let projectDescriptionHtml = '';
  try {
    projectDescriptionHtml = renderMarkdown(safeProjectDescription);
  } catch (e) {
    console.error('Error rendering project markdown:', e);
    projectDescriptionHtml = safeProjectDescription.replace(/\n/g, '<br>');
  }
  
  // Extract reply rendering logic to avoid IIFE
  const renderReplies = () => {
    if (safeReplies.length === 0) return [];
    
    const byParent = new Map();
    const validReplyIds = new Set(safeReplies.map(r => r.id).filter(Boolean));
    
    for (const r of safeReplies) {
      if (!r || !r.id) continue;
      const key = (r.reply_to_id && validReplyIds.has(r.reply_to_id)) ? r.reply_to_id : null;
      const arr = byParent.get(key) || [];
      arr.push(r);
      byParent.set(key, arr);
    }
    
    const renderReply = (r, { isChild }) => {
      if (!r || !r.id || !r.body) return null;
      const colorIndex = usernameColorMap.get(r.author_name) ?? getUsernameColorIndex(r.author_name || 'Unknown');
      
      let replyBodyHtml = '';
      try {
        replyBodyHtml = renderMarkdown(r.body);
      } catch (e) {
        console.error('Error rendering reply markdown:', e, { replyId: r.id });
        replyBodyHtml = r.body.replace(/\n/g, '<br>');
      }
      
      const replyLink = `/projects/${safeProjectId}?replyTo=${encodeURIComponent(r.id)}#reply-form`;
      
      return (
        <div
          key={r.id}
          className={`list-item${isChild ? ' reply-item--child' : ''}`}
          id={`reply-${r.id}`}
        >
          <div className="post-body" dangerouslySetInnerHTML={{ __html: replyBodyHtml }} />
          <div
            className="list-meta"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: '8px' }}
          >
            <span>
              <Username name={r.author_name} colorIndex={colorIndex} /> ·{' '}
              {r.created_at ? formatDateTime(r.created_at) : ''}
            </span>
            <a className="post-link" href={replyLink}>
              Reply
            </a>
          </div>
        </div>
      );
    };
    
    const top = byParent.get(null) || [];
    return top.map((r) => {
      const kids = byParent.get(r.id) || [];
      const renderedReply = renderReply(r, { isChild: false });
      const renderedKids = kids.map((c) => renderReply(c, { isChild: true })).filter(Boolean);
      if (!renderedReply) return null;
      return (
        <div key={`thread-${r.id}`} className="stack" style={{ gap: 10 }}>
          {renderedReply}
          {renderedKids.length ? (
            <div className="reply-children">
              {renderedKids}
            </div>
          ) : null}
        </div>
      );
    }).filter(Boolean);
  };
  
  const renderedReplies = renderReplies();

  return (
    <div className="stack">
      <PageTopRow
        items={[
          { href: '/', label: 'Home' },
          { href: '/projects', label: 'Projects' },
          { href: `/projects/${safeProjectId}`, label: safeProjectTitle },
        ]}
        right={
          canEdit ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <EditPostButtonWithPanel 
                buttonLabel="Edit Post" 
                panelId="edit-project-panel"
              />
              {canDelete ? (
                <DeletePostButton 
                  postId={safeProjectId} 
                  postType="project"
                />
              ) : null}
            </div>
          ) : null
        }
      />
      <section className="card">
        <div className="post-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            <h2 className="section-title" style={{ marginBottom: '4px' }}>{safeProjectTitle}</h2>
            {/* Project status badge removed - was appearing next to username and looked like user status */}
            <div className="list-meta" style={{ marginBottom: '0' }}>
              <Username name={safeProjectAuthorName} colorIndex={usernameColorMap.get(safeProjectAuthorName) ?? 0} /> ·{' '}
              {safeProjectCreatedAt ? formatDateTime(safeProjectCreatedAt) : ''}
              {safeProjectUpdatedAt ? ` · Updated ${formatDateTime(safeProjectUpdatedAt)}` : null}
            </div>
          </div>
          {user ? (
            <LikeButton 
              postType="project" 
              postId={safeProjectId} 
              initialLiked={userLiked}
              initialCount={safeProjectLikeCount}
            />
          ) : null}
        </div>
        {safeProjectImageKey ? (
          <img
            src={`/api/media/${safeProjectImageKey}`}
            alt=""
            className="post-image"
            loading="lazy"
          />
        ) : null}
        <div
          className="post-body"
          style={{ marginTop: '8px', marginBottom: '0' }}
          dangerouslySetInnerHTML={{ __html: projectDescriptionHtml }}
        />
        <div className="project-links">
          {safeProjectGithubUrl ? (
            <a href={safeProjectGithubUrl} target="_blank" rel="noopener noreferrer" className="project-link">
              GitHub
            </a>
          ) : null}
          {safeProjectDemoUrl ? (
            <a href={safeProjectDemoUrl} target="_blank" rel="noopener noreferrer" className="project-link">
              Demo
            </a>
          ) : null}
        </div>
      </section>

      {canEdit ? (
        <div id="edit-project-panel" style={{ display: 'none' }}>
          <section className="card">
            <h3 className="section-title">Edit Project</h3>
            {editNotice ? <div className="notice">{editNotice}</div> : null}
            <ProjectForm projectId={safeProjectId} initialData={{
              id: safeProjectId,
              title: safeProjectTitle,
              description: safeProjectDescription,
              status: safeProjectStatus,
              github_url: safeProjectGithubUrl,
              demo_url: safeProjectDemoUrl,
              image_key: safeProjectImageKey
            }} />
          </section>
        </div>
      ) : null}

      <section className="card">
        <h3 className="section-title">Replies</h3>
        {commentNotice ? <div className="notice">{commentNotice}</div> : null}
        <div className="list">
          {renderedReplies.length === 0 ? (
            <p className="muted">No replies yet.</p>
          ) : (
            renderedReplies
          )}
        </div>
        {repliesEnabled ? (
          <div style={{ marginTop: '12px' }} id="reply-form">
            <ReplyFormWrapper
              action={`/api/projects/${safeProjectId}/replies`}
              buttonLabel="Post reply"
              placeholder="Share your goo-certified thoughts..."
              labelText="What would you like to say?"
              hiddenFields={{ reply_to_id: replyToId || '' }}
              replyingTo={replyingTo}
              replyPrefill={replyPrefill}
            />
          </div>
        ) : (
          <div className="muted" style={{ fontSize: 13, marginTop: '12px' }}>
            Replies aren't enabled yet (database updates still applying).
          </div>
        )}
      </section>
    </div>
  );
  } catch (error) {
    console.error('Error loading project page:', error, { projectId: params.id, errorMessage: error.message, errorStack: error.stack });
    return (
      <div className="card">
        <h2 className="section-title">Error</h2>
        <p className="muted">Unable to load this project. Please try again later.</p>
      </div>
    );
  }
}
