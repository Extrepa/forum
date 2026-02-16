'use client';

import Username from './Username';
import { formatDateTimeShort } from '../lib/dates';

/**
 * PostMetaBar - Standardized metadata bar for section pages (Latest & More)
 *
 * Layout: Row 1 = title (left) + stats (top right). Row 2 = "by user" / custom content / or "by user" + last activity.
 * - When customRowsAfterTitle is passed (e.g. events): row 2 is that custom content only; caller includes last activity in it. No row 3.
 * - When no custom and has last activity: row 2 = by user (line 1) + last activity in .post-meta-last-activity-second-line (line 2, right-aligned). No row 3.
 * - When no custom and no last activity: row 2 = by user only.
 * Stats stay right-aligned (wrapper with flex-end). Uses formatDateTimeShort for compact date/time.
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
  hideDateOnDesktop = false,
  authorDateInline = false,
  hideStats = false,
  customRowsAfterTitle = null
}) {
  const formatCount = (count) => {
    if (count === 0) return null;
    return count;
  };

  const statLines = [
    formatCount(views) !== null && `${views} ${views === 1 ? 'view' : 'views'}`,
    formatCount(replies) !== null && `${replies} ${replies === 1 ? 'reply' : 'replies'}`,
    formatCount(likes) !== null && `${likes} ${likes === 1 ? 'like' : 'likes'}`
  ].filter(Boolean);

  const hasStats = statLines.length > 0 && !hideStats;
  const hasLastActivity = Boolean(lastActivity && replies > 0);

  const TitleElement = showTitleLink && titleHref ? 'a' : 'span';
  const titleProps = showTitleLink && titleHref ? { href: titleHref } : {};

  const byUserAtTime = (
    <span className="post-meta-by-block muted" style={{ fontSize: '12px' }}>
      by <Username
        name={author}
        colorIndex={authorColorIndex}
        preferredColorIndex={authorPreferredColorIndex}
      />
      {createdAt ? <> at <span className="post-meta-inline-date" style={{ fontSize: '12px' }} suppressHydrationWarning>{formatDateTimeShort(createdAt)}</span></> : null}
    </span>
  );

  const statsInline = hasStats ? (
    <span className="post-meta-stats-inline muted" style={{ fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
      {statLines.join(' \u00B7 ')}
    </span>
  ) : null;

  const lastActivityEl = hasLastActivity && (
    <span className="post-meta-last-activity post-meta-last-activity-inline muted" style={{ fontSize: '12px' }}>
      Last activity{lastActivityBy ? (
        <> by <Username name={lastActivityBy} colorIndex={lastActivityByColorIndex} preferredColorIndex={lastActivityByPreferredColorIndex} /></>
      ) : null} at <span suppressHydrationWarning>{formatDateTimeShort(lastActivity)}</span>
    </span>
  );

  /* When custom (e.g. event): row 2 is custom only; no row 3 (custom includes last activity).
     When not custom and has last activity: row 2 = by user + last activity (last activity wraps to second line); no row 3. */
  const hasCustomRow2 = customRowsAfterTitle != null;
  const row2HasActivity = !hasCustomRow2 && hasLastActivity;
  const row2Content = hasCustomRow2
    ? customRowsAfterTitle
    : (row2HasActivity ? (
        <>
          {byUserAtTime}
          <span className="post-meta-last-activity-second-line">{lastActivityEl}</span>
        </>
      ) : byUserAtTime);

  return (
    <div className={`${className} post-meta`.trim()} style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
      {/* Row 1: Title (left) + stats (top right); stats wrapper keeps them right when row wraps */}
      <div
        className="post-meta-row1 post-meta-title-row"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          gap: '8px',
          minWidth: 0
        }}
      >
        <TitleElement
          {...titleProps}
          style={{ ...(showTitleLink ? { textDecoration: 'none', color: 'inherit' } : {}), minWidth: 0, flex: '1 1 auto' }}
        >
          <h3 style={{ margin: 0, display: 'inline', fontSize: 'inherit' }}>{title}</h3>
        </TitleElement>
        {statsInline && (
          <div className="post-meta-stats-top-right" style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'flex-end', minWidth: 0 }}>
            {statsInline}
          </div>
        )}
      </div>

      {/* Row 2: by user / custom; when not custom and has last activity, last activity wraps to second line */}
      <div className={`post-meta-row2 post-meta-by-row${row2HasActivity ? ' post-meta-row2-with-activity' : ''}`}>
        {row2Content}
      </div>
    </div>
  );
}
