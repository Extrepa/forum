'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import NavLinks from './NavLinks';
import NotificationsLogoTrigger from './NotificationsLogoTrigger';
import HeaderSetupBanner from './HeaderSetupBanner';
import SearchBar from './SearchBar';

function isDetailPath(pathname) {
  if (!pathname) return false;
  return /^\/(announcements|lobby|projects|music|events|devlog)\/[^/]+$/.test(pathname);
}

export default function SiteHeader({ subtitle, isAdmin, isSignedIn }) {
  const pathname = usePathname();
  const router = useRouter();
  const detail = isDetailPath(pathname);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreWrapRef = useRef(null);
  const moreNavRef = useRef(null);
  const [titleClicked, setTitleClicked] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onDocMouseDown = (event) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
      // Check if click is outside both the toggle button container AND the expanded nav section
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

  const headerClassName = useMemo(() => {
    const bits = [];
    if (detail) bits.push('header--detail');
    if (moreOpen) bits.push('header--expanded');
    return bits.join(' ');
  }, [detail, moreOpen]);

  return (
    <header className={headerClassName}>
      <div className="brand">
        <div className="brand-left">
          <div>
            <h1 
              className="forum-title"
              onClick={() => {
                setTitleClicked(true);
                setTimeout(() => {
                  router.push('/');
                  setTitleClicked(false);
                }, 300);
              }}
              style={{ 
                animation: titleClicked ? 'gooey-click 0.3s ease' : undefined,
                cursor: 'pointer'
              }}
            >
              Errl Forum
            </h1>
            <p className="forum-description">{subtitle}</p>
          </div>
        </div>
        <NotificationsLogoTrigger />
      </div>

      <div className="header-nav-section">
        <div className="nav-menu" ref={menuRef}>
          <button
            type="button"
            className="nav-menu-button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Open menu"
            aria-expanded={menuOpen ? 'true' : 'false'}
          >
            Menu
          </button>

          {menuOpen ? (
            <div className="card nav-menu-popover" role="menu" aria-label="Site menu">
              <nav className="nav-menu-links">
                <NavLinks isAdmin={isAdmin} isSignedIn={isSignedIn} variant="all" />
              </nav>
            </div>
          ) : null}
        </div>

        <nav className="nav-inline">
          <NavLinks isAdmin={isAdmin} isSignedIn={isSignedIn} variant="primary" />
        </nav>

        <div className="header-right-controls" ref={moreWrapRef}>
          <button
            type="button"
            className="icon-button nav-more-toggle"
            onClick={() => setMoreOpen((v) => !v)}
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
          <SearchBar />
        </div>
      </div>

      {moreOpen ? (
        <nav ref={moreNavRef} className="nav-inline nav-inline--more" aria-label="More pages">
          <NavLinks isAdmin={isAdmin} isSignedIn={isSignedIn} variant="more" />
        </nav>
      ) : null}

      <HeaderSetupBanner />
    </header>
  );
}

