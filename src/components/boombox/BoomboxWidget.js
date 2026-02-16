'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { detectProviderFromUrl, safeEmbedFromUrl } from '../../lib/embeds';
import { getSongProviderMeta } from '../../lib/songProviders';
import { loadBoomboxState, saveBoomboxState } from './storage';
import './BoomboxWidget.css';

const DEFAULT_STATE = {
  pos: { x: 16, y: 120 },
  minimized: false,
  queue: [],
  activeIndex: 0,
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/** Parse URL into track using forum's embeds.js; returns { id, provider, sourceUrl, embedUrl, addedAt } or null. */
function parseTrackUrl(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;
  const provider = detectProviderFromUrl(trimmed);
  if (!provider) return null;
  const embed = safeEmbedFromUrl(provider, trimmed, 'auto', false);
  if (!embed || !embed.src) return null;
  return {
    id: (typeof crypto !== 'undefined' && crypto?.randomUUID?.()) ?? String(Date.now()),
    provider: provider === 'youtube-music' ? 'youtube' : provider,
    sourceUrl: trimmed,
    embedUrl: embed.src,
    addedAt: Date.now(),
  };
}

export default function BoomboxWidget() {
  const panelRef = useRef(null);
  const dragRef = useRef({
    dragging: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
  });

  const [state, setState] = useState(DEFAULT_STATE);
  const [input, setInput] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const saved = loadBoomboxState();
    if (saved && typeof saved === 'object') {
      const queue = Array.isArray(saved.queue) ? saved.queue.filter(t => t && t.embedUrl && t.provider) : [];
      const activeIndex = Math.max(0, Math.min(Number(saved.activeIndex) || 0, Math.max(0, queue.length - 1)));
      setState({
        pos: { x: Number(saved.pos?.x) || DEFAULT_STATE.pos.x, y: Number(saved.pos?.y) || DEFAULT_STATE.pos.y },
        minimized: Boolean(saved.minimized),
        queue,
        activeIndex,
      });
    }
  }, []);

  useEffect(() => {
    saveBoomboxState(state);
  }, [state]);

  useEffect(() => {
    function onResize() {
      const el = panelRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - 8;
      const maxY = window.innerHeight - rect.height - 8;
      setState((s) => ({
        ...s,
        pos: {
          x: clamp(s.pos.x, 8, Math.max(8, maxX)),
          y: clamp(s.pos.y, 8, Math.max(8, maxY)),
        },
      }));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const activeTrack = useMemo(
    () => state.queue[state.activeIndex] || null,
    [state.queue, state.activeIndex]
  );

  function addTrackFromInput() {
    setError(null);
    const track = parseTrackUrl(input);
    if (!track) {
      setError("That link doesn't look like YouTube, SoundCloud, or Spotify (yet).");
      return;
    }
    setState((s) => ({
      ...s,
      queue: [...s.queue, track],
      activeIndex: s.queue.length === 0 ? 0 : s.activeIndex,
    }));
    setInput('');
  }

  function removeTrack(idx) {
    setState((s) => {
      const nextQueue = s.queue.filter((_, i) => i !== idx);
      let nextActive = s.activeIndex;
      if (idx < s.activeIndex) nextActive = Math.max(0, s.activeIndex - 1);
      if (idx === s.activeIndex) nextActive = Math.min(nextQueue.length - 1, s.activeIndex);
      if (nextQueue.length === 0) nextActive = 0;
      return { ...s, queue: nextQueue, activeIndex: nextActive };
    });
  }

  function setActive(idx) {
    setState((s) => ({
      ...s,
      activeIndex: clamp(idx, 0, Math.max(0, s.queue.length - 1)),
    }));
  }

  function toggleMin() {
    setState((s) => ({ ...s, minimized: !s.minimized }));
  }

  function onPointerDown(e) {
    if (e.button !== 0 && e.pointerType !== 'touch') return;
    if (!panelRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current.dragging = true;
    dragRef.current.pointerId = e.pointerId;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.startPosX = state.pos.x;
    dragRef.current.startPosY = state.pos.y;
  }

  function onPointerMove(e) {
    if (!dragRef.current.dragging || dragRef.current.pointerId !== e.pointerId) return;
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const nextX = dragRef.current.startPosX + dx;
    const nextY = dragRef.current.startPosY + dy;
    const maxX = window.innerWidth - rect.width - 8;
    const maxY = window.innerHeight - rect.height - 8;
    setState((s) => ({
      ...s,
      pos: {
        x: clamp(nextX, 8, Math.max(8, maxX)),
        y: clamp(nextY, 8, Math.max(8, maxY)),
      },
    }));
  }

  function onPointerUp(e) {
    if (dragRef.current.pointerId !== e.pointerId) return;
    dragRef.current.dragging = false;
    dragRef.current.pointerId = null;
  }

  const providerLabel = (track) =>
    track ? (getSongProviderMeta(track.provider).label || '') : '';

  return (
    <div
      ref={panelRef}
      className={`errl-boombox ${state.minimized ? 'errl-boombox--minimized' : ''}`}
      style={{ left: state.pos.x, top: state.pos.y }}
      aria-label="Errl Boombox"
    >
      <div className="errl-boombox__panel neon-outline-card">
        <div
          className="errl-boombox__dragbar"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div className="errl-boombox__title">
            <span aria-hidden="true">&#x1F50A;</span>
            <span>Errl Boombox</span>
            {activeTrack ? (
              <span className="errl-boombox__title-meta">
                &mdash; {providerLabel(activeTrack)}
              </span>
            ) : (
              <span className="errl-boombox__title-meta errl-boombox__title-meta--idle">
                &mdash; idle drip
              </span>
            )}
          </div>
          <div className="errl-boombox__btns">
            <button
              className="errl-boombox__btn"
              onClick={toggleMin}
              type="button"
            >
              {state.minimized ? 'Open' : 'Min'}
            </button>
          </div>
        </div>

        <div className="errl-boombox__body">
          <div className="errl-boombox__add">
            <input
              className="errl-boombox__input"
              placeholder="Paste a YouTube / SoundCloud / Spotify link..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTrackFromInput();
              }}
            />
            <button
              className="errl-boombox__btn"
              onClick={addTrackFromInput}
              type="button"
            >
              Add
            </button>
          </div>

          {error && (
            <div className="errl-boombox__error">&#x26A0;&#xFE0F; {error}</div>
          )}

          <div className="errl-boombox__queue">
            {state.queue.length === 0 ? (
              <div className="errl-boombox__queue-empty">
                Queue is empty. Feed the boombox a link. It hungers.
              </div>
            ) : (
              state.queue.map((t, idx) => (
                <div
                  key={t.id}
                  className={`errl-boombox__track ${idx === state.activeIndex ? 'errl-boombox__track--active' : ''}`}
                >
                  <div
                    className="errl-boombox__trackLeft"
                    role="button"
                    tabIndex={0}
                    onClick={() => setActive(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActive(idx);
                      }
                    }}
                    aria-label={idx === state.activeIndex ? `Now playing: ${t.title || t.sourceUrl}` : `Play: ${t.title || t.sourceUrl}`}
                  >
                    <div className="errl-boombox__trackName">
                      {t.title || t.sourceUrl}
                    </div>
                    <div className="errl-boombox__trackMeta">
                      {providerLabel(t)}
                      {idx === state.activeIndex ? ' \u2022 Now' : ''}
                    </div>
                  </div>
                  <div className="errl-boombox__trackActions">
                    <button
                      className="errl-boombox__btn"
                      onClick={() => setActive(idx)}
                      type="button"
                    >
                      Play
                    </button>
                    <button
                      className="errl-boombox__btn"
                      onClick={() => removeTrack(idx)}
                      type="button"
                    >
                      &#xD7;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {activeTrack && (
            <iframe
              className="errl-boombox__player"
              src={activeTrack.embedUrl}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title={`Player - ${providerLabel(activeTrack)}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
