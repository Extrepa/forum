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
  const minMs = opts.minMs ?? 800;
  const maxMs = opts.maxMs ?? 1200;

  const [placeholder, setPlaceholder] = useState(() => suggestions[0] ?? '');
  const lastRef = useRef(null);
  const reduced = useMemo(() => prefersReducedMotion(), []);

  useEffect(() => {
    if (!isActive) return;
    if (reduced) {
      // Static placeholder when reduced motion is preferred
      setPlaceholder(suggestions[0] ?? '');
      return;
    }
    if (!suggestions.length) return;

    // Set immediately so it feels alive
    setPlaceholder((prev) => {
      const next = pickNext(suggestions, prev);
      lastRef.current = next;
      return next;
    });

    let timer;

    const tick = () => {
      setPlaceholder((prev) => {
        const next = pickNext(suggestions, prev);
        lastRef.current = next;
        return next;
      });
      const delay = Math.floor(minMs + Math.random() * (maxMs - minMs));
      timer = window.setTimeout(tick, delay);
    };

    const delay = Math.floor(minMs + Math.random() * (maxMs - minMs));
    timer = window.setTimeout(tick, delay);

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [isActive, reduced, suggestions, minMs, maxMs]);

  return placeholder;
}
