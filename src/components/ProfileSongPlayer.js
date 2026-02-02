'use client';

import { safeEmbedFromUrl, parseYouTubeId } from '../lib/embeds';

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
  const youtubeId = parseYouTubeId(songUrl); // Still need youtubeId for the div's ID
  const providerType = provider; // Renamed to avoid confusion with the provider variable

  if (!embed && providerType !== 'youtube' && providerType !== 'spotify') return null;
  if (providerType === 'youtube' && !youtubeId) return null;

  const classes = [
    'profile-song-player',
    'neon-outline-card',
    `profile-song-player--${provider}`,
    embedStyle === 'compact' ? 'profile-song-player--compact' : '',
    className,
  ].filter(Boolean).join(' ');
  const containerHeight = embed?.height ? embed.height : 'auto';

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
      {providerType === 'soundcloud' && embed && (
        <div
          className={`embed-frame profile-song-player-embed ${embed.aspect}`}
          aria-hidden={false}
          style={{ width: '100%', height: '100%', boxSizing: 'border-box' }}
        >
          <iframe
            src={embed.src}
            title="Profile song"
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
      {providerType === 'youtube' && embed && (
        <div
          id={`youtube-player-${youtubeId}`} // Use a consistent ID pattern
          className={`embed-frame profile-song-player-embed ${embed.aspect || ''}`}
          style={{ width: '100%', height: containerHeight, boxSizing: 'border-box' }}
          aria-hidden={false}
        >
          <iframe
            src={embed.src}
            title="Profile song"
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
      {providerType === 'spotify' && embed && (
        <div
          className={`embed-frame profile-song-player-embed ${embed.aspect}`}
          aria-hidden={false}
          style={{ width: '100%', height: containerHeight, boxSizing: 'border-box' }}
        >
          <iframe
            src={embed.src}
            title="Spotify song"
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
