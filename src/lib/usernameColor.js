import { normalizeUsername } from './username';

const PALETTE_SIZE = 8;

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

/**
 * Assigns unique color indices to all usernames on a page.
 * Ensures different users get different colors, while same user gets same color.
 * If a collision occurs, assigns the next available color.
 * 
 * @param {string[]} usernames - Array of all usernames that will be displayed on the page
 * @returns {Map<string, number>} Map of username -> colorIndex (0-7)
 */
export function assignUniqueColorsForPage(usernames) {
  const colorMap = new Map();
  const usedColors = new Set();
  const usernameToColor = new Map(); // Track which username has which color
  
  // First pass: assign stable colors
  usernames.forEach(username => {
    if (!username) return;
    const normalized = normalizeUsername(username);
    if (!normalized) return;
    
    const stableIndex = getStableUsernameColorIndex(username);
    colorMap.set(username, stableIndex);
    usernameToColor.set(stableIndex, username);
  });
  
  // Second pass: resolve collisions
  usernames.forEach(username => {
    if (!username) return;
    const normalized = normalizeUsername(username);
    if (!normalized) return;
    
    let colorIndex = colorMap.get(username);
    const currentOwner = usernameToColor.get(colorIndex);
    
    // If this color is already used by a different user, find next available
    if (currentOwner && normalizeUsername(currentOwner) !== normalized) {
      // Try to find an unused color
      for (let i = 0; i < PALETTE_SIZE; i++) {
        const testIndex = (colorIndex + i) % PALETTE_SIZE;
        const owner = usernameToColor.get(testIndex);
        if (!owner || normalizeUsername(owner) === normalized) {
          colorIndex = testIndex;
          break;
        }
      }
      
      // Update the mapping
      colorMap.set(username, colorIndex);
      usernameToColor.set(colorIndex, username);
    } else {
      // This user owns this color, mark it as used
      usernameToColor.set(colorIndex, username);
    }
  });
  
  return colorMap;
}

