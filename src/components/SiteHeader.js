'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import NavLinks from './NavLinks';
import NotificationsLogoTrigger from './NotificationsLogoTrigger';
import HeaderSetupBanner from './HeaderSetupBanner';
import SearchResultsPopover from './SearchResultsPopover';
import { useUiPrefs } from './UiPrefsProvider';
import { getForumStrings } from '../lib/forum-texts';

function isDetailPath(pathname) {
  if (!pathname) return false;
  return /^\/(announcements|lobby|projects|music|events|devlog)\/[^/]+$/.test(pathname);
}

export default function SiteHeader({ subtitle, isAdmin, isSignedIn, user }) {
  const pathname = usePathname();
  const router = useRouter();
  const detail = isDetailPath(pathname);
  const navDisabled = !isSignedIn;
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuQuery, setMenuQuery] = useState('');
  const menuRef = useRef(null);
  const menuExpandedRef = useRef(null);
  const [titleClicked, setTitleClicked] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);
  const searchFormRef = useRef(null);
  const searchTimeoutRef = useRef(null);
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
    setMenuQuery('');
    setSearchMode(false);
    setSearchQuery('');
    setSearchResults([]);
  }, [pathname]);

  useEffect(() => {
    if (navDisabled) {
      setMenuOpen(false);
      setMenuQuery('');
      setSearchMode(false);
      setSearchQuery('');
      setSearchResults([]);
    }
    if (!navDisabled) {
      setMenuOpen(false);
      setEggArmed(false);
      setEggActive(false);
      setEggDragging(false);
    }
  }, [navDisabled]);

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
        setMenuOpen(false);
        setMenuQuery('');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

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
        setMenuOpen(false);
        setMenuQuery('');
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [menuOpen, navDisabled]);

  useEffect(() => {
    const onDocMouseDown = (event) => {
      if (menuOpen) {
        const isInsideButton = menuRef.current && menuRef.current.contains(event.target);
        const isInsideMenu = menuExpandedRef.current && menuExpandedRef.current.contains(event.target);
        // Only close if click is outside both the button and the expanded menu
        if (!isInsideButton && !isInsideMenu) {
          setMenuOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [menuOpen]);

  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchMode && searchQuery) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchMode, performSearch]);

  const handleSearchClick = () => {
    if (navDisabled) {
      return;
    }
    setSearchMode(true);
    setMenuOpen(false);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleSearchClose = () => {
    setSearchMode(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (navDisabled) {
      return;
    }
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      handleSearchClose();
    }
  };

  const handleResultClick = (url) => {
    router.push(url);
    handleSearchClose();
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
      
      // Use currentTarget to get the element being interacted with, 
      // which is more reliable than the ref (especially if multiple NavLinks exist)
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
    if (searchMode) bits.push('header--search-open');
    if (eggActive) bits.push('header--easter-egg');
    return bits.join(' ');
  }, [detail, menuOpen, searchMode, eggActive]);

  return (
    <header
      className={headerClassName}
    >
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
            {searchMode ? (
              <form ref={searchFormRef} onSubmit={handleSearchSubmit} className="header-search-form-inline">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={strings.search.placeholder || "Search posts, threads, events..."}
                  className="header-search-input-inline"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSearchClose}
                  className="header-search-close"
                  aria-label="Close search"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m18 6-12 12"></path>
                    <path d="m6 6 12 12"></path>
                  </svg>
                </button>
              </form>
            ) : (
              <>
                {!navDisabled ? (
                  <button
                    type="button"
                    className="nav-menu-button"
                    onClick={() => {
                      setMenuOpen((v) => !v);
                      if (menuOpen) {
                        setMenuQuery('');
                      }
                      setSearchMode(false);
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
              </>
            )}
          </div>

          <div className="header-bottom-right">
            {!searchMode && !navDisabled && (
              <button
                type="button"
                onClick={handleSearchClick}
                className="header-search-toggle"
                aria-label="Search"
                title="Search"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {!eggActive && searchMode && searchResults.length > 0 && (
        <SearchResultsPopover
          results={searchResults}
          query={searchQuery}
          onClose={handleSearchClose}
          onResultClick={handleResultClick}
          excludeRef={searchFormRef}
        />
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
                onClick={() => {
                  setMenuOpen(false);
                  setMenuQuery('');
                }}
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
                    onClick={() => {
                      setMenuOpen(false);
                      setMenuQuery('');
                    }}
                    aria-label="Close navigation sidebar"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m18 6-12 12"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </button>
                </div>

                <div className="nav-sidebar-search-wrap">
                  <svg className="nav-sidebar-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    className="nav-sidebar-search-input"
                    value={menuQuery}
                    onChange={(event) => setMenuQuery(event.target.value)}
                    placeholder="Search navigation..."
                  />
                </div>

                <nav className="nav-sidebar-links">
                  <NavLinks
                    isAdmin={isAdmin}
                    isSignedIn={isSignedIn}
                    variant="all"
                    filterQuery={menuQuery}
                    onNavigate={() => {
                      setMenuOpen(false);
                      setMenuQuery('');
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
