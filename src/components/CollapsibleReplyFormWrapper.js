'use client';

import { useState, useEffect } from 'react';
import ReplyForm from './ReplyForm';

export default function CollapsibleReplyFormWrapper({ 
  threadId,
  initialQuotes = [],
  action,
  buttonLabel = 'Post reply'
}) {
  const [showForm, setShowForm] = useState(false);
  
  // Show form if there are initial quotes (user clicked "Quote" on a reply)
  useEffect(() => {
    if (initialQuotes.length > 0) {
      setShowForm(true);
    }
  }, [initialQuotes]);
  
  if (!showForm && initialQuotes.length === 0) {
    return (
      <button type="button" onClick={() => setShowForm(true)}>
        {buttonLabel}
      </button>
    );
  }
  
  return (
    <div>
      <ReplyForm 
        threadId={threadId}
        initialQuotes={initialQuotes}
        action={action}
      />
      {showForm && (
        <div style={{ marginTop: '10px' }}>
          <button type="button" onClick={() => setShowForm(false)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
