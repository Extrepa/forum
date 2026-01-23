'use client';

import { useRouter } from 'next/navigation';
import Username from '../../components/Username';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../lib/usernameColor';

export default function DevLogClient({ logs, notice }) {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Development</h2>
          <p className="muted" style={{ margin: 0, textAlign: 'right', flex: '1 1 auto', minWidth: '200px' }}>Updates, notes, and builds in progress.</p>
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Latest</h3>
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list">
          {logs.length === 0 ? (
            <p className="muted">No Development posts yet.</p>
          ) : (
            (() => {
              // Build preferences map and assign unique colors
              const allUsernames = logs.map(l => l.author_name).filter(Boolean);
              const preferredColors = new Map();
              logs.forEach(l => {
                if (l.author_name && l.author_color_preference !== null && l.author_color_preference !== undefined) {
                  preferredColors.set(l.author_name, Number(l.author_color_preference));
                }
              });
              const usernameColorMap = assignUniqueColorsForPage(allUsernames, preferredColors);

              const latest = logs[0];
              const rest = logs.slice(1);

              const renderItem = (row, { condensed }) => {
                const href = `/devlog/${row.id}`;
                const preferredColor = row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null;
                const colorIndex = usernameColorMap.get(row.author_name) ?? getUsernameColorIndex(row.author_name, { preferredColorIndex: preferredColor });

                return (
                  <a
                    key={row.id}
                    href={href}
                    className="list-item"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
                  >
                    <div style={{ marginBottom: condensed ? '4px' : '8px' }}>
                      <h3 style={{ marginBottom: 0, display: 'inline' }}>{row.title}</h3>
                      <span className="muted" style={{ fontSize: '14px', marginLeft: '6px' }}>
                        by <Username 
                          name={row.author_name} 
                          colorIndex={colorIndex}
                          preferredColorIndex={row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null}
                        />
                      </span>
                      {row.is_locked ? (
                        <span className="muted" style={{ fontSize: '12px', marginLeft: '8px' }}>
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
                        style={{ marginBottom: '8px' }}
                      />
                    ) : null}
                    {!condensed ? (
                      <div className="post-body" style={{ marginBottom: '8px' }} dangerouslySetInnerHTML={{ __html: row.bodyHtml }} />
                    ) : null}
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
                        {new Date(row.created_at).toLocaleString()}
                      </span>
                      <span>
                        {row.comment_count > 0
                          ? `${row.comment_count} ${row.comment_count === 1 ? 'reply' : 'replies'}`
                          : ''}
                      </span>
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
                      {rest.map((row) => renderItem(row, { condensed: true }))}
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

