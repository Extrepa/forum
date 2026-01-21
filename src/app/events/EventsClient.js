'use client';

import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';
import { useUiPrefs } from '../../components/UiPrefsProvider';
import { getForumStrings } from '../../lib/forum-texts';
import { formatEventDate, formatEventTime, formatRelativeEventDate, isEventUpcoming } from '../../lib/dates';

export default function EventsClient({ events, notice }) {
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });

  return (
    <div className="stack">
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <h2 className="section-title" style={{ margin: 0 }}>{strings.cards.events.title}</h2>
          <p className="muted" style={{ margin: 0, textAlign: 'right', flex: '1 1 auto', minWidth: '200px' }}>{strings.cards.events.description}</p>
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Latest</h3>
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list">
          {events.length === 0 ? (
            <p className="muted">{strings.cards.events.empty}</p>
          ) : (
            (() => {
              let lastName = null;
              let lastIndex = null;

              const latest = events[0];
              const rest = events.slice(1);

              const renderItem = (row, { condensed }) => {
                const colorIndex = getUsernameColorIndex(row.author_name, {
                  avoidIndex: lastIndex,
                  avoidName: lastName,
                });
                lastName = row.author_name;
                lastIndex = colorIndex;

                return (
                  <a
                    key={row.id}
                    href={`/events/${row.id}`}
                    className="list-item"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
                  >
                    <div style={{ marginBottom: condensed ? '4px' : '8px' }}>
                      <h3 style={{ marginBottom: 0, display: 'inline' }}>{row.title}</h3>
                      <span className="muted" style={{ fontSize: '14px', marginLeft: '6px' }}>
                        by <Username name={row.author_name} colorIndex={colorIndex} />
                      </span>
                    </div>
                    {!condensed && row.details ? (
                      <div className="post-body" style={{ marginBottom: '8px' }} dangerouslySetInnerHTML={{ __html: row.detailsHtml }} />
                    ) : null}
                    {row.image_key ? (
                      <img
                        src={`/api/media/${row.image_key}`}
                        alt=""
                        className="post-image"
                        loading="lazy"
                        style={{ marginBottom: '8px' }}
                      />
                    ) : null}
                    <div
                      className="list-meta"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: condensed ? '12px' : '16px',
                        fontWeight: condensed ? 'normal' : '600',
                        marginTop: '4px',
                        color: condensed ? 'var(--muted)' : 'var(--ink)'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg
                          width={condensed ? "14" : "18"}
                          height={condensed ? "14" : "18"}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: 'var(--errl-accent-3)', flexShrink: 0 }}
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {formatEventDate(row.starts_at)} {formatEventTime(row.starts_at)}
                        {isEventUpcoming(row.starts_at) ? (
                          <span className="muted" style={{ marginLeft: '4px', fontSize: condensed ? '12px' : '14px' }}>
                            ({formatRelativeEventDate(row.starts_at)})
                          </span>
                        ) : null}
                        {row.user_attending ? (
                          <span style={{ marginLeft: '8px', color: 'var(--errl-accent-4)', fontSize: condensed ? '12px' : '14px' }}>
                            ✓ Attending
                          </span>
                        ) : null}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {new Date(row.created_at).toLocaleString()}
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
