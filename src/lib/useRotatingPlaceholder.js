'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

function pickNext(list, last) {
  if (list.length === 0) return '';
  if (list.length === 1) return list[0];

  // Avoid repeating the same value twice in a row when possible
  let next = list[Math.floor(Math.random() * list.length)];
  if (last && list.length > 1) {
    let guard = 0;
    while (next === last && guard++ < 10) {
      next = list[Math.floor(Math.random() * list.length)];
    }
  }
  return next;
}

export function useRotatingPlaceholder(
  suggestions,
  isActive,
  opts = {}
) {
  const minMs = opts.minMs ?? 3000;
  const maxMs = opts.maxMs ?? 4500;
  const fadeDuration = 600; // Duration for fade in/out

  const [placeholder, setPlaceholder] = useState(() => suggestions[0] ?? '');
  const [opacity, setOpacity] = useState(1);
  const lastRef = useRef(null);
  const reduced = useMemo(() => prefersReducedMotion(), []);

  useEffect(() => {
    if (!isActive) {
      setOpacity(1);
      return;
    }
    if (reduced) {
      // Static placeholder when reduced motion is preferred
      setPlaceholder(suggestions[0] ?? '');
      setOpacity(1);
      return;
    }
    if (!suggestions.length) return;

    // Set immediately so it feels alive
    setPlaceholder((prev) => {
      const next = pickNext(suggestions, prev);
      lastRef.current = next;
      return next;
    });
    setOpacity(1);

    let timer;
    let fadeTimer;

    const tick = () => {
      // Fade out
      setOpacity(0);
      
      // After fade out, change placeholder and fade in
      fadeTimer = window.setTimeout(() => {
        setPlaceholder((prev) => {
          const next = pickNext(suggestions, prev);
          lastRef.current = next;
          return next;
        });
        // Small delay before fading in for smoother transition
        setTimeout(() => {
          setOpacity(1);
        }, 50);
      }, fadeDuration / 2);

      // Schedule next change
      const delay = Math.floor(minMs + Math.random() * (maxMs - minMs));
      timer = window.setTimeout(tick, delay);
    };

    // Initial delay before first change
    const initialDelay = Math.floor(minMs + Math.random() * (maxMs - minMs));
    timer = window.setTimeout(tick, initialDelay);

    return () => {
      if (timer) window.clearTimeout(timer);
      if (fadeTimer) window.clearTimeout(fadeTimer);
    };
  }, [isActive, reduced, suggestions, minMs, maxMs]);

  return { placeholder, opacity };
}
