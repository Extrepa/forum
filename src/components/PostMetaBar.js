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
  className = '',
  titleHref,
  showTitleLink = true
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
      {/* Row 1: Title/Author on left, Views/Replies/Likes on top right */}
      <div style={{ 
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
        {topRight && (
          <span className="muted" style={{ fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {topRight}
          </span>
        )}
      </div>

      {/* Row 2: Date/time on bottom left, Last Activity on bottom right */}
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
          <span className="muted" suppressHydrationWarning>
            {formatDateTime(createdAt)}
          </span>
        )}
        {lastActivity && (
          <span className="muted" style={{ whiteSpace: 'nowrap', marginLeft: 'auto' }} suppressHydrationWarning>
            Last activity: {formatDateTime(lastActivity)}
          </span>
        )}
      </div>
    </div>
  );
}
