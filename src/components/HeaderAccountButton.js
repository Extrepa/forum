'use client';

import { useEffect, useState } from 'react';
import ClaimUsernameForm from './ClaimUsernameForm';

const OPEN_EVENT = 'errl:open-account';

export function openAccountPopover() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export default function HeaderAccountButton() {
  const [open, setOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

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

  if (!isAuthed) return null;

  return (
    <div className="header-account-button">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={open ? 'active' : ''}
      >
        Account
      </button>

      {open ? (
        <div className="card header-account-popover">
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

