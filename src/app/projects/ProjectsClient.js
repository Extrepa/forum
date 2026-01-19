'use client';

import { useState } from 'react';
import ProjectForm from '../../components/ProjectForm';
import CreatePostModal from '../../components/CreatePostModal';

export default function ProjectsClient({ projects, isAdmin, notice }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="stack">
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 className="section-title">Projects</h2>
            <p className="muted">Current and past projects with updates and progress.</p>
          </div>
          {isAdmin && (
            <button onClick={() => setIsModalOpen(true)}>Create Post</button>
          )}
        </div>
        {notice ? <div className="notice">{notice}</div> : null}
      </section>

      <section className="card">
        <h3 className="section-title">All Projects</h3>
        <div className="list">
          {projects.length === 0 ? (
            <p className="muted">No projects yet.</p>
          ) : (
            projects.map((row) => (
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
                  dangerouslySetInnerHTML={{ __html: row.descriptionHtml }}
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
            ))
          )}
        </div>
      </section>

      {isAdmin && (
        <CreatePostModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="New Project"
        >
          <ProjectForm />
        </CreatePostModal>
      )}
    </div>
  );
}
