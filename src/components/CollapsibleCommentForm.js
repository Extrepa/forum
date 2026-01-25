'use client';

import { useState } from 'react';

export default function CollapsibleCommentForm({ 
  action, 
  buttonLabel = 'Post comment',
  placeholder = 'Drop your thoughts into the goo...',
  labelText = 'What would you like to say?',
  hiddenFields = {},
  children
}) {
  const [showForm, setShowForm] = useState(false);
  
  if (!showForm) {
    return (
      <div style={{ marginTop: '24px' }}>
        <button type="button" onClick={() => setShowForm(true)}>
          {buttonLabel}
        </button>
      </div>
    );
  }
  
  return (
    <div style={{ marginTop: '24px' }}>
    <form action={action} method="post">
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <label>
        <div className="muted">{labelText}</div>
        <textarea name="body" placeholder={placeholder} required />
      </label>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="submit">{buttonLabel}</button>
        <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
      </div>
      {children}
    </form>
    </div>
  );
}
