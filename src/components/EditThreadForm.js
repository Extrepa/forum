'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EditThreadForm({ threadId, initialTitle, initialBody, onCancel }) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('body', body);

    try {
      const response = await fetch(`/api/forum/${threadId}/edit`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        if (onCancel) {
          onCancel();
        } else {
          router.refresh();
        }
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update thread');
      }
    } catch (e) {
      alert('Error updating thread');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
      <label>
        <div className="muted">Title</div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ width: '100%', marginBottom: '12px' }}
        />
      </label>
      <label>
        <div className="muted">Body</div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          style={{ width: '100%', minHeight: '120px', marginBottom: '12px' }}
        />
      </label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" disabled={isSubmitting} className="button">
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="button" style={{ background: 'rgba(2, 7, 10, 0.6)' }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
