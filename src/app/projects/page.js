import ProjectsClient from './ProjectsClient';
import { getDb } from '../../lib/db';
import { renderMarkdown } from '../../lib/markdown';
import { getSessionUser } from '../../lib/auth';
import PageTopRow from '../../components/PageTopRow';
import NewPostModalButton from '../../components/NewPostModalButton';
import ProjectForm from '../../components/ProjectForm';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }
  const db = await getDb();
  let results = [];
  try {
    const out = await db
      .prepare(
        `SELECT projects.id, projects.title, projects.description, projects.status,
                projects.github_url, projects.demo_url, projects.image_key,
                projects.created_at, projects.updated_at,
                COALESCE(projects.views, 0) AS views,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT COUNT(*) FROM project_replies WHERE project_replies.project_id = projects.id AND project_replies.is_deleted = 0) AS reply_count,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'project' AND post_id = projects.id) AS like_count,
                COALESCE((SELECT MAX(created_at) FROM project_replies WHERE project_id = projects.id AND is_deleted = 0), projects.created_at) AS last_activity_at
         FROM projects
         JOIN users ON users.id = projects.author_user_id
         WHERE projects.moved_to_id IS NULL
           AND (projects.is_hidden = 0 OR projects.is_hidden IS NULL)
           AND (projects.is_deleted = 0 OR projects.is_deleted IS NULL)
         ORDER BY projects.created_at DESC
         LIMIT 50`
      )
      .all();
    results = out?.results || [];
  } catch (e) {
    const out = await db
      .prepare(
        `SELECT projects.id, projects.title, projects.description, projects.status,
                projects.github_url, projects.demo_url, projects.image_key,
                projects.created_at, projects.updated_at,
                COALESCE(projects.views, 0) AS views,
                users.username AS author_name,
                users.preferred_username_color_index AS author_color_preference,
                (SELECT COUNT(*) FROM project_comments WHERE project_comments.project_id = projects.id AND project_comments.is_deleted = 0) AS reply_count,
                (SELECT COUNT(*) FROM post_likes WHERE post_type = 'project' AND post_id = projects.id) AS like_count,
                COALESCE((SELECT MAX(created_at) FROM project_comments WHERE project_id = projects.id AND is_deleted = 0), projects.created_at) AS last_activity_at
         FROM projects
         JOIN users ON users.id = projects.author_user_id
         ORDER BY projects.created_at DESC
         LIMIT 50`
      )
      .all();
    results = out?.results || [];
  }

  const canCreate = !!user && !!user.password_hash;

  // Add unread status for logged-in users
  if (user && results.length > 0) {
    try {
      const projectIds = results.map(p => p.id);
      if (projectIds.length > 0) {
        const placeholders = projectIds.map(() => '?').join(',');
        const readStates = await db
          .prepare(
            `SELECT content_id FROM content_reads 
             WHERE user_id = ? AND content_type = 'project' AND content_id IN (${placeholders})`
          )
          .bind(user.id, ...projectIds)
          .all();

        const readSet = new Set();
        (readStates?.results || []).forEach(r => {
          readSet.add(r.content_id);
        });

        results.forEach(project => {
          project.is_unread = !readSet.has(project.id);
        });
      } else {
        results.forEach(project => {
          project.is_unread = false;
        });
      }
    } catch (e) {
      // content_reads table might not exist yet, mark all as read
      results.forEach(project => {
        project.is_unread = false;
      });
    }
  } else {
    results.forEach(project => {
      project.is_unread = false;
    });
  }

  // Pre-render markdown for server component
  const projects = results.map(row => {
    const descriptionPreview = row.description.length > 200
      ? row.description.substring(0, 200) + '...'
      : row.description;
    return {
      ...row,
      descriptionHtml: renderMarkdown(descriptionPreview)
    };
  });

  const error = searchParams?.error;
  const notice =
    error === 'claim'
      ? 'Sign in before posting.'
      : error === 'password'
      ? 'Set your password to continue posting.'
      : error === 'unauthorized'
      ? 'Only the project author can edit that.'
      : error === 'upload'
      ? 'Image upload is not allowed for this username.'
      : error === 'too_large'
      ? 'Image is too large (max 5MB).'
      : error === 'invalid_type'
      ? 'Only image files are allowed.'
      : error === 'missing'
      ? 'Title, description, and status are required.'
      : null;

  return (
    <>
      <PageTopRow
        items={[
          { href: '/', label: 'Home' },
          { href: '/projects', label: 'Projects' },
        ]}
        right={
          <NewPostModalButton label="New Project" title="New Project" disabled={!canCreate} variant="wide">
            <ProjectForm />
          </NewPostModalButton>
        }
      />
      <ProjectsClient projects={projects} canCreate={canCreate} notice={notice} />
    </>
  );
}
