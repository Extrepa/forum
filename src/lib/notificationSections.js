/**
 * Section/thread-type keys for "new content" notification preferences.
 * Used by account settings UI and (when implemented) by notification sending.
 * Keys match: lobby thread types (is_shitpost) and post types (posts.type).
 */
export const NEW_CONTENT_SECTION_KEYS = {
  lobby: [
    { key: 'lobby_general', label: 'General (Lobby)' },
    { key: 'lobby_shitposts', label: 'Shitposts' }
  ],
  sections: [
    { key: 'art', label: 'Art' },
    { key: 'nostalgia', label: 'Nostalgia' },
    { key: 'bugs', label: 'Bugs' },
    { key: 'rant', label: 'Rant' },
    { key: 'lore', label: 'Lore' },
    { key: 'memories', label: 'Memories' },
    { key: 'about', label: 'About' },
    { key: 'nomads', label: 'Nomads' }
  ]
};

export const ALL_NEW_CONTENT_KEYS = [
  ...NEW_CONTENT_SECTION_KEYS.lobby.map((o) => o.key),
  ...NEW_CONTENT_SECTION_KEYS.sections.map((o) => o.key)
];

export function parseNewContentSectionsJson(value) {
  if (value == null || value === '') {
    return {};
  }
  if (typeof value === 'object') {
    return value;
  }
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function defaultNewContentSections() {
  return Object.fromEntries(ALL_NEW_CONTENT_KEYS.map((k) => [k, false]));
}

/** All sections enabled (used when user first turns on "New forum threads" – they can then uncheck the ones they don't want). */
export function defaultNewContentSectionsAllTrue() {
  return Object.fromEntries(ALL_NEW_CONTENT_KEYS.map((k) => [k, true]));
}
