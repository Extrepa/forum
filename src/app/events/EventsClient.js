'use client';

import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../lib/usernameColor';
import { useUiPrefs } from '../../components/UiPrefsProvider';
import { getForumStrings } from '../../lib/forum-texts';
import { formatEventDate, formatEventTime, formatRelativeEventDate, isEventUpcoming } from '../../lib/dates';
import PostMetaBar from '../../components/PostMetaBar';

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
              // Build preferences map and assign unique colors
              const allUsernames = events.map(e => e.author_name).filter(Boolean);
              const preferredColors = new Map();
              events.forEach(e => {
                if (e.author_name && e.author_color_preference !== null && e.author_color_preference !== undefined) {
                  preferredColors.set(e.author_name, Number(e.author_color_preference));
                }
              });
              const usernameColorMap = assignUniqueColorsForPage(allUsernames, preferredColors);

              const latest = events[0];
              const rest = events.slice(1);

              const renderItem = (row, { condensed }) => {
                const preferredColor = row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null;
                const colorIndex = usernameColorMap.get(row.author_name) ?? getUsernameColorIndex(row.author_name, { preferredColorIndex: preferredColor });

                const formatTimeAgo = (timestamp) => {
                  const now = Date.now();
                  const diff = now - timestamp;
                  const seconds = Math.floor(diff / 1000);
                  const minutes = Math.floor(seconds / 60);
                  const hours = Math.floor(minutes / 60);
                  const days = Math.floor(hours / 24);

                  if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
                  if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
                  if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
                  return 'just now';
                };

                return (
                  <a
                    key={row.id}
                    href={`/events/${row.id}`}
                    className="list-item"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
                  >
                    <PostMetaBar
                      title={row.title}
                      author={row.author_name}
                      authorColorIndex={colorIndex}
                      authorPreferredColorIndex={row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null}
                      views={row.views || 0}
                      replies={row.comment_count || 0}
                      likes={row.like_count || 0}
                      createdAt={row.created_at}
                      lastActivity={row.last_activity_at || row.created_at}
                      titleHref={`/events/${row.id}`}
                      showTitleLink={false}
                    />
                    {!condensed && row.details ? (
                      <div className="post-body" style={{ marginTop: '8px', marginBottom: '8px' }} dangerouslySetInnerHTML={{ __html: row.detailsHtml }} />
                    ) : null}
                    {row.image_key ? (
                      <img
                        src={`/api/media/${row.image_key}`}
                        alt=""
                        className="post-image"
                        loading="lazy"
                        style={{ marginTop: '8px', marginBottom: '8px' }}
                      />
                    ) : null}
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: condensed ? '12px' : '14px' }}>
                      <svg
                        width={condensed ? "12" : "14"}
                        height={condensed ? "12" : "14"}
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
                      <span style={{ fontSize: condensed ? '11px' : '12px', color: 'var(--muted)' }}>
                        {formatEventDate(row.starts_at)} {formatEventTime(row.starts_at)}
                        {isEventUpcoming(row.starts_at) ? (
                          <span className="muted" style={{ marginLeft: '4px' }}>
                            ({formatRelativeEventDate(row.starts_at)})
                          </span>
                        ) : null}
                      </span>
                      {row.user_attending ? (
                        <span style={{ marginLeft: '8px', color: 'var(--errl-accent-4)', fontSize: condensed ? '11px' : '12px' }}>
                          ✓ Attending
                        </span>
                      ) : null}
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
