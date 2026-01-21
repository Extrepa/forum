'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
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
  const detail = isDetailPath(pathname);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onDocMouseDown = (event) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
      if (moreOpen && moreRef.current && !moreRef.current.contains(event.target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [menuOpen, moreOpen]);

  const headerClassName = useMemo(() => (detail ? 'header--detail' : ''), [detail]);

  return (
    <header className={headerClassName}>
      <div className="brand">
        <div className="brand-left">
          <h1>Errl Forum</h1>
          <p>{subtitle}</p>
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

        <div className="header-right-controls">
          <SearchBar />
          <div className="nav-more" ref={moreRef}>
            <button
              type="button"
              className="icon-button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-label="More pages"
              aria-expanded={moreOpen ? 'true' : 'false'}
              title="More"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {moreOpen ? (
              <div className="card nav-more-popover" role="menu" aria-label="More pages">
                <nav className="nav-menu-links">
                  <NavLinks isAdmin={isAdmin} isSignedIn={isSignedIn} variant="more" />
                </nav>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <HeaderSetupBanner />
    </header>
  );
}

