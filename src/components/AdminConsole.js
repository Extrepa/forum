'use client';

import { useMemo, useState } from 'react';
import AdminStatCard from './AdminStatCard';

const TAB_LIST = ['Overview', 'Posts', 'Users', 'Reports', 'Media', 'Settings'];

const STATUS_PILLS = {
  pinned: 'PINNED',
  hidden: 'HIDDEN',
  locked: 'LOCKED'
};

function formatTime(timestamp) {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return date.toLocaleString();
}

function formatDateInput(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AdminConsole({ stats = {}, posts = [], actions = [], users = [], reports = [], media = null, user }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [postList, setPostList] = useState(posts);
  const [filter, setFilter] = useState('');
  const [busyPost, setBusyPost] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [drawerPost, setDrawerPost] = useState(null);
  const imageUploadsEnabled = stats.imageUploadsEnabled !== false;
  const filteredPosts = useMemo(() => {
    const term = filter.toLowerCase().trim();
    if (!term) return postList;
    return postList.filter((post) => {
      const sectionLabel = String(post.sectionLabel || '').toLowerCase();
      const authorName = String(post.authorName || '').toLowerCase();
      const title = String(post.title || '').toLowerCase();
      return (
        title.includes(term) ||
        authorName.includes(term) ||
        sectionLabel.includes(term)
      );
    });
  }, [filter, postList]);

  const updatePost = (id, data) => {
    setPostList((prev) => prev.map((post) => (post.id === id ? { ...post, ...data } : post)));
  };

  const handleTogglePin = async (post) => {
    setBusyPost(post.id);
    try {
      const response = await fetch(`/api/admin/posts/${post.id}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: post.type })
      });
      if (!response.ok) {
        throw new Error('Unable to toggle pin');
      }
      const payload = await response.json();
      updatePost(post.id, { isPinned: payload.is_pinned });
      setStatusMessage(payload.is_pinned ? 'Pinned.' : 'Unpinned.');
    } catch (error) {
      console.error(error);
      setStatusMessage('Pin toggle failed.');
    } finally {
      setBusyPost(null);
    }
  };

  const handleToggleHidden = async (post) => {
    setBusyPost(post.id);
    try {
      if (!post.hideHref) {
        throw new Error('Hide unavailable');
      }
      const formData = new FormData();
      formData.append('hidden', post.isHidden ? '0' : '1');
      const response = await fetch(post.hideHref, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        throw new Error('Unable to toggle hidden');
      }
      updatePost(post.id, { isHidden: !post.isHidden });
      setStatusMessage(!post.isHidden ? 'Hidden.' : 'Visible again.');
    } catch (error) {
      console.error(error);
      setStatusMessage('Visibility toggle failed.');
    } finally {
      setBusyPost(null);
    }
  };

  const handleToggleLock = async (post) => {
    setBusyPost(post.id);
    try {
      if (!post.lockHref) {
        throw new Error('Lock unavailable');
      }
      const formData = new FormData();
      formData.append('locked', post.isLocked ? '0' : '1');
      const response = await fetch(post.lockHref, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        throw new Error('Unable to toggle lock');
      }
      updatePost(post.id, { isLocked: !post.isLocked });
      setStatusMessage(!post.isLocked ? 'Locked comments.' : 'Unlocked.');
    } catch (error) {
      console.error(error);
      setStatusMessage('Lock toggle failed.');
    } finally {
      setBusyPost(null);
    }
  };

  const overviewStats = [
    { label: 'Total users', value: stats.totalUsers || 0, helper: 'All accounts' },
    { label: 'Active (24h)', value: stats.active24h || 0 },
    { label: 'Active (7d)', value: stats.active7d || 0 },
    { label: 'Posts (24h)', value: stats.posts24h || 0 },
    { label: 'Posts (7d)', value: stats.posts7d || 0 },
    { label: 'Comments (24h)', value: stats.comments24h || 0 },
    { label: 'Comments (7d)', value: stats.comments7d || 0 },
    { label: 'Hidden posts', value: stats.hiddenPosts || 0 },
    { label: 'Locked posts', value: stats.lockedPosts || 0 },
    { label: 'Pinned posts', value: stats.pinnedPosts || 0 },
    { label: 'Flagged items', value: stats.flaggedItems || 0 }
  ];

  const quickActions = [
    { label: 'Create announcement', href: '/announcements' },
    { label: 'Mod queue', href: '/admin/moderation' },
    { label: 'Audit log', href: '#admin-actions' },
    { label: 'Backup status', href: '/admin/moderation' }
  ];

  return (
    <div className="admin-console stack">
      <section className="card admin-header-bar">
        <div>
          <p className="muted" style={{ marginBottom: '6px' }}>Admin Console</p>
          <h1 className="section-title" style={{ marginBottom: 0 }}>Mission Control</h1>
          {user?.username ? <p className="muted" style={{ marginBottom: 0 }}>Signed in as {user.username}</p> : null}
        </div>
        <div className="admin-header-actions">
          {quickActions.map((action) => (
            <a key={action.label} className="action-button admin-quick-action" href={action.href}>
              {action.label}
            </a>
          ))}
        </div>
      </section>

      <div className="admin-tabs">
        {TAB_LIST.map((tab) => (
          <button
            key={tab}
            type="button"
            className={[ 'admin-tab', activeTab === tab ? 'admin-tab--active' : '' ].filter(Boolean).join(' ')}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="admin-tab-panel">
        {activeTab === 'Overview' && (
          <section className="card stack admin-overview">
            <div className="admin-stat-grid">
              {overviewStats.map((stat) => (
                <AdminStatCard key={stat.label} {...stat} />
              ))}
            </div>
            <div id="admin-actions" className="admin-overview-panels">
              <div className="admin-panel">
                <h3 className="section-title">Recent admin actions</h3>
                {actions.length === 0 ? (
                  <p className="muted">No admin activity captured yet.</p>
                ) : (
                  <ul className="admin-action-list">
                    {actions.map((action) => (
                      <li key={action.id}>
                        <strong>{action.admin_username}</strong> {action.action_type.replace('_', ' ')} {action.target_type}
                        {action.target_id ? ` (${action.target_id})` : ''}
                        <div className="muted" style={{ fontSize: '13px' }}>{formatTime(action.created_at)}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="admin-panel">
                <h3 className="section-title">Latest threads</h3>
                <ul className="admin-action-list">
                  {postList.slice(0, 6).map((post) => (
                    <li key={post.id}>
                      <strong>{post.title}</strong>
                      <div className="muted" style={{ fontSize: '12px' }}>
                        {post.sectionLabel} · {post.authorName} · {formatTime(post.createdAt)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Posts' && (
          <section className="card admin-posts-panel">
            <div className="admin-posts-header">
              <div>
                <h3 className="section-title">Posts control center</h3>
                <p className="muted">Search, pin, hide, or lock posts across the forum.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search by title or author"
                  className="admin-search-input"
                />
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setFilter('')}
                >
                  Clear
                </button>
              </div>
            </div>
            {statusMessage ? <div className="notice">{statusMessage}</div> : null}
            <div className="admin-posts-table-wrapper">
              <table className="admin-posts-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Section</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post) => (
                    <tr key={post.id}>
                      <td>
                        <strong>{post.title}</strong>
                        <div className="muted" style={{ fontSize: '12px' }}>
                          {post.type === 'post' && post.subtype ? post.subtype : post.type}
                        </div>
                      </td>
                      <td>{post.authorName}</td>
                      <td>{post.sectionLabel}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatTime(post.createdAt)}</td>
                      <td>
                        <div className="admin-status-pills">
                          {post.isPinned && <span>{STATUS_PILLS.pinned}</span>}
                          {post.isHidden && <span>{STATUS_PILLS.hidden}</span>}
                          {post.isLocked && <span>{STATUS_PILLS.locked}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="admin-post-actions">
                          <button
                            type="button"
                            onClick={() => handleTogglePin(post)}
                            disabled={busyPost === post.id}
                          >
                            {post.isPinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button type="button" onClick={() => handleToggleHidden(post)} disabled={busyPost === post.id}>
                            {post.isHidden ? 'Show' : 'Hide'}
                          </button>
                          <button type="button" onClick={() => handleToggleLock(post)} disabled={busyPost === post.id}>
                            {post.isLocked ? 'Unlock' : 'Lock'}
                          </button>
                          <button type="button" onClick={() => setDrawerPost(post)} disabled={!post.editHref}>
                            Edit
                          </button>
                          <a className="button mini ghost" href={post.viewHref || `/lobby/${post.id}`} target="_blank" rel="noreferrer">
                            View
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'Users' && (
          <section className="card admin-posts-panel">
            <div className="admin-posts-header">
              <div>
                <h3 className="section-title">Users</h3>
                <p className="muted">Newest accounts and recent activity.</p>
              </div>
            </div>
            <div className="admin-posts-table-wrapper">
              <table className="admin-posts-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((member) => (
                    <tr key={member.id}>
                      <td>{member.username}</td>
                      <td>{member.role}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatTime(member.createdAt)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatTime(member.lastSeen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'Reports' && (
          <section className="card admin-posts-panel">
            <div className="admin-posts-header">
              <div>
                <h3 className="section-title">Reports</h3>
                <p className="muted">Open moderation items that still need review.</p>
              </div>
            </div>
            <div className="admin-posts-table-wrapper">
              <table className="admin-posts-table">
                <thead>
                  <tr>
                    <th>Target</th>
                    <th>Reporter</th>
                    <th>Reason</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="muted">No open reports right now.</td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id}>
                        <td>{report.targetType} · {report.targetId}</td>
                        <td>{report.reporter}</td>
                        <td>{report.reason || '—'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatTime(report.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'Media' && (
          <section className="card stack admin-overview">
            <div>
              <h3 className="section-title">Media overview</h3>
              <p className="muted">Uploads from posts, galleries, and announcements.</p>
            </div>
            <div className="admin-stat-grid">
              {(media?.totals || []).map((entry) => (
                <AdminStatCard key={entry.label} label={`${entry.label} images`} value={entry.count} />
              ))}
              <AdminStatCard label="Gallery images" value={media?.galleryCount || 0} />
            </div>
            <div className="admin-panel">
              <h3 className="section-title">Image uploads</h3>
              <p className="muted">Jump to moderation controls for upload settings and moving content.</p>
              <a className="action-button" href="/admin/moderation">Open moderation tools</a>
            </div>
          </section>
        )}

        {activeTab === 'Settings' && (
          <section className="card stack">
            <h3 className="section-title">Settings</h3>
            <p className="muted">Global toggles for admin workflows.</p>
            <p className="muted">
              Image uploads are currently {imageUploadsEnabled ? 'enabled' : 'disabled'}.
            </p>
            <form action="/api/admin/settings/image-upload" method="post" className="stack" style={{ gap: '12px' }}>
              <input type="hidden" name="enabled" value={imageUploadsEnabled ? '0' : '1'} />
              <button type="submit">
                {imageUploadsEnabled ? 'Disable image uploads' : 'Enable image uploads'}
              </button>
            </form>
            <a className="action-button" href="/admin/moderation">More moderation tools</a>
          </section>
        )}

        {activeTab !== 'Overview' && activeTab !== 'Posts' && activeTab !== 'Users' && activeTab !== 'Reports' && activeTab !== 'Media' && activeTab !== 'Settings' && (
          <section className="card">
            <h3 className="section-title">{activeTab} tab</h3>
            <p className="muted">This section is coming soon.</p>
          </section>
        )}
      </div>

      {drawerPost ? (
        <div className="admin-drawer-overlay" onClick={() => setDrawerPost(null)}>
          <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 className="section-title">Edit post</h3>
              <button type="button" onClick={() => setDrawerPost(null)} className="icon-button" aria-label="Close drawer">
                ×
              </button>
            </div>
            {drawerPost.editHref ? (
              <form action={drawerPost.editHref} method="post">
                <label>
                  <div className="muted">Title</div>
                  <input name="title" defaultValue={drawerPost.title} required />
                </label>
                <label>
                  <div className="muted">Body</div>
                  <textarea name="body" defaultValue={drawerPost.body || ''} rows={6} required />
                </label>
                {drawerPost.type === 'event' ? (
                  <label>
                    <div className="muted">Starts at (local time)</div>
                    <input name="starts_at" type="datetime-local" defaultValue={formatDateInput(drawerPost.startsAt)} required />
                  </label>
                ) : null}
                {drawerPost.type === 'project' ? (
                  <>
                    <label>
                      <div className="muted">Status</div>
                      <select name="status" defaultValue={drawerPost.status || 'active'} required>
                        <option value="active">Active</option>
                        <option value="on-hold">On Hold</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: '4px 0 12px 0' }}>
                      <input
                        type="checkbox"
                        name="updates_enabled"
                        defaultChecked={!!drawerPost.updatesEnabled}
                        style={{ width: 'auto', margin: 0 }}
                      />
                      <span className="muted" style={{ fontSize: '14px' }}>Enable project updates log</span>
                    </label>
                  </>
                ) : null}
                {drawerPost.type === 'post' ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: '4px 0 12px 0' }}>
                    <input type="checkbox" name="is_private" value="1" defaultChecked={!!drawerPost.isPrivate} style={{ width: 'auto', margin: 0 }} />
                    <span className="muted" style={{ fontSize: '14px' }}>Private post</span>
                  </label>
                ) : null}
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setDrawerPost(null)} className="button ghost">
                    Cancel
                  </button>
                  <a className="button mini ghost" href={drawerPost.viewHref || `/lobby/${drawerPost.id}`} target="_blank" rel="noreferrer">
                    View post
                  </a>
                </div>
              </form>
            ) : (
              <div className="muted">Editing for this content type is not available yet.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
