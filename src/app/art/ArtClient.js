'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../lib/usernameColor';
import PostMetaBar from '../../components/PostMetaBar';

export default function ArtClient({ posts, notice }) {
  const title = useMemo(() => 'Art', []);
  const description = useMemo(() => 'Image-only posts.', []);

  return (
    <div className="stack">
      <section className="card">
        <div className="section-intro">
          <div className="section-intro__meta">
            <h2 className="section-title section-intro__title">{title}</h2>
            <p className="section-intro__desc">{description}</p>
          </div>
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Latest</h3>
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list">
          {posts.length === 0 ? (
            <p className="muted">No art yet.</p>
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

              const renderItem = (p, { condensed }) => {
                const preferredColor = p.author_color_preference !== null && p.author_color_preference !== undefined ? Number(p.author_color_preference) : null;
                const colorIndex = usernameColorMap.get(p.author_name) ?? getUsernameColorIndex(p.author_name, { preferredColorIndex: preferredColor });
                const statusIcons = [];
                if (p.is_pinned) statusIcons.push('📌');
                if (p.is_unread) statusIcons.push('🆕');
                const titleWithIcons = statusIcons.length > 0 
                  ? <><span style={{ marginRight: '6px' }}>{statusIcons.join(' ')}</span>{p.title || 'Untitled'}</>
                  : (p.title || 'Untitled');
                
                return (
                <a
                  key={p.id}
                  href={`/art/${p.id}`}
                  className={`list-item ${p.is_unread ? 'thread-unread' : ''}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
                >
                  <PostMetaBar
                    title={titleWithIcons}
                    author={p.author_name}
                    authorColorIndex={colorIndex}
                    authorPreferredColorIndex={preferredColor}
                    views={p.views || 0}
                    replies={p.comment_count || 0}
                    likes={p.like_count || 0}
                    createdAt={p.created_at}
                    lastActivity={p.last_activity_at || p.created_at}
                    titleHref={`/art/${p.id}`}
                    showTitleLink={false}
                  />
                  {p.is_private ? (
                    <span className="muted" style={{ fontSize: 12, marginTop: '4px', display: 'block' }}>
                      Members-only
                    </span>
                  ) : null}
                  {!condensed && p.image_key ? (
                    <Image
                      src={`/api/media/${p.image_key}`}
                      alt=""
                      className="post-image"
                      width={1200}
                      height={800}
                      loading="lazy"
                      unoptimized
                      style={{ marginTop: '8px' }}
                    />
                  ) : null}
                  {!condensed && p.bodyHtml ? <div className="post-body post-body-scrollable" style={{ marginTop: '8px', marginBottom: '8px' }} dangerouslySetInnerHTML={{ __html: p.bodyHtml }} /> : null}
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
                      {rest.map((p) => renderItem(p, { condensed: true }))}
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
