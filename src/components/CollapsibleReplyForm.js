'use client';

import { useState, useEffect } from 'react';

export default function CollapsibleReplyForm({ 
  action, 
  buttonLabel = 'Post reply',
  placeholder = 'Share your goo-certified thoughts...',
  labelText = 'What would you like to say?',
  hiddenFields = {},
  replyingTo = null,
  replyPrefill = '',
  onCancel
}) {
  const [showForm, setShowForm] = useState(false);
  
  // Show form if replyingTo is set (user clicked "Reply" on a specific comment)
  useEffect(() => {
    if (replyingTo) {
      setShowForm(true);
    }
  }, [replyingTo]);
  
  if (!showForm && !replyingTo) {
    return (
      <button type="button" onClick={() => setShowForm(true)}>
        {buttonLabel}
      </button>
    );
  }
  
  const handleCancel = () => {
    setShowForm(false);
    if (onCancel) {
      onCancel();
    } else if (replyingTo && typeof window !== 'undefined') {
      // If replying to someone, navigate away from reply mode
      const url = new URL(window.location.href);
      url.searchParams.delete('replyTo');
      window.location.href = url.toString();
    }
  };
  
  return (
    <form action={action} method="post">
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value || ''} />
      ))}
      <label>
        <div className="muted">{replyingTo ? `Replying to ${replyingTo.author_name}` : labelText}</div>
        <textarea 
          name="body" 
          placeholder={replyingTo ? 'Write your reply…' : placeholder} 
          required
          defaultValue={replyPrefill}
        />
      </label>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button type="submit">{buttonLabel}</button>
        <button type="button" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
