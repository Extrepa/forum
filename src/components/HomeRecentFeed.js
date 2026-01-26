'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Username from './Username';
import { getUsernameColorIndex } from '../lib/usernameColor';
import { formatTimeAgo } from '../lib/dates';

export default function HomeRecentFeed({ recentPosts, usernameColorMap, preferredColors }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!recentPosts || recentPosts.length === 0) {
    return null;
  }

  return (
    <section className="card">
      <h3 className="section-title" style={{ marginBottom: '16px' }}>Recent Activity</h3>
      <div className="list">
        {recentPosts.map((activity) => {
          const preferredColor = activity.author_color_preference !== null && activity.author_color_preference !== undefined ? Number(activity.author_color_preference) : null;
          const colorIndex = usernameColorMap?.get(activity.author_name) ?? getUsernameColorIndex(activity.author_name, { preferredColorIndex: preferredColor });
          const isReplyOrComment = activity.activity_type?.includes('_reply') || activity.activity_type?.includes('_comment');
          
          return (
            <Link
              key={activity.id}
              href={activity.href || (isReplyOrComment ? `/${activity.section}/${activity.parent_id || activity.id}` : `/${activity.section}/${activity.id}`)}
              className="list-item"
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div style={{ marginBottom: '4px' }}>
                {isReplyOrComment ? (
                  <>
                    <Username name={activity.author_name} colorIndex={colorIndex} />
                    {' replied to '}
                    <strong>{activity.parent_title}</strong>
                    {activity.parent_author && (
                      <>
                        {' by '}
                        {(() => {
                          const parentPreferredColor = preferredColors?.get(activity.parent_author);
                          return (
                            <Username 
                              name={activity.parent_author} 
                              colorIndex={usernameColorMap?.get(activity.parent_author) ?? getUsernameColorIndex(activity.parent_author, { preferredColorIndex: parentPreferredColor })}
                              preferredColorIndex={parentPreferredColor}
                            />
                          );
                        })()}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <strong>{activity.title}</strong>
                    {' by '}
                    <Username name={activity.author_name} colorIndex={colorIndex} />
                  </>
                )}
              </div>
              <div className="list-meta" style={{ fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>{mounted ? formatTimeAgo(activity.created_at) : 'just now'}</span>
                {activity.section && (
                  <>
                    <span>·</span>
                    <span className="muted">{activity.section}</span>
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
