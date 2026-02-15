'use client';

import { useEffect, useRef, useState } from 'react';
import ClaimUsernameForm from './ClaimUsernameForm';
import { getAnchoredPopoverLayout } from '../lib/anchoredPopover';

const OPEN_EVENT = 'errl:open-account';

export function openAccountPopover() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export default function HeaderAccountButton() {
  const [open, setOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState({});
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

  const refreshAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', { method: 'GET' });
      const payload = await res.json();
      setIsAuthed(!!payload.user);
    } catch (e) {
      setIsAuthed(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!mounted) return;
      await refreshAuth();
    };
    run();
    const id = setInterval(run, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, handler);
    return () => window.removeEventListener(OPEN_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return undefined;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const anchorRect = buttonRef.current.getBoundingClientRect();
      const panelHeight = popoverRef.current?.offsetHeight || 0;
      const layout = getAnchoredPopoverLayout({
        anchorRect,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        desiredWidth: 560,
        minWidth: 280,
        edgePadding: 12,
        gap: 10,
        minHeight: 220,
        maxHeight: 760,
        panelHeight,
        align: 'end',
      });

      setPopoverStyle({
        position: 'fixed',
        left: `${layout.left}px`,
        top: `${layout.top}px`,
        width: `${layout.width}px`,
        maxWidth: `${layout.width}px`,
        minWidth: `${layout.width}px`,
        maxHeight: `${layout.maxHeight}px`,
      });
    };

    const timerId = setTimeout(updatePosition, 0);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      clearTimeout(timerId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  if (!isAuthed) return null;

  return (
    <div className="header-account-button">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={open ? 'active' : ''}
      >
        Account
      </button>

      {open ? (
        <div className="card header-account-popover" ref={popoverRef} style={popoverStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <strong>Account</strong>
            <button type="button" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            <ClaimUsernameForm />
          </div>
        </div>
      ) : null}
    </div>
  );
}
