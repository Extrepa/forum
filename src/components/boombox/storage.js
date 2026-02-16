const KEY = "errl_boombox_v1";

export function loadBoomboxState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveBoomboxState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearBoomboxState() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
