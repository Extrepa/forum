'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const GALLERY_MAX = 10;
const GALLERY_COLS = 5;

const PROFILE_TABS = [
  { id: 'activity', label: 'Activity' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'guestbook', label: 'Notes' },
  { id: 'socials', label: 'Socials' },
  { id: 'stats', label: 'Stats' },
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

const SOCIAL_ICONS = {
  github: '/icons/social/github.png',
  youtube: '/icons/social/youtube.png',
  soundcloud: '/icons/social/soundcloud.png',
  discord: '/icons/social/discord.png',
  chatgpt: '/icons/social/chatgpt.png',
};

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
  const resolvedInitial = initialTab && VALID_TAB_IDS.includes(initialTab) ? initialTab : null;
  const [activeTab, setActiveTab] = useState(resolvedInitial);
  const [guestbookList, setGuestbookList] = useState(guestbookEntries);
  const [guestbookContent, setGuestbookContent] = useState('');
  const [guestbookSubmitting, setGuestbookSubmitting] = useState(false);
  const [guestbookError, setGuestbookError] = useState(null);
  const [galleryModalEntry, setGalleryModalEntry] = useState(null);
  const activeIndex = activeTab == null ? -1 : tabs.findIndex(t => t.id === activeTab);
  const displayedGalleryEntries = galleryEntries.slice(0, GALLERY_MAX);

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

  const noTabSelected = activeTab == null;

  return (
    <div className={`profile-tabs-wrapper${noTabSelected ? ' profile-tabs-wrapper--no-selection' : ''}`} style={{ minWidth: 0, maxWidth: '100%' }}>
      <div className={`profile-tab-content profile-tab-content--above${noTabSelected ? ' profile-tab-content--no-selection' : ''}`} style={{ minWidth: 0, maxWidth: '100%' }}>
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
                <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.threadCount), fontWeight: '600' }}>{stats.threadCount}</span><span className="profile-stat-label">threads started</span></span>
                <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.replyCount), fontWeight: '600' }}>{stats.replyCount}</span><span className="profile-stat-label">replies contributed</span></span>
                <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor((stats.threadCount || 0) + (stats.replyCount || 0)), fontWeight: '600' }}>{(stats.threadCount || 0) + (stats.replyCount || 0)}</span><span className="profile-stat-label">total contribution (post contributions)</span></span>
                <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.profileViews), fontWeight: '600' }}>{stats.profileViews}</span><span className="profile-stat-label">profile visits</span></span>
                <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.timeSpentMinutes), fontWeight: '600' }}>{stats.timeSpentMinutes}</span><span className="profile-stat-label">minutes spent on the website</span></span>
                <span className="profile-stat"><span className="profile-stat-value" style={{ color: getRarityColor(stats.avatarEditMinutes), fontWeight: '600' }}>{stats.avatarEditMinutes}</span><span className="profile-stat-label">minutes editing your avatar</span></span>
              </div>
            </div>
          ) : (
            <div className="muted" style={{ padding: '12px' }}>No stats available.</div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div>
          <h4 className="section-title" style={{ fontSize: '16px', marginBottom: '4px' }}>Recent Activity</h4>
          {hasActivity ? (
            <div className={`profile-activity-list${activityItems.length >= 5 ? ' profile-activity-list--scrollable' : ''}`}>
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
          <h4 className="section-title" style={{ fontSize: '16px', marginBottom: '4px' }}>Socials</h4>
          {latelyLinks.length > 0 ? (
            <div style={{ display: 'grid', gap: '8px' }}>
              {latelyLinks.map(link => {
                const iconSrc = link.platform ? SOCIAL_ICONS[link.platform] : null;
                const isSoundCloud = link.platform === 'soundcloud';
                return (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: isSoundCloud ? '1px solid rgba(255, 107, 0, 0.3)' : '1px solid rgba(52, 225, 255, 0.2)',
                      background: isSoundCloud ? 'rgba(255, 107, 0, 0.05)' : 'rgba(2, 7, 10, 0.35)',
                      color: 'var(--ink)',
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    {iconSrc ? (
                      <span style={{ flexShrink: 0, width: 24, height: 24, position: 'relative' }}>
                        <Image src={iconSrc} alt={link.platform} width={24} height={24} />
                      </span>
                    ) : null}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                      <span style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{link.category}</span>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>{link.label}</span>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{link.url}</span>
                    </div>
                  </a>
                );
              })}
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
          <h4 className="section-title" style={{ fontSize: '16px', marginBottom: '4px' }}>Gallery</h4>
          {displayedGalleryEntries.length > 0 ? (
            <>
              <div className="profile-gallery-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${GALLERY_COLS}, 1fr)`, gap: '12px', maxWidth: '100%' }}>
                {displayedGalleryEntries.map((entry) => (
                  <div
                    key={entry.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setGalleryModalEntry(entry)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setGalleryModalEntry(entry); } }}
                    style={{
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '1px solid rgba(52, 225, 255, 0.2)',
                      background: 'rgba(2, 7, 10, 0.35)',
                      aspectRatio: '1',
                      cursor: 'pointer',
                      minWidth: 0,
                    }}
                    aria-label="View full size"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/media/${entry.image_key}`}
                      alt={entry.caption || 'Gallery image'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {entry.is_cover && <div style={{ fontSize: '11px', padding: '4px 8px', color: 'var(--accent)', fontWeight: '600' }}>Cover</div>}
                    {entry.caption && <p style={{ margin: 0, padding: '6px 8px', fontSize: '12px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.caption}</p>}
                  </div>
                ))}
              </div>
              {galleryModalEntry && (
                <div
                  className="profile-gallery-modal-overlay"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Gallery image full size"
                  onClick={() => setGalleryModalEntry(null)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setGalleryModalEntry(null); }}
                  tabIndex={-1}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px',
                    boxSizing: 'border-box',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setGalleryModalEntry(null)}
                    aria-label="Close"
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(255, 107, 0, 0.2)',
                      color: '#ff6b6b',
                      fontSize: '24px',
                      cursor: 'pointer',
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 12px rgba(255, 82, 82, 0.6)',
                      transition: 'all 0.2s ease',
                      zIndex: 10001,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 82, 82, 0.8)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 82, 82, 0.6)'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    &times;
                  </button>
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: 'min(100%, 1200px)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/media/${galleryModalEntry.image_key}`}
                      alt={galleryModalEntry.caption || 'Gallery image'}
                      style={{
                        maxWidth: '100%',
                        maxHeight: 'calc(100vh - 40px)',
                        objectFit: 'contain',
                        display: 'block',
                        borderRadius: '4px',
                        outline: 'none',
                        border: 'none',
                        boxShadow: 'none',
                      }}
                    />
                    
                    {galleryModalEntry.caption && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '20px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'rgba(2, 7, 10, 0.8)',
                          backdropFilter: 'blur(8px)',
                          padding: '8px 16px',
                          borderRadius: '12px',
                          border: '1px solid rgba(52, 225, 255, 0.2)',
                          maxWidth: '90%',
                          width: 'max-content',
                          textAlign: 'center',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                          zIndex: 10,
                        }}
                      >
                        <p style={{ margin: 0, color: '#e0e0e0', fontSize: '14px' }}>{galleryModalEntry.caption}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="muted" style={{ padding: '12px' }}>No photos uploaded yet.</div>
          )}
        </div>
      )}

      {activeTab === 'guestbook' && (
        <div>
          <h4 className="section-title" style={{ fontSize: '16px', marginBottom: '4px' }}>Notes</h4>
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
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>{entry.author_username}</span>
                    <span className="muted" style={{ fontSize: '12px' }} suppressHydrationWarning>{formatGuestbookDate(entry.created_at)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{entry.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted" style={{ padding: '12px' }}>
              No messages yet. Your notes are ready for visitors.
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
              width: activeIndex >= 0 ? `${100 / tabs.length}%` : 0,
              transform: activeIndex >= 0 ? `translateX(${activeIndex * 100}%)` : 'translateX(-100%)',
              opacity: activeIndex >= 0 ? 1 : 0,
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
