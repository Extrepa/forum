'use client';

import { useState } from 'react';

export default function EditPostPanel({ buttonLabel = 'Edit Post', title = 'Edit', children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="stack">
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="post-link" onClick={() => setOpen((v) => !v)}>
          {open ? 'Close' : buttonLabel}
        </button>
      </div>
      {open ? (
        <section className="card">
          <h3 className="section-title">{title}</h3>
          {children}
        </section>
      ) : null}
    </div>
  );
}

