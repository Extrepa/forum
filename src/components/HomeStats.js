'use client';

import Link from 'next/link';
import { formatTimeAgo } from '../lib/dates';

export default function HomeStats({ stats, recentPosts = [] }) {
  if (!stats) {
    return null;
  }

  return (
    <section className="card">
      <h3 className="section-title" style={{ marginBottom: '16px' }}>Stats</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {/* Total Posts Card */}
        <div
          className="card"
          style={{
            padding: '16px',
            border: '1px solid rgba(52, 225, 255, 0.2)',
            background: 'rgba(4, 16, 23, 0.6)'
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px' }}>
            {stats.totalPosts || 0}
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
            Total Posts
          </div>
          <div className="muted" style={{ fontSize: '12px' }}>
            Across all sections
          </div>
        </div>

        {/* Active Users Card - Two Columns */}
        <div
          className="card"
          style={{
            padding: '16px',
            border: '1px solid rgba(52, 225, 255, 0.2)',
            background: 'rgba(4, 16, 23, 0.6)'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
            Active Users
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ flex: '1' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>
                {stats.totalUsers || 0}
              </div>
              <div className="muted" style={{ fontSize: '11px' }}>
                Total signed up
              </div>
            </div>
            <div style={{ 
              width: '1px', 
              background: 'rgba(52, 225, 255, 0.2)', 
              alignSelf: 'stretch' 
            }} />
            <div style={{ flex: '1' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>
                {stats.activeUsers || 0}
              </div>
              <div className="muted" style={{ fontSize: '11px' }}>
                Currently active
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Card - Two Columns (Posts | Replies) */}
        <div
          className="card"
          style={{
            padding: '16px',
            border: '1px solid rgba(52, 225, 255, 0.2)',
            background: 'rgba(4, 16, 23, 0.6)',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              Recent Activity
            </div>
            <div className="muted" style={{ fontSize: '11px' }}>
              Last 24 hours
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ flex: '1' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>
                {stats.recentPostsCount || 0}
              </div>
              <div className="muted" style={{ fontSize: '11px' }}>
                Posts
              </div>
            </div>
            <div style={{ 
              width: '1px', 
              background: 'rgba(52, 225, 255, 0.2)', 
              alignSelf: 'stretch' 
            }} />
            <div style={{ flex: '1' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>
                {stats.recentRepliesCount || 0}
              </div>
              <div className="muted" style={{ fontSize: '11px' }}>
                Replies
              </div>
            </div>
          </div>
          {recentPosts && recentPosts.length > 0 && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '6px', 
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(52, 225, 255, 0.1)'
            }}>
              {recentPosts.slice(0, 5).map((post) => (
                <Link
                  key={post.id}
                  href={post.href || '#'}
                  style={{
                    fontSize: '11px',
                    color: 'var(--muted)',
                    textDecoration: 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'var(--muted)';
                  }}
                >
                  {post.title || 'Untitled'} · {formatTimeAgo(post.created_at)}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
