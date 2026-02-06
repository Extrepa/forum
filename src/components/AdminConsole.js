'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminStatCard from './AdminStatCard';

const TAB_LIST = ['Overview', 'Posts', 'Users', 'Reports', 'Media', 'Settings'];
const TAB_LOOKUP = TAB_LIST.reduce((acc, tab) => {
  acc[tab.toLowerCase()] = tab;
  return acc;
}, {});

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
  const [userList, setUserList] = useState(users);
  const [filter, setFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [busyPost, setBusyPost] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [drawerPost, setDrawerPost] = useState(null);
  const [drawerUser, setDrawerUser] = useState(null);
  const [showDeletedPosts, setShowDeletedPosts] = useState(false);
  const [showDeletedUsers, setShowDeletedUsers] = useState(false);
  const imageUploadsEnabled = stats.imageUploadsEnabled !== false;
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      const normalized = tabParam.toLowerCase();
      const mapped = TAB_LOOKUP[normalized];
      if (mapped) {
        setActiveTab(mapped);
      }
    }
  }, []);
  const filteredPosts = useMemo(() => {
    const term = filter.toLowerCase().trim();
    const filtered = postList.filter((post) => {
      if (!showDeletedPosts && post.isDeleted) {
        return false;
      }
      if (!term) return true;
      const sectionLabel = String(post.sectionLabel || '').toLowerCase();
      const authorName = String(post.authorName || '').toLowerCase();
      const title = String(post.title || '').toLowerCase();
      return (
        title.includes(term) ||
        authorName.includes(term) ||
        sectionLabel.includes(term)
      );
    });
    return filtered;
  }, [filter, postList, showDeletedPosts]);

  const filteredUsers = useMemo(() => {
    const term = userFilter.toLowerCase().trim();
    return userList.filter((member) => {
      if (!showDeletedUsers && member.isDeleted) {
        return false;
      }
      if (!term) return true;
      const name = String(member.username || '').toLowerCase();
      return name.includes(term);
    });
  }, [showDeletedUsers, userFilter, userList]);

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

  const handleRoleChange = async (member, nextRole) => {
    if (!nextRole || nextRole === member.role) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/users/${member.id}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole })
      });
      if (!response.ok) {
        throw new Error('Role update failed');
      }
      const payload = await response.json();
      setUserList((prev) => prev.map((userRow) => (
        userRow.id === member.id ? { ...userRow, role: payload.role } : userRow
      )));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteUser = async (member) => {
    if (!confirm(`Delete ${member.username}? This will anonymize their account and revoke access.`)) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/users/${member.id}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'yes' })
      });
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      setUserList((prev) => prev.map((userRow) => (
        userRow.id === member.id ? { ...userRow, isDeleted: true, role: 'user' } : userRow
      )));
      if (drawerUser && drawerUser.id === member.id) {
        setDrawerUser({ ...member, isDeleted: true, role: 'user' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePost = async (post) => {
    if (!post.deleteHref) return;
    if (!confirm(`Delete “${post.title}”? This will hide it from public views.`)) {
      return;
    }
    setBusyPost(post.id);
    try {
      const response = await fetch(post.deleteHref, { method: 'POST' });
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      updatePost(post.id, { isDeleted: true });
      setStatusMessage('Post deleted.');
    } catch (error) {
      console.error(error);
      setStatusMessage('Delete failed.');
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
    { label: 'Create announcement', href: '/announcements', title: 'Create a new announcement post' },
    { label: 'Mod queue', href: '/admin?tab=reports', title: 'Open moderation queue' },
    { label: 'Audit log', href: '/admin?tab=overview#admin-actions', title: 'Jump to recent admin actions' },
    { label: 'Backup status', href: '/admin/backups', title: 'Review backup status and workflows' }
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
            <a key={action.label} className="action-button admin-quick-action" href={action.href} title={action.title}>
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
            title={`Open ${tab} tab`}
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
                <p className="muted" title="All forum content types are consolidated here.">Search, pin, hide, lock, or edit posts across the forum.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search by title or author"
                  className="admin-search-input"
                  title="Filter by title, author, or section"
                />
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setShowDeletedPosts((value) => !value)}
                  title="Toggle deleted items visibility"
                >
                  {showDeletedPosts ? 'Hide deleted' : 'Show deleted'}
                </button>
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setFilter('')}
                  title="Clear search"
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
                    <th title="Title and content type">Title</th>
                    <th title="Content author">Author</th>
                    <th title="Section/area">Section</th>
                    <th title="Created timestamp">Created</th>
                    <th title="Pinned/hidden/locked/deleted">Status</th>
                    <th title="Actions menu">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className={post.isDeleted ? 'admin-row--deleted' : ''}>
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
                          {post.isDeleted && <span>DELETED</span>}
                        </div>
                      </td>
                      <td>
                        <details className="admin-actions-menu">
                          <summary className="button ghost mini" title="Post actions">Actions ▾</summary>
                          <div className="admin-actions-menu-list">
                            <button
                              type="button"
                              onClick={() => handleTogglePin(post)}
                              disabled={busyPost === post.id || post.isDeleted}
                              title="Pin or unpin this post"
                            >
                              {post.isPinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button type="button" onClick={() => handleToggleHidden(post)} disabled={busyPost === post.id || post.isDeleted} title="Hide or show this post">
                              {post.isHidden ? 'Show' : 'Hide'}
                            </button>
                            <button type="button" onClick={() => handleToggleLock(post)} disabled={busyPost === post.id || post.isDeleted} title="Lock or unlock comments">
                              {post.isLocked ? 'Unlock' : 'Lock'}
                            </button>
                            <button type="button" onClick={() => setDrawerPost(post)} disabled={!post.editHref || post.isDeleted} title="Edit this post">
                              Edit
                            </button>
                            {post.deleteHref ? (
                              <button type="button" onClick={() => handleDeletePost(post)} disabled={busyPost === post.id || post.isDeleted} title="Soft delete this post">
                                Delete
                              </button>
                            ) : null}
                            <a className="button mini ghost" href={post.viewHref || `/lobby/${post.id}`} target="_blank" rel="noreferrer" title="View post in new tab">
                              View
                            </a>
                          </div>
                        </details>
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
                <p className="muted" title="Personal data is intentionally limited in this view.">Newest accounts and recent activity.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  placeholder="Search username"
                  className="admin-search-input"
                  title="Filter by username"
                />
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setShowDeletedUsers((value) => !value)}
                  title="Toggle deleted users visibility"
                >
                  {showDeletedUsers ? 'Hide deleted' : 'Show deleted'}
                </button>
              </div>
            </div>
            <div className="admin-posts-table-wrapper">
              <table className="admin-posts-table">
                <thead>
                  <tr>
                    <th title="Username">User</th>
                    <th title="Role">Role</th>
                    <th title="Joined date">Joined</th>
                    <th title="Last active">Last seen</th>
                    <th title="Contributions">Posts</th>
                    <th title="Contributions">Comments</th>
                    <th title="Actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((member) => (
                    <tr key={member.id} className={member.isDeleted ? 'admin-row--deleted' : ''}>
                      <td>
                        <strong>{member.username}</strong>
                        {member.isDeleted ? <div className="muted" style={{ fontSize: '12px' }}>Deleted</div> : null}
                      </td>
                      <td>{member.role}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatTime(member.createdAt)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatTime(member.lastSeen)}</td>
                      <td>{member.postsCount ?? 0}</td>
                      <td>{member.commentsCount ?? 0}</td>
                      <td>
                        <details className="admin-actions-menu">
                          <summary className="button ghost mini" title="User actions">Actions ▾</summary>
                          <div className="admin-actions-menu-list">
                            <a className="button mini ghost" href={`/profile/${member.username}`} target="_blank" rel="noreferrer" title="Open public profile">
                              View profile
                            </a>
                            <button type="button" onClick={() => setDrawerUser(member)} title="Open user details drawer">
                              Details
                            </button>
                            <label className="admin-menu-label">
                              <span className="muted">Role</span>
                              <select
                                value={member.role}
                                onChange={(e) => handleRoleChange(member, e.target.value)}
                                title="Change user role"
                                disabled={member.isDeleted}
                              >
                                <option value="user">User</option>
                                <option value="mod">Mod</option>
                                <option value="admin">Admin</option>
                              </select>
                            </label>
                            <button type="button" onClick={() => handleDeleteUser(member)} disabled={member.isDeleted} title="Anonymize and delete this account">
                              Delete account
                            </button>
                          </div>
                        </details>
                      </td>
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
                <h3 className="section-title">Mod queue</h3>
                <p className="muted">Open moderation items that still need review. Use Moderation for moves and global controls.</p>
              </div>
              <a className="action-button admin-quick-action" href="/admin/moderation" title="Open moderation toolkit">Moderation tools</a>
            </div>
            <div className="admin-posts-table-wrapper">
              <table className="admin-posts-table">
                <thead>
                  <tr>
                    <th title="Reported content">Target</th>
                    <th title="Reporting user">Reporter</th>
                    <th title="Report reason">Reason</th>
                    <th title="Created">Created</th>
                    <th title="Actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="muted">No open reports right now.</td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id}>
                        <td>{report.targetType} · {report.targetId}</td>
                        <td>{report.reporter}</td>
                        <td>{report.reason || '—'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatTime(report.createdAt)}</td>
                        <td>
                          {report.viewHref ? (
                            <a className="button mini ghost" href={report.viewHref} target="_blank" rel="noreferrer" title="View reported content">
                              View
                            </a>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
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

      {drawerUser ? (
        <div className="admin-drawer-overlay" onClick={() => setDrawerUser(null)}>
          <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 className="section-title">User details</h3>
              <button type="button" onClick={() => setDrawerUser(null)} className="icon-button" aria-label="Close drawer">
                ×
              </button>
            </div>
            <div className="stack" style={{ gap: '10px' }}>
              <div>
                <div className="muted">Username</div>
                <strong>{drawerUser.username}</strong>
              </div>
              <div>
                <div className="muted">Role</div>
                <strong>{drawerUser.role}</strong>
              </div>
              <div>
                <div className="muted">Joined</div>
                <strong>{formatTime(drawerUser.createdAt)}</strong>
              </div>
              <div>
                <div className="muted">Last seen</div>
                <strong>{formatTime(drawerUser.lastSeen)}</strong>
              </div>
              <div>
                <div className="muted">Posts</div>
                <strong>{drawerUser.postsCount ?? 0}</strong>
              </div>
              <div>
                <div className="muted">Comments</div>
                <strong>{drawerUser.commentsCount ?? 0}</strong>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                <a className="button mini ghost" href={`/profile/${drawerUser.username}`} target="_blank" rel="noreferrer">
                  View profile
                </a>
                <button type="button" className="button ghost" onClick={() => handleDeleteUser(drawerUser)} disabled={drawerUser.isDeleted}>
                  Delete account
                </button>
              </div>
              <div className="muted" style={{ fontSize: '12px' }}>
                Privacy note: email/phone/passwords are not shown here. Deleting an account anonymizes personal data.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
