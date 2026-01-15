'use client';

import { useEffect, useState } from 'react';

export default function ClaimUsernameForm() {
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [username, setUsername] = useState('');
  const [lockedName, setLockedName] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch('/api/claim', { method: 'GET' });
        const payload = await response.json();
        if (!active) {
          return;
        }
        if (payload.username) {
          setLockedName(payload.username);
          setStatus({ type: 'success', message: `You are ${payload.username}.` });
        }
      } catch (error) {
        // ignore, stays claimable
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

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
      setLockedName(payload.username);
      setUsername('');
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  if (lockedName) {
    return (
      <div className="card">
        <div className="notice">Username locked: {lockedName}</div>
        <p className="muted">To change it, an admin reset is required.</p>
      </div>
    );
  }

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
