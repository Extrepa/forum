'use client';

import Image from 'next/image';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../lib/usernameColor';
import { useUiPrefs } from '../../components/UiPrefsProvider';
import { getForumStrings } from '../../lib/forum-texts';
import PostMetaBar from '../../components/PostMetaBar';

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <h2 className="section-title" style={{ margin: 0 }}>{strings.cards.shitposts.title}</h2>
          <p className="muted" style={{ margin: 0, textAlign: 'right', flex: '1 1 auto', minWidth: '200px' }}>{strings.cards.shitposts.description}</p>
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Latest</h3>
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list">
          {posts.length === 0 ? (
            <p className="muted">{strings.cards.shitposts.empty}</p>
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
                const preferredColor = row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null;
                const colorIndex = usernameColorMap.get(row.author_name) ?? getUsernameColorIndex(row.author_name, { preferredColorIndex: preferredColor });
                const statusIcons = [];
                if (row.is_unread) statusIcons.push('🆕');
                const titleWithIcons = statusIcons.length > 0 
                  ? <><span style={{ marginRight: '6px' }}>{statusIcons.join(' ')}</span>{row.title}</>
                  : row.title;

                return (
                  <a
                    key={row.id}
                    href={`/lobby/${row.id}`}
                    className={`list-item ${row.is_unread ? 'thread-unread' : ''}`}
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
                  >
                    <PostMetaBar
                      title={titleWithIcons}
                      author={row.author_name}
                      authorColorIndex={colorIndex}
                      authorPreferredColorIndex={row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null}
                      views={row.views || 0}
                      replies={row.reply_count || 0}
                      likes={row.like_count || 0}
                      createdAt={row.created_at}
                      lastActivity={row.last_activity_at || row.created_at}
                      titleHref={`/lobby/${row.id}`}
                      showTitleLink={false}
                    />
                    {!condensed && row.image_key ? (
                      <Image
                        src={`/api/media/${row.image_key}`}
                        alt=""
                        className="post-image"
                        width={1200}
                        height={800}
                        loading="lazy"
                        unoptimized
                        style={{ maxHeight: '200px', width: 'auto', marginTop: '8px' }}
                      />
                    ) : null}
                    {!condensed ? (
                      <p className="muted" style={{ marginTop: '8px', marginBottom: '8px', fontSize: '13px' }}>
                        {truncateBody(row.body)}
                      </p>
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
