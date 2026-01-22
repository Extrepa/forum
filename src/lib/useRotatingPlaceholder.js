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
  const maxMs = opts.maxMs ?? 5000;
  const fadeDuration = 600; // Duration for fade in/out

  // Keep suggestions stable (prevents effect restarts if caller passes new arrays)
  const stableSuggestions = useMemo(() => suggestions, [suggestions.join(',')]);
  const [placeholder, setPlaceholder] = useState(() => stableSuggestions[0] ?? '');
  const [opacity, setOpacity] = useState(1);
  const lastRef = useRef(null);
  const timerRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const reduced = useMemo(() => prefersReducedMotion(), []);

  useEffect(() => {
    // Clear any existing timers
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (fadeTimerRef.current) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }

    if (!isActive) {
      setOpacity(1);
      return;
    }
    if (reduced) {
      // Static placeholder when reduced motion is preferred
      setPlaceholder(stableSuggestions[0] ?? '');
      setOpacity(1);
      return;
    }
    if (!stableSuggestions.length) return;

    // Set initial placeholder
    setPlaceholder(stableSuggestions[0] ?? '');
    setOpacity(1);
    lastRef.current = stableSuggestions[0] ?? null;

    const tick = () => {
      // Fade out completely
      setOpacity(0);
      
      // After full fade out, change placeholder
      fadeTimerRef.current = window.setTimeout(() => {
        const next = pickNext(stableSuggestions, lastRef.current);
        lastRef.current = next;
        setPlaceholder(next);
        
        // Immediately start fading in for smooth crossfade
        // Use requestAnimationFrame to ensure smooth transition
        requestAnimationFrame(() => {
          setOpacity(1);
        });
      }, fadeDuration);

      // Schedule next change AFTER both fade out and fade in complete
      // Total time = fade out + fade in + delay
      const delay = Math.floor(minMs + Math.random() * (maxMs - minMs));
      timerRef.current = window.setTimeout(tick, fadeDuration * 2 + delay);
    };

    // Initial delay before first change (longer to let user see first placeholder)
    const initialDelay = Math.floor(minMs + Math.random() * (maxMs - minMs));
    timerRef.current = window.setTimeout(tick, initialDelay);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (fadeTimerRef.current) {
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    };
  }, [isActive, reduced, stableSuggestions, minMs, maxMs, fadeDuration]);

  return { placeholder, opacity };
}
