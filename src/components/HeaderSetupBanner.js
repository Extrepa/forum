'use client';

import { useEffect, useState } from 'react';
import { openAccountPopover } from './HeaderAccountButton';

function needsSetup(user) {
  if (!user) return false;
  return !user.email || !user.hasPassword || user.mustChangePassword;
}

export default function HeaderSetupBanner() {
  const [me, setMe] = useState(null);

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

  if (!me || !needsSetup(me)) return null;

  return (
    <div className="notice header-setup-banner">
      <span>Finish account setup: set your email + password so you can sign in from any device.</span>
      <button type="button" onClick={openAccountPopover}>
        Complete setup
      </button>
    </div>
  );
}

