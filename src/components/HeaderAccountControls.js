'use client';

import { useEffect, useState } from 'react';
import ClaimUsernameForm from './ClaimUsernameForm';

function needsSetup(user) {
  if (!user) return false;
  return !user.email || !user.hasPassword || user.mustChangePassword;
}

export default function HeaderAccountControls() {
  const [me, setMe] = useState(null);
  const [open, setOpen] = useState(false);

  const refresh = async () => {
    try {
      const res = await fetch('/api/auth/me', { method: 'GET' });
      const payload = await res.json();
      setMe(payload.user || null);
    } catch (e) {
      setMe(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!mounted) return;
      await refresh();
    };
    run();
    const id = setInterval(run, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  if (!me) return null;

  const showBanner = needsSetup(me);

  return (
    <div className="header-account">
      <div className="header-account-row">
        <button
          type="button"
          onClick={async () => {
            const next = !open;
            setOpen(next);
            if (next) await refresh();
          }}
          className={open ? 'active' : ''}
        >
          Account
        </button>
      </div>

      {showBanner ? (
        <div className="notice header-setup-banner">
          Finish account setup: set your email + password so you can sign in from any device.
          <button
            type="button"
            onClick={async () => {
              setOpen(true);
              await refresh();
            }}
            style={{ marginLeft: 12 }}
          >
            Complete setup
          </button>
        </div>
      ) : null}

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

