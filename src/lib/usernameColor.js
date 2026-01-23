import { normalizeUsername } from './username';

const PALETTE_SIZE = 8;
const DEFAULT_PURPLE_INDEX = 5; // Neon purple (#B026FF)

function fnv1a32(input) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    // hash *= 16777619 (with 32-bit overflow)
    hash = (hash + (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)) >>> 0;
  }
  return hash >>> 0;
}

export function getStableUsernameColorIndex(name, preferredColorIndex = null) {
  // If user has an explicit preferred color, use it (unless it's invalid)
  if (typeof preferredColorIndex === 'number' && preferredColorIndex >= 0 && preferredColorIndex < PALETTE_SIZE) {
    return preferredColorIndex;
  }
  
  // For automatic (NULL preference) users, use hash-based system for consistent colors
  // This ensures the same username always gets the same color when no preference is set
  const normalized = normalizeUsername(name);
  if (!normalized) return DEFAULT_PURPLE_INDEX;
  
  return fnv1a32(normalized) % PALETTE_SIZE;
}

export function getUsernameColorIndex(name, options = {}) {
  const { avoidIndex, avoidName, force, preferredColorIndex } = options;

  if (force === 'purple') {
    return 0;
  }

  // Use preferred color if provided and valid
  let idx = getStableUsernameColorIndex(name, preferredColorIndex);

  // Handle collision avoidance (for page-level uniqueness)
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
 * Prioritizes uniqueness for automatic (NULL preference) users.
 * Only allows duplicate colors when users with explicit preferences conflict and no alternative exists.
 * 
 * Strategy:
 * 1. First, assign colors to users WITHOUT explicit preferences (automatic) - ensure uniqueness
 * 2. Then, assign colors to users WITH explicit preferences
 * 3. If explicit preference conflicts with automatic user: move automatic user
 * 4. If explicit preference conflicts with another explicit preference: allow duplicate only if no alternative
 * 
 * @param {string[]} usernames - Array of all usernames that will be displayed on the page
 * @param {Map<string, number>} preferredColors - Optional map of username -> preferred color index (null means automatic)
 * @returns {Map<string, number>} Map of username -> colorIndex (0-7)
 */
export function assignUniqueColorsForPage(usernames, preferredColors = new Map()) {
  const colorMap = new Map();
  const usernameToColor = new Map(); // Track which username has which color
  const usedColors = new Set(); // Track which colors are in use
  
  // Separate users into automatic (no preference) and explicit (has preference)
  const automaticUsers = [];
  const explicitUsers = [];
  
  usernames.forEach(username => {
    if (!username) return;
    const normalized = normalizeUsername(username);
    if (!normalized) return;
    
    const preferred = preferredColors.get(username);
    if (typeof preferred === 'number' && preferred >= 0 && preferred < PALETTE_SIZE) {
      explicitUsers.push(username);
    } else {
      automaticUsers.push(username);
    }
  });
  
  // First pass: Assign colors to automatic users (prioritize uniqueness)
  automaticUsers.forEach(username => {
    const normalized = normalizeUsername(username);
    let colorIndex = getStableUsernameColorIndex(username, null);
    
    // If color is taken, find next available
    if (usedColors.has(colorIndex)) {
      for (let i = 0; i < PALETTE_SIZE; i++) {
        const testIndex = (colorIndex + i) % PALETTE_SIZE;
        if (!usedColors.has(testIndex)) {
          colorIndex = testIndex;
          break;
        }
      }
    }
    
    colorMap.set(username, colorIndex);
    usernameToColor.set(colorIndex, username);
    usedColors.add(colorIndex);
  });
  
  // Second pass: Assign colors to users with explicit preferences
  explicitUsers.forEach(username => {
    const normalized = normalizeUsername(username);
    const preferred = preferredColors.get(username);
    let colorIndex = preferred;
    const currentOwner = usernameToColor.get(colorIndex);
    
    // If preferred color is available, use it
    if (!currentOwner || normalizeUsername(currentOwner) === normalized) {
      colorMap.set(username, colorIndex);
      usernameToColor.set(colorIndex, username);
      usedColors.add(colorIndex);
    } else {
      // Color is taken - check if owner is automatic or explicit
      const ownerPreferred = preferredColors.get(currentOwner);
      const ownerIsExplicit = typeof ownerPreferred === 'number' && ownerPreferred >= 0 && ownerPreferred < PALETTE_SIZE;
      
      if (ownerIsExplicit) {
        // Both have explicit preferences - try to find alternative for this user
        let foundAlternative = false;
        for (let i = 0; i < PALETTE_SIZE; i++) {
          const testIndex = (colorIndex + i) % PALETTE_SIZE;
          const testOwner = usernameToColor.get(testIndex);
          if (!testOwner || normalizeUsername(testOwner) === normalized) {
            colorIndex = testIndex;
            foundAlternative = true;
            break;
          }
        }
        
        // If no alternative found, allow duplicate (both explicit preferences)
        if (!foundAlternative) {
          // Keep the preferred color even though it's a duplicate
          colorIndex = preferred;
        }
      } else {
        // Owner is automatic - move the automatic user to make room
        const movedColor = colorIndex;
        const movedUsername = currentOwner;
        
        // Find new color for the automatic user
        let newColorIndex = getStableUsernameColorIndex(movedUsername, null);
        for (let i = 0; i < PALETTE_SIZE; i++) {
          const testIndex = (newColorIndex + i) % PALETTE_SIZE;
          if (testIndex !== movedColor && !usedColors.has(testIndex)) {
            newColorIndex = testIndex;
            break;
          }
        }
        
        // Update automatic user's color
        colorMap.set(movedUsername, newColorIndex);
        usernameToColor.delete(movedColor);
        usernameToColor.set(newColorIndex, movedUsername);
        usedColors.delete(movedColor);
        usedColors.add(newColorIndex);
      }
      
      // Assign color to explicit preference user
      colorMap.set(username, colorIndex);
      usernameToColor.set(colorIndex, username);
      if (!usedColors.has(colorIndex)) {
        usedColors.add(colorIndex);
      }
    }
  });
  
  return colorMap;
}

