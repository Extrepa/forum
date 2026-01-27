'use client';

import Username from './Username';
import { formatDateTime } from '../lib/dates';

/**
 * PostMetaBar - Standardized metadata bar for section pages (Latest & More)
 * 
 * Layout:
 * Row 1: Post Title by <username>
 * Row 2: 
 *   Left: Post date and time
 *   Right: {views} views · {replies} replies · {likes} likes
 * Row 3: Last activity (last comment/response timestamp) - bottom right
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
      {/* Row 1: Title and Author */}
      <div style={{ marginBottom: '8px' }}>
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

      {/* Row 2: Date on left, Views/Replies/Likes on right */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        fontSize: '12px',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: lastActivity ? '8px' : '0'
      }}>
        <span className="muted" suppressHydrationWarning>
          {createdAt ? formatDateTime(createdAt) : ''}
        </span>
        {topRight && (
          <span className="muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
            {topRight}
          </span>
        )}
      </div>

      {/* Row 3: Last Activity (bottom right) */}
      {lastActivity && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          fontSize: '12px',
          marginTop: '4px'
        }}>
          <span className="muted" style={{ whiteSpace: 'nowrap' }} suppressHydrationWarning>
            Last activity: {formatDateTime(lastActivity)}
          </span>
        </div>
      )}
    </div>
  );
}
