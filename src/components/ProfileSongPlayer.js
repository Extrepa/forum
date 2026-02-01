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
  const [isPlaying, setIsPlaying] = useState(!!autoPlay);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const userPausedRef = useRef(false);
  const autoplayTimeoutsRef = useRef([]);

  /* Always use auto_play=false in embed URL; we start playback from JS so user pause wins */
  const embed = safeEmbedFromUrl(provider, songUrl, 'auto', autoPlay);
  const videoId = provider === 'youtube' ? parseYouTubeId(songUrl) : null;
  const songName = songNameFromUrl(songUrl);

  const clearAutoplayTimeouts = () => {
    autoplayTimeoutsRef.current.forEach((id) => clearTimeout(id));
    autoplayTimeoutsRef.current = [];
  };

  // SoundCloud: load API and bind to iframe; autoplay only once, never overwrite user pause
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
            if (autoPlay && !userPausedRef.current) {
              clearAutoplayTimeouts();
              const t1 = setTimeout(() => {
                if (userPausedRef.current) return;
                try { widget.play(); } catch (_) {}
              }, 400);
              autoplayTimeoutsRef.current.push(t1);
            }
          });
          widget.bind(window.SC.Widget.Events.PLAY, () => {
            if (!userPausedRef.current) setIsPlaying(true);
          });
          widget.bind(window.SC.Widget.Events.PAUSE, () => setIsPlaying(false));
          widget.bind(window.SC.Widget.Events.FINISH, () => {
            setIsPlaying(false);
            setProgress(0);
          });
          if (window.SC.Widget.Events.PLAY_PROGRESS) {
            widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, (e) => {
              const p = e?.relativePosition != null
                ? Math.min(1, Math.max(0, Number(e.relativePosition)))
                : (e?.currentPosition != null && e?.soundDuration != null && e.soundDuration > 0
                  ? Math.min(1, Math.max(0, e.currentPosition / e.soundDuration))
                  : null);
              if (typeof p === 'number' && !Number.isNaN(p)) setProgress(p);
            });
          }
        } else {
          setReady(true);
        }
      })
      .catch(() => setReady(true));
    return () => {
      clearAutoplayTimeouts();
      if (widget && widget.unbind) {
        try {
          widget.unbind(window.SC.Widget.Events.READY);
          if (window.SC.Widget.Events.PLAY_PROGRESS) widget.unbind(window.SC.Widget.Events.PLAY_PROGRESS);
        } catch (_) {}
      }
    };
  }, [provider, embed, autoPlay]);

  // YouTube: load IFrame API and create player; autoplay only if user hasn't paused
  useEffect(() => {
    if (provider !== 'youtube' || !videoId) return;
    const container = document.getElementById(youtubeId);
    if (!container) return;
    let player = null;
    let autoplayT = null;
    const initPlayer = () => {
      if (!window.YT?.Player) return;
      player = new window.YT.Player(youtubeId, {
        videoId,
        height: 166,
        width: '100%',
        playerVars: { autoplay: 0, modestbranding: 1 },
        events: {
          onReady(e) {
            const playerInstance = e.target;
            setYoutubePlayer(playerInstance);
            setReady(true);
            if (autoPlay && !userPausedRef.current) {
              autoplayT = setTimeout(() => {
                if (userPausedRef.current) return;
                try { playerInstance.playVideo?.(); } catch (_) {}
              }, 200);
            }
          },
          onStateChange(e) {
            const state = e?.data;
            if (state === 1) {
              if (!userPausedRef.current) setIsPlaying(true);
            } else if (state === 2 || state === 0) {
              setIsPlaying(false);
              if (state === 0) setProgress(0);
            }
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
      if (autoplayT) clearTimeout(autoplayT);
      if (player?.destroy) player.destroy();
    };
  }, [provider, videoId, autoPlay, youtubeId]);

  // YouTube progress polling when playing
  useEffect(() => {
    if (provider !== 'youtube' || !youtubePlayer || !isPlaying) return;
    const interval = setInterval(() => {
      try {
        const current = youtubePlayer.getCurrentTime?.();
        const duration = youtubePlayer.getDuration?.();
        if (typeof current === 'number' && typeof duration === 'number' && duration > 0) {
          setProgress(Math.min(1, Math.max(0, current / duration)));
        }
      } catch (_) {}
    }, 500);
    return () => clearInterval(interval);
  }, [provider, youtubePlayer, isPlaying]);

  const handlePlay = () => {
    userPausedRef.current = false;
    clearAutoplayTimeouts();
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
    userPausedRef.current = true;
    clearAutoplayTimeouts();
    if (soundcloudWidget) {
      soundcloudWidget.pause();
      setIsPlaying(false);
    }
    if (youtubePlayer?.pauseVideo) {
      youtubePlayer.pauseVideo();
      setIsPlaying(false);
    }
  };

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (provider === 'soundcloud' && soundcloudWidget && typeof soundcloudWidget.getPaused === 'function') {
      soundcloudWidget.getPaused((paused) => {
        if (paused) {
          userPausedRef.current = false;
          clearAutoplayTimeouts();
          soundcloudWidget.play();
          setIsPlaying(true);
        } else {
          userPausedRef.current = true;
          clearAutoplayTimeouts();
          soundcloudWidget.pause();
          setIsPlaying(false);
        }
      });
      return;
    }
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  if (!embed && provider !== 'youtube') return null;
  if (provider === 'youtube' && !videoId) return null;

  const displaySongName = (songUrl.length > 42 ? `${songUrl.slice(0, 39)}…` : songUrl);

  return (
    <div className="profile-song-player neon-outline-card" style={{ marginTop: '12px', position: 'relative', width: '100%', maxWidth: '400px', borderRadius: '8px', overflow: 'hidden' }}>
      {provider === 'soundcloud' && embed && (
        <div
          className={`embed-frame profile-song-player-embed ${embed.aspect}`}
          aria-hidden={false}
          style={{ position: 'absolute', inset: 0 }}
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
          style={{ position: 'absolute', inset: 0, height: '100%', minHeight: '166px' }}
          aria-hidden={false}
        />
      )}

      <div className="profile-song-player-overlay" style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.6) 100%)' }}>
        <div className="profile-song-player-top-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span className="profile-song-player-provider" style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{providerLabel}</span>
          <span className="profile-song-player-name" style={{ fontSize: '14px', fontWeight: '500', marginTop: '2px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'white' }}>
            <a href={songUrl} target="_blank" rel="noopener noreferrer" className="profile-song-link" title={songUrl} style={{ color: 'inherit', textDecoration: 'none' }}>
              {songName}
            </a>
          </span>
        </div>
        <div className="profile-song-player-bottom-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={handleToggle}
            className="profile-song-player-btn"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            aria-pressed={isPlaying}
            style={{ color: '#ffffff', zIndex: 11, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(5px)' }}
          >
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" style={{ display: 'block', flexShrink: 0 }}>
                <title>Pause</title>
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" style={{ display: 'block', flexShrink: 0 }}>
                <title>Play</title>
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <div className="profile-song-player-progress-wrap" role="presentation" aria-hidden="true" style={{ flexGrow: 1, marginLeft: '10px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}>
            <div className="profile-song-player-progress-track" style={{ height: '100%', background: 'transparent' }} />
            <div className="profile-song-player-progress-fill" style={{ width: `${progress * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: '2px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
