'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const UiPrefsContext = createContext({
  loreEnabled: false,
  setLoreEnabled: () => {},
  uiColorMode: 0,
  setUiColorMode: () => {},
  uiBorderColor: null,
  setUiBorderColor: () => {},
  uiInvertColors: false,
  setUiInvertColors: () => {},
  refresh: async () => {}
});

export function UiPrefsProvider({ 
  initialLoreEnabled = false, 
  initialColorMode = 0,
  initialBorderColor = null,
  initialInvertColors = false,
  children 
}) {
  const [loreEnabled, setLoreEnabled] = useState(!!initialLoreEnabled);
  const [uiColorMode, setUiColorMode] = useState(initialColorMode);
  const [uiBorderColor, setUiBorderColor] = useState(initialBorderColor);
  const [uiInvertColors, setUiInvertColors] = useState(!!initialInvertColors);

  useEffect(() => {
    setLoreEnabled(!!initialLoreEnabled);
    setUiColorMode(initialColorMode);
    setUiBorderColor(initialBorderColor);
    setUiInvertColors(!!initialInvertColors);
  }, [initialLoreEnabled, initialColorMode, initialBorderColor, initialInvertColors]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-ui-color-mode', uiColorMode.toString());
    root.setAttribute('data-ui-invert', uiInvertColors.toString());
    if (uiBorderColor) {
      root.style.setProperty('--ui-border-color', uiBorderColor);
    } else {
      root.style.removeProperty('--ui-border-color');
    }
  }, [uiColorMode, uiInvertColors, uiBorderColor]);

  const refresh = async () => {
    try {
      const res = await fetch('/api/auth/me', { method: 'GET' });
      const payload = await res.json();
      if (payload?.user) {
        setLoreEnabled(!!payload.user.uiLoreEnabled);
        setUiColorMode(payload.user.uiColorMode ?? 0);
        setUiBorderColor(payload.user.uiBorderColor ?? null);
        setUiInvertColors(!!payload.user.uiInvertColors);
      }
    } catch (e) {
      // If not authed or request fails, keep current values.
    }
  };

  const value = useMemo(() => ({ 
    loreEnabled, setLoreEnabled, 
    uiColorMode, setUiColorMode,
    uiBorderColor, setUiBorderColor,
    uiInvertColors, setUiInvertColors,
    refresh 
  }), [loreEnabled, uiColorMode, uiBorderColor, uiInvertColors]);

  return <UiPrefsContext.Provider value={value}>{children}</UiPrefsContext.Provider>;
}

export function useUiPrefs() {
  return useContext(UiPrefsContext);
}

