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
 * 
 * Note: View count is displayed at the bottom right of the entire post card,
 * not in this header component.
 */
export default function PostHeader({
  title,
  author,
  authorColorIndex,
  authorPreferredColorIndex,
  createdAt,
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

    </div>
  );
}
