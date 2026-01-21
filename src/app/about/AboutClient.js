'use client';

import { useMemo } from 'react';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';

export default function AboutClient({ posts, notice }) {
  const title = useMemo(() => 'About', []);
  const description = useMemo(() => 'Site description and links.', []);

  return (
    <div className="stack">
      <section className="card">
        <h3 className="section-title">Latest</h3>
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list">
          {posts.length === 0 ? (
            <p className="muted">No about posts yet.</p>
          ) : (
            (() => {
              const latest = posts[0];
              const rest = posts.slice(1);

              const renderItem = (p, { condensed }) => (
                <div key={p.id} className="list-item">
                  <div className="post-header">
                    <h3>
                      <a href={`/about#${p.id}`}>{p.title || 'About'}</a>
                    </h3>
                    {p.is_private ? (
                      <span className="muted" style={{ fontSize: 12 }}>
                        Members-only
                      </span>
                    ) : null}
                  </div>
                  <div className="list-meta">
                    <Username name={p.author_name} colorIndex={getUsernameColorIndex(p.author_name)} /> ·{' '}
                    {new Date(p.created_at).toLocaleString()}
                  </div>
                  {!condensed && p.image_key ? (
                    <img src={`/api/media/${p.image_key}`} alt="" className="post-image" loading="lazy" />
                  ) : null}
                  {!condensed && p.bodyHtml ? (
                    <div id={p.id} className="post-body" dangerouslySetInnerHTML={{ __html: p.bodyHtml }} />
                  ) : null}
                </div>
              );

              return (
                <>
                  {renderItem(latest, { condensed: false })}
                  {rest.length ? (
                    <>
                      <div className="list-divider" />
                      <h3 className="section-title" style={{ marginTop: 0 }}>More</h3>
                      {rest.map((p) => renderItem(p, { condensed: true }))}
                    </>
                  ) : null}
                </>
              );
            })()
          )}
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">{title}</h2>
        <p className="muted">{description}</p>
      </section>
    </div>
  );
}

