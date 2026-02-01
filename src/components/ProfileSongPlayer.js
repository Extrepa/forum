'use client';

import { useRef, useState, useEffect, useId } from 'react';
import { safeEmbedFromUrl, parseYouTubeId } from '../lib/embeds';

const SOUNDCLOUD_API = 'https://w.soundcloud.com/player/api.js';
const YOUTUBE_API = 'https://www.youtube.com/iframe_api';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      if (src === YOUTUBE_API && window.YT?.ready) {
        window.YT.ready(resolve);
      } else {
        resolve();
      }
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function songNameFromUrl(url) {
  try {
    const path = new URL(url).pathname;
    const segment = path.split('/').filter(Boolean).pop() || '';
    return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Song';
  } catch {
    return 'Song';
  }
}

export default function ProfileSongPlayer({ provider, songUrl, autoPlay = false, providerLabel = 'Song' }) {
  const iframeRef = useRef(null);
  const youtubeId = useId();
  const [soundcloudWidget, setSoundcloudWidget] = useState(null);
  const [youtubePlayer, setYoutubePlayer] = useState(null);

  const embed = safeEmbedFromUrl(provider, songUrl, 'auto', autoPlay);
  const videoId = provider === 'youtube' ? parseYouTubeId(songUrl) : null;

  // SoundCloud: load API and create widget
  useEffect(() => {
    if (provider !== 'soundcloud' || !iframeRef.current || !embed) return;
    let widget = null;
    loadScript(SOUNDCLOUD_API)
      .then(() => {
        if (typeof window.SC !== 'undefined' && window.SC.Widget && iframeRef.current) {
          widget = window.SC.Widget(iframeRef.current);
          widget.bind(window.SC.Widget.Events.READY, () => {
            setSoundcloudWidget(widget);
          });
        }
      })
      .catch(() => {});
    return () => {
      if (widget && widget.unbind) {
        try {
          widget.unbind(window.SC.Widget.Events.READY);
        } catch (_) {}
      }
    };
  }, [provider, embed]); // Removed autoPlay from dependencies as it's handled by embed URL

  // YouTube: load IFrame API and create player
  useEffect(() => {
    if (provider !== 'youtube' || !videoId) return;
    const container = document.getElementById(youtubeId);
    if (!container) return;
    let player = null;
    const initPlayer = () => {
      if (!window.YT?.Player) return;
      player = new window.YT.Player(youtubeId, {
        videoId,
        height: 166,
        width: '100%',
        playerVars: { autoplay: 0, modestbranding: 1 }, // Autoplay handled by embed URL
        events: {
          onReady(e) {
            const playerInstance = e.target;
            setYoutubePlayer(playerInstance);
          },
        },
      });
    };
    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      loadScript(YOUTUBE_API).then(() => {
        if (window.YT?.ready) window.YT.ready(initPlayer);
        else if (window.YT?.Player) initPlayer();
      });
    }
    return () => {
      if (player?.destroy) player.destroy();
    };
  }, [provider, videoId]); // Removed autoPlay from dependencies

  if (!embed && provider !== 'youtube') return null;
  if (provider === 'youtube' && !videoId) return null;

  return (
    <div className={`profile-song-player neon-outline-card profile-song-player--${provider}`} style={{ marginTop: '12px', position: 'relative', width: '100%', maxWidth: '400px', borderRadius: '8px', height: embed.height ? embed.height : 'auto' }}>
      {provider === 'soundcloud' && embed && (
        <div
          className={`embed-frame profile-song-player-embed ${embed.aspect}`}
          aria-hidden={false}
          style={{ position: 'relative', width: '100%', height: embed.height ? embed.height : '100%' }}
        >
          <iframe
            ref={iframeRef}
            src={embed.src}
            title="Profile song"
            allow={embed.allow}
            allowFullScreen={embed.allowFullScreen}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '0',
            }}
          />
        </div>
      )}
      {provider === 'youtube' && (
        <div
          id={youtubeId}
          className="embed-frame profile-song-player-embed"
          style={{ position: 'relative', width: '100%', height: embed.height ? embed.height : '100%', minHeight: '166px' }}
          aria-hidden={false}
        />
      )}
    </div>
  );
}
