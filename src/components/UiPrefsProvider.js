'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const UiPrefsContext = createContext({
  loreEnabled: false,
  setLoreEnabled: () => {},
  refresh: async () => {}
});

export function UiPrefsProvider({ initialLoreEnabled = false, children }) {
  const [loreEnabled, setLoreEnabled] = useState(!!initialLoreEnabled);

  useEffect(() => {
    setLoreEnabled(!!initialLoreEnabled);
  }, [initialLoreEnabled]);

  const refresh = async () => {
    try {
      const res = await fetch('/api/auth/me', { method: 'GET' });
      const payload = await res.json();
      setLoreEnabled(!!payload?.user?.uiLoreEnabled);
    } catch (e) {
      // If not authed or request fails, keep current value.
    }
  };

  const value = useMemo(() => ({ loreEnabled, setLoreEnabled, refresh }), [loreEnabled]);

  return <UiPrefsContext.Provider value={value}>{children}</UiPrefsContext.Provider>;
}

export function useUiPrefs() {
  return useContext(UiPrefsContext);
}

