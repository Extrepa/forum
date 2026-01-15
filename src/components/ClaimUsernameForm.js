'use client';

import { useState } from 'react';

export default function ClaimUsernameForm() {
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [username, setUsername] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ type: 'loading', message: 'Claiming...' });

    try {
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to claim that username.');
      }

      setStatus({ type: 'success', message: `You are now ${payload.username}.` });
      setUsername('');
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  return (
    <form onSubmit={submit} className="card">
      <label>
        <div className="muted">Username (lowercase, 3 to 20 chars)</div>
        <input
          name="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="errlmember"
          required
        />
      </label>
      <button type="submit" disabled={status.type === 'loading'}>
        Claim username
      </button>
      {status.type !== 'idle' ? (
        <div className="notice">{status.message}</div>
      ) : null}
    </form>
  );
}
