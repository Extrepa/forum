'use client';

import Username from './Username';

/**
 * PostMetaBar - Standardized metadata bar for section pages (Latest & More)
 * 
 * Layout:
 * Top Row:
 *   Left: Post Title by <username>
 *   Right: {views} views · {replies} replies · {likes} likes
 * Bottom Row:
 *   Left: Post date and time
 *   Right: Last activity (last comment/response timestamp)
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
      {/* Top Row */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '8px',
        flexWrap: 'wrap',
        gap: '8px'
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
          <span className="muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
            {topRight}
          </span>
        )}
      </div>

      {/* Bottom Row */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        fontSize: '12px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <span className="muted">
          {createdAt ? new Date(createdAt).toLocaleString() : ''}
        </span>
        {lastActivity && (
          <span className="muted">
            Last activity: {new Date(lastActivity).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
