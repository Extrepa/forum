'use client';

import { safeEmbedFromUrl, parseYouTubeId } from '../lib/embeds';

export default function ProfileSongPlayer({ provider, songUrl, autoPlay = false, providerLabel = 'Song' }) {

  const embed = safeEmbedFromUrl(provider, songUrl, 'auto', autoPlay);

  const youtubeId = parseYouTubeId(songUrl); // Still need youtubeId for the div's ID

  const providerType = provider; // Renamed to avoid confusion with the provider variable



  if (!embed && providerType !== 'youtube' && providerType !== 'spotify') return null;

  if (providerType === 'youtube' && !youtubeId) return null;



  // Basic rendering with provider-specific styling

  return (

    <div className={`profile-song-player neon-outline-card profile-song-player--${provider}`} style={{ position: 'relative', width: '100%', height: embed.height ? embed.height : 'auto', boxSizing: 'border-box' }}>

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

      {providerType === 'youtube' && (

        <div

          id={`youtube-player-${youtubeId}`} // Use a consistent ID pattern

          className="embed-frame profile-song-player-embed"

          style={{ width: '100%', height: embed.height ? embed.height : '100%', boxSizing: 'border-box' }}

          aria-hidden={false}

        />

      )}

      {providerType === 'spotify' && embed && (

        <div

          className={`embed-frame profile-song-player-embed ${embed.aspect}`}

          aria-hidden={false}

          style={{ width: '100%', height: '100%', boxSizing: 'border-box' }}

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
