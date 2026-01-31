'use client';

import Link from 'next/link';

export default function HomeStats({ stats, recentPosts = [] }) {
  if (!stats) {
    return null;
  }

  return (
    <section className="card home-stats">
      <h3 className="section-title" style={{ marginBottom: '16px' }}>Stats</h3>
      {/* Mobile: single combined card */}
      <div className="home-stats-combined">
        <div className="home-stats-combined-row">
          <span className="home-stats-combined-item">
            <span className="home-stats-number">{stats.totalPosts || 0}</span>
            <span className="muted"> posts</span>
          </span>
          <span className="home-stats-combined-sep" aria-hidden> · </span>
          <span className="home-stats-combined-item">
            <span className="home-stats-number">{stats.totalUsers || 0}</span>
            <span className="muted"> users</span>
            <span className="muted"> ({stats.activeUsers || 0} active)</span>
          </span>
          <span className="home-stats-combined-sep" aria-hidden> · </span>
          <span className="home-stats-combined-item">
            <span className="home-stats-number">{stats.recentPostsCount || 0}</span>
            <span className="muted"> post{(stats.recentPostsCount || 0) !== 1 ? 's' : ''}, </span>
            <span className="home-stats-number">{stats.recentRepliesCount || 0}</span>
            <span className="muted"> repl{(stats.recentRepliesCount || 0) !== 1 ? 'ies' : 'y'} (24h)</span>
          </span>
        </div>
        {recentPosts && recentPosts.length > 0 && (
          <div className="home-stats-combined-recent">
            {recentPosts.slice(0, 3).map((post) => (
              <Link
                key={post.id}
                href={post.href || '#'}
                className="home-stats-combined-link"
                onMouseEnter={(e) => { e.target.style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { e.target.style.color = 'var(--muted)'; }}
              >
                {post.title || 'Untitled'} · <span suppressHydrationWarning>{post.timeAgo || 'just now'}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      {/* Desktop: three cards */}
      <div className="home-stats-grid">
        {/* Total Posts Card */}
        <div
          className="card home-stats-card"
          style={{
            padding: '16px',
            border: '1px solid rgba(52, 225, 255, 0.2)',
            background: 'rgba(4, 16, 23, 0.6)',
            minWidth: 0
          }}
        >
          <div className="home-stats-number" style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px' }}>
            {stats.totalPosts || 0}
          </div>
          <div className="home-stats-label" style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
            Total Posts
          </div>
          <div className="muted home-stats-sublabel" style={{ fontSize: '12px' }}>
            Across all sections
          </div>
        </div>

        {/* Active Users Card */}
        <div
          className="card home-stats-card"
          style={{
            padding: '16px',
            border: '1px solid rgba(52, 225, 255, 0.2)',
            background: 'rgba(4, 16, 23, 0.6)',
            minWidth: 0
          }}
        >
          <div className="home-stats-label" style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
            Active Users
          </div>
          <div className="home-stats-two-col" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ flex: '1', minWidth: 0 }}>
              <div className="home-stats-number home-stats-number-sm" style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>
                {stats.totalUsers || 0}
              </div>
              <div className="muted home-stats-sublabel" style={{ fontSize: '11px' }}>
                Total signed up
              </div>
            </div>
            <div className="home-stats-divider" style={{ 
              width: '1px', 
              background: 'rgba(52, 225, 255, 0.2)', 
              alignSelf: 'stretch' 
            }} />
            <div style={{ flex: '1', minWidth: 0 }}>
              <div className="home-stats-number home-stats-number-sm" style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>
                {stats.activeUsers || 0}
              </div>
              <div className="muted home-stats-sublabel" style={{ fontSize: '11px' }}>
                Currently active
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div
          className="card home-stats-card"
          style={{
            padding: '16px',
            border: '1px solid rgba(52, 225, 255, 0.2)',
            background: 'rgba(4, 16, 23, 0.6)',
            position: 'relative',
            minWidth: 0
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div className="home-stats-label" style={{ fontSize: '14px', fontWeight: '600' }}>
              Recent Activity
            </div>
            <div className="muted home-stats-sublabel" style={{ fontSize: '11px' }}>
              Last 24 hours
            </div>
          </div>
          <div className="home-stats-two-col" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ flex: '1', minWidth: 0 }}>
              <div className="home-stats-number home-stats-number-sm" style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>
                {stats.recentPostsCount || 0}
              </div>
              <div className="muted home-stats-sublabel" style={{ fontSize: '11px' }}>
                Posts
              </div>
            </div>
            <div className="home-stats-divider" style={{ 
              width: '1px', 
              background: 'rgba(52, 225, 255, 0.2)', 
              alignSelf: 'stretch' 
            }} />
            <div style={{ flex: '1', minWidth: 0 }}>
              <div className="home-stats-number home-stats-number-sm" style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>
                {stats.recentRepliesCount || 0}
              </div>
              <div className="muted home-stats-sublabel" style={{ fontSize: '11px' }}>
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
                  {post.title || 'Untitled'} · <span suppressHydrationWarning>{post.timeAgo || 'just now'}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
