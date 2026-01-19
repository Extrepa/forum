import { normalizeUsername } from './username';

const PALETTE_SIZE = 4;

function fnv1a32(input) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    // hash *= 16777619 (with 32-bit overflow)
    hash = (hash + (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)) >>> 0;
  }
  return hash >>> 0;
}

export function getStableUsernameColorIndex(name) {
  const normalized = normalizeUsername(name);
  if (!normalized) return 0;
  return fnv1a32(normalized) % PALETTE_SIZE;
}

export function getUsernameColorIndex(name, options = {}) {
  const { avoidIndex, avoidName, force } = options;

  if (force === 'purple') {
    return 0;
  }

  let idx = getStableUsernameColorIndex(name);

  if (
    typeof avoidIndex === 'number' &&
    avoidIndex >= 0 &&
    avoidIndex < PALETTE_SIZE &&
    avoidName &&
    normalizeUsername(avoidName) !== normalizeUsername(name) &&
    idx === avoidIndex
  ) {
    idx = (idx + 1) % PALETTE_SIZE;
  }

  return idx;
}

