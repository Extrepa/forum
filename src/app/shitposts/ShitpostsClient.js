'use client';

import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';
import { useUiPrefs } from '../../components/UiPrefsProvider';
import { getForumStrings } from '../../lib/forum-texts';

export default function ShitpostsClient({ posts, notice }) {
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });

  const truncateBody = (body, maxLength = 150) => {
    if (!body) return '';
    // Strip markdown formatting for preview
    const plainText = body
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links
      .replace(/<u>([^<]+)<\/u>/g, '$1') // Remove underline
      .trim();
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  return (
    <div className="stack">
      <section className="card">
        <h3 className="section-title">Latest</h3>
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list">
          {posts.length === 0 ? (
            <p className="muted">{strings.cards.shitposts.empty}</p>
          ) : (
            (() => {
              let lastName = null;
              let lastIndex = null;

              const latest = posts[0];
              const rest = posts.slice(1);

              const renderItem = (row, { condensed }) => {
                const colorIndex = getUsernameColorIndex(row.author_name, {
                  avoidIndex: lastIndex,
                  avoidName: lastName,
                });
                lastName = row.author_name;
                lastIndex = colorIndex;

                return (
                  <div key={row.id} className="list-item" style={{ cursor: 'pointer' }}>
                    <a href={`/lobby/${row.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3>{row.title}</h3>
                      {!condensed && row.image_key ? (
                        <img
                          src={`/api/media/${row.image_key}`}
                          alt=""
                          className="post-image"
                          loading="lazy"
                          style={{ maxHeight: '200px', width: 'auto' }}
                        />
                      ) : null}
                      {!condensed ? (
                        <p className="muted" style={{ marginBottom: '8px' }}>
                          {truncateBody(row.body)}
                        </p>
                      ) : null}
                      <div
                        className="list-meta"
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <span>
                          <Username name={row.author_name} colorIndex={colorIndex} />
                        </span>
                        <span>
                          {new Date(row.created_at).toLocaleString()}
                          {row.reply_count > 0
                            ? ` · ${row.reply_count} ${row.reply_count === 1 ? 'reply' : 'replies'}`
                            : ''}
                        </span>
                      </div>
                    </a>
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

      <section className="card">
        <h2 className="section-title">{strings.cards.shitposts.title}</h2>
        <p className="muted">{strings.cards.shitposts.description}</p>
      </section>
    </div>
  );
}
