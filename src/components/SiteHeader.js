'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import HeaderSetupBanner from './HeaderSetupBanner';
import ForumLogo from './ForumLogo';
import AvatarImage from './AvatarImage';
import NotificationsMenu from './NotificationsMenu';
import { useUiPrefs } from './UiPrefsProvider';
import { getForumStrings } from '../lib/forum-texts';

function isActivePath(pathname, href) {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export default function SiteHeader({ subtitle, isAdmin, isSignedIn, user }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });
  const navDisabled = !isSignedIn;

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryFilterOpen, setLibraryFilterOpen] = useState(false);
  const [librarySearchValue, setLibrarySearchValue] = useState('');
  const [kebabOpen, setKebabOpen] = useState(false);
  const [libraryStyle, setLibraryStyle] = useState({});

  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyUnreadCount, setNotifyUnreadCount] = useState(0);
  const [notifyItems, setNotifyItems] = useState([]);
  const [notifyStatus, setNotifyStatus] = useState('idle');
  const [signingOut, setSigningOut] = useState(false);
  const [guestFeedArmed, setGuestFeedArmed] = useState(false);
  const [guestFeedDragging, setGuestFeedDragging] = useState(false);
  const [guestFeedGhost, setGuestFeedGhost] = useState(null);
  const [headerEasterOpen, setHeaderEasterOpen] = useState(false);

  const libraryAnchorRef = useRef(null);
  const libraryMenuRef = useRef(null);
  const avatarRef = useRef(null);
  const kebabRef = useRef(null);
  const kebabMenuRef = useRef(null);
  const brandRef = useRef(null);
  const guestFeedArmTimerRef = useRef(null);

  const refreshNotifications = useCallback(async () => {
    if (navDisabled) return;
    setNotifyStatus('loading');
    try {
      const res = await fetch('/api/notifications', { method: 'GET' });
      const payload = await res.json();
      setNotifyUnreadCount(Number(payload.unreadCount || 0));
      setNotifyItems(Array.isArray(payload.items) ? payload.items : []);
      setNotifyStatus('idle');
    } catch (e) {
      setNotifyStatus('error');
    }
  }, [navDisabled]);

  useEffect(() => {
    if (navDisabled) return undefined;
    let mounted = true;
    const run = async () => {
      if (!mounted) return;
      await refreshNotifications();
    };
    run();
    const id = setInterval(run, 25000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [navDisabled, refreshNotifications]);

  useEffect(() => {
    setLibraryOpen(false);
    setLibraryFilterOpen(false);
    setLibrarySearchValue('');
    setKebabOpen(false);
    setNotifyOpen(false);
    setHeaderEasterOpen(false);
    setGuestFeedArmed(false);
    setGuestFeedDragging(false);
    setGuestFeedGhost(null);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;

      if (libraryOpen) {
        const inTrigger = libraryAnchorRef.current?.contains(target);
        const inMenu = libraryMenuRef.current?.contains(target);
        if (!inTrigger && !inMenu) setLibraryOpen(false);
      }

      if (kebabOpen) {
        const inTrigger = kebabRef.current?.contains(target);
        const inMenu = kebabMenuRef.current?.contains(target);
        if (!inTrigger && !inMenu) setKebabOpen(false);
      }

      if (notifyOpen) {
        const inTrigger = avatarRef.current?.contains(target);
        const inMenu = document.querySelector('.notifications-popover');
        if (!inTrigger && !inMenu?.contains(target)) setNotifyOpen(false);
      }

    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [libraryOpen, kebabOpen, notifyOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setLibraryOpen(false);
      setKebabOpen(false);
      setNotifyOpen(false);
      setGuestFeedArmed(false);
      setGuestFeedDragging(false);
      setGuestFeedGhost(null);
      setHeaderEasterOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!guestFeedDragging) return undefined;
    const handleMove = (event) => {
      setGuestFeedGhost({ x: event.clientX, y: event.clientY });
    };
    const handleUp = (event) => {
      const rect = brandRef.current?.getBoundingClientRect();
      const droppedOnMascot = !!rect
        && event.clientX >= rect.left
        && event.clientX <= rect.right
        && event.clientY >= rect.top
        && event.clientY <= rect.bottom;
      setGuestFeedDragging(false);
      setGuestFeedGhost(null);
      if (droppedOnMascot) {
        setHeaderEasterOpen(true);
      }
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp, { once: true });
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [guestFeedDragging]);

  useEffect(() => () => {
    if (guestFeedArmTimerRef.current) {
      clearTimeout(guestFeedArmTimerRef.current);
    }
  }, []);

  const libraryLinks = useMemo(() => ([
    { href: '/announcements', label: strings.tabs.announcements },
    { href: '/events', label: strings.tabs.events },
    { href: '/devlog', label: 'Development' },
    { href: '/lobby', label: 'General' },
    { href: '/music', label: strings.tabs.music },
    { href: '/projects', label: strings.tabs.projects },
    { href: '/shitposts', label: strings.tabs.shitposts },
    { href: '/art-nostalgia', label: 'Art & Nostalgia' },
    { href: '/bugs-rant', label: 'Bugs & Rants' },
    { href: '/lore-memories', label: 'Lore & Memories' },
  ]), [strings]);

  useEffect(() => {
    if (!libraryOpen || typeof window === 'undefined' || !libraryAnchorRef.current) return undefined;

    const updatePosition = () => {
      const rect = libraryAnchorRef.current.getBoundingClientRect();
      const edgePadding = window.innerWidth <= 640 ? 8 : 12;
      const widthSource = libraryLinks;
      const widestLabelLength = widthSource.reduce((max, item) => Math.max(max, item.label.length), 0);
      const estimatedMenuWidth = (widestLabelLength * 8) + (libraryFilterOpen ? 112 : 86);
      const menuWidth = Math.min(
        Math.max(208, estimatedMenuWidth),
        window.innerWidth - (edgePadding * 2)
      );
      let left = rect.left + (rect.width / 2) - (menuWidth / 2);
      if (left + menuWidth > window.innerWidth - edgePadding) {
        left = window.innerWidth - menuWidth - edgePadding;
      }
      if (left < edgePadding) left = edgePadding;
      const top = rect.bottom + 6;
      const maxHeight = Math.max(220, window.innerHeight - top - edgePadding);
      setLibraryStyle({
        position: 'fixed',
        top,
        left,
        width: menuWidth,
        maxHeight,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [libraryFilterOpen, libraryLinks, libraryOpen]);

  useEffect(() => {
    if (!libraryOpen) return undefined;
    const rafId = window.requestAnimationFrame(() => {
      const activeItem = libraryMenuRef.current?.querySelector('a.active');
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [libraryOpen, pathname]);

  const handleForumSearchSubmit = (event) => {
    event.preventDefault();
    if (navDisabled) return;
    const trimmed = librarySearchValue.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    setLibrarySearchValue('');
    setLibraryFilterOpen(false);
    setLibraryOpen(false);
  };

  const notificationLabel = useMemo(() => {
    if (notifyUnreadCount > 0) return `Notifications (${notifyUnreadCount})`;
    return 'Notifications';
  }, [notifyUnreadCount]);

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    setLibraryOpen(false);
    setNotifyOpen(false);
    setKebabOpen(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (_) {
      // Keep redirect flow even if logout request fails.
    }
    if (typeof window !== 'undefined') {
      window.location.href = 'https://forum.errl.wtf';
    }
  }, [signingOut]);

  return (
    <>
      <header className={`site-header ${isSignedIn ? '' : 'site-header--guest'} ${headerEasterOpen ? 'header--easter-egg' : ''}`.trim()}>
        <div className="site-header__inner">
        <div className="header-left">
          <Link href="/" className="header-brand" ref={brandRef} aria-label="Errl Forum Home">
            <ForumLogo variant="header" as="span" showText={false} interactive={false} />
            <div className="header-brand-text">
              <h1 className="forum-title forum-title--header">Errl Forum</h1>
              <span className="forum-description forum-description--header">{subtitle}</span>
            </div>
          </Link>
        </div>

        {isSignedIn ? (
          <div className="header-center">
            <nav className="header-nav" aria-label="Primary">
              <Link
                href="/?home=1"
                className={`header-nav-pill nav-pill-home ${isActivePath(pathname, '/') ? 'is-active' : ''}`}
                aria-current={isActivePath(pathname, '/') ? 'page' : undefined}
                title="Home"
                aria-label="Home"
              >
                <span className="header-nav-label">Home</span>
              </Link>
              <Link
                href="/feed"
                className={`header-nav-pill nav-pill-feed ${isActivePath(pathname, '/feed') ? 'is-active' : ''}`}
                aria-current={isActivePath(pathname, '/feed') ? 'page' : undefined}
                title="Feed"
                aria-label="Feed"
              >
                <span className="header-nav-label">Feed</span>
              </Link>
              <div className="header-library">
                <button
                  type="button"
                  className={`header-nav-pill nav-pill-button nav-pill-library ${libraryOpen ? 'is-active' : ''}`}
                  onClick={(event) => {
                    if (navDisabled) return;
                    libraryAnchorRef.current = event.currentTarget;
                    setNotifyOpen(false);
                    setKebabOpen(false);
                    setLibraryFilterOpen(false);
                    setLibrarySearchValue('');
                    setLibraryOpen((current) => !current);
                  }}
                  aria-expanded={libraryOpen ? 'true' : 'false'}
                  aria-haspopup="true"
                  disabled={navDisabled}
                  title="Library"
                  aria-label="Library"
                >
                  <span className="header-nav-label">Library</span>
                  <span aria-hidden="true" className="nav-pill-caret">▾</span>
                </button>
                {libraryOpen ? (
                  <div className="header-library-menu" ref={libraryMenuRef} role="menu" style={libraryStyle}>
                    <div className="header-library-head">
                      <span className="header-library-title">Library</span>
                      <button
                        type="button"
                        className={`header-library-search-toggle ${libraryFilterOpen ? 'is-active' : ''}`}
                        aria-label={libraryFilterOpen ? 'Hide forum search' : 'Search forum'}
                        title={libraryFilterOpen ? 'Hide search' : 'Search forum'}
                        onClick={() => {
                          setLibraryFilterOpen((current) => !current);
                          if (libraryFilterOpen) setLibrarySearchValue('');
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"></circle>
                          <path d="m21 21-4.35-4.35"></path>
                        </svg>
                      </button>
                    </div>
                    {libraryFilterOpen ? (
                      <form onSubmit={handleForumSearchSubmit} className="header-library-search-form">
                        <input
                          type="search"
                          value={librarySearchValue}
                          onChange={(event) => setLibrarySearchValue(event.target.value)}
                          placeholder="Search across the forum..."
                          className="header-library-filter"
                          autoFocus
                        />
                      </form>
                    ) : null}
                    <div className="header-library-list">
                      {libraryLinks.map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          className={isActivePath(pathname, item.href) ? 'active' : ''}
                          onClick={(event) => {
                            event.preventDefault();
                            if (navDisabled) return;
                            router.push(item.href);
                            setLibraryOpen(false);
                          }}
                        >
                          <span className="header-library-item-label">{item.label}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </nav>
          </div>
        ) : null}

        <div className="header-right">
          {isSignedIn ? (
            <div className="header-avatar" ref={avatarRef}>
              <button
                type="button"
                className="header-icon-button header-icon-button--notifications"
                onClick={async () => {
                  const next = !notifyOpen;
                  setLibraryOpen(false);
                  setNotifyOpen(next);
                  setKebabOpen(false);
                  if (next) await refreshNotifications();
                }}
                aria-label={notificationLabel}
                title={notificationLabel}
              >
                <span className="header-icon-glyph" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                </span>
                {notifyUnreadCount > 0 ? (
                  <span className="header-icon-badge" aria-hidden="true">
                    {notifyUnreadCount > 99 ? '99+' : notifyUnreadCount}
                  </span>
                ) : null}
              </button>
            </div>
          ) : (
            <div className="header-guest-actions">
              <button type="button" className="header-nav-pill header-guest-pill" aria-disabled="true" title="Home">
                <span className="header-nav-label">Home</span>
              </button>
              <button
                type="button"
                className={`header-nav-pill header-guest-pill header-guest-feed ${guestFeedArmed ? 'nav-link-egg-armed' : ''} ${guestFeedDragging ? 'nav-link-egg-hidden' : ''}`}
                aria-disabled="true"
                title="Feed"
                onDoubleClick={() => {
                  setGuestFeedArmed(true);
                  if (guestFeedArmTimerRef.current) clearTimeout(guestFeedArmTimerRef.current);
                  guestFeedArmTimerRef.current = setTimeout(() => {
                    setGuestFeedArmed(false);
                  }, 6000);
                }}
                onPointerDown={(event) => {
                  if (!guestFeedArmed) return;
                  event.preventDefault();
                  setGuestFeedDragging(true);
                  setGuestFeedGhost({ x: event.clientX, y: event.clientY });
                }}
              >
                <span className="header-nav-label">Feed</span>
              </button>
            </div>
          )}

          {isSignedIn ? (
            <div className="header-kebab" ref={kebabRef}>
            <button
              type="button"
              className="header-icon-button"
              onClick={() => {
                if (navDisabled) return;
                setLibraryOpen(false);
                setNotifyOpen(false);
                setKebabOpen((current) => !current);
              }}
              aria-label="More settings"
              title="More"
              disabled={navDisabled}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="12" cy="5" r="2"></circle>
                <circle cx="12" cy="12" r="2"></circle>
                <circle cx="12" cy="19" r="2"></circle>
              </svg>
            </button>
            {kebabOpen ? (
              <div className="header-menu" ref={kebabMenuRef} role="menu">
                <button type="button" onClick={() => router.push('/account?tab=account')}>Account</button>
                <button type="button" onClick={() => router.push('/account?tab=profile')}>Edit Profile</button>
                <button type="button" onClick={() => router.push(`/profile/${user?.username || user?.id}`)}>View Profile</button>
                <button type="button" onClick={() => router.push('/account?tab=profile&subtab=avatar')}>Edit Avatar</button>
                {isAdmin ? <button type="button" onClick={() => router.push('/admin')}>Admin</button> : null}
                <button type="button" onClick={handleSignOut} disabled={signingOut}>
                  {signingOut ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            ) : null}
            </div>
          ) : null}

          {isSignedIn ? (
            <NotificationsMenu
              open={notifyOpen}
              onClose={() => setNotifyOpen(false)}
              unreadCount={notifyUnreadCount}
              items={notifyItems}
              status={notifyStatus}
              user={user}
              onRefresh={refreshNotifications}
              onMarkRead={async (id) => {
                try {
                  const res = await fetch('/api/notifications/read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                  });
                  const payload = await res.json();
                  if (res.ok) {
                    setNotifyUnreadCount(Number(payload.unreadCount || 0));
                    setNotifyItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: true } : n)));
                  }
                } catch (e) {
                  // ignore
                }
              }}
              onMarkAllRead={async () => {
                try {
                  const res = await fetch('/api/notifications/read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ all: true })
                  });
                  const payload = await res.json();
                  if (res.ok) {
                    setNotifyUnreadCount(Number(payload.unreadCount || 0));
                    setNotifyItems((prev) => prev.map((n) => ({ ...n, read_at: true })));
                  }
                } catch (e) {
                  // ignore
                }
              }}
              onClearAll={async () => {
                try {
                  const res = await fetch('/api/notifications/clear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                  });
                  if (res.ok) {
                    setNotifyUnreadCount(0);
                    setNotifyItems([]);
                  }
                } catch (e) {
                  // ignore
                }
              }}
              anchor="right"
              anchorRef={avatarRef}
            />
          ) : null}
        </div>
      </div>
      {headerEasterOpen ? (
        <div className="header-easter-egg-overlay" role="dialog" aria-label="Header easter egg">
          <button
            type="button"
            className="header-easter-egg-close"
            onClick={() => setHeaderEasterOpen(false)}
          >
            Close
          </button>
          <iframe
            className="header-easter-egg-iframe"
            src="/easter-eggs/errl-bubbles-header.html"
            title="Header easter egg"
          />
        </div>
      ) : null}
      </header>

      <HeaderSetupBanner />
      {guestFeedDragging && guestFeedGhost ? (
        <div
          className="nav-egg-drag-ghost"
          style={{ transform: `translate(${guestFeedGhost.x - 40}px, ${guestFeedGhost.y - 22}px)` }}
        >
          Feed
        </div>
      ) : null}
    </>
  );
}
