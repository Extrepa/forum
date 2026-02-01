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

export default function ProfileSongPlayer({ provider, songUrl, autoPlay = false, providerLabel = 'Song' }) {
  const iframeRef = useRef(null);
  const youtubeId = useId();
  const [soundcloudWidget, setSoundcloudWidget] = useState(null);
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(!!autoPlay);
  const [ready, setReady] = useState(false);

  const embed = safeEmbedFromUrl(provider, songUrl, 'auto', autoPlay);
  const videoId = provider === 'youtube' ? parseYouTubeId(songUrl) : null;

  // SoundCloud: load API and bind to iframe
  useEffect(() => {
    if (provider !== 'soundcloud' || !iframeRef.current || !embed) return;
    let widget = null;
    loadScript(SOUNDCLOUD_API)
      .then(() => {
        if (typeof window.SC !== 'undefined' && window.SC.Widget && iframeRef.current) {
          widget = window.SC.Widget(iframeRef.current);
          widget.bind(window.SC.Widget.Events.READY, () => {
            setSoundcloudWidget(widget);
            setReady(true);
            if (autoPlay) setTimeout(() => { try { widget.play(); } catch (_) {} }, 150);
          });
          widget.bind(window.SC.Widget.Events.PLAY, () => setIsPlaying(true));
          widget.bind(window.SC.Widget.Events.PAUSE, () => setIsPlaying(false));
          widget.bind(window.SC.Widget.Events.FINISH, () => setIsPlaying(false));
        } else {
          setReady(true);
        }
      })
      .catch(() => setReady(true));
    return () => {
      if (widget && widget.unbind) widget.unbind(window.SC.Widget.Events.READY);
    };
  }, [provider, embed, autoPlay]);

  // YouTube: load IFrame API and create player (needs a div with stable id)
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
        playerVars: { autoplay: autoPlay ? 1 : 0, modestbranding: 1 },
        events: {
          onReady(e) {
            const playerInstance = e.target;
            setYoutubePlayer(playerInstance);
            setReady(true);
            if (autoPlay) setTimeout(() => { try { playerInstance.playVideo?.(); } catch (_) {} }, 150);
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
  }, [provider, videoId, autoPlay, youtubeId]);

  const handlePlay = () => {
    if (soundcloudWidget) {
      soundcloudWidget.play();
      setIsPlaying(true);
    }
    if (youtubePlayer?.playVideo) {
      youtubePlayer.playVideo();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (soundcloudWidget) {
      soundcloudWidget.pause();
      setIsPlaying(false);
    }
    if (youtubePlayer?.pauseVideo) {
      youtubePlayer.pauseVideo();
      setIsPlaying(false);
    }
  };

  const handleToggle = () => {
    if (isPlaying) handlePause();
    else handlePlay();
  };

  const linkLabel = songUrl.length > 42 ? `${songUrl.slice(0, 39)}…` : songUrl;

  if (!embed && provider !== 'youtube') return null;
  if (provider === 'youtube' && !videoId) return null;

  return (
    <div className="profile-song-player" style={{ marginTop: '12px', width: '100%', maxWidth: '400px' }}>
      <div className="profile-song-player-bar">
        <button
          type="button"
          onClick={handleToggle}
          className="profile-song-player-btn"
          title={isPlaying ? 'Pause' : 'Play'}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <span className="profile-song-player-label">{providerLabel}</span>
        <a
          href={songUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="profile-song-player-link"
          title={songUrl}
        >
          {linkLabel}
        </a>
      </div>
      {provider === 'soundcloud' && embed && (
        <div className={`embed-frame profile-song-player-embed ${embed.aspect}`}>
          <iframe
            ref={iframeRef}
            src={embed.src}
            title="Profile song"
            allow={embed.allow}
            allowFullScreen={embed.allowFullScreen}
            style={{ width: '100%', border: 'none', borderRadius: '8px' }}
            {...(embed.height ? { height: embed.height, minHeight: embed.height } : {})}
          />
        </div>
      )}
      {provider === 'youtube' && (
        <div id={youtubeId} className="embed-frame profile-song-player-embed" style={{ height: 166, minHeight: 166 }} />
      )}
    </div>
  );
}
