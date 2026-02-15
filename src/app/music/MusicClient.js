'use client';

import Image from 'next/image';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../lib/usernameColor';
import { useUiPrefs } from '../../components/UiPrefsProvider';
import { getForumStrings } from '../../lib/forum-texts';
import PostMetaBar from '../../components/PostMetaBar';

export default function MusicClient({ posts, notice , headerActions}) {
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });

  return (
    <div className="stack">
      <section className="card">
        <div className="section-intro">
          <div className="section-intro__meta">
            <h2 className="section-title section-intro__title">{strings.cards.music.title}</h2>
            <p className="section-intro__desc">{strings.cards.music.description}</p>
          </div>
          {headerActions ? (
            <div className="section-intro__actions">{headerActions}</div>
          ) : null}
        </div>
      </section>

      <section className="card">
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list list--tight">
          {posts.length === 0 ? (
            <p className="muted">{strings.cards.music.empty}</p>
          ) : (
            (() => {
              // Build preferences map and assign unique colors
              const allUsernames = posts.map(p => p.author_name).filter(Boolean);
              const preferredColors = new Map();
              posts.forEach(p => {
                if (p.author_name && p.author_color_preference !== null && p.author_color_preference !== undefined) {
                  preferredColors.set(p.author_name, Number(p.author_color_preference));
                }
              });
              const usernameColorMap = assignUniqueColorsForPage(allUsernames, preferredColors);

              const latest = posts[0];
              const rest = posts.slice(1);

              const renderItem = (row, { condensed }) => {
                const tags = row.tags ? row.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [];

                const preferredColor = row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null;
                const colorIndex = usernameColorMap.get(row.author_name) ?? getUsernameColorIndex(row.author_name, { preferredColorIndex: preferredColor });
                const statusIcons = [];
                if (row.is_pinned) statusIcons.push('📌');
                if (row.is_unread) statusIcons.push('🆕');
                const titleWithIcons = statusIcons.length > 0 
                  ? <><span style={{ marginRight: '6px' }}>{statusIcons.join(' ')}</span>{row.title}</>
                  : row.title;

                return (
                  <a
                    key={row.id}
                    href={`/music/${row.id}`}
                    className={`list-item ${row.is_unread ? 'thread-unread' : ''}`}
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
                  >
                    <PostMetaBar
                      title={titleWithIcons}
                      author={row.author_name}
                      authorColorIndex={colorIndex}
                      authorPreferredColorIndex={preferredColor}
                      views={row.views || 0}
                      replies={row.comment_count || 0}
                      likes={row.like_count || 0}
                      createdAt={row.created_at}
                      lastActivity={row.last_activity_at || row.created_at}
                      titleHref={`/music/${row.id}`}
                      showTitleLink={false}
                    />
                    {!condensed && row.bodyHtml ? (
                      <div className="post-body post-body-scrollable" style={{ marginTop: '8px', marginBottom: '8px' }} dangerouslySetInnerHTML={{ __html: row.bodyHtml }} />
                    ) : null}
                    {!condensed && row.embed ? (
                      <div 
                        className={`embed-frame ${row.embed.aspect}`}
                        style={{
                          marginTop: '8px',
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
                    {!condensed && tags.length ? (
                      <div className="tag-row" style={{ marginTop: '8px', marginBottom: '8px' }}>
                        {tags.map((tag) => (
                          <span key={tag} className="tag-pill">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {!condensed ? (
                      <div className="rating-row" style={{ fontSize: '12px', marginTop: '8px', marginBottom: '8px' }}>
                        <span>Rating: {row.avg_rating ? Number(row.avg_rating).toFixed(1) : '—'}</span>
                        <span>{row.rating_count} votes</span>
                        <span>{row.comment_count} comments</span>
                      </div>
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
