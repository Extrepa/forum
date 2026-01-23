'use client';

import Username from './Username';
import LikeButton from './LikeButton';

/**
 * PostHeader - Standardized header for detail pages
 * 
 * Layout:
 * Top Row:
 *   Left: Post Title by <username>
 *   Right: Like Button
 * Bottom Row:
 *   Left: Post date and time
 *   Right: View Count (only counts new viewers)
 */
export default function PostHeader({
  title,
  author,
  authorColorIndex,
  authorPreferredColorIndex,
  createdAt,
  views = 0,
  likeButton,
  className = '',
  showUpdatedAt = false,
  updatedAt = null
}) {
  return (
    <div className={className}>
      {/* Top Row */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '12px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ flex: 1 }}>
          <h2 className="section-title" style={{ marginBottom: '8px' }}>{title}</h2>
          <div className="list-meta">
            <Username 
              name={author} 
              colorIndex={authorColorIndex}
              preferredColorIndex={authorPreferredColorIndex}
            />
            {createdAt && (
              <>
                {' · '}
                {new Date(createdAt).toLocaleString()}
              </>
            )}
            {showUpdatedAt && updatedAt && updatedAt !== createdAt && (
              <>
                {' · Updated '}
                {new Date(updatedAt).toLocaleString()}
              </>
            )}
          </div>
        </div>
        {likeButton}
      </div>

      {/* Bottom Row - Only show view count on right, date/time already shown above */}
      {views !== undefined && views !== null && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center', 
          fontSize: '12px',
          marginTop: '8px'
        }}>
          <span className="muted">
            {views} {views === 1 ? 'view' : 'views'}
          </span>
        </div>
      )}
    </div>
  );
}
