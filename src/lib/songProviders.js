const SONG_PROVIDER_META = {
  youtube: { label: 'YouTube', abbr: 'Y', color: '#ff1744', icon: '/icons/social/youtube.png' },
  'youtube-music': { label: 'YouTube Music', abbr: 'Y', color: '#ff1744', icon: '/icons/social/youtube.png' },
  soundcloud: { label: 'SoundCloud', abbr: 'SC', color: '#ff7700', icon: '/icons/social/soundcloud.png' },
  spotify: { label: 'Spotify', abbr: 'S', color: '#1DB954', icon: '/icons/social/spotify.svg' },
};

const normalizeSongProvider = (value) => {
  if (!value) return '';
  const normalized = String(value).toLowerCase().trim();
  if (normalized === 'youtube-music') {
    return 'youtube';
  }
  return normalized;
};

export function getSongProviderMeta(value, options = {}) {
  const key = normalizeSongProvider(value);
  const base = SONG_PROVIDER_META[key];
  if (base) {
    return base;
  }
  const label = options.label || 'Song';
  const abbr = options.abbr || (label ? label.charAt(0).toUpperCase() : '');
  return {
    label,
    abbr,
    color: 'var(--accent)',
    icon: '',
  };
}

export function getSongProviderGlowColor(value) {
  const meta = getSongProviderMeta(value);
  return meta.color || 'rgba(52, 225, 255, 0.4)';
}
