'use client';

import { useRouter } from 'next/navigation';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';

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
        <h2 className="section-title">Development</h2>
        <p className="muted">Updates, notes, and builds in progress.</p>
      </section>

      <section className="card">
        <h3 className="section-title">Latest</h3>
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list">
          {logs.length === 0 ? (
            <p className="muted">No Development posts yet.</p>
          ) : (
            (() => {
              let lastName = null;
              let lastIndex = null;

              const latest = logs[0];
              const rest = logs.slice(1);

              const renderItem = (row, { condensed }) => {
                const href = `/devlog/${row.id}`;
                const colorIndex = getUsernameColorIndex(row.author_name, {
                  avoidIndex: lastIndex,
                  avoidName: lastName,
                });
                lastName = row.author_name;
                lastIndex = colorIndex;

                return (
                  <a
                    key={row.id}
                    href={href}
                    className="list-item"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
                  >
                    <div className="post-header" style={{ marginBottom: condensed ? '4px' : '6px' }}>
                      <h3 style={{ marginBottom: 0 }}>{row.title}</h3>
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
                    {!condensed ? (
                      <div className="post-body" dangerouslySetInnerHTML={{ __html: row.bodyHtml }} />
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
                        <Username name={row.author_name} colorIndex={colorIndex} />
                      </span>
                      <span>
                        {new Date(row.created_at).toLocaleString()}
                        {row.comment_count > 0
                          ? ` · ${row.comment_count} ${row.comment_count === 1 ? 'reply' : 'replies'}`
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

