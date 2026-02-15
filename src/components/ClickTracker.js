'use client';

import { useEffect } from 'react';

function readLabel(element) {
  if (!element) return null;
  const aria = element.getAttribute('aria-label');
  if (aria && aria.trim()) return aria.trim().slice(0, 240);
  const title = element.getAttribute('title');
  if (title && title.trim()) return title.trim().slice(0, 240);
  const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, 240) : null;
}

function sendClickEvent(payload) {
  const body = JSON.stringify(payload);
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    const sent = navigator.sendBeacon('/api/telemetry/click', blob);
    if (sent) return;
  }
  fetch('/api/telemetry/click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true
  }).catch(() => {});
}

export default function ClickTracker() {
  useEffect(() => {
    const onClick = (event) => {
      const target = event.target;
      if (!target || !(target instanceof Element)) return;

      const clickable = target.closest(
        'a,button,summary,[role="button"],input[type="button"],input[type="submit"]'
      );
      if (!clickable) return;

      const hrefValue = clickable instanceof HTMLAnchorElement
        ? clickable.href
        : clickable.getAttribute('href');

      sendClickEvent({
        path: `${window.location.pathname}${window.location.search || ''}`,
        href: hrefValue || null,
        tagName: clickable.tagName.toLowerCase(),
        label: readLabel(clickable),
        createdAt: Date.now()
      });
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
