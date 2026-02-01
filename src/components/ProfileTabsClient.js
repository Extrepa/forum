'use client';

import { useMemo, useState } from 'react';

const PROFILE_TABS = [
  { id: 'stats', label: 'Stats' },
  { id: 'activity', label: 'Activity' },
  { id: 'socials', label: 'Socials' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'guestbook', label: 'Guestbook' },
];

function getRarityColor(value) {
  if (value === 0) return 'var(--muted)';
  if (value < 10) return 'var(--accent)';
  if (value < 100) return '#00f5a0';
  if (value < 1000) return '#5b8def';
  return '#b794f6';
}

const VALID_TAB_IDS = ['stats', 'activity', 'socials', 'gallery', 'guestbook'];

export default function ProfileTabsClient({
  activityItems,
  hasActivity,
  latelyLinks,
  galleryCount,
  notesCount,
  filesEnabled,
  stats,
  initialTab,
}) {
  const tabs = useMemo(() => PROFILE_TABS, []);
  const resolvedInitial = initialTab && VALID_TAB_IDS.includes(initialTab) ? initialTab : 'stats';
  const [activeTab, setActiveTab] = useState(resolvedInitial);
  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  return (
    <div className="profile-tabs-wrapper">
      <div className="profile-tab-content profile-tab-content--above">
      {activeTab === 'stats' && (
        <div>
          {stats ? (
            <div className="profile-stats-block profile-stats-block--grid">
              <div className="profile-stats-grid">
                <span className="profile-stat">
                  <span className="profile-stat-label">Portal entry</span>
                  <span className="profile-stat-value date-only-mobile">{stats.joinDateShort}</span>
                  <span className="profile-stat-value date-with-time-desktop">{stats.joinDateLong}</span>
                </span>
                <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.threadCount), fontWeight: '600' }}>{stats.threadCount}</span><span className="profile-stat-label">threads</span></span>
                <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.replyCount), fontWeight: '600' }}>{stats.replyCount}</span><span className="profile-stat-label">replies</span></span>
                <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.profileViews), fontWeight: '600' }}>{stats.profileViews}</span><span className="profile-stat-label">visits</span></span>
                <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.timeSpentMinutes), fontWeight: '600' }}>{stats.timeSpentMinutes}</span><span className="profile-stat-label">min on site</span></span>
                <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.avatarEditMinutes), fontWeight: '600' }}>{stats.avatarEditMinutes}</span><span className="profile-stat-label">avatar min</span></span>
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

      {activeTab === 'guestbook' && (
        <div>
          <h4 className="section-title" style={{ fontSize: '16px', marginBottom: '12px' }}>Guestbook</h4>
          <div className="muted" style={{ padding: '12px' }}>
            {notesCount > 0 ? `${notesCount} message${notesCount === 1 ? '' : 's'}.` : 'No messages yet. Your guestbook is ready for visitors.'}
          </div>
        </div>
      )}

      </div>

      <div className="tabs-pill" role="tablist" aria-label="Profile sections">
        <div className="tabs-pill-inner">
          <div
            className="tabs-pill-indicator"
            style={{
              width: `${100 / tabs.length}%`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
            aria-hidden
          />
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'profile-tab profile-tab--active' : 'profile-tab'}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
