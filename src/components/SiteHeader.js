'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import NavLinks from './NavLinks';
import HeaderSetupBanner from './HeaderSetupBanner';
import ForumLogo from './ForumLogo';
import AvatarImage from './AvatarImage';
import NotificationsMenu from './NotificationsMenu';
import { useUiPrefs } from './UiPrefsProvider';
import { getForumStrings } from '../lib/forum-texts';

const EXTERNAL_PORTAL_URL = 'https://errl.wtf';

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
  const [searchValue, setSearchValue] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [kebabOpen, setKebabOpen] = useState(false);
  const [libraryStyle, setLibraryStyle] = useState({});

  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyUnreadCount, setNotifyUnreadCount] = useState(0);
  const [notifyItems, setNotifyItems] = useState([]);
  const [notifyStatus, setNotifyStatus] = useState('idle');

  const libraryAnchorRef = useRef(null);
  const libraryMenuRef = useRef(null);
  const searchModalRef = useRef(null);
  const avatarRef = useRef(null);
  const avatarMenuRef = useRef(null);
  const kebabRef = useRef(null);
  const kebabMenuRef = useRef(null);
  const notificationRef = useRef(null);

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
    setSearchOpen(false);
    setAvatarOpen(false);
    setKebabOpen(false);
    setNotifyOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;

      if (libraryOpen) {
        const inTrigger = libraryAnchorRef.current?.contains(target);
        const inMenu = libraryMenuRef.current?.contains(target);
        if (!inTrigger && !inMenu) setLibraryOpen(false);
      }

      if (avatarOpen) {
        const inTrigger = avatarRef.current?.contains(target);
        const inMenu = avatarMenuRef.current?.contains(target);
        if (!inTrigger && !inMenu) setAvatarOpen(false);
      }

      if (kebabOpen) {
        const inTrigger = kebabRef.current?.contains(target);
        const inMenu = kebabMenuRef.current?.contains(target);
        if (!inTrigger && !inMenu) setKebabOpen(false);
      }

      if (notifyOpen) {
        const inTrigger = notificationRef.current?.contains(target);
        const inMenu = document.querySelector('.notifications-popover');
        if (!inTrigger && !inMenu?.contains(target)) setNotifyOpen(false);
      }

      if (searchOpen) {
        const inModal = searchModalRef.current?.contains(target);
        if (!inModal) setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [libraryOpen, avatarOpen, kebabOpen, notifyOpen, searchOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setLibraryOpen(false);
      setAvatarOpen(false);
      setKebabOpen(false);
      setNotifyOpen(false);
      setSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!libraryOpen || typeof window === 'undefined' || !libraryAnchorRef.current) return undefined;

    const updatePosition = () => {
      const rect = libraryAnchorRef.current.getBoundingClientRect();
      const maxWidth = Math.min(420, window.innerWidth - 24);
      let left = rect.left;
      if (left + maxWidth > window.innerWidth - 12) {
        left = window.innerWidth - maxWidth - 12;
      }
      if (left < 12) left = 12;
      setLibraryStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left,
        width: maxWidth,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [libraryOpen]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (navDisabled) return;
    const trimmed = searchValue.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    setSearchValue('');
    setSearchOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      // ignore
    }
    if (typeof window !== 'undefined') {
      window.location.href = 'https://forum.errl.wtf';
    }
  };

  const notificationLabel = useMemo(() => {
    if (notifyUnreadCount > 0) return `Notifications (${notifyUnreadCount})`;
    return 'Notifications';
  }, [notifyUnreadCount]);

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
        <div className="header-left">
          <div className="header-brand">
            <ForumLogo variant="nav" href="/" showText={false} />
            <div className="header-brand-text">
              <span className="header-brand-title">Errl Forum</span>
              <span className="header-brand-subtitle">{subtitle}</span>
            </div>
            <a
              className="header-url-link"
              href={EXTERNAL_PORTAL_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Visit Errl portal"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 13a5 5 0 0 1 0-7l2-2a5 5 0 0 1 7 7l-1 1" />
                <path d="M14 11a5 5 0 0 1 0 7l-2 2a5 5 0 0 1-7-7l1-1" />
              </svg>
              <span>errl.wtf</span>
            </a>
          </div>
        </div>

        <div className="header-center">
          <nav className="header-nav" aria-label="Primary">
            <Link
              href="/"
              className={`nav-pill ${isActivePath(pathname, '/') ? 'is-active' : ''}`}
              aria-current={isActivePath(pathname, '/') ? 'page' : undefined}
            >
              Home
            </Link>
            <Link
              href="/feed"
              className={`nav-pill ${isActivePath(pathname, '/feed') ? 'is-active' : ''}`}
              aria-current={isActivePath(pathname, '/feed') ? 'page' : undefined}
            >
              Feed
            </Link>
            <div className="header-library">
              <button
                type="button"
                className={`nav-pill nav-pill-button ${libraryOpen ? 'is-active' : ''}`}
                onClick={(event) => {
                  if (navDisabled) return;
                  libraryAnchorRef.current = event.currentTarget;
                  setLibraryOpen((current) => !current);
                }}
                aria-expanded={libraryOpen ? 'true' : 'false'}
                aria-haspopup="true"
                disabled={navDisabled}
              >
                Library
                <span aria-hidden="true" className="nav-pill-caret">▾</span>
              </button>
              {libraryOpen ? (
                <div className="header-library-menu" ref={libraryMenuRef} role="menu" style={libraryStyle}>
                  <NavLinks
                    isAdmin={isAdmin}
                    isSignedIn={isSignedIn}
                    variant="all"
                    onNavigate={() => setLibraryOpen(false)}
                  />
                </div>
              ) : null}
            </div>
          </nav>

          <form className="header-search-inline" onSubmit={handleSearchSubmit}>
            <svg className="header-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={strings.search.placeholder}
              className="header-search-inline-input"
              disabled={navDisabled}
              aria-label="Search"
            />
            <button type="submit" className="header-search-submit" disabled={navDisabled || !searchValue.trim()}>
              Search
            </button>
          </form>
        </div>

        <div className="header-right">
          <button
            type="button"
            className="header-icon-button header-icon-button--search"
            onClick={() => {
              if (navDisabled) return;
              setSearchOpen(true);
            }}
            aria-label="Open search"
            title="Search"
            disabled={navDisabled}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>

          <button
            type="button"
            className="header-icon-button header-icon-button--library"
            onClick={(event) => {
              if (navDisabled) return;
              libraryAnchorRef.current = event.currentTarget;
              setLibraryOpen((current) => !current);
            }}
            aria-label="Open library"
            title="Library"
            disabled={navDisabled}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M4 4.5A2.5 2.5 0 0 1 6.5 7H20"></path>
              <path d="M6.5 7H20v10H6.5A2.5 2.5 0 0 0 4 19.5V4.5A2.5 2.5 0 0 1 6.5 7Z"></path>
            </svg>
          </button>

          <div className="notifications-logo-trigger" ref={notificationRef}>
            <button
              type="button"
              className="header-icon-button"
              onClick={async () => {
                if (navDisabled) return;
                const next = !notifyOpen;
                setNotifyOpen(next);
                if (next) await refreshNotifications();
              }}
              aria-label={notificationLabel}
              title={notificationLabel}
              disabled={navDisabled}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {notifyUnreadCount > 0 ? (
                <span className="header-icon-badge">
                  {notifyUnreadCount > 99 ? '99+' : notifyUnreadCount}
                </span>
              ) : null}
            </button>
            <NotificationsMenu
              open={notifyOpen}
              onClose={() => setNotifyOpen(false)}
              unreadCount={notifyUnreadCount}
              items={notifyItems}
              status={notifyStatus}
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
                    setNotifyItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: Date.now() } : n)));
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
                    setNotifyItems((prev) => prev.map((n) => ({ ...n, read_at: Date.now() })));
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
                  const payload = await res.json();
                  if (res.ok) {
                    setNotifyUnreadCount(0);
                    setNotifyItems([]);
                  }
                } catch (e) {
                  // ignore
                }
              }}
              anchor="right"
            />
          </div>

          <button
            type="button"
            className="header-icon-button"
            onClick={() => {
              if (navDisabled) return;
              router.push('/messages');
            }}
            aria-label="Messages"
            title="Messages"
            disabled={navDisabled}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>

          <div className="header-avatar" ref={avatarRef}>
            <button
              type="button"
              className="header-avatar-button"
              onClick={() => {
                if (navDisabled) return;
                setAvatarOpen((current) => !current);
              }}
              aria-label="Open profile menu"
              title="Profile"
              disabled={navDisabled}
            >
              {user?.avatar_key ? (
                <AvatarImage avatarKey={user.avatar_key} alt="" size={30} className="header-avatar-image" />
              ) : (
                <AvatarImage src="/icons/default-avatar.svg" alt="" size={30} className="header-avatar-image" />
              )}
              <span className="header-avatar-caret" aria-hidden="true">▾</span>
            </button>
            {avatarOpen ? (
              <div className="header-menu" ref={avatarMenuRef} role="menu">
                <button type="button" onClick={() => router.push('/account?tab=profile')}>Profile</button>
                <button type="button" onClick={() => router.push('/account?tab=account')}>Account</button>
                <button type="button" onClick={() => router.push('/account?tab=profile')}>Avatar &amp; Hair</button>
                {isAdmin ? (
                  <button type="button" onClick={() => router.push('/admin')}>Admin</button>
                ) : null}
                <button type="button" onClick={handleSignOut}>Sign out</button>
              </div>
            ) : null}
          </div>

          <div className="header-kebab" ref={kebabRef}>
            <button
              type="button"
              className="header-icon-button"
              onClick={() => {
                if (navDisabled) return;
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
                <button type="button" onClick={() => router.push('/account?tab=account')}>Account settings</button>
                <button type="button" onClick={() => router.push('/account?tab=profile')}>Profile settings</button>
                <button type="button" onClick={() => router.push('/account?tab=profile')}>Hair settings</button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      </header>

      {searchOpen ? (
        <div className="header-search-modal">
          <div className="header-search-modal-inner" ref={searchModalRef}>
            <div className="header-search-modal-title">Search</div>
            <form onSubmit={handleSearchSubmit} className="header-search-modal-form">
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={strings.search.placeholder}
                autoFocus
              />
              <button type="submit" disabled={!searchValue.trim()}>Search</button>
            </form>
            <button type="button" className="header-search-modal-close" onClick={() => setSearchOpen(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}

      <HeaderSetupBanner />
    </>
  );
}
