'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import NavLinks from './NavLinks';
import NotificationsLogoTrigger from './NotificationsLogoTrigger';
import HeaderAccountButton from './HeaderAccountButton';
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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onDocMouseDown = (event) => {
      if (!menuOpen) return;
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [menuOpen]);

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
                <NavLinks isAdmin={isAdmin} isSignedIn={isSignedIn} />
              </nav>
            </div>
          ) : null}
        </div>

        <nav className="nav-inline">
          <NavLinks isAdmin={isAdmin} isSignedIn={isSignedIn} />
        </nav>

        <div className="header-right-controls">
          <HeaderAccountButton />
          <SearchBar />
        </div>
      </div>

      <HeaderSetupBanner />
    </header>
  );
}

