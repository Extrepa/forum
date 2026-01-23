'use client';

import { useMemo } from 'react';
import Username from '../../components/Username';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../lib/usernameColor';

export default function RantClient({ posts, notice }) {
  const title = useMemo(() => 'Rant', []);
  const description = useMemo(() => 'Vent. Get it out. Be kind.', []);

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
            <p className="muted">No rants yet.</p>
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
                    <Username 
                      name={p.author_name} 
                      colorIndex={colorIndex}
                      preferredColorIndex={preferredColor}
                    /> ·{' '}
                    {new Date(p.created_at).toLocaleString()}
                  </div>
                  {!condensed && p.bodyHtml ? <div className="post-body" dangerouslySetInnerHTML={{ __html: p.bodyHtml }} /> : null}
                </div>
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

