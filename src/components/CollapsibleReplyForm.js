'use client';

import { useState, useEffect, useRef } from 'react';

export default function CollapsibleReplyForm({ 
  action, 
  buttonLabel = 'Post reply',
  placeholder = 'Share your drip-certified thoughts...',
  labelText = 'What would you like to say?',
  hiddenFields = {},
  replyingTo = null,
  replyPrefill = '',
  onCancel,
  allowImageUpload = false
}) {
  const [showForm, setShowForm] = useState(false);
  const [currentReplyingTo, setCurrentReplyingTo] = useState(replyingTo);
  const [currentPrefill, setCurrentPrefill] = useState(replyPrefill);
  const textareaRef = useRef(null);
  const hiddenReplyToRef = useRef(null);
  
  // Show form if replyingTo is set (user clicked "Reply" on a specific comment)
  useEffect(() => {
    if (replyingTo) {
      setShowForm(true);
      setCurrentReplyingTo(replyingTo);
      setCurrentPrefill(replyPrefill);
    }
  }, [replyingTo, replyPrefill]);
  
  // Listen for dynamic reply changes from ReplyButton clicks
  useEffect(() => {
    const handleReplyToChanged = (event) => {
      const { replyId, replyAuthor, replyBody } = event.detail;
      
      // Update the replyingTo state
      setCurrentReplyingTo({ id: replyId, author_name: replyAuthor, body: replyBody });
      
      // Generate prefill text
      const quoteText = `> @${replyAuthor} said:\n${replyBody.split('\n').slice(0, 8).map(l => `> ${l}`).join('\n')}\n\n`;
      setCurrentPrefill(quoteText);
      
      // Update hidden field
      if (hiddenReplyToRef.current) {
        hiddenReplyToRef.current.value = replyId;
      }
      
      // Update textarea
      if (textareaRef.current) {
        textareaRef.current.value = quoteText;
      }
      
      // Show form if it's hidden
      setShowForm(true);
    };
    
    window.addEventListener('replyToChanged', handleReplyToChanged);
    
    return () => {
      window.removeEventListener('replyToChanged', handleReplyToChanged);
    };
  }, []);
  
  if (!showForm && !currentReplyingTo) {
    return (
      <button type="button" onClick={() => setShowForm(true)}>
        {buttonLabel}
      </button>
    );
  }
  
  const handleCancel = () => {
    setShowForm(false);
    setCurrentReplyingTo(null);
    setCurrentPrefill('');
    if (onCancel) {
      onCancel();
    } else if (currentReplyingTo && typeof window !== 'undefined') {
      // If replying to someone, navigate away from reply mode
      const url = new URL(window.location.href);
      url.searchParams.delete('replyTo');
      window.history.pushState({}, '', url.toString());
    }
  };
  
  return (
    <form action={action} method="post" encType={allowImageUpload ? "multipart/form-data" : undefined}>
      {Object.entries(hiddenFields).map(([name, value]) => {
        // Use ref for reply_to_id so we can update it dynamically
        if (name === 'reply_to_id') {
          return (
            <input 
              key={name} 
              ref={hiddenReplyToRef}
              type="hidden" 
              name={name} 
              value={currentReplyingTo?.id || value || ''} 
            />
          );
        }
        return (
          <input key={name} type="hidden" name={name} value={value || ''} />
        );
      })}
      <label>
        <div className="muted" style={{ marginBottom: '8px' }}>
          {currentReplyingTo ? `Replying to ${currentReplyingTo.author_name}` : labelText}
        </div>
        <textarea 
          ref={textareaRef}
          name="body" 
          placeholder={currentReplyingTo ? 'Write your reply…' : placeholder} 
          required={!allowImageUpload}
          defaultValue={currentPrefill}
          style={{ marginBottom: '0' }}
        />
      </label>
      {allowImageUpload && (
        <label style={{ marginTop: '-8px', display: 'block' }}>
          <div className="muted" style={{ marginTop: '8px', marginBottom: '8px' }}>Image (optional)</div>
          <input name="image" type="file" accept="image/*" />
        </label>
      )}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button type="submit">{buttonLabel}</button>
        <button type="button" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
