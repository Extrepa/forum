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
    fontSize: '13px',
    padding: '7px 12px',
    minWidth: '92px',
    minHeight: '40px',
    lineHeight: 1.2,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
  };

  return (
    <button type="button" className="button" onClick={handleButtonClick} style={compactStyle}>
      {buttonLabel}
    </button>
  );
}
