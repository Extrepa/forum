'use client';

import { useMemo } from 'react';
import Username from '../../components/Username';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../lib/usernameColor';

export default function MemoriesClient({ posts, notice }) {
  const title = useMemo(() => 'Memories', []);
  const description = useMemo(
    () => 'Nomad history, documents, and the things we did together.',
    []
  );

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
            <p className="muted">No memories yet.</p>
          ) : (
            (() => {
              // Build preferences map and assign unique colors
              const allUsernames = posts.map(p => p.author_name).filter(Boolean);
              const preferredColors = new Map();
              posts.forEach(p => {
                if (p.author_name && p.author_color_preference !== null && p.author_color_preference !== undefined) {
                  preferredColors.set(p.author_name, Number(p.author_color_preference));
                }
              });
              const usernameColorMap = assignUniqueColorsForPage(allUsernames, preferredColors);

              const latest = posts[0];
              const rest = posts.slice(1);

              const renderItem = (p, { condensed }) => {
                const preferredColor = p.author_color_preference !== null && p.author_color_preference !== undefined ? Number(p.author_color_preference) : null;
                const colorIndex = usernameColorMap.get(p.author_name) ?? getUsernameColorIndex(p.author_name, { preferredColorIndex: preferredColor });
                
                return (
                <a
                  key={p.id}
                  href={`/memories/${p.id}`}
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
                      <Username 
                        name={p.author_name} 
                        colorIndex={colorIndex}
                        preferredColorIndex={preferredColor}
                      />
                    </span>
                    <span>{new Date(p.created_at).toLocaleString()}</span>
                  </div>
                  {!condensed && p.bodyHtml ? <div className="post-body" dangerouslySetInnerHTML={{ __html: p.bodyHtml }} /> : null}
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

