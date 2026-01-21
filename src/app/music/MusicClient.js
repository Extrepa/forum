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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <h2 className="section-title" style={{ margin: 0 }}>{strings.cards.music.title}</h2>
          <p className="muted" style={{ margin: 0, textAlign: 'right', flex: '1 1 auto', minWidth: '200px' }}>{strings.cards.music.description}</p>
        </div>
      </section>

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
                  <a
                    key={row.id}
                    href={`/music/${row.id}`}
                    className="list-item"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
                  >
                    <div style={{ marginBottom: condensed ? '4px' : '8px' }}>
                      <h3 style={{ marginBottom: 0, display: 'inline' }}>{row.title}</h3>
                      <span className="muted" style={{ fontSize: '14px', marginLeft: '6px' }}>
                        by <Username name={row.author_name} colorIndex={colorIndex} />
                      </span>
                    </div>
                    {!condensed && row.bodyHtml ? (
                      <div className="post-body" style={{ marginBottom: '8px' }} dangerouslySetInnerHTML={{ __html: row.bodyHtml }} />
                    ) : null}
                    {!condensed && row.embed ? (
                      <div 
                        className={`embed-frame ${row.embed.aspect}`}
                        style={{
                          marginBottom: '8px',
                          ...(row.embed.height ? { height: `${row.embed.height}px`, minHeight: `${row.embed.height}px` } : {})
                        }}
                      >
                        <iframe
                          src={row.embed.src}
                          title={row.title}
                          allow={row.embed.allow}
                          allowFullScreen={row.embed.allowFullScreen}
                          style={{ height: '100%' }}
                        />
                      </div>
                    ) : null}
                    {!condensed && row.image_key ? (
                      <img
                        src={`/api/media/${row.image_key}`}
                        alt=""
                        className="post-image"
                        loading="lazy"
                        style={{ marginBottom: '8px' }}
                      />
                    ) : null}
                    {!condensed && tags.length ? (
                      <div className="tag-row" style={{ marginBottom: '8px' }}>
                        {tags.map((tag) => (
                          <span key={tag} className="tag-pill">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {!condensed ? (
                      <div className="rating-row" style={{ fontSize: '12px', marginBottom: '8px' }}>
                        <span>Rating: {row.avg_rating ? Number(row.avg_rating).toFixed(1) : '—'}</span>
                        <span>{row.rating_count} votes</span>
                        <span>{row.comment_count} comments</span>
                      </div>
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
                      <span>{new Date(row.created_at).toLocaleString()}</span>
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
