const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(input) {
  return String(input || '').trim().toLowerCase();
}

export function validateUsername(input) {
  const normalized = normalizeUsername(input);
  if (!USERNAME_PATTERN.test(normalized)) {
    return {
      ok: false,
      normalized,
      message: 'Use 3 to 20 lowercase letters, numbers, or underscores.'
    };
  }
  return { ok: true, normalized };
}
