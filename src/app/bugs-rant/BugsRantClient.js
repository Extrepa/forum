'use client';

import { useMemo } from 'react';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';

export default function BugsRantClient({ posts, notice }) {
  const title = useMemo(() => 'Bugs & Rants', []);
  const description = useMemo(() => 'Report issues, weirdness, and broken stuff. Or vent. Get it out. Be kind.', []);

  return (
    <div className="stack">
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <h2 className="section-title" style={{ margin: 0 }}>{title}</h2>
          <p className="muted" style={{ margin: 0, textAlign: 'right', flex: '1 1 auto', minWidth: '200px' }}>{description}</p>
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Latest</h3>
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list">
          {posts.length === 0 ? (
            <p className="muted">No posts yet.</p>
          ) : (
            (() => {
              const latest = posts[0];
              const rest = posts.slice(1);

              const renderItem = (p, { condensed }) => {
                const colorIndex = getUsernameColorIndex(p.author_name);
                return (
                  <a
                    key={p.id}
                    href={`/${p.type}/${p.id}`}
                    className="list-item"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
                  >
                    <div style={{ marginBottom: condensed ? '4px' : '8px' }}>
                      <h3 style={{ marginBottom: 0, display: 'inline' }}>{p.title || (p.type === 'bugs' ? 'Bug report' : 'Untitled')}</h3>
                      <span className="muted" style={{ fontSize: '14px', marginLeft: '6px' }}>
                        by <Username name={p.author_name} colorIndex={colorIndex} />
                      </span>
                      <span className="muted" style={{ fontSize: 12, marginLeft: '8px' }}>
                        {p.type === 'bugs' ? 'Bug' : 'Rant'}
                        {p.is_private ? ' · Members-only' : ''}
                      </span>
                    </div>
                    {!condensed && p.bodyHtml ? <div className="post-body" style={{ marginBottom: '8px' }} dangerouslySetInnerHTML={{ __html: p.bodyHtml }} /> : null}
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
                      <span>{new Date(p.created_at).toLocaleString()}</span>
                    </div>
                  </a>
                );
              };

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
