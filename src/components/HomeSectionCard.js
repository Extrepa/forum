'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Username from './Username';
import { getUsernameColorIndex } from '../lib/usernameColor';

export default function HomeSectionCard({
  title,
  description,
  count,
  recentActivities,
  recentActivity,
  href,
  usernameColorMap,
  compactMode = false,
  isExpanded = false,
  onToggle
}) {
  const router = useRouter();
  const countLabel = `${count} ${count === 1 ? 'post' : 'posts'}`;
  const listItems = Array.isArray(recentActivities) ? recentActivities.filter(Boolean) : [];
  const recentItems = recentActivity
    ? [recentActivity, ...listItems.filter((item) => item.href !== recentActivity.href || item.timeAgo !== recentActivity.timeAgo)].slice(0, 3)
    : listItems.slice(0, 3);
  const nowTs = Date.now();
  const latestActivityTs = Number(recentItems[0]?.createdAt || recentActivity?.createdAt || 0);
  const hasRecentInLast24h = Number.isFinite(latestActivityTs) && latestActivityTs > 0 && (nowTs - latestActivityTs) <= (24 * 60 * 60 * 1000);

  const renderActivityDescription = (activity) => (
    activity.type === 'reply' || activity.type === 'comment' ? (
      <>
        <Username
          name={activity.activityAuthor}
          colorIndex={usernameColorMap?.get(activity.activityAuthor) ?? getUsernameColorIndex(activity.activityAuthor, { preferredColorIndex: activity.activityAuthorColorPreference })}
          preferredColorIndex={activity.activityAuthorColorPreference}
        />
        {activity.type === 'comment' ? ' commented on ' : ' replied to '}
        <span style={{ color: 'var(--errl-accent-3)' }}>{activity.postTitle}</span>
        {' by '}
        <Username
          name={activity.postAuthor}
          colorIndex={usernameColorMap?.get(activity.postAuthor) ?? getUsernameColorIndex(activity.postAuthor, { preferredColorIndex: activity.postAuthorColorPreference })}
          preferredColorIndex={activity.postAuthorColorPreference}
        />
      </>
    ) : (
      <>
        <Username
          name={activity.postAuthor || activity.author}
          colorIndex={usernameColorMap?.get(activity.postAuthor || activity.author) ?? getUsernameColorIndex(activity.postAuthor || activity.author, { preferredColorIndex: activity.postAuthorColorPreference || activity.authorColorPreference })}
          preferredColorIndex={activity.postAuthorColorPreference || activity.authorColorPreference}
        />
        {' posted '}
        <span style={{ color: 'var(--errl-accent-3)' }}>{activity.postTitle || activity.title}</span>
      </>
    )
  );

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
            <span className="home-section-card__title-wrap">
              <span className="home-section-card__headline">
                <span className="home-section-card__title">{title}</span>
                <span className="home-section-card__headline-sep" aria-hidden="true"> - </span>
                <span className="home-section-card__headline-description">{description}</span>
              </span>
            </span>
            <span className="home-section-card__count-wrap">
              <span className="section-card-count" suppressHydrationWarning>{countLabel}</span>
              <span className={`home-section-card__status-dot${hasRecentInLast24h ? ' is-recent' : ''}`} aria-hidden="true" />
              <span className="home-section-card__chevron" aria-hidden="true">{isExpanded ? '-' : '+'}</span>
            </span>
          </button>
        </div>

        {isExpanded && (
          <div className="home-section-card__details">
            <p className="home-section-card__full-description">{description}</p>
            <div className="home-section-card__details-head">
              {recentItems.length > 0 ? (
                <span className="home-section-card__status-text">Latest drip:</span>
              ) : (
                <span />
              )}
              <Link href={href} className="home-section-card__section-link">
                Open section
              </Link>
            </div>
            {recentItems.length > 0 ? (
              <ul className="home-section-card__recent-list">
                {recentItems.slice(0, 3).map((item, idx) => (
                  <li key={`${item.href}-${idx}`} className="home-section-card__recent-item">
                    <Link href={item.href} className="home-section-card__recent-link" suppressHydrationWarning>
                      {renderActivityDescription(item)} · <span suppressHydrationWarning>{item.timeAgo || 'just now'}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="section-card-empty-cta">The goo is quiet here - head in and post something.</p>
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
          The goo is quiet here - head in and post something.
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
          <span className="home-section-card__status-text">Latest drip:</span>{' '}
          {renderActivityDescription(recentActivity)} · <span suppressHydrationWarning>{recentActivity.timeAgo || 'just now'}</span>
        </Link>
      </div>
    </div>
  );
}
