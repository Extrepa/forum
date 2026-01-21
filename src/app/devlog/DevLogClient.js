'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CreatePostModal from '../../components/CreatePostModal';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';
import DevLogForm from '../../components/DevLogForm';

export default function DevLogClient({ logs, notice, isAdmin }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const navigateToLog = (event, href) => {
    if (event?.target?.closest && event.target.closest('a')) {
      return;
    }
    router.push(href);
  };

  return (
    <div className="stack">
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 className="section-title">Development</h2>
            <p className="muted">Updates, notes, and builds in progress.</p>
          </div>
          {isAdmin ? <button onClick={() => setIsModalOpen(true)}>New Development Post</button> : null}
        </div>
        {notice ? <div className="notice">{notice}</div> : null}
      </section>

      <section className="card">
        <h3 className="section-title">Latest</h3>
        <div className="list">
          {logs.length === 0 ? (
            <p className="muted">No Development posts yet.</p>
          ) : (
            (() => {
              let lastName = null;
              let lastIndex = null;

              return logs.map((row) => {
                const href = `/devlog/${row.id}`;
                const colorIndex = getUsernameColorIndex(row.author_name, {
                  avoidIndex: lastIndex,
                  avoidName: lastName,
                });
                lastName = row.author_name;
                lastIndex = colorIndex;

                return (
                  <div
                    key={row.id}
                    className="list-item"
                    role="link"
                    tabIndex={0}
                    onClick={(e) => navigateToLog(e, href)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigateToLog(e, href);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="post-header">
                      <h3>
                        <a href={href}>{row.title}</a>
                      </h3>
                      {row.is_locked ? (
                        <span className="muted" style={{ fontSize: '12px' }}>
                          Comments locked
                        </span>
                      ) : null}
                    </div>
                    {row.image_key ? (
                      <img
                        src={`/api/media/${row.image_key}`}
                        alt=""
                        className="post-image"
                        loading="lazy"
                      />
                    ) : null}
                    <div className="post-body" dangerouslySetInnerHTML={{ __html: row.bodyHtml }} />
                    <div
                      className="list-meta"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>
                        <Username name={row.author_name} colorIndex={colorIndex} />
                      </span>
                      <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <a className="post-link" href={href}>
                          Open full post
                        </a>
                        {new Date(row.created_at).toLocaleString()}
                        {row.comment_count > 0
                          ? ` · ${row.comment_count} ${row.comment_count === 1 ? 'reply' : 'replies'}`
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

      {isAdmin ? (
        <CreatePostModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="New Development Post"
          variant="wide"
        >
          <DevLogForm />
        </CreatePostModal>
      ) : null}
    </div>
  );
}

