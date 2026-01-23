'use client';

import Link from 'next/link';
import Username from './Username';
import { getUsernameColorIndex } from '../lib/usernameColor';

export default function HomeSectionCard({ title, description, count, recentActivity, href }) {
  if (!recentActivity) {
    return (
      <Link
        href={href}
        className="list-item"
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      >
        <strong>{title}</strong>
        <div className="list-meta">{description}</div>
        <div className="section-stats">
          <span>{count} {count === 1 ? 'post' : 'posts'}</span>
        </div>
      </Link>
    );
  }

  const activityDescription = recentActivity.type === 'reply' || recentActivity.type === 'comment' ? (
    <>
      <Username
        name={recentActivity.activityAuthor}
        colorIndex={getUsernameColorIndex(recentActivity.activityAuthor, { preferredColorIndex: recentActivity.activityAuthorColorPreference })}
        preferredColorIndex={recentActivity.activityAuthorColorPreference}
      />
      {recentActivity.type === 'comment' ? ' commented on ' : ' replied to '}
      <span style={{ color: 'var(--errl-accent-3)' }}>{recentActivity.postTitle}</span>
      {' by '}
      <Username
        name={recentActivity.postAuthor}
        colorIndex={getUsernameColorIndex(recentActivity.postAuthor, { preferredColorIndex: recentActivity.postAuthorColorPreference })}
        preferredColorIndex={recentActivity.postAuthorColorPreference}
      />
    </>
  ) : (
    <>
      <Username
        name={recentActivity.postAuthor || recentActivity.author}
        colorIndex={getUsernameColorIndex(recentActivity.postAuthor || recentActivity.author, { preferredColorIndex: recentActivity.postAuthorColorPreference || recentActivity.authorColorPreference })}
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
      <strong>{title}</strong>
      <div className="list-meta">{description}</div>
      <div className="section-stats">
        <span>{count} {count === 1 ? 'post' : 'posts'}</span>
        {recentActivity && (
          <span>
            {' · '}
            Latest: {activityDescription} · {recentActivity.timeAgo}
          </span>
        )}
      </div>
    </Link>
  );
}
