import ProjectsClient from './ProjectsClient';
import { getDb } from '../../lib/db';
import { renderMarkdown } from '../../lib/markdown';
import { getSessionUserWithRole, isAdminUser } from '../../lib/admin';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage({ searchParams }) {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT projects.id, projects.title, projects.description, projects.status,
              projects.github_url, projects.demo_url, projects.image_key,
              projects.created_at, projects.updated_at,
              users.username AS author_name,
              (SELECT COUNT(*) FROM project_comments WHERE project_comments.project_id = projects.id AND project_comments.is_deleted = 0) AS comment_count
       FROM projects
       JOIN users ON users.id = projects.author_user_id
       ORDER BY projects.created_at DESC
       LIMIT 50`
    )
    .all();

  const user = await getSessionUserWithRole();
  const isAdmin = isAdminUser(user);

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
    error === 'unauthorized'
      ? 'Only admins can create projects.'
      : error === 'upload'
      ? 'Image upload is not allowed for this username.'
      : error === 'too_large'
      ? 'Image is too large (max 5MB).'
      : error === 'invalid_type'
      ? 'Only image files are allowed.'
      : error === 'missing'
      ? 'Title, description, and status are required.'
      : null;

  return <ProjectsClient projects={projects} isAdmin={isAdmin} notice={notice} />;
}
