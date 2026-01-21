'use client';

import { useState } from 'react';
import ProjectForm from '../../components/ProjectForm';
import CreatePostModal from '../../components/CreatePostModal';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';
import { getForumStrings, isLoreEnabled } from '../../lib/forum-texts';

export default function ProjectsClient({ projects, canCreate, notice }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const strings = getForumStrings({ useLore: isLoreEnabled() });

  return (
    <div className="stack">
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 className="section-title">{strings.cards.projects.title}</h2>
            <p className="muted">{strings.cards.projects.description}</p>
          </div>
          {canCreate && (
            <button onClick={() => setIsModalOpen(true)}>{strings.actions.newPost}</button>
          )}
        </div>
        {notice ? <div className="notice">{notice}</div> : null}
      </section>

      <section className="card">
        <h3 className="section-title">All Projects</h3>
        <div className="list">
          {projects.length === 0 ? (
            <p className="muted">{strings.cards.projects.empty}</p>
          ) : (
            (() => {
              let lastName = null;
              let lastIndex = null;

              return projects.map((row) => {
                const colorIndex = getUsernameColorIndex(row.author_name, {
                  avoidIndex: lastIndex,
                  avoidName: lastName,
                });
                lastName = row.author_name;
                lastIndex = colorIndex;

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
                    <div className="post-body" dangerouslySetInnerHTML={{ __html: row.descriptionHtml }} />
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
                    <div
                      className="list-meta"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>
                        <Username name={row.author_name} colorIndex={colorIndex} />
                      </span>
                      <span>
                        {new Date(row.created_at).toLocaleString()}
                        {row.comment_count > 0
                          ? ` · ${row.comment_count} ${row.comment_count === 1 ? 'comment' : 'comments'}`
                          : ''}
                      </span>
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
      </section>

      {canCreate && (
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
