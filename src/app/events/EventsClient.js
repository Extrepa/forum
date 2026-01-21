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
        <h2 className="section-title">{strings.cards.events.title}</h2>
        <p className="muted">{strings.cards.events.description}</p>
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
                    <h3 style={{ marginBottom: condensed ? '4px' : '6px' }}>{row.title}</h3>
                    {row.image_key ? (
                      <img
                        src={`/api/media/${row.image_key}`}
                        alt=""
                        className="post-image"
                        loading="lazy"
                      />
                    ) : null}
                    {!condensed && row.details ? (
                      <div className="post-body" dangerouslySetInnerHTML={{ __html: row.detailsHtml }} />
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
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg
                          width="14"
                          height="14"
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
                          <span className="muted" style={{ marginLeft: '4px' }}>
                            ({formatRelativeEventDate(row.starts_at)})
                          </span>
                        ) : null}
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
