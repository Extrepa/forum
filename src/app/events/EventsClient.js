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
                  <div key={row.id} className="list-item">
                    <h3>
                      <a href={`/events/${row.id}`}>{row.title}</a>
                    </h3>
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
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>
                        <Username name={row.author_name} colorIndex={colorIndex} />
                      </span>
                      <span>
                        {formatEventDate(row.starts_at)} {formatEventTime(row.starts_at)}
                        {isEventUpcoming(row.starts_at) ? (
                          <span className="muted" style={{ marginLeft: '8px' }}>
                            ({formatRelativeEventDate(row.starts_at)})
                          </span>
                        ) : null}
                      </span>
                    </div>
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
