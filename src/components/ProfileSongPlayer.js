'use client';

import { safeEmbedFromUrl } from '../lib/embeds';

export default function ProfileSongPlayer({
  provider,
  songUrl,
  autoPlay = false,
  providerLabel = 'Song',
  embedStyle = 'auto',
  className = '',
  style,
}) {
  const embed = safeEmbedFromUrl(provider, songUrl, embedStyle, autoPlay);
  const providerType = provider || '';
  const normalizedProvider = providerType === 'youtube-music' ? 'youtube' : providerType;
  const supportedProviders = ['soundcloud', 'spotify', 'youtube'];

  if (!embed || !supportedProviders.includes(normalizedProvider)) return null;

  let youtubeKey = 'custom';
  if (normalizedProvider === 'youtube') {
    const youtubeMeta = embed.meta || {};
    const youtubeId = youtubeMeta.youtubeId || youtubeMeta.youtubePlaylistId;
    if (!youtubeId) {
      return null;
    }
    youtubeKey = String(youtubeId || 'custom').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!youtubeKey) {
      youtubeKey = 'custom';
    }
  }

  const classes = [
    'profile-song-player',
    'neon-outline-card',
    `profile-song-player--${normalizedProvider}`,
    embedStyle === 'compact' ? 'profile-song-player--compact' : '',
    className,
  ].filter(Boolean).join(' ');
  const containerHeight = embed?.height ? embed.height : 'auto';
  const iframeTitle = providerLabel ? `${providerLabel} player` : 'Profile song';

  // Basic rendering with provider-specific styling
  return (
    <div
      className={classes}
      style={{
        position: 'relative',
        width: '100%',
        height: containerHeight,
        boxSizing: 'border-box',
        ...style
      }}
    >
      {normalizedProvider === 'soundcloud' && embed && (
        <div
          className={`embed-frame profile-song-player-embed ${embed.aspect}`}
          aria-hidden={false}
          style={{ width: '100%', height: '100%', boxSizing: 'border-box' }}
        >
          <iframe
            src={embed.src}
            title={iframeTitle}
            allow={embed.allow}
            allowFullScreen={embed.allowFullScreen}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '0',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}
      {normalizedProvider === 'youtube' && embed && (
        <div
          id={`youtube-player-${youtubeKey}`}
          className={`embed-frame profile-song-player-embed ${embed.aspect || ''}`}
          style={{ width: '100%', height: containerHeight, boxSizing: 'border-box' }}
          aria-hidden={false}
        >
          <iframe
            src={embed.src}
            title={iframeTitle}
            allow={embed.allow}
            allowFullScreen={embed.allowFullScreen}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '0',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}
      {normalizedProvider === 'spotify' && embed && (
        <div
          className={`embed-frame profile-song-player-embed ${embed.aspect}`}
          aria-hidden={false}
          style={{ width: '100%', height: containerHeight, boxSizing: 'border-box' }}
        >
          <iframe
            src={embed.src}
            title={iframeTitle}
            allow={embed.allow}
            allowFullScreen={embed.allowFullScreen}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '0',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}
    </div>
  );
}
