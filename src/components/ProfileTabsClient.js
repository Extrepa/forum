'use client';

import { useMemo, useState } from 'react';

const PROFILE_TABS = [
  { id: 'stats', label: 'Stats' },
  { id: 'activity', label: 'Activity' },
  { id: 'socials', label: 'Socials' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'notes', label: 'Notes' },
];

function getRarityColor(value) {
  if (value === 0) return 'var(--muted)';
  if (value < 10) return 'var(--accent)';
  if (value < 100) return '#00f5a0';
  if (value < 1000) return '#5b8def';
  return '#b794f6';
}

export default function ProfileTabsClient({
  activityItems,
  hasActivity,
  latelyLinks,
  galleryCount,
  notesCount,
  filesEnabled,
  stats,
}) {
  const tabs = useMemo(() => PROFILE_TABS, []);
  const [activeTab, setActiveTab] = useState('stats');

  return (
    <div className="profile-tabs-wrapper">
      <div className="profile-tabs-strip profile-tabs-strip--spread">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'profile-tab profile-tab--active' : 'profile-tab'}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="profile-tab-content">
      {activeTab === 'stats' && (
        <div>
          {stats ? (
            <div className="profile-stats-block" style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(52, 225, 255, 0.2)', background: 'rgba(2, 7, 10, 0.4)' }}>
              <div className="profile-stats-grid">
                <span className="profile-stat">
                  <span className="profile-stat-label">Portal entry:</span>{' '}
                  <span className="date-only-mobile">{stats.joinDateShort}</span>
                  <span className="date-with-time-desktop">{stats.joinDateLong}</span>
                </span>
                <span className="profile-stat"><span style={{ color: getRarityColor(stats.threadCount), fontWeight: '600' }}>{stats.threadCount}</span> threads</span>
                <span className="profile-stat"><span style={{ color: getRarityColor(stats.replyCount), fontWeight: '600' }}>{stats.replyCount}</span> replies</span>
                <span className="profile-stat"><span style={{ color: getRarityColor(stats.profileViews), fontWeight: '600' }}>{stats.profileViews}</span> visits</span>
                <span className="profile-stat"><span style={{ color: getRarityColor(stats.timeSpentMinutes), fontWeight: '600' }}>{stats.timeSpentMinutes}</span> min</span>
                <span className="profile-stat"><span style={{ color: getRarityColor(stats.avatarEditMinutes), fontWeight: '600' }}>{stats.avatarEditMinutes}</span> avatar min</span>
              </div>
            </div>
          ) : (
            <div className="muted" style={{ padding: '12px' }}>No stats available.</div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div>
          <h4 className="section-title" style={{ fontSize: '16px', marginBottom: '12px' }}>Recent Activity</h4>
          {hasActivity ? (
            <div className={`profile-activity-list${activityItems.length > 5 ? ' profile-activity-list--scrollable' : ''}`}>
              {activityItems.map(item => (
                <a key={item.key} href={item.href} className="profile-activity-item">
                  {item.type === 'thread' ? (
                    <>
                      <span className="activity-label">Posted</span>
                      <span className="activity-title" title={item.title}>{item.title}</span>
                      <span className="activity-label">in</span>
                      <span className="activity-section">{item.section}</span>
                      <span className="activity-label">at</span>
                      <span className="activity-meta">{item.timeStr}</span>
                    </>
                  ) : (
                    <>
                      <span className="activity-label">Replied to</span>
                      <span className="activity-title" title={item.title}>{item.title}</span>
                      <span className="activity-label">at</span>
                      <span className="activity-meta">{item.timeStr}</span>
                    </>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="muted" style={{ padding: '12px' }}>No recent activity yet.</div>
          )}
        </div>
      )}

      {activeTab === 'socials' && (
        <div>
          <h4 className="section-title" style={{ fontSize: '16px', marginBottom: '12px' }}>Socials</h4>
          {latelyLinks.length > 0 ? (
            <div style={{ display: 'grid', gap: '8px' }}>
              {latelyLinks.map(link => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(52, 225, 255, 0.2)',
                    background: 'rgba(2, 7, 10, 0.35)',
                    color: 'var(--ink)',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{link.category}</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{link.label}</span>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{link.url}</span>
                </a>
              ))}
            </div>
          ) : (
            <div className="muted" style={{ padding: '12px' }}>
              No socials added yet. Edit your profile to add links.
            </div>
          )}
        </div>
      )}

      {activeTab === 'gallery' && (
        <div>
          <h4 className="section-title" style={{ fontSize: '16px', marginBottom: '12px' }}>Gallery</h4>
          <div className="muted" style={{ padding: '12px' }}>
            {galleryCount > 0 ? `${galleryCount} photo${galleryCount === 1 ? '' : 's'} ready for the gallery.` : 'No photos uploaded yet.'}
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div>
          <h4 className="section-title" style={{ fontSize: '16px', marginBottom: '12px' }}>Notes</h4>
          <div className="muted" style={{ padding: '12px' }}>
            {notesCount > 0 ? `${notesCount} note${notesCount === 1 ? '' : 's'} on file.` : 'No notes yet. Private notes live here first.'}
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
