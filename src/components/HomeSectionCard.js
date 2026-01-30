'use client';

import Link from 'next/link';
import Username from './Username';
import { getUsernameColorIndex } from '../lib/usernameColor';

export default function HomeSectionCard({ title, description, count, recentActivity, href, usernameColorMap, preferredColors }) {
  if (!recentActivity) {
    return (
      <Link
        href={href}
        className="list-item"
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
          <strong>{title}</strong>
          <span className="section-card-count" suppressHydrationWarning>{count} {count === 1 ? 'post' : 'posts'}</span>
        </div>
        <div className="list-meta">{description}</div>
        <p className="section-card-empty-cta" aria-hidden="true">
          The goo is quiet here — head in and post something.
        </p>
      </Link>
    );
  }

  const activityDescription = recentActivity.type === 'reply' || recentActivity.type === 'comment' ? (
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
  );

  return (
    <Link
      href={recentActivity.href}
      className="list-item"
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
        <strong>{title}</strong>
        <span className="section-card-count" suppressHydrationWarning>{count} {count === 1 ? 'post' : 'posts'}</span>
      </div>
      <div className="list-meta">{description}</div>
      <div className="section-stats" suppressHydrationWarning>
        <span>
          Latest drip: {activityDescription} · <span suppressHydrationWarning>{recentActivity.timeAgo || 'just now'}</span>
        </span>
      </div>
    </Link>
  );
}
