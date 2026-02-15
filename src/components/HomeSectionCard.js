'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Username from './Username';
import { getUsernameColorIndex } from '../lib/usernameColor';

export default function HomeSectionCard({
  title,
  description,
  count,
  recentActivity,
  href,
  usernameColorMap,
  compactMode = false,
  isExpanded = false,
  onToggle
}) {
  const router = useRouter();
  const countLabel = `${count} ${count === 1 ? 'post' : 'posts'}`;

  const activityDescription = recentActivity
    ? (recentActivity.type === 'reply' || recentActivity.type === 'comment' ? (
      <>
        <Username
          name={recentActivity.activityAuthor}
          colorIndex={usernameColorMap?.get(recentActivity.activityAuthor) ?? getUsernameColorIndex(recentActivity.activityAuthor, { preferredColorIndex: recentActivity.activityAuthorColorPreference })}
          preferredColorIndex={recentActivity.activityAuthorColorPreference}
        />
        {recentActivity.type === 'comment' ? ' commented on ' : ' replied to '}
        <span style={{ color: 'var(--errl-accent-3)' }}>{recentActivity.postTitle}</span>
        {' by '}
        <Username
          name={recentActivity.postAuthor}
          colorIndex={usernameColorMap?.get(recentActivity.postAuthor) ?? getUsernameColorIndex(recentActivity.postAuthor, { preferredColorIndex: recentActivity.postAuthorColorPreference })}
          preferredColorIndex={recentActivity.postAuthorColorPreference}
        />
      </>
    ) : (
      <>
        <Username
          name={recentActivity.postAuthor || recentActivity.author}
          colorIndex={usernameColorMap?.get(recentActivity.postAuthor || recentActivity.author) ?? getUsernameColorIndex(recentActivity.postAuthor || recentActivity.author, { preferredColorIndex: recentActivity.postAuthorColorPreference || recentActivity.authorColorPreference })}
          preferredColorIndex={recentActivity.postAuthorColorPreference || recentActivity.authorColorPreference}
        />
        {' posted '}
        <span style={{ color: 'var(--errl-accent-3)' }}>{recentActivity.postTitle || recentActivity.title}</span>
      </>
    ))
    : null;

  if (compactMode) {
    return (
      <article className={`list-item home-section-card home-section-card--compact${isExpanded ? ' is-expanded' : ''}`}>
        <div className="home-section-card__top">
          <button
            type="button"
            className="home-section-card__toggle"
            onClick={onToggle}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title}`}
          >
            <span className="home-section-card__title">{title}</span>
            <span className="section-card-count" suppressHydrationWarning>{countLabel}</span>
          </button>
          <Link href={href} className="home-section-card__open-link">
            Open
          </Link>
        </div>

        <p className="list-meta home-section-card__description">{description}</p>

        {isExpanded && (
          <div className="home-section-card__details">
            {recentActivity ? (
              <div className="section-stats" suppressHydrationWarning>
                <Link href={recentActivity.href} style={{ color: 'inherit', textDecoration: 'none' }}>
                  Latest drip: {activityDescription} · <span suppressHydrationWarning>{recentActivity.timeAgo || 'just now'}</span>
                </Link>
              </div>
            ) : (
              <p className="section-card-empty-cta">The goo is quiet here — head in and post something.</p>
            )}
          </div>
        )}
      </article>
    );
  }

  if (!recentActivity) {
    return (
      <Link
        href={href}
        className="list-item"
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
          <strong>{title}</strong>
          <span className="section-card-count" suppressHydrationWarning>{countLabel}</span>
        </div>
        <div className="list-meta">{description}</div>
        <p className="section-card-empty-cta" aria-hidden="true">
          The goo is quiet here — head in and post something.
        </p>
      </Link>
    );
  }

  return (
    <div
      className="list-item"
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          router.push(href);
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
        <strong>{title}</strong>
        <span className="section-card-count" suppressHydrationWarning>{countLabel}</span>
      </div>
      <div className="list-meta">{description}</div>
      <div className="section-stats" suppressHydrationWarning>
        <Link
          href={recentActivity.href}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          Latest drip: {activityDescription} · <span suppressHydrationWarning>{recentActivity.timeAgo || 'just now'}</span>
        </Link>
      </div>
    </div>
  );
}
