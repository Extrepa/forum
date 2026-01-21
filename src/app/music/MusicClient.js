'use client';

import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';
import { useUiPrefs } from '../../components/UiPrefsProvider';
import { getForumStrings } from '../../lib/forum-texts';

export default function MusicClient({ posts, notice }) {
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });

  return (
    <div className="stack">
      <section className="card">
        <h3 className="section-title">Latest</h3>
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list">
          {posts.length === 0 ? (
            <p className="muted">{strings.cards.music.empty}</p>
          ) : (
            (() => {
              let lastName = null;
              let lastIndex = null;

              const latest = posts[0];
              const rest = posts.slice(1);

              const renderItem = (row, { condensed }) => {
                const tags = row.tags ? row.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [];

                const colorIndex = getUsernameColorIndex(row.author_name, {
                  avoidIndex: lastIndex,
                  avoidName: lastName,
                });
                lastName = row.author_name;
                lastIndex = colorIndex;

                return (
                  <div key={row.id} className="list-item">
                    <div className="post-header">
                      <h3>{row.title}</h3>
                      <a className="post-link" href={`/music/${row.id}`}>
                        {condensed ? 'Open' : 'View'}
                      </a>
                    </div>
                    <div
                      className="list-meta"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>
                        <Username name={row.author_name} colorIndex={colorIndex} />
                      </span>
                      <span>{new Date(row.created_at).toLocaleString()}</span>
                    </div>
                    {!condensed && row.embed ? (
                      <div className={`embed-frame ${row.embed.aspect}`}>
                        <iframe
                          src={row.embed.src}
                          title={row.title}
                          allow={row.embed.allow}
                          allowFullScreen={row.embed.allowFullScreen}
                        />
                      </div>
                    ) : null}
                    {!condensed && row.image_key ? (
                      <img
                        src={`/api/media/${row.image_key}`}
                        alt=""
                        className="post-image"
                        loading="lazy"
                      />
                    ) : null}
                    {!condensed && row.bodyHtml ? (
                      <div className="post-body" dangerouslySetInnerHTML={{ __html: row.bodyHtml }} />
                    ) : null}
                    {!condensed && tags.length ? (
                      <div className="tag-row">
                        {tags.map((tag) => (
                          <span key={tag} className="tag-pill">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="rating-row">
                      <span>Rating: {row.avg_rating ? Number(row.avg_rating).toFixed(1) : '—'}</span>
                      <span>{row.rating_count} votes</span>
                      <span>{row.comment_count} comments</span>
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

      <section className="card">
        <h2 className="section-title">{strings.cards.music.title}</h2>
        <p className="muted">{strings.cards.music.description}</p>
      </section>
    </div>
  );
}
