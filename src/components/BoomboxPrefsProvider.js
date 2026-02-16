'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

const BOOMBOX_ENABLED_KEY = 'errl_boombox_enabled';

const BoomboxPrefsContext = createContext({
  boomboxEnabled: false,
  setBoomboxEnabled: () => {},
});

const BoomboxWidget = dynamic(
  () => import('./boombox/BoomboxWidget'),
  { ssr: false }
);

export function BoomboxPrefsProvider({ children }) {
  const [boomboxEnabled, setBoomboxEnabledState] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const raw = localStorage.getItem(BOOMBOX_ENABLED_KEY);
      setBoomboxEnabledState(raw === '1'); // unchecked by default; only '1' means enabled
    } catch {
      setBoomboxEnabledState(false);
    }
  }, [mounted]);

  const setBoomboxEnabled = (enabled) => {
    try {
      localStorage.setItem(BOOMBOX_ENABLED_KEY, enabled ? '1' : '0');
      setBoomboxEnabledState(!!enabled);
    } catch {
      setBoomboxEnabledState(false);
    }
  };

  const value = useMemo(
    () => ({ boomboxEnabled, setBoomboxEnabled }),
    [boomboxEnabled]
  );

  return (
    <BoomboxPrefsContext.Provider value={value}>
      {children}
      {mounted && boomboxEnabled && <BoomboxWidget />}
    </BoomboxPrefsContext.Provider>
  );
}

export function useBoomboxPrefs() {
  return useContext(BoomboxPrefsContext);
}
