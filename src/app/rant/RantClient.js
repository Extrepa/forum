'use client';

import { useMemo } from 'react';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';

export default function RantClient({ posts, notice }) {
  const title = useMemo(() => 'Rant', []);
  const description = useMemo(() => 'Vent. Get it out. Be kind.', []);

  return (
    <div className="stack">
      <section className="card">
        <h2 className="section-title">{title}</h2>
        <p className="muted">{description}</p>
      </section>

      <section className="card">
        <h3 className="section-title">Latest</h3>
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list">
          {posts.length === 0 ? (
            <p className="muted">No rants yet.</p>
          ) : (
            (() => {
              const latest = posts[0];
              const rest = posts.slice(1);

              const renderItem = (p, { condensed }) => (
                <div key={p.id} className="list-item">
                  <div className="post-header">
                    <h3>
                      <a href={`/rant/${p.id}`}>{p.title || 'Untitled'}</a>
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
                  {!condensed && p.bodyHtml ? <div className="post-body" dangerouslySetInnerHTML={{ __html: p.bodyHtml }} /> : null}
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
    </div>
  );
}

