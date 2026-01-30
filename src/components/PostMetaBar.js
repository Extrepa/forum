'use client';

import Username from './Username';
import { formatDateTime } from '../lib/dates';

/**
 * PostMetaBar - Standardized metadata bar for section pages (Latest & More)
 * 
 * Desktop Layout:
 * Row 1: 
 *   Left: Post Title by <username>
 *   Right: {views} views · {replies} replies · {likes} likes (top right)
 * Row 2:
 *   Left: Post date and time (bottom left)
 *   Right: Last activity (bottom right)
 * 
 * Mobile Layout:
 * Wraps naturally while maintaining structure
 */
export default function PostMetaBar({
  title,
  author,
  authorColorIndex,
  authorPreferredColorIndex,
  views = 0,
  replies = 0,
  likes = 0,
  createdAt,
  lastActivity,
  lastActivityBy,
  lastActivityByColorIndex,
  lastActivityByPreferredColorIndex,
  className = '',
  titleHref,
  showTitleLink = true,
  hideDateOnDesktop = false
}) {
  const formatCount = (count) => {
    if (count === 0) return null;
    return count;
  };

  const topRight = [
    formatCount(views) !== null && `${views} ${views === 1 ? 'view' : 'views'}`,
    formatCount(replies) !== null && `${replies} ${replies === 1 ? 'reply' : 'replies'}`,
    formatCount(likes) !== null && `${likes} ${likes === 1 ? 'like' : 'likes'}`
  ].filter(Boolean).join(' · ');

  const TitleElement = showTitleLink && titleHref ? 'a' : 'span';
  const titleProps = showTitleLink && titleHref ? { href: titleHref } : {};

  return (
    <div className={className}>
      {/* Row 1: Title/Author on left, Views/Replies/Likes on top right (desktop) */}
      <div className="post-meta-row1" style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '8px',
        flexWrap: 'wrap',
        gap: '8px',
        rowGap: '4px'
      }}>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <TitleElement 
            {...titleProps}
            style={showTitleLink ? { textDecoration: 'none', color: 'inherit' } : {}}
          >
            <h3 style={{ margin: 0, display: 'inline' }}>{title}</h3>
          </TitleElement>
          <span className="muted" style={{ fontSize: '14px', marginLeft: '6px' }}>
            by <Username 
              name={author} 
              colorIndex={authorColorIndex}
              preferredColorIndex={authorPreferredColorIndex}
            />
          </span>
        </div>
        {/* Desktop: Views/Replies/Likes on top right */}
        {topRight && (
          <span className="post-meta-stats-desktop muted" style={{ fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {topRight}
          </span>
        )}
      </div>

      {/* Row 2: Date/time on left, Views/Replies/Likes on right (mobile), Last Activity on right (desktop) */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        fontSize: '12px',
        flexWrap: 'wrap',
        gap: '8px',
        rowGap: '4px'
      }}>
        {createdAt && (
          <span className={`muted ${hideDateOnDesktop ? 'post-meta-date-mobile-only' : ''}`} suppressHydrationWarning>
            {formatDateTime(createdAt)}
          </span>
        )}
        {/* Mobile: Views/Replies/Likes on right side of date row */}
        {topRight && (
          <span className="post-meta-stats-mobile muted" style={{ fontSize: '12px', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
            {topRight}
          </span>
        )}
        {/* Desktop: Last Activity on bottom right - hide when no replies (avoids duplicating author) */}
        {lastActivity && replies > 0 && (
          <span className="post-meta-last-activity muted" style={{ whiteSpace: 'nowrap', marginLeft: 'auto' }}>
            Last activity{lastActivityBy ? (
              <> by <Username name={lastActivityBy} colorIndex={lastActivityByColorIndex} preferredColorIndex={lastActivityByPreferredColorIndex} /></>
            ) : null} at <span suppressHydrationWarning>{formatDateTime(lastActivity)}</span>
          </span>
        )}
      </div>
      {/* Mobile: Last Activity on separate row - hide when no replies (avoids duplicating author) */}
      {lastActivity && replies > 0 && (
        <div className="post-meta-last-activity-mobile" style={{ 
          display: 'flex',
          justifyContent: 'flex-end',
          fontSize: '12px',
          marginTop: '4px'
        }}>
          <span className="muted" style={{ whiteSpace: 'nowrap' }}>
            Last activity{lastActivityBy ? (
              <> by <Username name={lastActivityBy} colorIndex={lastActivityByColorIndex} preferredColorIndex={lastActivityByPreferredColorIndex} /></>
            ) : null} at <span suppressHydrationWarning>{formatDateTime(lastActivity)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
