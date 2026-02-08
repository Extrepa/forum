'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import NavLinks from './NavLinks';
import NotificationsLogoTrigger from './NotificationsLogoTrigger';
import HeaderSetupBanner from './HeaderSetupBanner';

function isDetailPath(pathname) {
  if (!pathname) return false;
  return /^\/(announcements|lobby|projects|music|events|devlog)\/[^/]+$/.test(pathname);
}

function getTypeLabel(type) {
  const labels = {
    thread: 'Thread',
    announcement: 'Announcement',
    event: 'Event',
    music: 'Music',
    project: 'Project',
    reply: 'Reply',
    user: 'User',
    art: 'Art',
    bugs: 'Bug',
    rant: 'Rant',
    nostalgia: 'Nostalgia',
    lore: 'Lore',
    memories: 'Memory',
    about: 'About',
  };
  return labels[type] || type;
}

export default function SiteHeader({ subtitle, isAdmin, isSignedIn, user }) {
  const pathname = usePathname();
  const router = useRouter();
  const detail = isDetailPath(pathname);
  const navDisabled = !isSignedIn;

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuQuery, setMenuQuery] = useState('');
  const [menuResults, setMenuResults] = useState([]);
  const [menuSearching, setMenuSearching] = useState(false);
  const menuRef = useRef(null);
  const menuExpandedRef = useRef(null);
  const [titleClicked, setTitleClicked] = useState(false);
  const menuSearchTimeoutRef = useRef(null);
  const menuSearchInputRef = useRef(null);
  const logoWrapRef = useRef(null);
  const feedLinkRef = useRef(null);
  const [eggArmed, setEggArmed] = useState(false);
  const [eggActive, setEggActive] = useState(false);
  const [eggDragging, setEggDragging] = useState(false);
  const [dragPoint, setDragPoint] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragSize, setDragSize] = useState({ width: 0, height: 0 });
  const [dragLabel, setDragLabel] = useState('Feed');
  const [mounted, setMounted] = useState(false);
  const [eggIframeSrc, setEggIframeSrc] = useState('');
  const swipeStartRef = useRef(null);

  const clearSidebarSearch = useCallback(() => {
    setMenuQuery('');
    setMenuResults([]);
    setMenuSearching(false);
  }, []);

  const closeSidebar = useCallback(() => {
    setMenuOpen(false);
    clearSidebarSearch();
  }, [clearSidebarSearch]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEggIframeSrc(`${window.location.origin}/easter-eggs/errl-bubbles-header.html`);
    }
  }, [mounted]);

  useEffect(() => {
    setMenuOpen(false);
    clearSidebarSearch();
  }, [pathname, clearSidebarSearch]);

  useEffect(() => {
    if (navDisabled) {
      setMenuOpen(false);
      clearSidebarSearch();
    }
    if (!navDisabled) {
      setMenuOpen(false);
      setEggArmed(false);
      setEggActive(false);
      setEggDragging(false);
    }
  }, [navDisabled, clearSidebarSearch]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    if (menuOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }

    return undefined;
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeSidebar();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, closeSidebar]);

  useEffect(() => {
    if (!menuOpen || navDisabled) return;
    const timer = setTimeout(() => {
      menuSearchInputRef.current?.focus();
    }, 80);
    return () => clearTimeout(timer);
  }, [menuOpen, navDisabled]);

  useEffect(() => {
    if (typeof window === 'undefined' || navDisabled) return undefined;

    const isMobileViewport = () => window.matchMedia('(max-width: 1000px)').matches;

    const onTouchStart = (event) => {
      if (!isMobileViewport()) {
        swipeStartRef.current = null;
        return;
      }
      const touch = event.touches?.[0];
      if (!touch) return;

      if (!menuOpen && touch.clientX <= 26) {
        swipeStartRef.current = { x: touch.clientX, y: touch.clientY, canOpen: true, canClose: false };
        return;
      }

      if (menuOpen && touch.clientX <= 340) {
        swipeStartRef.current = { x: touch.clientX, y: touch.clientY, canOpen: false, canClose: true };
        return;
      }

      swipeStartRef.current = null;
    };

    const onTouchEnd = (event) => {
      const start = swipeStartRef.current;
      swipeStartRef.current = null;
      if (!start || !isMobileViewport()) return;

      const touch = event.changedTouches?.[0];
      if (!touch) return;

      const deltaX = touch.clientX - start.x;
      const deltaY = Math.abs(touch.clientY - start.y);
      if (deltaY > 64) return;

      if (start.canOpen && deltaX > 72) {
        setMenuOpen(true);
      }

      if (start.canClose && deltaX < -72) {
        closeSidebar();
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [menuOpen, navDisabled, closeSidebar]);

  useEffect(() => {
    const onDocMouseDown = (event) => {
      if (menuOpen) {
        const isInsideButton = menuRef.current && menuRef.current.contains(event.target);
        const isInsideMenu = menuExpandedRef.current && menuExpandedRef.current.contains(event.target);
        if (!isInsideButton && !isInsideMenu) {
          closeSidebar();
        }
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [menuOpen, closeSidebar]);

  const performSidebarSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setMenuResults([]);
      return;
    }

    setMenuSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      if (response.ok) {
        const data = await response.json();
        setMenuResults(data.results || []);
      } else {
        setMenuResults([]);
      }
    } catch (error) {
      console.error('Sidebar search error:', error);
      setMenuResults([]);
    } finally {
      setMenuSearching(false);
    }
  }, []);

  useEffect(() => {
    if (menuSearchTimeoutRef.current) {
      clearTimeout(menuSearchTimeoutRef.current);
    }

    if (!menuOpen || navDisabled || !menuQuery.trim()) {
      setMenuResults([]);
      setMenuSearching(false);
      return undefined;
    }

    menuSearchTimeoutRef.current = setTimeout(() => {
      performSidebarSearch(menuQuery);
    }, 250);

    return () => {
      if (menuSearchTimeoutRef.current) {
        clearTimeout(menuSearchTimeoutRef.current);
      }
    };
  }, [menuQuery, menuOpen, navDisabled, performSidebarSearch]);

  const handleSidebarSearchSubmit = (event) => {
    event.preventDefault();
    if (navDisabled || !menuQuery.trim()) {
      return;
    }
    router.push(`/search?q=${encodeURIComponent(menuQuery.trim())}`);
    closeSidebar();
  };

  const handleSidebarResultClick = (url) => {
    router.push(url);
    closeSidebar();
  };

  const handleEggArm = useCallback(
    (event) => {
      if (!navDisabled || eggActive) return;
      event.preventDefault();
      event.stopPropagation();
      setEggArmed(true);
    },
    [navDisabled, eggActive]
  );

  const handleEggDragStart = useCallback(
    (event) => {
      if (!navDisabled || !eggArmed || eggActive) return;
      if (event.button !== undefined && event.button !== 0) return;

      const target = event.currentTarget;
      const rect = target.getBoundingClientRect();

      const label = target.textContent?.trim();
      if (label) setDragLabel(label);

      event.preventDefault();
      event.stopPropagation();

      if (event.target.setPointerCapture) {
        event.target.setPointerCapture(event.pointerId);
      }

      setDragSize({ width: rect.width, height: rect.height });
      setDragOffset({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      setDragPoint({ x: event.clientX, y: event.clientY });
      setEggDragging(true);
    },
    [navDisabled, eggArmed, eggActive]
  );

  useEffect(() => {
    if (!eggDragging) return;

    const prevTouchAction = document.body.style.touchAction;
    document.body.style.touchAction = 'none';

    const handleMove = (event) => {
      setDragPoint({ x: event.clientX, y: event.clientY });
    };

    const handleUp = (event) => {
      document.body.style.touchAction = prevTouchAction;
      setEggDragging(false);
      const logoRect = logoWrapRef.current?.getBoundingClientRect();
      if (!logoRect) return;
      const hit =
        event.clientX >= logoRect.left &&
        event.clientX <= logoRect.right &&
        event.clientY >= logoRect.top &&
        event.clientY <= logoRect.bottom;
      if (hit) {
        setEggActive(true);
        setEggArmed(false);
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      document.body.style.touchAction = prevTouchAction;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [eggDragging]);

  const headerClassName = useMemo(() => {
    const bits = [];
    if (detail) bits.push('header--detail');
    if (menuOpen) bits.push('header--menu-open');
    if (eggActive) bits.push('header--easter-egg');
    return bits.join(' ');
  }, [detail, menuOpen, eggActive]);

  return (
    <header className={headerClassName}>
      {!eggActive && (
        <div className="brand">
          <div className="brand-left">
            <div>
              <h1
                className="forum-title"
                onClick={() => {
                  if (navDisabled) return;
                  setTitleClicked(true);
                  setTimeout(() => {
                    router.push('/');
                    setTitleClicked(false);
                  }, 300);
                }}
                style={{
                  animation: titleClicked ? 'gooey-click 0.3s ease' : undefined,
                  cursor: navDisabled ? 'default' : 'pointer'
                }}
              >
                Errl Forum
              </h1>
              <p className="forum-description">{subtitle}</p>
            </div>
          </div>
          <div ref={logoWrapRef} className="header-errl-logo-wrap">
            <NotificationsLogoTrigger enabled={!navDisabled} user={user} />
          </div>
        </div>
      )}

      {!eggActive && (
        <div className="header-bottom-controls">
          <div className="header-bottom-left" ref={menuRef}>
            {!navDisabled ? (
              <button
                type="button"
                className="nav-menu-button"
                onClick={() => {
                  setMenuOpen((current) => {
                    if (current) {
                      clearSidebarSearch();
                    }
                    return !current;
                  });
                }}
                aria-label="Open navigation menu"
                aria-expanded={menuOpen ? 'true' : 'false'}
              >
                Navigation
              </button>
            ) : (
              <button
                type="button"
                className={`feed-egg-trigger ${eggArmed ? 'feed-egg-trigger--armed' : ''} ${eggDragging ? 'feed-egg-trigger--hidden' : ''}`}
                ref={feedLinkRef}
                onDoubleClick={handleEggArm}
                onPointerDown={handleEggDragStart}
                onClick={(event) => event.preventDefault()}
                aria-label="Feed easter egg trigger"
                title="Double-click to arm, then drag to the face"
              >
                Feed
              </button>
            )}
          </div>
        </div>
      )}

      {mounted && eggDragging ? createPortal(
        <div
          className="nav-egg-drag-ghost"
          style={{
            width: dragSize.width,
            height: dragSize.height,
            left: dragPoint.x - dragOffset.x,
            top: dragPoint.y - dragOffset.y
          }}
        >
          {dragLabel}
        </div>,
        document.body
      ) : null}

      {mounted && eggActive && eggIframeSrc ? (
        <div className="header-easter-egg-overlay" aria-hidden="true" suppressHydrationWarning>
          <iframe
            key="egg-active"
            className="header-easter-egg-iframe"
            title="Errl's Bubble Blitz"
            src={eggIframeSrc}
          />
        </div>
      ) : null}

      {mounted && !eggActive && !navDisabled
        ? createPortal(
            <>
              {!menuOpen ? (
                <button
                  type="button"
                  className="nav-neon-handle"
                  onClick={() => setMenuOpen(true)}
                  aria-label="Open navigation sidebar"
                >
                  <span>NAV</span>
                </button>
              ) : null}

              <button
                type="button"
                className={`nav-sidebar-backdrop ${menuOpen ? 'is-open' : ''}`}
                aria-label="Close navigation sidebar"
                onClick={closeSidebar}
              />

              <aside
                ref={menuExpandedRef}
                className={`nav-sidebar ${menuOpen ? 'is-open' : ''}`}
                aria-hidden={menuOpen ? 'false' : 'true'}
                aria-label="Site navigation sidebar"
              >
                <div className="nav-sidebar-header">
                  <h2 className="nav-sidebar-title">Menu</h2>
                  <button
                    type="button"
                    className="nav-sidebar-close"
                    onClick={closeSidebar}
                    aria-label="Close navigation sidebar"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>

                <form className="nav-sidebar-search-wrap" onSubmit={handleSidebarSearchSubmit}>
                  <svg className="nav-sidebar-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    ref={menuSearchInputRef}
                    type="text"
                    className="nav-sidebar-search-input"
                    value={menuQuery}
                    onChange={(event) => setMenuQuery(event.target.value)}
                    placeholder="Search posts, users, threads, events..."
                  />
                </form>

                {menuQuery.trim() ? (
                  <section className="nav-sidebar-results" aria-label="Search results">
                    <div className="nav-sidebar-results-heading">
                      {menuSearching
                        ? 'Searching...'
                        : `${menuResults.length} result${menuResults.length === 1 ? '' : 's'}`}
                    </div>
                    {!menuSearching && menuResults.length === 0 ? (
                      <p className="nav-sidebar-results-empty">No matches yet.</p>
                    ) : null}
                    {menuResults.slice(0, 8).map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        type="button"
                        className="nav-sidebar-result-item"
                        onClick={() => handleSidebarResultClick(result.url)}
                      >
                        <span className="nav-sidebar-result-title">
                          {result.title || result.thread_title || result.author_name || 'Untitled'}
                        </span>
                        <span className="nav-sidebar-result-meta">{getTypeLabel(result.type)}</span>
                      </button>
                    ))}
                    {!menuSearching && menuResults.length > 0 ? (
                      <a
                        href={`/search?q=${encodeURIComponent(menuQuery.trim())}`}
                        className="nav-sidebar-results-more"
                        onClick={() => closeSidebar()}
                      >
                        View full search results
                      </a>
                    ) : null}
                  </section>
                ) : null}

                <nav className="nav-sidebar-links">
                  <NavLinks
                    isAdmin={isAdmin}
                    isSignedIn={isSignedIn}
                    variant="all"
                    filterQuery={menuQuery}
                    onNavigate={() => {
                      closeSidebar();
                    }}
                    easterEgg={{
                      armed: eggArmed,
                      dragging: eggDragging,
                      feedRef: feedLinkRef,
                      onArm: handleEggArm,
                      onDragStart: handleEggDragStart
                    }}
                  />
                </nav>
              </aside>
            </>,
            document.body
          )
        : null}

      {!eggActive && <HeaderSetupBanner />}
    </header>
  );
}
