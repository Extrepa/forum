'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../lib/usernameColor';
import PostMetaBar from '../../components/PostMetaBar';

export default function ArtNostalgiaClient({ posts, notice , headerActions}) {
  const title = useMemo(() => 'Art & Nostalgia', []);
  const description = useMemo(() => 'Image-only posts and memories from the 2000s, childhood, and everything in between.', []);

  return (
    <div className="stack">
      <section className="card">
        <div className="section-intro">
          <div className="section-intro__meta">
            <h2 className="section-title section-intro__title">{title}</h2>
            <p className="section-intro__desc">{description}</p>
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
            <p className="muted">No posts yet.</p>
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
                
                return (
                  <a
                    key={p.id}
                    href={`/${p.type}/${p.id}`}
                    className="list-item"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
                  >
                    <PostMetaBar
                      title={p.title || 'Untitled'}
                      author={p.author_name}
                      authorColorIndex={colorIndex}
                      authorPreferredColorIndex={preferredColor}
                      views={p.views || 0}
                      replies={p.comment_count || 0}
                      likes={p.like_count || 0}
                      createdAt={p.created_at}
                      lastActivity={p.last_activity_at || p.created_at}
                      titleHref={`/${p.type}/${p.id}`}
                      showTitleLink={false}
                    />
                    <span className="muted" style={{ fontSize: 12, marginTop: '4px', display: 'block' }}>
                      {p.type === 'art' ? 'Art' : 'Nostalgia'}
                      {p.is_private ? ' · Members-only' : ''}
                    </span>
                    {p.image_key && (!condensed || p.is_pinned) ? (
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
