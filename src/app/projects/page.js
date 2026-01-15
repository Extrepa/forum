import ProjectForm from '../../components/ProjectForm';
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
              users.username AS author_name
       FROM projects
       JOIN users ON users.id = projects.author_user_id
       ORDER BY projects.created_at DESC
       LIMIT 50`
    )
    .all();

  const user = await getSessionUserWithRole();
  const isAdmin = isAdminUser(user);

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

  return (
    <div className="stack">
      {isAdmin ? (
        <section className="card">
          <h2 className="section-title">New Project</h2>
          <p className="muted">Add a new project you're working on.</p>
          {notice ? <div className="notice">{notice}</div> : null}
          <ProjectForm />
        </section>
      ) : null}

      <section className="card">
        <h2 className="section-title">Projects</h2>
        <p className="muted">Current and past projects with updates and progress.</p>
        <div className="list">
          {results.length === 0 ? (
            <p className="muted">No projects yet.</p>
          ) : (
            results.map((row) => {
              const descriptionPreview = row.description.length > 200
                ? row.description.substring(0, 200) + '...'
                : row.description;
              return (
                <div key={row.id} className="list-item">
                  <div className="post-header">
                    <h3>
                      <a href={`/projects/${row.id}`}>{row.title}</a>
                    </h3>
                    <span className={`status-badge status-${row.status}`}>{row.status}</span>
                  </div>
                  {row.image_key ? (
                    <img
                      src={`/api/media/${row.image_key}`}
                      alt=""
                      className="post-image"
                      loading="lazy"
                    />
                  ) : null}
                  <div
                    className="post-body"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(descriptionPreview) }}
                  />
                  <div className="project-links">
                    {row.github_url ? (
                      <a href={row.github_url} target="_blank" rel="noopener noreferrer" className="project-link">
                        GitHub
                      </a>
                    ) : null}
                    {row.demo_url ? (
                      <a href={row.demo_url} target="_blank" rel="noopener noreferrer" className="project-link">
                        Demo
                      </a>
                    ) : null}
                  </div>
                  <div className="list-meta">
                    {row.author_name} · {new Date(row.created_at).toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
