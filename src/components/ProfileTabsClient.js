'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

function formatGuestbookDate(ts) {
  if (ts == null) return '';
  const d = new Date(typeof ts === 'number' ? ts : parseInt(ts, 10));
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { dateStyle: 'short' }) + ' ' + d.toLocaleTimeString(undefined, { timeStyle: 'short' });
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
  guestbookEntries = [],
  profileUsername,
  canLeaveMessage = false,
  galleryEntries = [],
}) {
  const router = useRouter();
  const tabs = useMemo(() => PROFILE_TABS, []);
  const resolvedInitial = initialTab && VALID_TAB_IDS.includes(initialTab) ? initialTab : 'stats';
  const [activeTab, setActiveTab] = useState(resolvedInitial);
  const [guestbookList, setGuestbookList] = useState(guestbookEntries);
  const [guestbookContent, setGuestbookContent] = useState('');
  const [guestbookSubmitting, setGuestbookSubmitting] = useState(false);
  const [guestbookError, setGuestbookError] = useState(null);
  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  useEffect(() => {
    setGuestbookList(guestbookEntries);
  }, [guestbookEntries]);

  const handleLeaveMessage = async (e) => {
    e.preventDefault();
    if (!profileUsername || !guestbookContent.trim() || guestbookSubmitting) return;
    setGuestbookError(null);
    setGuestbookSubmitting(true);
    try {
      const res = await fetch(`/api/user/${encodeURIComponent(profileUsername)}/guestbook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: guestbookContent.trim().slice(0, 2000) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGuestbookError(data.error || 'Failed to leave message');
        return;
      }
      setGuestbookContent('');
      if (data.entry) {
        setGuestbookList((prev) => [{
          id: data.entry.id,
          author_username: data.entry.author_username,
          content: data.entry.content,
          created_at: data.entry.created_at,
        }, ...prev]);
      } else {
        router.refresh();
      }
    } catch (_) {
      setGuestbookError('Something went wrong');
    } finally {
      setGuestbookSubmitting(false);
    }
  };

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
          {galleryEntries.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {galleryEntries.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid rgba(52, 225, 255, 0.2)',
                    background: 'rgba(2, 7, 10, 0.35)',
                  }}
                >
                  <a href={`/api/media/${entry.image_key}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', lineHeight: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/media/${entry.image_key}`}
                      alt={entry.caption || 'Gallery image'}
                      style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
                    />
                  </a>
                  {entry.is_cover && <div style={{ fontSize: '11px', padding: '4px 8px', color: 'var(--accent)', fontWeight: '600' }}>Cover</div>}
                  {entry.caption && <p style={{ margin: 0, padding: '6px 8px', fontSize: '12px', color: 'var(--muted)' }}>{entry.caption}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="muted" style={{ padding: '12px' }}>No photos uploaded yet.</div>
          )}
        </div>
      )}

      {activeTab === 'guestbook' && (
        <div>
          <h4 className="section-title" style={{ fontSize: '16px', marginBottom: '12px' }}>Guestbook</h4>
          {canLeaveMessage && profileUsername && (
            <form onSubmit={handleLeaveMessage} style={{ marginBottom: '16px' }}>
              <textarea
                value={guestbookContent}
                onChange={(e) => setGuestbookContent(e.target.value)}
                placeholder="Leave a message..."
                maxLength={2000}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(52, 225, 255, 0.3)',
                  background: 'rgba(2, 7, 10, 0.6)',
                  color: 'var(--ink)',
                  fontSize: '14px',
                  resize: 'vertical',
                  minHeight: '72px',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={!guestbookContent.trim() || guestbookSubmitting}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: 'var(--bg)',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: guestbookSubmitting ? 'not-allowed' : 'pointer',
                    opacity: guestbookSubmitting ? 0.7 : 1,
                  }}
                >
                  {guestbookSubmitting ? 'Sending…' : 'Leave message'}
                </button>
                {guestbookError && <span style={{ fontSize: '13px', color: '#ff6b6b' }}>{guestbookError}</span>}
              </div>
            </form>
          )}
          {guestbookList.length > 0 ? (
            <div className="profile-activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {guestbookList.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(52, 225, 255, 0.15)',
                    background: 'rgba(2, 7, 10, 0.35)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>{entry.author_username}</span>
                    <span className="muted" style={{ fontSize: '12px' }} suppressHydrationWarning>{formatGuestbookDate(entry.created_at)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{entry.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted" style={{ padding: '12px' }}>
              No messages yet. Your guestbook is ready for visitors.
            </div>
          )}
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
