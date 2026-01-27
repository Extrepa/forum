import ProjectForm from '../../../components/ProjectForm';
import { redirect } from 'next/navigation';
import { getDb } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';
import { getSessionUser } from '../../../lib/auth';
import { isAdminUser } from '../../../lib/admin';
import PageTopRow from '../../../components/PageTopRow';
import Username from '../../../components/Username';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../../lib/usernameColor';
import LikeButton from '../../../components/LikeButton';
import DeletePostButton from '../../../components/DeletePostButton';
import EditPostButtonWithPanel from '../../../components/EditPostButtonWithPanel';
import PostHeader from '../../../components/PostHeader';
import ViewTracker from '../../../components/ViewTracker';
import ProjectRepliesSection from '../../../components/ProjectRepliesSection';
import ProjectUpdateForm from '../../../components/ProjectUpdateForm';

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

export default async function ProjectDetailPage({ params, searchParams }) {
  // Next.js 15: params and searchParams are Promises, must await
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) || {};

  try {
    if (!id) {
      return (
        <div className="card">
          <h2 className="section-title">Error</h2>
          <p className="muted">Invalid project ID.</p>
        </div>
      );
    }
    const user = await getSessionUser();
    if (!user) {
      redirect('/');
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
                COALESCE(projects.updates_enabled, 0) AS updates_enabled,
                COALESCE(projects.views, 0) AS views,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'project' AND post_id = projects.id) AS like_count,
                COALESCE(projects.is_locked, 0) AS is_locked
         FROM projects
         JOIN users ON users.id = projects.author_user_id
         WHERE projects.id = ? AND (projects.is_deleted = 0 OR projects.is_deleted IS NULL)`
      )
      .bind(id)
      .first();
  } catch (e) {
    // Rollout compatibility if moved columns aren't migrated yet.
    try {
      project = await db
        .prepare(
          `SELECT projects.id, projects.author_user_id, projects.title, projects.description, projects.status,
                  projects.github_url, projects.demo_url, projects.image_key,
                  projects.created_at, projects.updated_at,
                  COALESCE(projects.views, 0) AS views,
                  users.username AS author_name,
                  users.preferred_username_color_index AS author_color_preference,
                  (SELECT COUNT(*) FROM post_likes WHERE post_type = 'project' AND post_id = projects.id) AS like_count,
                  COALESCE(projects.is_locked, 0) AS is_locked
           FROM projects
           JOIN users ON users.id = projects.author_user_id
           WHERE projects.id = ? AND (projects.is_deleted = 0 OR projects.is_deleted IS NULL)`
        )
        .bind(id)
        .first();
      if (project) {
        project.moved_to_id = null;
        project.moved_to_type = null;
        project.is_locked = project.is_locked ?? 0;
      }
    } catch (e2) {
      // Final fallback: remove is_deleted filter in case column doesn't exist
      try {
        project = await db
          .prepare(
             `SELECT projects.id, projects.author_user_id, projects.title, projects.description, projects.status,
                    projects.github_url, projects.demo_url, projects.image_key,
                    projects.created_at, projects.updated_at,
                    COALESCE(projects.views, 0) AS views,
                    users.username AS author_name,
                    users.preferred_username_color_index AS author_color_preference,
                    (SELECT COUNT(*) FROM post_likes WHERE post_type = 'project' AND post_id = projects.id) AS like_count,
                    0 AS is_locked
             FROM projects
             JOIN users ON users.id = projects.author_user_id
             WHERE projects.id = ?`
          )
          .bind(id)
          .first();
        if (project) {
          project.moved_to_id = null;
          project.moved_to_type = null;
          project.is_locked = 0;
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
                project_replies.author_user_id, project_replies.image_key,
                COALESCE(users.username, 'Deleted User') AS author_name,
                users.preferred_username_color_index AS author_color_preference
         FROM project_replies
         LEFT JOIN users ON users.id = project_replies.author_user_id
         WHERE project_replies.project_id = ? AND (project_replies.is_deleted = 0 OR project_replies.is_deleted IS NULL)
         ORDER BY project_replies.created_at ASC`
      )
      .bind(id)
      .all();
    replies = (out?.results || []).filter(r => r && r.id && r.body); // Filter out invalid replies
  } catch (e) {
    console.error('Error fetching project replies:', e, { projectId: id });
    // Fallback if is_deleted column doesn't exist
    try {
      const out = await db
        .prepare(
          `SELECT project_replies.id, project_replies.body, project_replies.created_at, project_replies.reply_to_id,
                  project_replies.author_user_id, project_replies.image_key,
                  COALESCE(users.username, 'Deleted User') AS author_name,
                  users.preferred_username_color_index AS author_color_preference
           FROM project_replies
           LEFT JOIN users ON users.id = project_replies.author_user_id
           WHERE project_replies.project_id = ?
           ORDER BY project_replies.created_at ASC`
        )
        .bind(id)
        .all();
      replies = (out?.results || []).filter(r => r && r.id && r.body); // Filter out invalid replies
    } catch (e2) {
      console.error('Error fetching project replies (fallback 1):', e2, { projectId: id });
      // Final fallback: try without JOIN if users table has issues
      try {
        const out = await db
          .prepare(
            `SELECT project_replies.id, project_replies.body, project_replies.created_at, project_replies.reply_to_id,
                    project_replies.author_user_id, project_replies.image_key
             FROM project_replies
             WHERE project_replies.project_id = ?
             ORDER BY project_replies.created_at ASC`
          )
          .bind(id)
          .all();
        replies = (out?.results || []).map(r => ({
          ...r,
          author_name: 'Unknown User', // Default if user lookup fails
          author_color_preference: null
        })).filter(r => r && r.id && r.body);
      } catch (e3) {
        console.error('Error fetching project replies (fallback 2):', e3, { projectId: id });
        replies = [];
        repliesEnabled = false;
      }
    }
  }

  const isAdmin = isAdminUser(user);
  const canEdit =
    !!user &&
    !!user.password_hash &&
    (user.id === project.author_user_id || isAdmin);
  const canDelete = canEdit;

  // Fetch project updates if enabled
  let updates = [];
  if (project.updates_enabled) {
    try {
      const out = await db
        .prepare(
          `SELECT id, title, body, created_at, image_key
           FROM project_updates
           WHERE project_id = ?
           ORDER BY created_at DESC`
        )
        .bind(id)
        .all();
      updates = (out?.results || []).map(u => ({
        ...u,
        body_html: renderMarkdown(u.body)
      }));
    } catch (e) {
      console.error('Error fetching project updates:', e);
    }
  }
  
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

  // Safely extract searchParams (already awaited above)
  let errorParam = null;
  let replyToId = null;
  try {
    if (resolvedSearchParams && typeof resolvedSearchParams === 'object') {
      if ('error' in resolvedSearchParams) {
        errorParam = String(resolvedSearchParams.error || '');
      }
      if ('replyTo' in resolvedSearchParams) {
        const replyTo = String(resolvedSearchParams.replyTo || '').trim();
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
      ? 'Log in to post.'
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
      ? 'Log in to post.'
      : errorParam === 'locked'
      ? 'Comments are locked on this project.'
      : errorParam === 'notready'
      ? 'Replies are not enabled yet (database updates still applying).'
      : errorParam === 'missing'
      ? 'Reply text or image is required.'
      : errorParam === 'upload_permission'
      ? 'You do not have permission to upload images. Your username may not be in the image upload allowlist.'
      : errorParam === 'upload_failed'
      ? 'Image upload failed. Check server logs for details.'
      : errorParam === 'upload'
      ? 'Image upload failed. You may not have permission to upload images, or there was an error uploading.'
      : errorParam === 'too_large'
      ? 'Image is too large (max 5MB).'
      : errorParam === 'invalid_type'
      ? 'Only image files are allowed.'
      : errorParam
      ? `Error: ${errorParam}`
      : null;

  // Fully serialize all data before rendering
  const safeProjectId = id ? String(id) : '';
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
  
  // Serialize replies array with markdown rendering
  const safeReplies = Array.isArray(replies)
    ? replies
        .filter(r => r && r.id && r.body)
        .map(r => {
          let bodyHtml = '';
          try {
            bodyHtml = renderMarkdown(r.body);
          } catch (e) {
            console.error('Error rendering reply markdown:', e, { replyId: r.id });
            bodyHtml = r.body.replace(/\n/g, '<br>');
          }
          return {
            id: String(r.id || ''),
            author_name: String(r.author_name || 'Unknown'),
            body: String(r.body || ''),
            body_html: bodyHtml,
            created_at: r.created_at ? Number(r.created_at) : 0,
            reply_to_id: r.reply_to_id ? String(r.reply_to_id) : null,
            author_user_id: String(r.author_user_id || ''),
            author_color_preference: r.author_color_preference !== null && r.author_color_preference !== undefined ? Number(r.author_color_preference) : null,
            image_key: r.image_key ? String(r.image_key) : null
          };
        })
    : [];
  
  // Assign unique colors to all usernames on this page
  const allUsernames = [
    safeProjectAuthorName,
    ...safeReplies.map(r => r.author_name)
  ].filter(Boolean).filter(name => name && typeof name === 'string');
  
  // Build map of username -> preferred color index
  const preferredColors = new Map();
  if (project?.author_name && project?.author_color_preference !== null && project?.author_color_preference !== undefined) {
    preferredColors.set(project.author_name, Number(project.author_color_preference));
  }
  if (Array.isArray(replies)) {
    replies.forEach(r => {
      if (r?.author_name && r?.author_color_preference !== null && r?.author_color_preference !== undefined) {
        preferredColors.set(r.author_name, Number(r.author_color_preference));
      }
    });
  }
  
  let usernameColorMap = new Map();
  try {
    if (allUsernames.length > 0) {
      usernameColorMap = assignUniqueColorsForPage(allUsernames, preferredColors);
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

  return (
    <div className="stack">
      <PageTopRow
        items={[
          { href: '/', label: 'Home' },
          { href: '/projects', label: 'Projects' },
          { href: `/projects/${safeProjectId}`, label: safeProjectTitle },
        ]}
        right={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isAdmin ? (
              <form action={`/api/projects/${safeProjectId}/lock`} method="post" style={{ margin: 0 }}>
                <input type="hidden" name="locked" value={project.is_locked ? '0' : '1'} />
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
                    <span>{project.is_locked ? 'Unlock' : 'Lock'}</span>
                    <span style={{ whiteSpace: 'nowrap' }}>comments</span>
                  </span>
                </button>
              </form>
            ) : null}
            {canEdit ? (
              <>
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
              </>
            ) : null}
          </div>
        }
      />
      <ViewTracker contentType="projects" contentId={safeProjectId} />
      
      <section className="card">
        <PostHeader
          title={safeProjectTitle}
          author={safeProjectAuthorName}
          authorColorIndex={usernameColorMap.get(safeProjectAuthorName) ?? 0}
          authorPreferredColorIndex={project?.author_color_preference !== null && project?.author_color_preference !== undefined ? Number(project.author_color_preference) : null}
          createdAt={safeProjectCreatedAt}
          likeButton={user ? (
            <LikeButton 
              postType="project" 
              postId={safeProjectId} 
              initialLiked={userLiked}
              initialCount={safeProjectLikeCount}
            />
          ) : null}
          showUpdatedAt={true}
          updatedAt={safeProjectUpdatedAt}
        />
        {project.is_locked ? (
          <span className="muted" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
            Comments locked
          </span>
        ) : null}
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
        {project?.views !== undefined && project?.views !== null && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            fontSize: '12px',
            marginTop: '12px'
          }}>
            <span className="muted">
              {project.views} {project.views === 1 ? 'view' : 'views'}
            </span>
          </div>
        )}
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
              image_key: safeProjectImageKey,
              updates_enabled: project.updates_enabled
            }} />
          </section>
        </div>
      ) : null}

      {project.updates_enabled ? (
        <section className="card">
          <h3 className="section-title">Project Updates</h3>
          {canEdit ? (
            <div style={{ marginBottom: '20px' }}>
              <details>
                <summary className="muted" style={{ cursor: 'pointer', fontSize: '14px' }}>
                  Post a new update...
                </summary>
                <div style={{ marginTop: '10px' }}>
                  <ProjectUpdateForm projectId={safeProjectId} />
                </div>
              </details>
            </div>
          ) : null}
          
          {updates.length === 0 ? (
            <p className="muted" style={{ fontSize: '14px' }}>No updates yet.</p>
          ) : (
            <div className="stack" style={{ gap: '24px' }}>
              {updates.map(update => (
                <div key={update.id} className="project-update" style={{ 
                  borderLeft: '2px solid var(--border)', 
                  paddingLeft: '16px',
                  paddingBottom: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0 }}>{update.title}</h4>
                    <span className="muted" style={{ fontSize: '12px' }}>
                      {new Date(update.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {update.image_key && (
                    <img 
                      src={`/api/media/${update.image_key}`} 
                      alt="" 
                      style={{ maxWidth: '100%', borderRadius: '4px', marginBottom: '8px' }} 
                    />
                  )}
                  <div 
                    className="post-body" 
                    style={{ fontSize: '14px' }}
                    dangerouslySetInnerHTML={{ __html: update.body_html }} 
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <ProjectRepliesSection
        projectId={safeProjectId}
        replies={safeReplies}
        user={user}
        isAdmin={isAdmin}
        commentNotice={commentNotice}
        usernameColorMap={usernameColorMap}
        isLocked={project.is_locked}
        repliesEnabled={repliesEnabled}
      />
    </div>
  );
  } catch (error) {
    console.error('Error loading project page:', error, { projectId: id, errorMessage: error.message, errorStack: error.stack });
    return (
      <div className="card">
        <h2 className="section-title">Error</h2>
        <p className="muted">Unable to load this project. Please try again later.</p>
      </div>
    );
  }
}
