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
    return `https://w.soundcloud.com/player/?url=${encoded}&color=%2334e1ff&auto_play=${autoPlayStr}&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`;
  } catch {
    return null;
  }
}

export function safeEmbedFromUrl(type, url, embedStyle = 'auto', autoPlay = false) {
  if (type === 'youtube') {
    const id = parseYouTubeId(url);
    if (!id) {
      return null;
    }
    const src = `https://www.youtube.com/embed/${id}${autoPlay ? '?autoplay=1' : ''}`;
    return {
      src,
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      allowFullScreen: true,
      aspect: '16:9'
    };
  }

  if (type === 'soundcloud') {
    const src = soundCloudPlayerSrc(url, autoPlay);
    if (!src) {
      return null;
    }
    const isPlaylist = isSoundCloudPlaylist(url);
    const height = (embedStyle === 'full' || (embedStyle === 'auto' && isPlaylist)) ? 450 : 166;
    const embedClass = height === 450 ? 'soundcloud-full' : 'soundcloud-compact';

    return {
      src,
      allow: 'autoplay',
      allowFullScreen: false,
      aspect: embedClass,
      height
    };
  }

  return null;
}
