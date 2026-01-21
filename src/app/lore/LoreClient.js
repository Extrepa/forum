'use client';

import { useMemo } from 'react';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';

export default function LoreClient({ posts, notice }) {
  const title = useMemo(() => 'Lore', []);
  const description = useMemo(() => "Errl's story and history.", []);

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
            <p className="muted">No lore yet.</p>
          ) : (
            (() => {
              const latest = posts[0];
              const rest = posts.slice(1);

              const renderItem = (p, { condensed }) => (
                <a
                  key={p.id}
                  href={`/lore/${p.id}`}
                  className="list-item"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
                >
                  <div className="post-header" style={{ marginBottom: condensed ? '4px' : '6px' }}>
                    <h3 style={{ marginBottom: 0 }}>{p.title || 'Untitled'}</h3>
                    {p.is_private ? (
                      <span className="muted" style={{ fontSize: 12 }}>
                        Members-only
                      </span>
                    ) : null}
                  </div>
                  <div
                    className="list-meta"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      marginTop: '4px'
                    }}
                  >
                    <span>
                      <Username name={p.author_name} colorIndex={getUsernameColorIndex(p.author_name)} />
                    </span>
                    <span>{new Date(p.created_at).toLocaleString()}</span>
                  </div>
                  {!condensed && p.bodyHtml ? <div className="post-body" dangerouslySetInnerHTML={{ __html: p.bodyHtml }} /> : null}
                </a>
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

