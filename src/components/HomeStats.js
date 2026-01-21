'use client';

export default function HomeStats({ stats }) {
  if (!stats) {
    return null;
  }

  const statCards = [
    {
      label: 'Total Posts',
      value: stats.totalPosts || 0,
      description: 'Across all sections'
    },
    {
      label: 'Active Users',
      value: stats.activeUsers || 0,
      description: 'Recently active'
    },
    {
      label: 'Recent Activity',
      value: stats.recentActivity || 0,
      description: 'Last 24 hours'
    }
  ];

  return (
    <section className="card">
      <h3 className="section-title" style={{ marginBottom: '16px' }}>Stats</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="card"
            style={{
              padding: '16px',
              border: '1px solid rgba(52, 225, 255, 0.2)',
              background: 'rgba(4, 16, 23, 0.6)'
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
              {stat.label}
            </div>
            <div className="muted" style={{ fontSize: '12px' }}>
              {stat.description}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
