/** Spotify path types we support for embed (track, album, playlist, artist, episode, show). */
const SPOTIFY_EMBED_PATH_PREFIXES = ['/track/', '/album/', '/playlist/', '/artist/', '/episode/', '/show/'];

/** Detect embed provider from URL. Returns 'youtube' | 'youtube-music' | 'soundcloud' | 'spotify' | null. */
export function detectProviderFromUrl(url) {
  const trimmed = typeof url === 'string' ? url.trim() : '';
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname || '';

    if (host.includes('spotify.com') && SPOTIFY_EMBED_PATH_PREFIXES.some((p) => path.includes(p))) {
      return 'spotify';
    }
    if (host.includes('music.youtube.com')) {
      return 'youtube-music';
    }
    if (host === 'youtu.be' || host.endsWith('youtube.com')) {
      return 'youtube';
    }
    if (host.endsWith('soundcloud.com')) {
      return 'soundcloud';
    }
    return null;
  } catch {
    return null;
  }
}

export function parseYouTubeId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/')[0] || '';
      return id || null;
    }
    if (parsed.hostname.endsWith('youtube.com')) {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v') || null;
      }
      const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch?.[1]) return embedMatch[1];
      const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch?.[1]) return shortsMatch[1];
      const liveMatch = parsed.pathname.match(/\/live\/([^/?]+)/);
      if (liveMatch?.[1]) return liveMatch[1];
      const vMatch = parsed.pathname.match(/\/v\/([^/?]+)/);
      if (vMatch?.[1]) return vMatch[1];
    }
    return null;
  } catch {
    return null;
  }
}

export function parseYouTubePlaylistId(url) {
  try {
    const parsed = new URL(url);
    const listParam = parsed.searchParams.get('list');
    if (listParam) {
      return listParam;
    }
    const playlistMatch = parsed.pathname.match(/\/playlist\/([^/]+)/);
    if (playlistMatch?.[1]) {
      return playlistMatch[1];
    }
    return null;
  } catch {
    return null;
  }
}

function isSoundCloudPlaylist(url) {
  try {
    const parsed = new URL(url);
    // SoundCloud playlists/sets have "/sets/" in the path
    return parsed.pathname.includes('/sets/');
  } catch {
    return false;
  }
}

function soundCloudPlayerSrc(trackUrl, autoPlay = false) {
  try {
    const parsed = new URL(trackUrl);
    if (!parsed.hostname.endsWith('soundcloud.com')) {
      return null;
    }
    const encoded = encodeURIComponent(trackUrl);
    const autoPlayStr = autoPlay ? 'true' : 'false';
    return `https://w.soundcloud.com/player/?url=${encoded}&color=%2334e1ff&auto_play=${autoPlayStr}&visual=true&show_artwork=true&show_comments=true`;
  } catch {
    return null;
  }
}

export function safeEmbedFromUrl(type, url, embedStyle = 'auto', autoPlay = false) {
  const normalizedType = (type || '').toLowerCase();
  const isYouTubeType = normalizedType === 'youtube' || normalizedType === 'youtube-music';
  if (isYouTubeType) {
    const playlistId = parseYouTubePlaylistId(url);
    const videoId = parseYouTubeId(url);
    if (!videoId && !playlistId) {
      return null;
    }
    const params = new URLSearchParams();
    if (playlistId) {
      params.set('list', playlistId);
    }
    if (autoPlay) {
      params.set('autoplay', '1');
    }
    let src;
    if (!videoId && playlistId) {
      const base = 'https://www.youtube.com/embed/videoseries';
      const query = params.toString();
      src = query ? `${base}?${query}` : base;
    } else {
      const base = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
      const query = params.toString();
      src = query ? `${base}?${query}` : base;
    }
    return {
      src,
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      allowFullScreen: true,
      aspect: '16:9',
      meta: {
        youtubeId: videoId || null,
        youtubePlaylistId: playlistId || null,
      },
    };
  }

  if (type === 'soundcloud') {
    const src = soundCloudPlayerSrc(url, autoPlay);
    if (!src) {
      return null;
    }
    const isPlaylist = isSoundCloudPlaylist(url);
    const height = (embedStyle === 'full' || (embedStyle === 'auto' && isPlaylist)) ? 450 : (embedStyle === 'artwork' ? 300 : (embedStyle === 'profile_full_height' ? '100%' : 90));
    const embedClass = height === 450 ? 'soundcloud-full' : (height === 300 ? 'soundcloud-artwork' : 'soundcloud-compact');

    return {
      src,
      allow: 'autoplay',
      allowFullScreen: false,
      aspect: embedClass,
      height
    };
  }

  if (type === 'spotify') {
    const parsed = parseSpotifyEmbed(url);
    if (!parsed) {
      return null;
    }
    const src = spotifyPlayerSrc(parsed.type, parsed.id, autoPlay);
    const height = spotifyEmbedHeight(parsed.type);
    return {
      src,
      allow: 'encrypted-media',
      allowFullScreen: true,
      aspect: 'spotify',
      height,
      meta: { spotifyType: parsed.type },
    };
  }

  return null;
}

/**
 * Parse Spotify URL into embed type and id. Embed URL must be /embed/{type}/{id}.
 * Supports: track, album, playlist, artist, episode, show.
 * @returns {{ type: string, id: string } | null}
 */
function parseSpotifyEmbed(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname || '';
    const types = ['track', 'album', 'playlist', 'artist', 'episode', 'show'];
    for (const t of types) {
      const m = path.match(new RegExp(`/${t}/([a-zA-Z0-9]+)`));
      if (m?.[1]) return { type: t, id: m[1] };
    }
    return null;
  } catch {
    return null;
  }
}

function spotifyEmbedHeight(spotifyType) {
  switch (spotifyType) {
    case 'track':
      return 152;
    case 'episode':
    case 'show':
      return 232;
    default:
      return 380; // album, playlist, artist
  }
}

function spotifyPlayerSrc(embedType, id, autoPlay = false) {
  const q = new URLSearchParams({ utm_source: 'generator' });
  if (autoPlay) q.set('autoplay', 'true');
  return `https://open.spotify.com/embed/${embedType}/${id}?${q.toString()}`;
}
