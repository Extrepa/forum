'use client';

import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../lib/usernameColor';
import { useUiPrefs } from '../../components/UiPrefsProvider';
import { getForumStrings } from '../../lib/forum-texts';
import PostMetaBar from '../../components/PostMetaBar';

export default function TimelineClient({ updates, notice, basePath = '/timeline' }) {
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });

  return (
    <div className="stack">
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <h2 className="section-title" style={{ margin: 0 }}>{strings.cards.announcements.title}</h2>
          <p className="muted" style={{ margin: 0, textAlign: 'right', flex: '1 1 auto', minWidth: '200px' }}>{strings.cards.announcements.description}</p>
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Latest</h3>
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list">
          {updates.length === 0 ? (
            <p className="muted">{strings.cards.announcements.empty}</p>
          ) : (
            (() => {
              // Build preferences map and assign unique colors
              const allUsernames = updates.map(u => u.author_name).filter(Boolean);
              const preferredColors = new Map();
              updates.forEach(u => {
                if (u.author_name && u.author_color_preference !== null && u.author_color_preference !== undefined) {
                  preferredColors.set(u.author_name, Number(u.author_color_preference));
                }
              });
              const usernameColorMap = assignUniqueColorsForPage(allUsernames, preferredColors);

              const latest = updates[0];
              const rest = updates.slice(1);

              const renderItem = (row, { condensed }) => {
                const preferredColor = row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null;
                const colorIndex = usernameColorMap.get(row.author_name) ?? getUsernameColorIndex(row.author_name, { preferredColorIndex: preferredColor });

                return (
                  <a
                    key={row.id}
                    href={`${basePath}/${row.id}`}
                    className="list-item"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
                  >
                    <PostMetaBar
                      title={row.title || 'Update'}
                      author={row.author_name}
                      authorColorIndex={colorIndex}
                      authorPreferredColorIndex={preferredColor}
                      views={row.views || 0}
                      replies={row.comment_count || 0}
                      likes={row.like_count || 0}
                      createdAt={row.created_at}
                      lastActivity={row.last_activity_at || row.created_at}
                      titleHref={`${basePath}/${row.id}`}
                      showTitleLink={false}
                    />
                    {row.image_key ? (
                      <img
                        src={`/api/media/${row.image_key}`}
                        alt=""
                        className="post-image"
                        loading="lazy"
                        style={{ marginTop: '8px' }}
                      />
                    ) : null}
                    {!condensed ? <div className="post-body" style={{ marginTop: '8px' }} dangerouslySetInnerHTML={{ __html: row.bodyHtml }} /> : null}
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
