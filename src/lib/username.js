const USERNAME_PATTERN = /^[^\s]{1,20}$/;

export function normalizeUsername(input) {
  return String(input || '').trim().toLowerCase();
}

export function validateUsername(input) {
  const trimmed = String(input || '').trim();
  const normalized = normalizeUsername(trimmed);
  if (!USERNAME_PATTERN.test(trimmed)) {
    return {
      ok: false,
      normalized,
      message: 'Pick a username up to 20 characters (letters, numbers, symbols — no spaces).'
    };
  }
  return { ok: true, normalized, display: trimmed };
}
