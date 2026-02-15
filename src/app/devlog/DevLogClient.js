'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../lib/usernameColor';
import PostMetaBar from '../../components/PostMetaBar';

export default function DevLogClient({ logs, notice , headerActions}) {
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
      const postBodyElement = latestPostWrapper?.querySelector('.post-body.post-body-scrollable');
      
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
        fetch(`/api/devlog/${latestPostId}/view`, {
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
  }, [logs, viewTracked]);

  return (
    <div className="stack">
      <section className="card">
        <div className="section-intro">
          <div className="section-intro__meta">
            <h2 className="section-title section-intro__title">Development</h2>
            <p className="section-intro__desc">Updates, notes, and builds in progress.</p>
          </div>
          {headerActions ? (
            <div className="section-intro__actions">{headerActions}</div>
          ) : null}
        </div>
      </section>

      <section className="card">
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list list--tight">
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
                if (row.is_pinned) statusIcons.push('📌');
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
