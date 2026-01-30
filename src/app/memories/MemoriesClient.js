'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../lib/usernameColor';
import PostMetaBar from '../../components/PostMetaBar';

export default function MemoriesClient({ posts, notice }) {
  const title = useMemo(() => 'Memories', []);
  const description = useMemo(
    () => 'Nomad history, documents, and the things we did together.',
    []
  );
  const latestPostRef = useRef(null);
  const [viewTracked, setViewTracked] = useState(false);

  // Track view when user scrolls to bottom of latest post
  useEffect(() => {
    if (!latestPostRef.current || viewTracked || posts.length === 0) return;

    const latestPostId = posts[0].id;
    let initialScrollY = window.scrollY || window.pageYOffset;
    let hasScrolledDown = false;
    let maxScrollY = initialScrollY;

    const checkScroll = () => {
      if (viewTracked) return;

      const currentScrollY = window.scrollY || window.pageYOffset;
      
      // Track if user has scrolled DOWN (not just any scroll)
      if (currentScrollY > maxScrollY) {
        hasScrolledDown = true;
        maxScrollY = currentScrollY;
      }

      // Only count as view if user has scrolled down AND reached the bottom of the post
      if (!hasScrolledDown) return;

      // Find the post body element within the latest post (the actual content div)
      const latestPostWrapper = latestPostRef.current;
      const postBodyElement = latestPostWrapper?.querySelector('.post-body');
      
      if (!postBodyElement) return;

      // Get the bounding box of the post body element (the actual content)
      const rect = postBodyElement.getBoundingClientRect();
      
      // Calculate the absolute position of the bottom of the post body on the page
      // rect.bottom is relative to viewport top, so we add scrollY to get absolute position
      const elementBottomAbsolute = currentScrollY + rect.bottom;
      
      // Check if the user has scrolled enough that the bottom of the post body is visible
      // The bottom is visible when the viewport bottom has reached or passed the element bottom
      const viewportBottom = currentScrollY + window.innerHeight;
      const isBottomVisible = viewportBottom >= elementBottomAbsolute - 50; // 50px threshold

      if (isBottomVisible) {
        // Track the view
        fetch(`/api/posts/${latestPostId}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(() => {
          // Silently fail if view tracking fails
        });

        setViewTracked(true);
      }
    };

    // Check on scroll and resize
    window.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [posts, viewTracked]);

  return (
    <div className="stack">
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <h2 className="section-title" style={{ margin: 0 }}>{title}</h2>
          <p className="muted" style={{ margin: 0, textAlign: 'right', flex: '1 1 auto', minWidth: '200px' }}>{description}</p>
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Latest</h3>
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list">
          {posts.length === 0 ? (
            <p className="muted">No memories yet.</p>
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
                  href={`/memories/${p.id}`}
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
                    titleHref={`/memories/${p.id}`}
                    showTitleLink={false}
                  />
                  {p.is_private ? (
                    <span className="muted" style={{ fontSize: 12, marginTop: '4px', display: 'block' }}>
                      Members-only
                    </span>
                  ) : null}
                  {!condensed && p.bodyHtml ? <div className="post-body" style={{ marginTop: '8px' }} dangerouslySetInnerHTML={{ __html: p.bodyHtml }} /> : null}
                </a>
                );
              };

              return (
                <>
                  <div ref={latestPostRef}>
                    {renderItem(latest, { condensed: false })}
                  </div>
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

