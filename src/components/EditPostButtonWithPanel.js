'use client';

import { useState, useEffect } from 'react';

export default function EditPostButtonWithPanel({ buttonLabel = 'Edit Post', panelId = 'edit-post-panel' }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Update panel visibility when state changes
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.style.display = open ? 'block' : 'none';
    }
  }, [open, panelId]);

  const handleButtonClick = () => {
    setOpen((v) => !v);
    // Scroll to panel after a brief delay to ensure it's rendered
    setTimeout(() => {
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  const compactStyle = {
    fontSize: '12px',
    padding: '4px 8px',
    minWidth: '56px',
    maxWidth: '80px',
    minHeight: '44px',
    lineHeight: 1.2,
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflow: 'hidden',
  };

  const parts = (buttonLabel || 'Edit Post').split(/\s+/);
  const twoLine = parts.length >= 2;

  return (
    <button type="button" className="button" onClick={handleButtonClick} style={compactStyle}>
      {twoLine ? (
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
          <span>{parts[0]}</span>
          <span>{parts.slice(1).join(' ')}</span>
        </span>
      ) : (
        buttonLabel
      )}
    </button>
  );
}
