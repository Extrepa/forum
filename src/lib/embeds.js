function parseYouTubeId(url) {
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

function soundCloudPlayerSrc(trackUrl) {
  try {
    const parsed = new URL(trackUrl);
    if (!parsed.hostname.endsWith('soundcloud.com')) {
      return null;
    }
    const encoded = encodeURIComponent(trackUrl);
    return `https://w.soundcloud.com/player/?url=${encoded}&color=%2334e1ff&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`;
  } catch {
    return null;
  }
}

export function safeEmbedFromUrl(type, url) {
  if (type === 'youtube') {
    const id = parseYouTubeId(url);
    if (!id) {
      return null;
    }
    return {
      src: `https://www.youtube.com/embed/${id}`,
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      allowFullScreen: true,
      aspect: '16:9'
    };
  }

  if (type === 'soundcloud') {
    const src = soundCloudPlayerSrc(url);
    if (!src) {
      return null;
    }
    return {
      src,
      allow: 'autoplay',
      allowFullScreen: false,
      aspect: 'soundcloud'
    };
  }

  return null;
}
