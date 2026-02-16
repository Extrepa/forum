'use client';

import Image from 'next/image';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../lib/usernameColor';
import { useUiPrefs } from '../../components/UiPrefsProvider';
import { getForumStrings } from '../../lib/forum-texts';
import { formatEventDate, formatEventTime, formatRelativeEventDate, isEventUpcoming, formatDateTime, getEventDayCompletionTimestamp } from '../../lib/dates';
import PostMetaBar from '../../components/PostMetaBar';

export default function EventsClient({ events, notice , headerActions}) {
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });

  return (
    <div className="stack">
      <section className="card">
        <div className="section-intro">
          <div className="section-intro__meta">
            <h2 className="section-title section-intro__title">{strings.cards.events.title}</h2>
            <p className="section-intro__desc">{strings.cards.events.description}</p>
          </div>
          {headerActions ? (
            <div className="section-intro__actions">{headerActions}</div>
          ) : null}
        </div>
      </section>

      <section className="card">
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list list--tight">
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

                const statusIcons = [];
                if (row.is_pinned) statusIcons.push('📌');
                if (row.is_unread) statusIcons.push('🆕');
                const titleWithIcons = statusIcons.length > 0 
                  ? <><span style={{ marginRight: '6px' }}>{statusIcons.join(' ')}</span>{row.title}</>
                  : row.title;
                const eventEndAt = row.ends_at || row.starts_at;
                const completionAt = getEventDayCompletionTimestamp(eventEndAt);
                const hasPassed = completionAt > 0 && Date.now() > completionAt;
                const attendeeLabel = hasPassed ? 'attended' : 'attending';
                const attendeeTitle = row.attendee_names?.length ? row.attendee_names.join(', ') : '';
                const showAttendingTag = row.user_attending && !hasPassed;

                return (
                  <a
                    key={row.id}
                    href={`/events/${row.id}`}
                    className={`list-item ${row.is_unread ? 'thread-unread' : ''}`}
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
                  >
                    <PostMetaBar
                      title={titleWithIcons}
                      author={row.author_name}
                      authorColorIndex={colorIndex}
                      authorPreferredColorIndex={row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null}
                      views={row.views || 0}
                      replies={row.comment_count || 0}
                      likes={row.like_count || 0}
                      createdAt={row.created_at}
                      lastActivity={undefined}
                      titleHref={`/events/${row.id}`}
                      showTitleLink={false}
                      authorDateInline={condensed}
                    />
                    <div
                      className="event-info-row"
                      style={{
                        marginTop: '8px',
                        display: 'flex',
                        flexWrap: condensed ? 'nowrap' : 'wrap',
                        alignItems: 'center',
                        gap: condensed ? '4px' : '6px',
                        fontSize: condensed ? '12px' : '14px',
                        minWidth: 0,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 auto', minWidth: 0 }}>
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
                        <span
                          style={{
                            fontSize: condensed ? '11px' : '12px',
                            color: 'var(--muted)',
                            whiteSpace: condensed ? 'nowrap' : 'normal',
                            overflow: condensed ? 'hidden' : 'visible',
                            textOverflow: condensed ? 'ellipsis' : 'clip',
                          }}
                          suppressHydrationWarning
                        >
                          {formatEventDate(row.starts_at)} {formatEventTime(row.starts_at)}
                          {!hasPassed && isEventUpcoming(row.starts_at) ? (
                            <span className="muted" style={{ marginLeft: '4px' }}>
                              ({formatRelativeEventDate(row.starts_at)})
                            </span>
                          ) : null}
                          {hasPassed ? (
                            <span className="muted" style={{ marginLeft: '4px' }}>
                              (Event happened)
                            </span>
                          ) : null}
                          {row.attendee_count > 0 ? (
                            <span className="muted" style={{ marginLeft: '6px' }} title={attendeeTitle}>
                              · {row.attendee_count} {attendeeLabel}
                            </span>
                          ) : null}
                        </span>
                      </div>
                      {showAttendingTag ? (
                        <span style={{ color: 'var(--errl-accent-4)', fontSize: condensed ? '11px' : '12px', flexShrink: 0 }}>
                          ✓ Attending
                        </span>
                      ) : null}
                      {!condensed && (row.last_activity_at || row.created_at) && (row.comment_count || 0) > 0 ? (
                        <span className="muted" style={{ marginLeft: 'auto', whiteSpace: 'nowrap', fontSize: '12px' }} suppressHydrationWarning>
                          Last activity at {formatDateTime(row.last_activity_at || row.created_at)}
                        </span>
                      ) : null}
                    </div>
                    {row.image_key && (!condensed || row.is_pinned) ? (
                      <Image
                        src={`/api/media/${row.image_key}`}
                        alt=""
                        className="post-image"
                        width={1200}
                        height={800}
                        loading="lazy"
                        unoptimized
                        style={{ marginTop: '8px', marginBottom: '8px' }}
                      />
                    ) : null}
                    {!condensed && row.details ? (
                      <div className="post-body post-body-scrollable" style={{ marginTop: '8px', marginBottom: '8px' }} dangerouslySetInnerHTML={{ __html: row.detailsHtml }} />
                    ) : null}
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
