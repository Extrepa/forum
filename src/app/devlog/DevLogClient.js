'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../lib/usernameColor';
import PostMetaBar from '../../components/PostMetaBar';

export default function DevLogClient({ logs, notice }) {
  const router = useRouter();
  const latestPostRef = useRef(null);
  const [viewTracked, setViewTracked] = useState(false);

  const navigateToLog = (event, href) => {
    if (event?.target?.closest && event.target.closest('a')) {
      return;
    }
    router.push(href);
  };

  // Track view when user scrolls to bottom of latest post
  useEffect(() => {
    if (!latestPostRef.current || viewTracked || logs.length === 0) return;

    const latestPostId = logs[0].id;
    const latestPostElement = latestPostRef.current;

    const checkScroll = () => {
      if (viewTracked) return;

      // Get the bounding box of the latest post element
      const rect = latestPostElement.getBoundingClientRect();
      const elementBottom = rect.bottom;
      const windowHeight = window.innerHeight;

      // Check if the bottom of the post has been scrolled into view
      // We consider it "read" if the bottom of the element is at or above the bottom of the viewport
      // This means the user has scrolled to see the entire post
      // Using a 100px threshold to account for edge cases and ensure the user has actually scrolled
      const isAtBottom = elementBottom <= windowHeight + 100;

      if (isAtBottom) {
        // Track the view
        fetch(`/api/devlog/${latestPostId}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(() => {
          // Silently fail if view tracking fails
        });

        setViewTracked(true);
      }
    };

    // Check on initial load (in case post is already fully visible)
    // Use a small delay to ensure DOM is fully rendered
    const initialCheck = setTimeout(checkScroll, 100);

    // Check on scroll and resize
    window.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll, { passive: true });

    return () => {
      clearTimeout(initialCheck);
      window.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [logs, viewTracked]);

  return (
    <div className="stack">
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Development</h2>
          <p className="muted" style={{ margin: 0, textAlign: 'right', flex: '1 1 auto', minWidth: '200px' }}>Updates, notes, and builds in progress.</p>
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Latest</h3>
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list">
          {logs.length === 0 ? (
            <p className="muted">No Development posts yet.</p>
          ) : (
            (() => {
              // Build preferences map and assign unique colors
              const allUsernames = logs.map(l => l.author_name).filter(Boolean);
              const preferredColors = new Map();
              logs.forEach(l => {
                if (l.author_name && l.author_color_preference !== null && l.author_color_preference !== undefined) {
                  preferredColors.set(l.author_name, Number(l.author_color_preference));
                }
              });
              const usernameColorMap = assignUniqueColorsForPage(allUsernames, preferredColors);

              const latest = logs[0];
              const rest = logs.slice(1);

              const renderItem = (row, { condensed }) => {
                const href = `/devlog/${row.id}`;
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
                    href={href}
                    className={`list-item ${row.is_unread ? 'thread-unread' : ''}`}
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
                    onClick={(e) => navigateToLog(e, href)}
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
                      titleHref={href}
                      showTitleLink={false}
                    />
                    {row.is_locked ? (
                      <span className="muted" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        Comments locked
                      </span>
                    ) : null}
                    {row.image_key ? (
                      <img
                        src={`/api/media/${row.image_key}`}
                        alt=""
                        className="post-image"
                        loading="lazy"
                        style={{ marginTop: '8px', marginBottom: '8px' }}
                      />
                    ) : null}
                    {!condensed ? (
                      <div className="post-body post-body-scrollable" style={{ marginTop: '8px', marginBottom: '8px' }} dangerouslySetInnerHTML={{ __html: row.bodyHtml }} />
                    ) : null}
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

