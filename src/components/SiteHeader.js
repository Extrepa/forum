'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import NavLinks from './NavLinks';
import NotificationsLogoTrigger from './NotificationsLogoTrigger';
import HeaderSetupBanner from './HeaderSetupBanner';
import SearchResultsPopover from './SearchResultsPopover';
import SearchBar from './SearchBar';
import { useUiPrefs } from './UiPrefsProvider';
import { getForumStrings } from '../lib/forum-texts';

function isDetailPath(pathname) {
  if (!pathname) return false;
  return /^\/(announcements|lobby|projects|music|events|devlog)\/[^/]+$/.test(pathname);
}

export default function SiteHeader({ subtitle, isAdmin, isSignedIn }) {
  const pathname = usePathname();
  const router = useRouter();
  const detail = isDetailPath(pathname);
  const navDisabled = !isSignedIn;
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const menuExpandedRef = useRef(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreWrapRef = useRef(null);
  const moreNavRef = useRef(null);
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
  const [dragSize, setDragSize] = useState({ width: 0, height: 0 });
  const [dragLabel, setDragLabel] = useState('Feed');

  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
    setSearchMode(false);
    setSearchQuery('');
    setSearchResults([]);
  }, [pathname]);

  useEffect(() => {
    if (navDisabled) {
      setMenuOpen(false);
      setMoreOpen(false);
      setSearchMode(false);
      setSearchQuery('');
      setSearchResults([]);
    }
    if (!navDisabled) {
      setEggArmed(false);
      setEggActive(false);
      setEggDragging(false);
    }
  }, [navDisabled]);

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
      if (moreOpen && moreWrapRef.current && moreNavRef.current) {
        const isInsideToggle = moreWrapRef.current.contains(event.target);
        const isInsideNav = moreNavRef.current.contains(event.target);
        if (!isInsideToggle && !isInsideNav) {
          setMoreOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [menuOpen, moreOpen]);

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
      const rect = feedLinkRef.current?.getBoundingClientRect();
      if (!rect) return;
      const label = feedLinkRef.current?.textContent?.trim();
      if (label) setDragLabel(label);
      event.preventDefault();
      event.stopPropagation();
      setDragSize({ width: rect.width, height: rect.height });
      setDragPoint({ x: event.clientX, y: event.clientY });
      setEggDragging(true);
    },
    [navDisabled, eggArmed, eggActive]
  );

  useEffect(() => {
    if (!eggDragging) return;

    const handleMove = (event) => {
      setDragPoint({ x: event.clientX, y: event.clientY });
    };

    const handleUp = (event) => {
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
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [eggDragging]);

  const headerClassName = useMemo(() => {
    const bits = [];
    if (detail) bits.push('header--detail');
    if (moreOpen) bits.push('header--expanded');
    if (menuOpen) bits.push('header--menu-open');
    if (searchMode) bits.push('header--search-open');
    if (eggActive) bits.push('header--easter-egg');
    return bits.join(' ');
  }, [detail, moreOpen, menuOpen, searchMode, eggActive]);

  return (
    <header className={headerClassName}>
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
          <NotificationsLogoTrigger enabled={!navDisabled} />
        </div>
      </div>

      <div className="header-nav-section">
        <nav className="nav-inline">
          <NavLinks
            isAdmin={isAdmin}
            isSignedIn={isSignedIn}
            variant="primary"
            easterEgg={{
              armed: eggArmed,
              feedRef: feedLinkRef,
              onArm: handleEggArm,
              onDragStart: handleEggDragStart
            }}
          />
        </nav>

        <div className="header-right-controls" ref={moreWrapRef}>
          <button
            type="button"
            className="icon-button nav-more-toggle"
            onClick={() => {
              if (navDisabled) return;
              setMoreOpen((v) => !v);
            }}
            aria-label="More pages"
            aria-expanded={moreOpen ? 'true' : 'false'}
            title="More"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: moreOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <SearchBar disabled={navDisabled} />
        </div>
      </div>

      {moreOpen ? (
        <nav ref={moreNavRef} className="nav-inline nav-inline--more" aria-label="More pages">
          <NavLinks
            isAdmin={isAdmin}
            isSignedIn={isSignedIn}
            variant="more"
            easterEgg={{
              armed: eggArmed,
              feedRef: feedLinkRef,
              onArm: handleEggArm,
              onDragStart: handleEggDragStart
            }}
          />
        </nav>
      ) : null}

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
            <button
              type="button"
              className="nav-menu-button"
              onClick={() => {
                if (navDisabled) return;
                setMenuOpen((v) => !v);
                setSearchMode(false);
              }}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen ? 'true' : 'false'}
            >
              Navigation
            </button>
          )}
        </div>

        <div className="header-bottom-right">
          {!searchMode && (
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

      {menuOpen && (
        <div ref={menuExpandedRef} className="nav-menu-expanded" role="menu" aria-label="Site menu">
          <nav className="nav-menu-links-scrollable">
            <NavLinks
              isAdmin={isAdmin}
              isSignedIn={isSignedIn}
              variant="all"
              easterEgg={{
                armed: eggArmed,
                feedRef: feedLinkRef,
                onArm: handleEggArm,
                onDragStart: handleEggDragStart
              }}
            />
          </nav>
        </div>
      )}

      {searchMode && searchResults.length > 0 && (
        <SearchResultsPopover
          results={searchResults}
          query={searchQuery}
          onClose={handleSearchClose}
          onResultClick={handleResultClick}
          excludeRef={searchFormRef}
        />
      )}

      {eggDragging ? (
        <div
          className="nav-egg-drag-ghost"
          style={{
            width: dragSize.width,
            height: dragSize.height,
            left: dragPoint.x,
            top: dragPoint.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {dragLabel}
        </div>
      ) : null}

      {eggActive ? (
        <div className="header-easter-egg-overlay" aria-hidden="true">
          <iframe
            className="header-easter-egg-iframe"
            title="Errl Easter Egg"
            src="/easter-eggs/errl-bubbles-header.html"
          />
        </div>
      ) : null}

      <HeaderSetupBanner />
    </header>
  );
}
