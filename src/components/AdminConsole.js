'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AdminStatCard from './AdminStatCard';
import ErrlTabSwitcher from './ErrlTabSwitcher';
import CreatePostModal from './CreatePostModal';
import { roleDisplayLabel } from '../lib/roles';
import {
  FORUM_TIME_ZONE,
  formatDateTime,
  formatDateTimeLocalInputInForumTime
} from '../lib/dates';

const TAB_LIST = ['Overview', 'System Log', 'Posts', 'Users', 'Reports', 'Media', 'Settings'];
const ADMIN_TABS = TAB_LIST.map((tab) => ({ id: tab, label: tab }));
const TAB_LOOKUP = TAB_LIST.reduce((acc, tab) => {
  acc[tab.toLowerCase()] = tab;
  return acc;
}, {});
const ADMIN_TAB_COLOR_SEQUENCE = ['#34E1FF', '#FF34F5', '#00FF9F', '#FFD166', '#7CF3FF', '#9E7BFF', '#FF7A59'];
const TRAFFIC_BAR_COLORS = [
  '#4BD8FF',
  '#7EE3FF',
  '#9DF0FF',
  '#4DC8FF',
  '#66D1FF',
  '#8AD8FF',
  '#6FE0FF',
  '#59CCFF',
  '#45C3FF',
  '#6BCBFF',
  '#90DAFF',
  '#3DB7F4'
];

const LIVE_SYSTEM_LOG_LIMIT = 500;
const SYSTEM_LOG_ARCHIVE_CHUNK_SIZE = 250;

const STATUS_PILLS = {
  pinned: 'PINNED',
  hidden: 'HIDDEN',
  locked: 'LOCKED'
};

const CONTENT_MOVE_DESTINATIONS = [
  { value: 'forum_thread', label: 'General' },
  { value: 'forum_thread_shitpost', label: 'Shitposts' },
  { value: 'timeline_update', label: 'Announcements' },
  { value: 'event', label: 'Events' },
  { value: 'music_post', label: 'Music' },
  { value: 'project', label: 'Projects' },
  { value: 'dev_log', label: 'Development' },
  { value: 'post:art', label: 'Art' },
  { value: 'post:nostalgia', label: 'Nostalgia' },
  { value: 'post:bugs', label: 'Bugs' },
  { value: 'post:rant', label: 'Rants' },
  { value: 'post:lore', label: 'Lore' },
  { value: 'post:memories', label: 'Memories' },
  { value: 'post:nomads', label: 'Nomads' }
];

const POST_SECTION_DESTINATIONS = [
  { value: 'art', label: 'Art' },
  { value: 'nostalgia', label: 'Nostalgia' },
  { value: 'bugs', label: 'Bugs' },
  { value: 'rant', label: 'Rants' },
  { value: 'lore', label: 'Lore' },
  { value: 'memories', label: 'Memories' },
  { value: 'nomads', label: 'Nomads' },
  { value: 'about', label: 'About' }
];

const POST_SUBTYPE_PATHS = {
  art: '/art',
  nostalgia: '/nostalgia',
  bugs: '/bugs',
  rant: '/rant',
  lore: '/lore',
  memories: '/memories',
  nomads: '/nomads',
  about: '/about'
};

function formatTime(timestamp) {
  if (!timestamp && timestamp !== 0) return '—';
  return formatDateTime(timestamp);
}

function formatDateInput(timestamp) {
  return formatDateTimeLocalInputInForumTime(timestamp);
}

function formatLogClock(timestamp) {
  if (!timestamp) return '--:--:--';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour12: false, timeZone: FORUM_TIME_ZONE });
}

function formatLogDateTime(timestamp) {
  if (!timestamp && timestamp !== 0) return 'unknown';
  return formatDateTime(timestamp);
}

function formatActionLabel(value) {
  return String(value || '').replace(/_/g, ' ').trim();
}

function normalizeActionType(value, fallback = 'event') {
  const normalized = String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .trim();
  return normalized || fallback;
}

function inferClickActionType(click = {}) {
  const label = String(click.label || '').toLowerCase();
  if (label.includes('save')) return 'save';
  if (label.includes('edit') || label.includes('update')) return 'edit';
  if (label.includes('delete') || label.includes('remove')) return 'delete';
  if (label.includes('open') || label.includes('view')) return 'open';
  if (label.includes('create') || label.includes('new')) return 'create';
  if (click.href && click.href !== click.path) return 'navigate';
  return 'open';
}

function buildSystemLogMarkdown(entries = [], title = 'System log export') {
  const sorted = [...entries].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  const lines = [
    `# ${title}`,
    '',
    `Generated: ${formatDateTime(Date.now())}`,
    `Entries: ${sorted.length}`,
    ''
  ];
  sorted.forEach((entry) => {
    const level = String(entry.level || 'info').toUpperCase();
    const actor = entry.actor || 'system';
    const actionType = formatActionLabel(entry.actionType || 'event') || 'event';
    lines.push(`- [${formatLogDateTime(entry.createdAt)}] [${level}] [${actor}] [${actionType}] ${entry.message}`);
  });
  lines.push('');
  return lines.join('\n');
}

function buildSystemLogEntries({ stats = {}, actions = [], posts = [], users = [], reports = [], clicks = [] }) {
  const bootTime = Date.now();
  const entries = [
    {
      id: `system-boot-${bootTime}`,
      createdAt: bootTime,
      level: 'info',
      source: 'system',
      actor: 'system',
      actionType: 'open',
      message: 'System initialized. Welcome to Errl UI.'
    },
    {
      id: 'system-snapshot',
      createdAt: bootTime - 1,
      level: 'info',
      source: 'stats',
      actor: 'system',
      actionType: 'snapshot',
      message: `Snapshot loaded: ${stats.totalUsers || 0} users, ${stats.active24h || 0} active (24h), ${stats.flaggedItems || 0} flagged.`
    }
  ];

  if (reports.length > 0) {
    entries.push({
      id: 'system-reports-open',
      createdAt: bootTime - 2,
      level: 'warn',
      source: 'reports',
      actor: 'system',
      actionType: 'open',
      message: `${reports.length} open ${reports.length === 1 ? 'report' : 'reports'} in moderation queue.`
    });
  }

  actions.forEach((action) => {
    entries.push({
      id: `audit-${action.id}`,
      createdAt: Number(action.created_at || 0) || bootTime,
      level: 'info',
      source: 'audit',
      actor: action.admin_username || 'admin',
      actionType: normalizeActionType(action.action_type, 'edit'),
      message: `${action.admin_username || 'Admin'} ${formatActionLabel(action.action_type)} ${formatActionLabel(action.target_type)}${action.target_id ? ` (${action.target_id})` : ''}.`
    });
  });

  posts.slice(0, 6).forEach((post) => {
    entries.push({
      id: `post-${post.type}-${post.id}`,
      createdAt: Number(post.createdAt || 0) || bootTime,
      level: 'info',
      source: 'content',
      actor: post.authorName || 'author',
      actionType: 'create',
      message: `Content published in ${post.sectionLabel || post.type}: ${post.title}.`
    });
  });

  users.slice(0, 4).forEach((member) => {
    entries.push({
      id: `user-${member.id}`,
      createdAt: Number(member.createdAt || 0) || bootTime,
      level: 'info',
      source: 'users',
      actor: member.username || 'user',
      actionType: 'open',
      message: `Account observed: ${member.username} (${roleDisplayLabel(member.role || 'user')}).`
    });
  });

  clicks.forEach((click) => {
    const actor = click.username || (click.userId ? 'user' : 'guest');
    const target = click.label || click.tagName || 'element';
    const location = click.path || '/';
    const destination = click.href ? ` -> ${click.href}` : '';
    entries.push({
      id: `click-${click.id || Math.random().toString(16).slice(2, 8)}`,
      createdAt: Number(click.createdAt || 0) || bootTime,
      level: 'info',
      source: 'click',
      actor,
      actionType: inferClickActionType(click),
      message: `${actor} clicked ${target} on ${location}${destination}.`
    });
  });

  const dedupe = new Set();
  return entries
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .filter((entry) => {
      const key = `${entry.createdAt}|${entry.source}|${entry.message}`;
      if (dedupe.has(key)) return false;
      dedupe.add(key);
      return true;
    });
}

function mediaPreviewUrl(imageKey) {
  const raw = String(imageKey || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return raw;
  }
  if (raw.startsWith('/')) {
    return raw;
  }
  const encodedKey = raw
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `/api/media/${encodedKey}`;
}

function currentMoveDestination(post) {
  if (!post) return '';
  if (post.type === 'post') {
    return post.subtype || '';
  }
  if (post.type === 'forum_thread') {
    if (post.isShitpost || String(post.sectionLabel || '').toLowerCase() === 'shitposts') {
      return 'forum_thread_shitpost';
    }
    return 'forum_thread';
  }
  return post.type || '';
}

export default function AdminConsole({ stats = {}, posts = [], actions = [], users = [], reports = [], media = null, clickEvents = [] }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [postList, setPostList] = useState(posts);
  const [userList, setUserList] = useState(users);
  const [filter, setFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [busyPost, setBusyPost] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [notificationBroadcastBusy, setNotificationBroadcastBusy] = useState(false);
  const [notificationBroadcastMessage, setNotificationBroadcastMessage] = useState(null);
  const [broadcastComposerOpen, setBroadcastComposerOpen] = useState(false);
  const [broadcastMessageDraft, setBroadcastMessageDraft] = useState('');
  const [broadcastSendBusy, setBroadcastSendBusy] = useState(false);
  const [drawerPost, setDrawerPost] = useState(null);
  const [drawerUser, setDrawerUser] = useState(null);
  const [showDeletedPosts, setShowDeletedPosts] = useState(false);
  const [showDeletedUsers, setShowDeletedUsers] = useState(false);
  const [openPostMenu, setOpenPostMenu] = useState(null);
  const [openUserMenu, setOpenUserMenu] = useState(null);
  const [movePost, setMovePost] = useState(null);
  const [moveDestination, setMoveDestination] = useState('');
  const [moveStartsAt, setMoveStartsAt] = useState('');
  const [moveMusicUrl, setMoveMusicUrl] = useState('');
  const [moveMusicType, setMoveMusicType] = useState('song');
  const [moveMusicTags, setMoveMusicTags] = useState('');
  const [moveProjectStatus, setMoveProjectStatus] = useState('active');
  const [moveBusy, setMoveBusy] = useState(false);
  const [globalNotice, setGlobalNotice] = useState(null);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [logUserFilter, setLogUserFilter] = useState('all');
  const [logTypeFilter, setLogTypeFilter] = useState('all');
  const [systemLogEntries, setSystemLogEntries] = useState(() => buildSystemLogEntries({
    stats,
    actions,
    posts,
    users,
    reports,
    clicks: clickEvents
  }));
  const [systemLogArchives, setSystemLogArchives] = useState([]);
  const [imageUploadsEnabled, setImageUploadsEnabled] = useState(stats.imageUploadsEnabled !== false);
  const archiveUrlsRef = useRef([]);

  const postKey = (post) => `${post.type || 'post'}:${post.id}`;
  const userKey = (member) => `${member.id}`;
  const shouldOpenMenuUp = (triggerElement) => {
    if (typeof window === 'undefined' || !triggerElement) return false;
    const rect = triggerElement.getBoundingClientRect();
    const menuHeightEstimate = 340;
    const viewportPadding = 16;
    const spaceBelow = window.innerHeight - rect.bottom;
    const wrapper = triggerElement.closest('.admin-posts-table-wrapper');
    const panel = triggerElement.closest('.admin-posts-panel');
    const wrapperBottom = wrapper?.getBoundingClientRect?.().bottom ?? Number.POSITIVE_INFINITY;
    const panelBottom = panel?.getBoundingClientRect?.().bottom ?? Number.POSITIVE_INFINITY;
    const nearestBoundaryBottom = Math.min(wrapperBottom, panelBottom, window.innerHeight);
    const boundarySpaceBelow = nearestBoundaryBottom - rect.bottom;
    const requiredSpace = menuHeightEstimate + viewportPadding;
    return spaceBelow < requiredSpace || boundarySpaceBelow < requiredSpace;
  };

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

  useEffect(() => () => {
    archiveUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (_) {
        // ignore URL revoke failures
      }
    });
  }, []);

  useEffect(() => {
    if (!globalNotice) return undefined;
    const timeout = window.setTimeout(() => {
      setGlobalNotice(null);
    }, 4200);
    return () => window.clearTimeout(timeout);
  }, [globalNotice]);

  const allSystemLogEntries = useMemo(() => (
    [...systemLogEntries, ...systemLogArchives.flatMap((archive) => archive.entries)]
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
  ), [systemLogArchives, systemLogEntries]);

  const logUserOptions = useMemo(() => {
    const values = new Set();
    allSystemLogEntries.forEach((entry) => {
      if (entry.actor) values.add(entry.actor);
    });
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [allSystemLogEntries]);

  const logTypeOptions = useMemo(() => {
    const values = new Set();
    allSystemLogEntries.forEach((entry) => {
      values.add(normalizeActionType(entry.actionType || entry.source, 'event'));
    });
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [allSystemLogEntries]);

  const filteredSystemLogEntries = useMemo(() => {
    return allSystemLogEntries.filter((entry) => {
      const actor = entry.actor || 'system';
      const actionType = normalizeActionType(entry.actionType || entry.source, 'event');
      if (logUserFilter !== 'all' && actor !== logUserFilter) return false;
      if (logTypeFilter !== 'all' && actionType !== logTypeFilter) return false;
      return true;
    });
  }, [allSystemLogEntries, logTypeFilter, logUserFilter]);

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

  const updatePost = (targetPost, data) => {
    const targetKey = postKey(targetPost);
    setPostList((prev) => prev.map((post) => (postKey(post) === targetKey ? { ...post, ...data } : post)));
  };

  const togglePostMenu = (id, triggerElement) => {
    setOpenUserMenu(null);
    setOpenPostMenu((current) => {
      if (current?.id === id) return null;
      return { id, openUp: shouldOpenMenuUp(triggerElement) };
    });
  };

  const toggleUserMenu = (id, triggerElement) => {
    setOpenPostMenu(null);
    setOpenUserMenu((current) => {
      if (current?.id === id) return null;
      return { id, openUp: shouldOpenMenuUp(triggerElement) };
    });
  };

  const closeMenus = () => {
    setOpenPostMenu(null);
    setOpenUserMenu(null);
  };

  const openMoveDialog = (post) => {
    const currentDestination = currentMoveDestination(post);
    const defaultDestination = post.type === 'post'
      ? (post.subtype && post.subtype !== 'art' ? 'art' : 'nostalgia')
      : (CONTENT_MOVE_DESTINATIONS.find((option) => option.value !== currentDestination)?.value || '');
    setMovePost(post);
    setMoveDestination(defaultDestination);
    setMoveStartsAt('');
    setMoveMusicUrl('');
    setMoveMusicType('song');
    setMoveMusicTags('');
    setMoveProjectStatus('active');
  };

  const closeMoveDialog = () => {
    setMovePost(null);
    setMoveDestination('');
    setMoveStartsAt('');
    setMoveMusicUrl('');
    setMoveMusicType('song');
    setMoveMusicTags('');
    setMoveProjectStatus('active');
    setMoveBusy(false);
  };

  const pushNotice = (message, tone = 'info') => {
    if (!message) return;
    setGlobalNotice({ message, tone, createdAt: Date.now() });
  };

  const appendSystemLog = (message, { level = 'info', source = 'system', actor = 'admin', actionType = 'event' } = {}) => {
    const createdAt = Date.now();
    const nextEntry = {
      id: `live-${createdAt}-${Math.random().toString(16).slice(2, 8)}`,
      createdAt,
      level,
      source,
      actor,
      actionType: normalizeActionType(actionType, 'event'),
      message
    };
    setSystemLogEntries((prev) => {
      const combined = [nextEntry, ...prev];
      if (combined.length <= LIVE_SYSTEM_LOG_LIMIT) return combined;
      const archiveEntries = combined.slice(LIVE_SYSTEM_LOG_LIMIT - SYSTEM_LOG_ARCHIVE_CHUNK_SIZE);
      const liveEntries = combined.slice(0, LIVE_SYSTEM_LOG_LIMIT - SYSTEM_LOG_ARCHIVE_CHUNK_SIZE);
      const archiveCreatedAt = Date.now();
      const archiveName = `system-log-archive-${new Date(archiveCreatedAt).toISOString().replace(/[:]/g, '-')}.md`;
      const archiveText = buildSystemLogMarkdown(archiveEntries, `System log archive (${formatLogDateTime(archiveCreatedAt)})`);
      const archiveBlob = new Blob([archiveText], { type: 'text/markdown;charset=utf-8' });
      const archiveUrl = URL.createObjectURL(archiveBlob);
      archiveUrlsRef.current.push(archiveUrl);
      setSystemLogArchives((archives) => [
        {
          id: `archive-${archiveCreatedAt}-${Math.random().toString(16).slice(2, 8)}`,
          createdAt: archiveCreatedAt,
          entries: archiveEntries,
          name: archiveName,
          url: archiveUrl
        },
        ...archives
      ]);
      return liveEntries;
    });
  };

  const handleExportSystemLogMarkdown = ({ includeAll = true } = {}) => {
    const sourceEntries = includeAll ? allSystemLogEntries : filteredSystemLogEntries;
    const exportTitle = includeAll ? 'System log export' : 'System log export (filtered)';
    const markdown = buildSystemLogMarkdown(sourceEntries, exportTitle);
    const fileName = `system-log-export-${new Date().toISOString().replace(/[:]/g, '-')}.md`;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    pushNotice(`Exported ${sourceEntries.length} log ${sourceEntries.length === 1 ? 'entry' : 'entries'} to Markdown.`, 'success');
    appendSystemLog(`Exported ${sourceEntries.length} system log entries to Markdown.`, {
      source: 'system',
      actor: 'admin',
      actionType: 'save'
    });
  };

  const handleClearSystemLog = ({ clearAll = false } = {}) => {
    const targetEntries = clearAll ? allSystemLogEntries : filteredSystemLogEntries;
    if (targetEntries.length === 0) {
      pushNotice('No log entries to clear.', 'info');
      return;
    }
    const prompt = clearAll
      ? `Clear all ${targetEntries.length} loaded system log entries?`
      : `Clear ${targetEntries.length} currently visible system log entries?`;
    if (!confirm(prompt)) return;

    const targetIds = new Set(targetEntries.map((entry) => entry.id));
    setSystemLogEntries((prev) => prev.filter((entry) => !targetIds.has(entry.id)));
    setSystemLogArchives((prev) => {
      const next = [];
      prev.forEach((archive) => {
        const remaining = archive.entries.filter((entry) => !targetIds.has(entry.id));
        if (remaining.length === 0) {
          try {
            URL.revokeObjectURL(archive.url);
          } catch (_) {
            // ignore URL revoke failures
          }
          archiveUrlsRef.current = archiveUrlsRef.current.filter((url) => url !== archive.url);
          return;
        }
        next.push({
          ...archive,
          entries: remaining
        });
      });
      return next;
    });
    const label = clearAll ? 'all loaded' : 'filtered';
    pushNotice(`Cleared ${targetEntries.length} ${label} system log entries.`, 'success');
    appendSystemLog(`Cleared ${targetEntries.length} ${label} system log entries.`, {
      source: 'system',
      actor: 'admin',
      actionType: 'delete'
    });
  };

  const handleJumpToAuditLog = () => {
    setActiveTab('Overview');
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        const target = document.getElementById('admin-actions');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  };

  const handleToggleImageUploads = async () => {
    if (settingsBusy) return;
    setSettingsBusy(true);
    try {
      const formData = new FormData();
      formData.append('enabled', imageUploadsEnabled ? '0' : '1');
      const response = await fetch('/api/admin/settings/image-upload', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        throw new Error('Settings update failed');
      }
      const nextEnabled = !imageUploadsEnabled;
      setImageUploadsEnabled(nextEnabled);
      const message = nextEnabled ? 'Image uploads enabled.' : 'Image uploads disabled.';
      pushNotice(message, 'success');
      appendSystemLog(message, { source: 'settings', actor: 'admin', actionType: 'save' });
    } catch (error) {
      console.error(error);
      pushNotice('Image upload setting failed to save.', 'error');
      appendSystemLog('Image upload setting failed to save.', { level: 'error', source: 'settings', actor: 'admin', actionType: 'save' });
    } finally {
      setSettingsBusy(false);
    }
  };

  const handleTogglePin = async (post) => {
    const key = postKey(post);
    setBusyPost(key);
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
      updatePost(post, { isPinned: payload.is_pinned });
      setStatusMessage(payload.is_pinned ? 'Pinned.' : 'Unpinned.');
      pushNotice(payload.is_pinned ? `Pinned: ${post.title}` : `Unpinned: ${post.title}`, 'success');
      appendSystemLog(`${post.title} ${payload.is_pinned ? 'was pinned' : 'was unpinned'} by admin.`, { source: 'posts', actor: 'admin', actionType: 'edit' });
    } catch (error) {
      console.error(error);
      setStatusMessage('Pin toggle failed.');
      pushNotice(`Pin toggle failed for ${post.title}.`, 'error');
      appendSystemLog(`Pin toggle failed for ${post.title}.`, { level: 'error', source: 'posts', actor: 'admin', actionType: 'edit' });
    } finally {
      setBusyPost(null);
    }
  };

  const handleToggleHidden = async (post) => {
    const key = postKey(post);
    setBusyPost(key);
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
      updatePost(post, { isHidden: !post.isHidden });
      setStatusMessage(!post.isHidden ? 'Hidden.' : 'Visible again.');
      pushNotice(!post.isHidden ? `Hidden: ${post.title}` : `Visible: ${post.title}`, 'success');
      appendSystemLog(`${post.title} visibility set to ${!post.isHidden ? 'hidden' : 'visible'}.`, { source: 'posts', actor: 'admin', actionType: 'edit' });
    } catch (error) {
      console.error(error);
      setStatusMessage('Visibility toggle failed.');
      pushNotice(`Visibility toggle failed for ${post.title}.`, 'error');
      appendSystemLog(`Visibility toggle failed for ${post.title}.`, { level: 'error', source: 'posts', actor: 'admin', actionType: 'edit' });
    } finally {
      setBusyPost(null);
    }
  };

  const handleToggleLock = async (post) => {
    const key = postKey(post);
    setBusyPost(key);
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
      updatePost(post, { isLocked: !post.isLocked });
      setStatusMessage(!post.isLocked ? 'Locked comments.' : 'Unlocked.');
      pushNotice(!post.isLocked ? `Locked: ${post.title}` : `Unlocked: ${post.title}`, 'success');
      appendSystemLog(`${post.title} comment lock ${!post.isLocked ? 'enabled' : 'removed'}.`, { source: 'posts', actor: 'admin', actionType: 'edit' });
    } catch (error) {
      console.error(error);
      setStatusMessage('Lock toggle failed.');
      pushNotice(`Lock toggle failed for ${post.title}.`, 'error');
      appendSystemLog(`Lock toggle failed for ${post.title}.`, { level: 'error', source: 'posts', actor: 'admin', actionType: 'edit' });
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
      pushNotice(`Role saved: ${member.username} -> ${payload.role}`, 'success');
      appendSystemLog(`Role updated: ${member.username} -> ${payload.role}.`, { source: 'users', actor: 'admin', actionType: 'save' });
    } catch (error) {
      console.error(error);
      pushNotice(`Role update failed for ${member.username}.`, 'error');
      appendSystemLog(`Role update failed for ${member.username}.`, { level: 'error', source: 'users', actor: 'admin', actionType: 'save' });
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
      pushNotice(`Deleted account: ${member.username}`, 'success');
      appendSystemLog(`Account deleted: ${member.username}.`, { level: 'warn', source: 'users', actor: 'admin', actionType: 'delete' });
    } catch (error) {
      console.error(error);
      pushNotice(`Account delete failed for ${member.username}.`, 'error');
      appendSystemLog(`Account delete failed for ${member.username}.`, { level: 'error', source: 'users', actor: 'admin', actionType: 'delete' });
    }
  };

  const handleDeletePost = async (post) => {
    if (!post.deleteHref) return;
    if (!confirm(`Delete “${post.title}”? This will hide it from public views.`)) {
      return;
    }
    const key = postKey(post);
    setBusyPost(key);
    try {
      const response = await fetch(post.deleteHref, { method: 'POST' });
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      updatePost(post, { isDeleted: true });
      setStatusMessage('Post deleted.');
      pushNotice(`Deleted post: ${post.title}`, 'success');
      appendSystemLog(`Post deleted: ${post.title}.`, { level: 'warn', source: 'posts', actor: 'admin', actionType: 'delete' });
    } catch (error) {
      console.error(error);
      setStatusMessage('Delete failed.');
      pushNotice(`Delete failed: ${post.title}`, 'error');
      appendSystemLog(`Post delete failed: ${post.title}.`, { level: 'error', source: 'posts', actor: 'admin', actionType: 'delete' });
    } finally {
      setBusyPost(null);
    }
  };

  const handleRestorePost = async (post) => {
    const key = postKey(post);
    setBusyPost(key);
    try {
      const response = await fetch(`/api/admin/posts/${post.id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: post.type })
      });
      if (!response.ok) {
        throw new Error('Restore failed');
      }
      updatePost(post, { isDeleted: false });
      setStatusMessage('Post restored.');
      pushNotice(`Restored post: ${post.title}`, 'success');
      appendSystemLog(`Post restored: ${post.title}.`, { source: 'posts', actor: 'admin', actionType: 'save' });
    } catch (error) {
      console.error(error);
      setStatusMessage('Restore failed.');
      pushNotice(`Restore failed: ${post.title}`, 'error');
      appendSystemLog(`Post restore failed: ${post.title}.`, { level: 'error', source: 'posts', actor: 'admin', actionType: 'save' });
    } finally {
      setBusyPost(null);
    }
  };

  const handleMovePost = async () => {
    if (!movePost || !moveDestination) return;
    setMoveBusy(true);
    try {
      if (movePost.type === 'post') {
        const response = await fetch(`/api/admin/posts/${movePost.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'post',
            postSubtype: moveDestination
          })
        });
        if (!response.ok) {
          throw new Error('Unable to move post section');
        }
        const updated = await response.json();
        const label = POST_SECTION_DESTINATIONS.find((entry) => entry.value === updated.type)?.label || 'Post';
        updatePost(movePost, {
          subtype: updated.type,
          sectionLabel: label,
          viewHref: `${POST_SUBTYPE_PATHS[updated.type] || '/posts'}/${movePost.id}`
        });
        setStatusMessage(`Moved to ${label}.`);
        pushNotice(`Moved ${movePost.title} to ${label}.`, 'success');
        appendSystemLog(`Post moved: ${movePost.title} -> ${label}.`, { source: 'move', actor: 'admin', actionType: 'save' });
        closeMoveDialog();
        return;
      }

      if (movePost.type === 'forum_thread' && (moveDestination === 'forum_thread' || moveDestination === 'forum_thread_shitpost')) {
        const forumSection = moveDestination === 'forum_thread_shitpost' ? 'shitposts' : 'general';
        const response = await fetch(`/api/admin/posts/${movePost.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'forum_thread',
            forumSection
          })
        });
        if (!response.ok) {
          let errorMessage = 'Unable to move forum section';
          try {
            const payload = await response.json();
            if (payload?.error) {
              errorMessage = payload.error;
            }
          } catch (_) {
            // ignore parse failures
          }
          throw new Error(errorMessage);
        }
        const updated = await response.json();
        const label = forumSection === 'shitposts' ? 'Shitposts' : 'General';
        updatePost(movePost, {
          sectionLabel: label,
          isShitpost: Boolean(updated?.is_shitpost)
        });
        setStatusMessage(`Moved to ${label}.`);
        pushNotice(`Moved ${movePost.title} to ${label}.`, 'success');
        appendSystemLog(`Thread moved: ${movePost.title} -> ${label}.`, { source: 'move', actor: 'admin', actionType: 'save' });
        closeMoveDialog();
        return;
      }

      const formData = new FormData();
      formData.append('source_type', movePost.type);
      formData.append('source_id', movePost.id);
      const isPostDestination = moveDestination.startsWith('post:');
      const destinationTypeForApi = isPostDestination
        ? 'post'
        : (moveDestination === 'forum_thread_shitpost' ? 'forum_thread' : moveDestination);
      formData.append('dest_type', destinationTypeForApi);
      if (moveDestination === 'forum_thread_shitpost') {
        formData.append('forum_section', 'shitposts');
      }
      if (isPostDestination) {
        formData.append('post_subtype', moveDestination.slice('post:'.length));
      }
      if (moveDestination === 'event') {
        if (!moveStartsAt) {
          throw new Error('Start time is required for events.');
        }
        formData.append('starts_at', moveStartsAt);
      }
      if (moveDestination === 'music_post') {
        if (!moveMusicUrl.trim()) {
          throw new Error('Music URL is required.');
        }
        if (!moveMusicType.trim()) {
          throw new Error('Music type is required.');
        }
        formData.append('url', moveMusicUrl.trim());
        formData.append('type', moveMusicType.trim());
        if (moveMusicTags.trim()) {
          formData.append('tags', moveMusicTags.trim());
        }
      }
      if (moveDestination === 'project') {
        formData.append('status', moveProjectStatus);
      }

      const response = await fetch('/api/admin/move', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        let errorMessage = 'Move failed.';
        try {
          const payload = await response.json();
          if (payload?.error) {
            errorMessage = `Move failed: ${payload.error}`;
          }
        } catch (_) {
          // ignore parse failures
        }
        throw new Error(errorMessage);
      }

      const destinationLabel = CONTENT_MOVE_DESTINATIONS.find((entry) => entry.value === moveDestination)?.label || 'destination';
      setPostList((prev) => prev.filter((postRow) => postKey(postRow) !== postKey(movePost)));
      setStatusMessage(`Moved to ${destinationLabel}.`);
      pushNotice(`Moved ${movePost.title} to ${destinationLabel}.`, 'success');
      appendSystemLog(`Content moved: ${movePost.title} -> ${destinationLabel}.`, { source: 'move', actor: 'admin', actionType: 'save' });
      closeMoveDialog();
    } catch (error) {
      console.error(error);
      setStatusMessage(error?.message || 'Move failed.');
      pushNotice(error?.message || `Move failed for ${movePost?.title || 'content'}.`, 'error');
      appendSystemLog(`Move failed for ${movePost?.title || 'content'}.`, { level: 'error', source: 'move', actor: 'admin', actionType: 'save' });
      setMoveBusy(false);
    }
  };

  const handleSendNavigationTip = async () => {
    if (notificationBroadcastBusy) return;
    setNotificationBroadcastBusy(true);
    setNotificationBroadcastMessage(null);
    try {
      const response = await fetch('/api/admin/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'navigation_tip' })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Broadcast failed');
      }
      setNotificationBroadcastMessage(payload?.message || 'Navigation tip notification sent.');
      appendSystemLog(payload?.message || 'Navigation tip notification broadcast sent to users.', {
        source: 'system',
        actor: 'admin',
        actionType: 'save'
      });
      pushNotice(payload?.message || 'Navigation tip notification sent.', 'success');
    } catch (error) {
      const message = error?.message || 'Broadcast failed.';
      setNotificationBroadcastMessage(message);
      appendSystemLog(`Navigation tip broadcast failed: ${message}`, {
        level: 'error',
        source: 'system',
        actor: 'admin',
        actionType: 'save'
      });
      pushNotice(message, 'error');
    } finally {
      setNotificationBroadcastBusy(false);
    }
  };

  const handleSendCustomBroadcast = async () => {
    const message = broadcastMessageDraft.trim();
    if (!message || broadcastSendBusy) return;
    setBroadcastSendBusy(true);
    try {
      const response = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Broadcast send failed');
      }
      setNotificationBroadcastMessage(payload?.message || 'Broadcast sent.');
      appendSystemLog(payload?.message || 'Custom broadcast notification sent.', { source: 'system', actor: 'admin', actionType: 'save' });
      setBroadcastComposerOpen(false);
      setBroadcastMessageDraft('');
      pushNotice(payload?.message || 'Broadcast sent.', 'success');
    } catch (error) {
      const messageText = error?.message || 'Broadcast send failed.';
      setNotificationBroadcastMessage(messageText);
      appendSystemLog(`Custom broadcast failed: ${messageText}`, { level: 'error', source: 'system', actor: 'admin', actionType: 'save' });
      pushNotice(messageText, 'error');
    } finally {
      setBroadcastSendBusy(false);
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
    { label: 'Moderation', href: '/admin/moderation', title: 'Open moderation toolkit' },
    { label: 'Audit log', action: handleJumpToAuditLog, title: 'Jump to recent admin actions' },
    { label: 'Backup status', href: '/admin/backups', title: 'Review backup status and workflows' }
  ];

  const activitySeries = [
    { label: 'Active (24h)', value: stats.active24h || 0 },
    { label: 'Posts (24h)', value: stats.posts24h || 0 },
    { label: 'Comments (24h)', value: stats.comments24h || 0 },
    { label: 'Active (7d)', value: stats.active7d || 0 },
    { label: 'Posts (7d)', value: stats.posts7d || 0 },
    { label: 'Comments (7d)', value: stats.comments7d || 0 }
  ].map((point, index) => ({ ...point, color: TRAFFIC_BAR_COLORS[index % TRAFFIC_BAR_COLORS.length] }));
  const operationalTotals = [
    { label: 'Hidden posts', value: stats.hiddenPosts || 0 },
    { label: 'Locked posts', value: stats.lockedPosts || 0 },
    { label: 'Pinned posts', value: stats.pinnedPosts || 0 },
    { label: 'Flagged', value: stats.flaggedItems || 0 },
    { label: 'Open reports', value: reports.length || 0 },
    { label: 'Audit rows', value: actions.length || 0 }
  ];
  const maxTrafficValue = Math.max(...activitySeries.map((point) => point.value), 1);
  const minTrafficValue = Math.min(...activitySeries.map((point) => point.value), 0);
  const midTrafficValue = Math.round(maxTrafficValue / 2);
  const avgTrafficValue = Math.round(
    (activitySeries.reduce((sum, point) => sum + point.value, 0) / Math.max(activitySeries.length, 1)) * 10
  ) / 10;

  return (
    <div className="admin-console stack">
      <section className="card admin-header-bar">
        <div className="admin-header-copy">
          <p className="muted admin-header-eyebrow">Admin Console</p>
          <h1 className="section-title admin-header-title">Mission Control</h1>
        </div>
        <div className="admin-header-actions">
          {quickActions.map((action) => (
            action.href ? (
              <a key={action.label} className="action-button admin-quick-action" href={action.href} title={action.title}>
                {action.label}
              </a>
            ) : (
              <button key={action.label} type="button" className="action-button admin-quick-action" onClick={action.action} title={action.title}>
                {action.label}
              </button>
            )
          ))}
        </div>
      </section>

      <ErrlTabSwitcher
        tabs={ADMIN_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="admin-tabs-switcher"
        colorSequence={ADMIN_TAB_COLOR_SEQUENCE}
        renderTabLabel={(tab) => (
          tab.id === 'System Log'
            ? (
              <>
                <span className="admin-tab-label-full">System Log</span>
                <span className="admin-tab-label-compact">Log</span>
              </>
            )
            : tab.label
        )}
        getTabClassName={(tab) => [
          'account-edit-tab',
          'admin-tab',
          activeTab === tab.id ? 'account-edit-tab--active admin-tab--active' : ''
        ].filter(Boolean).join(' ')}
      />

      <div className="admin-tab-panel">
        {globalNotice ? (
          <div className={`notice admin-global-notice admin-global-notice--${globalNotice.tone || 'info'}`}>
            {globalNotice.message}
          </div>
        ) : null}
        {activeTab === 'Overview' && (
          <section className="card stack admin-overview">
            <div className="admin-stat-grid">
              {overviewStats.map((stat) => (
                <AdminStatCard key={stat.label} {...stat} />
              ))}
            </div>
            <div id="admin-actions" className="admin-overview-layout">
              <div className="admin-overview-feed-column">
                <div className="admin-overview-feed-scroll">
                  <div className="admin-panel admin-panel--scroll-list">
                    <h3 className="section-title">Recent admin actions</h3>
                    {actions.length === 0 ? (
                      <p className="muted">No admin activity captured yet.</p>
                    ) : (
                      <div className="admin-panel-list-scroll">
                        <ul className="admin-action-list">
                          {actions.map((action) => (
                            <li key={action.id}>
                              <strong>{action.admin_username}</strong> {action.action_type.replace('_', ' ')} {action.target_type}
                              {action.target_id ? ` (${action.target_id})` : ''}
                              <div className="muted" style={{ fontSize: '13px' }}>{formatTime(action.created_at)}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="admin-panel admin-panel--scroll-list">
                    <h3 className="section-title">Latest threads</h3>
                    <div className="admin-panel-list-scroll">
                      <ul className="admin-action-list">
                        {postList.map((post) => (
                          <li key={postKey(post)}>
                            <strong>{post.title}</strong>
                            <div className="muted" style={{ fontSize: '12px' }}>
                              {post.sectionLabel} · {post.authorName} · {formatTime(post.createdAt)}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="admin-panel admin-panel--system admin-panel--system-wide">
                <div className="admin-panel-header-row">
                  <h3 className="section-title">System log</h3>
                  <div className="admin-system-log-actions">
                    <button type="button" className="button mini ghost" onClick={() => setActiveTab('System Log')}>
                      Open tab
                    </button>
                  </div>
                </div>
                <div className="admin-system-log-window">
                  <div className="admin-system-log-titlebar">
                    <span>system.log</span>
                    <span className="admin-system-log-dot" aria-hidden="true" />
                  </div>
                  <div className="admin-system-log-controls">
                    <label className="admin-system-log-filter">
                      <span className="muted">User</span>
                      <select value={logUserFilter} onChange={(event) => setLogUserFilter(event.target.value)}>
                        <option value="all">All users</option>
                        {logUserOptions.map((userName) => (
                          <option key={userName} value={userName}>{userName}</option>
                        ))}
                      </select>
                    </label>
                    <label className="admin-system-log-filter">
                      <span className="muted">Action type</span>
                      <select value={logTypeFilter} onChange={(event) => setLogTypeFilter(event.target.value)}>
                        <option value="all">All actions</option>
                        {logTypeOptions.map((actionType) => (
                          <option key={actionType} value={actionType}>{formatActionLabel(actionType)}</option>
                        ))}
                      </select>
                    </label>
                    <div className="admin-system-log-actions">
                      <button type="button" className="button mini ghost" onClick={() => handleExportSystemLogMarkdown({ includeAll: false })}>
                        Export filtered .md
                      </button>
                      <button type="button" className="button mini ghost" onClick={() => handleExportSystemLogMarkdown({ includeAll: true })}>
                        Export full .md
                      </button>
                      <button type="button" className="button mini ghost" onClick={() => handleClearSystemLog({ clearAll: false })}>
                        Clear visible
                      </button>
                    </div>
                  </div>
                  {systemLogArchives.length > 0 ? (
                    <div className="admin-system-log-archives">
                      <p className="muted">Archived log files:</p>
                      <div className="admin-system-log-archive-list">
                        {systemLogArchives.map((archive) => (
                          <a key={archive.id} className="button mini ghost" href={archive.url} download={archive.name}>
                            Download {archive.name} ({archive.entries.length})
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <ul className="admin-system-log-list">
                    {filteredSystemLogEntries.slice(0, 14).map((entry) => (
                      <li key={entry.id} className={`admin-system-log-line admin-system-log-line--${entry.level || 'info'}`}>
                        <span className="admin-system-log-time">[{formatLogClock(entry.createdAt)}]</span>
                        <span className="admin-system-log-meta">{entry.actor || 'system'} · {formatActionLabel(entry.actionType || entry.source)}</span>
                        <span>{entry.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'System Log' && (
          <section className="card stack admin-system-tab">
            <div className="admin-traffic-card">
              <div className="admin-traffic-header-row">
                <h3 className="section-title">Network activity</h3>
                <div className="admin-traffic-summary muted">
                  <span>Low: {minTrafficValue}</span>
                  <span>Avg: {avgTrafficValue}</span>
                  <span>High: {maxTrafficValue}</span>
                </div>
              </div>
              <div className="admin-traffic-chart">
                <div className="admin-traffic-scale" aria-hidden="true">
                  <span>{maxTrafficValue}</span>
                  <span>{midTrafficValue}</span>
                  <span>0</span>
                </div>
                <div className="admin-traffic-bars" style={{ gridTemplateColumns: `repeat(${activitySeries.length}, minmax(0, 1fr))` }}>
                  {activitySeries.map((point) => {
                    const height = Math.max(16, Math.round((point.value / maxTrafficValue) * 100));
                    return (
                      <div
                        key={point.label}
                        className={`admin-traffic-bar-column ${point.value > 0 ? 'admin-traffic-bar-column--active' : ''}`}
                        title={`${point.label}: ${point.value}`}
                      >
                        <span className="admin-traffic-bar-track">
                          <span className="admin-traffic-bar" style={{ height: `${height}%`, background: point.color }} />
                        </span>
                        {point.value > 0 ? <span className="admin-traffic-bar-label">{point.label}</span> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="admin-traffic-legend" role="list" aria-label="Network activity metrics">
                {activitySeries.map((point) => (
                  <div key={`legend-${point.label}`} className="admin-traffic-legend-item" role="listitem">
                    <span className="admin-traffic-legend-swatch" style={{ background: point.color }} aria-hidden="true" />
                    <span className="admin-traffic-legend-label">{point.label}</span>
                    <strong className="admin-traffic-legend-value">{point.value}</strong>
                  </div>
                ))}
              </div>
              <div className="admin-operational-totals">
                <h4 className="admin-operational-title">Operational totals</h4>
                <div className="admin-operational-grid">
                  {operationalTotals.map((metric) => (
                    <div key={metric.label} className="admin-operational-item">
                      <span className="admin-operational-label">{metric.label}</span>
                      <strong className="admin-operational-value">{metric.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="admin-system-log-window admin-system-log-window--expanded">
              <div className="admin-system-log-titlebar">
                <span>system.log</span>
                <span className="admin-system-log-dot" aria-hidden="true" />
              </div>
              <div className="admin-system-log-controls">
                <label className="admin-system-log-filter">
                  <span className="muted">User</span>
                  <select value={logUserFilter} onChange={(event) => setLogUserFilter(event.target.value)}>
                    <option value="all">All users</option>
                    {logUserOptions.map((userName) => (
                      <option key={userName} value={userName}>{userName}</option>
                    ))}
                  </select>
                </label>
                <label className="admin-system-log-filter">
                  <span className="muted">Action type</span>
                  <select value={logTypeFilter} onChange={(event) => setLogTypeFilter(event.target.value)}>
                    <option value="all">All actions</option>
                    {logTypeOptions.map((actionType) => (
                      <option key={actionType} value={actionType}>{formatActionLabel(actionType)}</option>
                    ))}
                  </select>
                </label>
                <div className="admin-system-log-actions">
                  <button type="button" className="button mini ghost" onClick={() => handleExportSystemLogMarkdown({ includeAll: false })}>
                    Export filtered .md
                  </button>
                  <button type="button" className="button mini ghost" onClick={() => handleExportSystemLogMarkdown({ includeAll: true })}>
                    Export full .md
                  </button>
                  <button type="button" className="button mini ghost" onClick={() => handleClearSystemLog({ clearAll: false })}>
                    Clear visible
                  </button>
                  <button type="button" className="button mini ghost" onClick={() => handleClearSystemLog({ clearAll: true })}>
                    Clear all loaded
                  </button>
                </div>
              </div>
              {systemLogArchives.length > 0 ? (
                <div className="admin-system-log-archives">
                  <p className="muted">Archived log files (auto-created as log grows):</p>
                  <div className="admin-system-log-archive-list">
                    {systemLogArchives.map((archive) => (
                      <a key={archive.id} className="button mini ghost" href={archive.url} download={archive.name}>
                        Download {archive.name} ({archive.entries.length})
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
              <ul className="admin-system-log-list">
                {filteredSystemLogEntries.length === 0 ? (
                  <li className="admin-system-log-line admin-system-log-line--info">
                    <span className="admin-system-log-time">[{formatLogClock(Date.now())}]</span>
                    <span>No system events captured yet.</span>
                  </li>
                ) : (
                  filteredSystemLogEntries.map((entry) => (
                    <li key={entry.id} className={`admin-system-log-line admin-system-log-line--${entry.level || 'info'}`}>
                      <span className="admin-system-log-time">[{formatLogClock(entry.createdAt)}]</span>
                      <span className="admin-system-log-meta">{entry.actor || 'system'} · {formatActionLabel(entry.actionType || entry.source)}</span>
                      <span>{entry.message}</span>
                    </li>
                  ))
                )}
              </ul>
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
              <div className="admin-posts-header-controls">
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
                  className="button ghost admin-control-button"
                  onClick={() => {
                    closeMenus();
                    setShowDeletedPosts((value) => !value);
                  }}
                  title="Toggle deleted items visibility"
                >
                  {showDeletedPosts ? 'Hide deleted' : 'Show deleted'}
                </button>
                <button
                  type="button"
                  className="button ghost admin-control-button"
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
                  {filteredPosts.map((post) => {
                    const key = postKey(post);
                    const menuOpen = openPostMenu?.id === key;
                    return (
                    <tr key={key} className={post.isDeleted ? 'admin-row--deleted' : ''}>
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
                        <details
                          className={['admin-actions-menu', menuOpen && openPostMenu?.openUp ? 'admin-actions-menu--up' : ''].filter(Boolean).join(' ')}
                          open={menuOpen}
                        >
                          <summary
                            className="button ghost mini"
                            title="Post actions"
                            onClick={(event) => {
                              event.preventDefault();
                              togglePostMenu(key, event.currentTarget);
                            }}
                          >
                            Actions ▾
                          </summary>
                          <div className="admin-actions-menu-list">
                            {!post.isDeleted ? (
                              <>
                                <button
                                  type="button"
                                  className="admin-action-item"
                                  onClick={() => {
                                    closeMenus();
                                    handleTogglePin(post);
                                  }}
                                  disabled={busyPost === key}
                                  title="Pin or unpin this post"
                                >
                                  {post.isPinned ? 'Unpin' : 'Pin'}
                                </button>
                                <button
                                  type="button"
                                  className="admin-action-item"
                                  onClick={() => {
                                    closeMenus();
                                    handleToggleHidden(post);
                                  }}
                                  disabled={busyPost === key}
                                  title="Hide or show this post"
                                >
                                  {post.isHidden ? 'Show' : 'Hide'}
                                </button>
                                <button
                                  type="button"
                                  className="admin-action-item"
                                  onClick={() => {
                                    closeMenus();
                                    handleToggleLock(post);
                                  }}
                                  disabled={busyPost === key}
                                  title="Lock or unlock comments"
                                >
                                  {post.isLocked ? 'Unlock' : 'Lock'}
                                </button>
                                <button
                                  type="button"
                                  className="admin-action-item"
                                  onClick={() => {
                                    closeMenus();
                                    setDrawerPost(post);
                                  }}
                                  disabled={!post.editHref}
                                  title="Edit this post"
                                >
                                  Edit
                                </button>
                              </>
                            ) : null}
                            {!post.isDeleted ? (
                              <button
                                type="button"
                                className="admin-action-item"
                                onClick={() => {
                                  closeMenus();
                                  openMoveDialog(post);
                                }}
                                title="Move this post to another section"
                              >
                                Move section
                              </button>
                            ) : null}
                            {post.deleteHref && !post.isDeleted ? (
                              <button
                                type="button"
                                className="admin-action-item"
                                onClick={() => {
                                  closeMenus();
                                  handleDeletePost(post);
                                }}
                                disabled={busyPost === key}
                                title="Soft delete this post"
                              >
                                Delete
                              </button>
                            ) : null}
                            {post.isDeleted ? (
                              <button
                                type="button"
                                className="admin-action-item"
                                onClick={() => {
                                  closeMenus();
                                  handleRestorePost(post);
                                }}
                                disabled={busyPost === key}
                                title="Restore this post"
                              >
                                Restore
                              </button>
                            ) : null}
                            <a
                              className="button mini ghost admin-action-item"
                              href={post.viewHref || `/lobby/${post.id}`}
                              target="_blank"
                              rel="noreferrer"
                              title="View post in new tab"
                              onClick={closeMenus}
                            >
                              View
                            </a>
                          </div>
                        </details>
                      </td>
                    </tr>
                    );
                  })}
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
              <div className="admin-posts-header-controls">
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
                  className="button ghost admin-control-button"
                  onClick={() => {
                    closeMenus();
                    setShowDeletedUsers((value) => !value);
                  }}
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
                    <tr key={userKey(member)} className={member.isDeleted ? 'admin-row--deleted' : ''}>
                      <td>
                        <strong>{member.username}</strong>
                        {member.isDeleted ? <div className="muted" style={{ fontSize: '12px' }}>Deleted</div> : null}
                      </td>
                      <td>{roleDisplayLabel(member.role)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatTime(member.createdAt)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatTime(member.lastSeen)}</td>
                      <td>{member.postsCount ?? 0}</td>
                      <td>{member.commentsCount ?? 0}</td>
                      <td>
                        <details
                          className={['admin-actions-menu', openUserMenu?.id === userKey(member) && openUserMenu?.openUp ? 'admin-actions-menu--up' : ''].filter(Boolean).join(' ')}
                          open={openUserMenu?.id === userKey(member)}
                        >
                          <summary
                            className="button ghost mini"
                            title="User actions"
                            onClick={(event) => {
                              event.preventDefault();
                              toggleUserMenu(userKey(member), event.currentTarget);
                            }}
                          >
                            Actions ▾
                          </summary>
                          <div className="admin-actions-menu-list">
                            <a
                              className="button mini ghost admin-action-item"
                              href={`/profile/${member.username}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Open public profile"
                              onClick={closeMenus}
                            >
                              View profile
                            </a>
                            <button
                              type="button"
                              className="admin-action-item"
                              onClick={() => {
                                closeMenus();
                                setDrawerUser(member);
                              }}
                              title="Open user details drawer"
                            >
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
                                <option value="user">Driplet</option>
                                <option value="drip_nomad">Drip Nomad</option>
                                <option value="mod">Mod</option>
                                <option value="admin">Admin</option>
                              </select>
                            </label>
                            <button
                              type="button"
                              className="admin-action-item"
                              onClick={() => {
                                closeMenus();
                                handleDeleteUser(member);
                              }}
                              disabled={member.isDeleted}
                              title="Anonymize and delete this account"
                            >
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
              <p className="muted">Browse recent uploads, then jump to source content to edit or moderate.</p>
              {Array.isArray(media?.recent) && media.recent.length > 0 ? (
                <div className="admin-media-grid">
                  {media.recent.map((item) => (
                    <article key={item.key} className="admin-media-card">
                      <a href={mediaPreviewUrl(item.imageKey)} target="_blank" rel="noreferrer" title="Open image in new tab">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mediaPreviewUrl(item.imageKey)}
                          alt={item.title || item.label || 'Uploaded media'}
                          width={640}
                          height={360}
                          loading="lazy"
                          decoding="async"
                        />
                      </a>
                      <div className="admin-media-card-body">
                        <strong>{item.title || item.label || 'Untitled media'}</strong>
                        <div className="muted" style={{ fontSize: '12px' }}>
                          {item.label || item.type} · {item.authorName || 'unknown'} · {formatTime(item.createdAt)}
                        </div>
                        <div className="admin-media-card-actions">
                          <a className="button mini ghost" href={mediaPreviewUrl(item.imageKey)} target="_blank" rel="noreferrer">
                            View image
                          </a>
                          {item.viewHref ? (
                            <a className="button mini ghost" href={item.viewHref} target="_blank" rel="noreferrer">
                              Open source
                            </a>
                          ) : null}
                          {item.editHref ? (
                            <a className="button mini ghost" href={item.editHref} target="_blank" rel="noreferrer">
                              Edit source
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted">No recent uploads found yet.</p>
              )}
              <a className="action-button" href="/admin/moderation">Open moderation tools</a>
            </div>
          </section>
        )}

        {activeTab === 'Settings' && (
          <section className="card stack admin-settings-panel">
            <h3 className="section-title">Settings</h3>
            <p className="muted">Global toggles for admin workflows.</p>
            <div className="admin-settings-grid">
              <div className="admin-settings-row">
                <div className="admin-settings-copy">
                  <strong>Image uploads</strong>
                  <p className="muted">Currently {imageUploadsEnabled ? 'enabled' : 'disabled'}. Saves immediately and confirms in notice bar.</p>
                </div>
                <div className="admin-settings-actions">
                  <button type="button" className="button mini" onClick={handleToggleImageUploads} disabled={settingsBusy}>
                    {settingsBusy ? 'Saving...' : (imageUploadsEnabled ? 'Disable uploads' : 'Enable uploads')}
                  </button>
                </div>
              </div>
              <div className="admin-settings-row">
                <div className="admin-settings-copy">
                  <strong>Navigation tip broadcast</strong>
                  <p className="muted">Sends one-time guidance for notifications and account/admin links in the header menu.</p>
                </div>
                <div className="admin-settings-actions">
                  <button
                    type="button"
                    className="button mini"
                    onClick={handleSendNavigationTip}
                    disabled={notificationBroadcastBusy}
                    title="Send one-time navigation guidance notification to all users"
                  >
                    {notificationBroadcastBusy ? 'Sending...' : 'Send tip'}
                  </button>
                </div>
              </div>
              <div className={`admin-settings-composer ${broadcastComposerOpen ? 'admin-settings-composer--open' : ''}`}>
                <div className="admin-settings-row">
                  <div className="admin-settings-copy">
                    <strong>Custom broadcast</strong>
                    <p className="muted">Open the composer to draft and send a site-wide in-app notification.</p>
                  </div>
                  <div className="admin-settings-actions">
                    <button
                      type="button"
                      className="button mini ghost"
                      onClick={() => setBroadcastComposerOpen((open) => !open)}
                      disabled={broadcastSendBusy}
                      title="Open composer to send a custom in-app notification to all users"
                    >
                      {broadcastComposerOpen ? 'Collapse' : 'Compose'}
                    </button>
                  </div>
                </div>
                {broadcastComposerOpen ? (
                  <div className="admin-settings-composer-body">
                    <label>
                      <div className="muted">Message</div>
                      <textarea
                        value={broadcastMessageDraft}
                        onChange={(event) => setBroadcastMessageDraft(event.target.value)}
                        rows={4}
                        maxLength={280}
                        placeholder="Example: Notifications are now in the Messages icon in the top right. Use the three-dot menu for Account, Profile, and Admin."
                        style={{ resize: 'vertical' }}
                      />
                    </label>
                    <div className="admin-settings-composer-footer">
                      <span className="muted">{broadcastMessageDraft.trim().length}/280</span>
                      <div className="admin-settings-actions">
                        <button
                          type="button"
                          className="button mini"
                          onClick={handleSendCustomBroadcast}
                          disabled={!broadcastMessageDraft.trim() || broadcastSendBusy}
                        >
                          {broadcastSendBusy ? 'Sending...' : 'Send broadcast'}
                        </button>
                        <button
                          type="button"
                          className="button mini ghost"
                          onClick={() => setBroadcastComposerOpen(false)}
                          disabled={broadcastSendBusy}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            {notificationBroadcastMessage ? <div className="notice">{notificationBroadcastMessage}</div> : null}
          </section>
        )}

        {activeTab !== 'Overview' && activeTab !== 'System Log' && activeTab !== 'Posts' && activeTab !== 'Users' && activeTab !== 'Reports' && activeTab !== 'Media' && activeTab !== 'Settings' && (
          <section className="card">
            <h3 className="section-title">{activeTab} tab</h3>
            <p className="muted">This section is coming soon.</p>
          </section>
        )}
      </div>

      {drawerPost ? (
        <CreatePostModal
          isOpen={Boolean(drawerPost)}
          onClose={() => setDrawerPost(null)}
          title="Edit post"
          className="admin-drawer"
          maxWidth="420px"
          confirmOnUnsavedChanges
        >
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
                    <div className="muted">Starts at (forum time)</div>
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
        </CreatePostModal>
      ) : null}

      {drawerUser ? (
        <CreatePostModal
          isOpen={Boolean(drawerUser)}
          onClose={() => setDrawerUser(null)}
          title="User details"
          className="admin-drawer"
          maxWidth="420px"
          confirmOnUnsavedChanges={false}
        >
          <div className="stack" style={{ gap: '10px' }}>
            <div>
              <div className="muted">Username</div>
              <strong>{drawerUser.username}</strong>
            </div>
            <div>
              <div className="muted">Role</div>
              <strong>{roleDisplayLabel(drawerUser.role)}</strong>
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
        </CreatePostModal>
      ) : null}

      {movePost ? (
        <CreatePostModal
          isOpen={Boolean(movePost)}
          onClose={() => {
            if (!moveBusy) closeMoveDialog();
          }}
          title="Move post"
          className="admin-drawer"
          maxWidth="420px"
          confirmOnUnsavedChanges
        >
          <div className="stack admin-move-stack">
            <p className="muted">
              Moving <strong>{movePost.title}</strong> from <strong>{movePost.sectionLabel}</strong>.
            </p>
            <label>
              <div className="muted">Destination</div>
              <select
                value={moveDestination}
                onChange={(e) => setMoveDestination(e.target.value)}
                disabled={moveBusy}
              >
                {movePost.type === 'post'
                  ? POST_SECTION_DESTINATIONS
                      .filter((option) => option.value !== movePost.subtype)
                      .map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))
                  : CONTENT_MOVE_DESTINATIONS
                      .filter((option) => option.value !== currentMoveDestination(movePost))
                      .map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
              </select>
            </label>
            {movePost.type !== 'post' && moveDestination === 'event' ? (
              <label>
                <div className="muted">Event start (forum time)</div>
                <input
                  type="datetime-local"
                  value={moveStartsAt}
                  onChange={(e) => setMoveStartsAt(e.target.value)}
                  required
                  disabled={moveBusy}
                />
              </label>
            ) : null}
            {movePost.type !== 'post' && moveDestination === 'music_post' ? (
              <>
                <label>
                  <div className="muted">Music URL</div>
                  <input
                    type="url"
                    value={moveMusicUrl}
                    onChange={(e) => setMoveMusicUrl(e.target.value)}
                    placeholder="https://..."
                    disabled={moveBusy}
                  />
                </label>
                <label>
                  <div className="muted">Music type</div>
                  <input
                    type="text"
                    value={moveMusicType}
                    onChange={(e) => setMoveMusicType(e.target.value)}
                    placeholder="song, album, mix..."
                    disabled={moveBusy}
                  />
                </label>
                <label>
                  <div className="muted">Tags (optional)</div>
                  <input
                    type="text"
                    value={moveMusicTags}
                    onChange={(e) => setMoveMusicTags(e.target.value)}
                    placeholder="lofi, ambient"
                    disabled={moveBusy}
                  />
                </label>
              </>
            ) : null}
            {movePost.type !== 'post' && moveDestination === 'project' ? (
              <label>
                <div className="muted">Project status</div>
                <select
                  value={moveProjectStatus}
                  onChange={(e) => setMoveProjectStatus(e.target.value)}
                  disabled={moveBusy}
                >
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            ) : null}
            <div className="admin-drawer-actions">
              <button type="button" onClick={handleMovePost} disabled={moveBusy || !moveDestination}>
                {moveBusy ? 'Moving...' : 'Move now'}
              </button>
              <button type="button" className="button ghost" onClick={closeMoveDialog} disabled={moveBusy}>
                Cancel
              </button>
            </div>
            <p className="muted admin-move-help">
              {movePost.type === 'post'
                ? 'This keeps the same post and updates its section.'
                : 'This creates destination content, migrates discussion, and marks the source as moved.'}
            </p>
          </div>
        </CreatePostModal>
      ) : null}

    </div>
  );
}
