'use client';

import Link from 'next/link';
import Username from './Username';
import { getUsernameColorIndex } from '../lib/usernameColor';
import { formatTimeAgo } from '../lib/dates';

export default function HomeRecentFeed({ recentPosts }) {
  if (!recentPosts || recentPosts.length === 0) {
    return null;
  }

  return (
    <section className="card">
      <h3 className="section-title" style={{ marginBottom: '16px' }}>Recent Activity</h3>
      <div className="list">
        {recentPosts.map((post) => {
          const colorIndex = getUsernameColorIndex(post.author_name);
          return (
            <Link
              key={post.id}
              href={post.href || `/${post.section}/${post.id}`}
              className="list-item"
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div style={{ marginBottom: '4px' }}>
                <strong>{post.title}</strong>
              </div>
              <div className="list-meta" style={{ fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Username name={post.author_name} colorIndex={colorIndex} />
                <span>·</span>
                <span>{formatTimeAgo(post.created_at)}</span>
                {post.section && (
                  <>
                    <span>·</span>
                    <span className="muted">{post.section}</span>
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
