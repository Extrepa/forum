export function parseYouTubeId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.replace('/', '').trim();
      return id || null;
    }
    if (parsed.hostname.endsWith('youtube.com')) {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v');
      }
      const embedMatch = parsed.pathname.match(/\/embed\/([^/]+)/);
      if (embedMatch?.[1]) {
        return embedMatch[1];
      }
      const shortsMatch = parsed.pathname.match(/\/shorts\/([^/]+)/);
      if (shortsMatch?.[1]) {
        return shortsMatch[1];
      }
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
    const id = parseSpotifyId(url);
    if (!id) {
      return null;
    }
    const src = spotifyPlayerSrc(id, autoPlay); // Autoplay not directly in standard embed, but might be possible with API
    return {
      src,
      allow: 'encrypted-media',
      allowFullScreen: true,
      aspect: 'spotify', // Custom aspect class for Spotify
      height: 380 // Standard Spotify embed height for track
    };
  }

  return null;
}

function parseSpotifyId(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    const trackMatch = path.match(/\/track\/([a-zA-Z0-9]+)/);
    if (trackMatch?.[1]) {
      return trackMatch[1];
    }
    const albumMatch = path.match(/\/album\/([a-zA-Z0-9]+)/);
    if (albumMatch?.[1]) {
      return albumMatch[1];
    }
    const playlistMatch = path.match(/\/playlist\/([a-zA-Z0-9]+)/);
    if (playlistMatch?.[1]) {
      return playlistMatch[1];
    }
    return null;
  } catch {
    return null;
  }
}

function spotifyPlayerSrc(id, autoPlay = false) { // Autoplay not standard for embeds, but including param
  return `https://open.spotify.com/embed/${id}?utm_source=generator${autoPlay ? '&autoplay=true' : ''}`;
}
