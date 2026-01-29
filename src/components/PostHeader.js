'use client';

import Username from './Username';
import LikeButton from './LikeButton';
import { formatDateTime } from '../lib/dates';

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
  authorAvatarKey, // Added authorAvatarKey
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
        flexWrap: 'nowrap',
        gap: '12px'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="section-title" style={{ marginBottom: '8px', wordBreak: 'break-word' }}>{title}</h2>
          <div className="list-meta" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <Username 
              name={author} 
              colorIndex={authorColorIndex}
              preferredColorIndex={authorPreferredColorIndex}
              avatarKey={authorAvatarKey} 
              style={{ verticalAlign: 'middle' }} // Apply vertical-align
            />
            {createdAt && (
              <>
                <span style={{ verticalAlign: 'middle' }}>·</span>
                <span suppressHydrationWarning style={{ verticalAlign: 'middle' }}>{formatDateTime(createdAt)}</span>
              </>
            )}
            {showUpdatedAt && updatedAt && updatedAt !== createdAt && (
              <>
                <span style={{ verticalAlign: 'middle' }}>·</span>
                <span style={{ verticalAlign: 'middle' }}>Updated</span>
                <span suppressHydrationWarning style={{ verticalAlign: 'middle' }}>{formatDateTime(updatedAt)}</span>
              </>
            )}
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          {likeButton}
        </div>
      </div>

    </div>
  );
}
