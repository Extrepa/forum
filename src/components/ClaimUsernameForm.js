'use client';

import { useEffect, useState } from 'react';
import Username from './Username';
import { getUsernameColorIndex } from '../lib/usernameColor';

export default function ClaimUsernameForm() {
  const [status, setStatus] = useState({ type: 'idle', message: null });
  const [mode, setMode] = useState('signup'); // signup | login

  const [me, setMe] = useState(null);

  // signup
  const [signupEmail, setSignupEmail] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // login (email or username for legacy users)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // account settings
  const [newEmail, setNewEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [notifyEmailEnabled, setNotifyEmailEnabled] = useState(false);
  const [notifySmsEnabled, setNotifySmsEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch('/api/auth/me', { method: 'GET' });
        const payload = await response.json();
        if (!active) {
          return;
        }
        setMe(payload.user || null);
        setNotifyEmailEnabled(!!payload.user?.notifyEmailEnabled);
        setNotifySmsEnabled(!!payload.user?.notifySmsEnabled);
      } catch (error) {
        // ignore, stays claimable
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const refreshMe = async () => {
    try {
      const response = await fetch('/api/auth/me', { method: 'GET' });
      const payload = await response.json();
      setMe(payload.user || null);
      setNotifyEmailEnabled(!!payload.user?.notifyEmailEnabled);
      setNotifySmsEnabled(!!payload.user?.notifySmsEnabled);
    } catch (error) {
      setMe(null);
    }
  };

  const submitNotificationPrefs = async (event) => {
    event.preventDefault();
    setStatus({ type: 'loading', message: 'Saving notification settings...' });
    try {
      const response = await fetch('/api/auth/notification-prefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailEnabled: notifyEmailEnabled, smsEnabled: notifySmsEnabled })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to save notification settings.');
      }
      setStatus({ type: 'success', message: 'Notification settings saved.' });
      await refreshMe();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  const submitSignup = async (event) => {
    event.preventDefault();
    setStatus({ type: 'loading', message: 'Creating account...' });

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail,
          username: signupUsername,
          password: signupPassword
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to claim that username.');
      }

      setStatus({ type: 'success', message: 'Account created.' });
      setSignupEmail('');
      setSignupUsername('');
      setSignupPassword('');
      await refreshMe();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    setStatus({ type: 'loading', message: 'Signing in...' });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to sign in.');
      }

      setStatus({ type: 'success', message: 'Signed in.' });
      setLoginIdentifier('');
      setLoginPassword('');
      await refreshMe();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  const submitLogout = async () => {
    setStatus({ type: 'loading', message: 'Signing out...' });
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      // ignore
    }
    setStatus({ type: 'idle', message: null });
    await refreshMe();
  };

  const submitSetEmail = async (event) => {
    event.preventDefault();
    setStatus({ type: 'loading', message: 'Saving email...' });
    try {
      const response = await fetch('/api/auth/set-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to set email.');
      }
      setStatus({ type: 'success', message: 'Email saved.' });
      setNewEmail('');
      await refreshMe();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  const submitChangePassword = async (event) => {
    event.preventDefault();
    setStatus({ type: 'loading', message: 'Changing password...' });
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to change password.');
      }
      setStatus({ type: 'success', message: 'Password updated.' });
      setOldPassword('');
      setNewPassword('');
      await refreshMe();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  if (me?.username) {
    const colorIndex = getUsernameColorIndex(me.username);
    return (
      <div className="card">
        <div className="notice">
          Signed in as <Username name={me.username} colorIndex={colorIndex} />
        </div>
        {me.mustChangePassword ? (
          <p className="muted">You must change your password before posting.</p>
        ) : (
          <p className="muted">Your session is active on this device.</p>
        )}

        <div className="stack" style={{ gap: 12 }}>
          <form onSubmit={submitNotificationPrefs} className="card" style={{ padding: 12 }}>
            <div className="muted" style={{ marginBottom: 8 }}>
              Notification preferences (external sending is not enabled yet)
            </div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span>Email notifications</span>
              <input
                type="checkbox"
                checked={notifyEmailEnabled}
                onChange={(e) => setNotifyEmailEnabled(e.target.checked)}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span>Text (SMS) notifications</span>
              <input
                type="checkbox"
                checked={notifySmsEnabled}
                onChange={(e) => setNotifySmsEnabled(e.target.checked)}
              />
            </label>
            <button type="submit" disabled={status.type === 'loading'}>
              Save notification settings
            </button>
          </form>

          <form onSubmit={submitSetEmail} className="card" style={{ padding: 12 }}>
            <label>
              <div className="muted">Email</div>
              <input
                name="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder={me.email || 'you@example.com'}
                required
              />
            </label>
            <button type="submit" disabled={status.type === 'loading'}>
              Set email
            </button>
          </form>

          <form onSubmit={submitChangePassword} className="card" style={{ padding: 12 }}>
            {!me.mustChangePassword ? (
              <label>
                <div className="muted">Old password</div>
                <input
                  name="oldPassword"
                  type="password"
                  value={oldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                  placeholder="Current password"
                  required
                />
              </label>
            ) : null}
            <label>
              <div className="muted">New password</div>
              <input
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="New password (8+ chars)"
                required
              />
            </label>
            <button type="submit" disabled={status.type === 'loading'}>
              Change password
            </button>
          </form>

          <button type="button" onClick={submitLogout} disabled={status.type === 'loading'}>
            Sign out
          </button>
        </div>

        {status.type !== 'idle' ? <div className="notice">{status.message}</div> : null}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="stack" style={{ gap: 12 }}>
        <div className="list" style={{ marginTop: 0 }}>
          <button
            type="button"
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => {
              setStatus({ type: 'idle', message: null });
              setMode('signup');
            }}
          >
            Create account
          </button>
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setStatus({ type: 'idle', message: null });
              setMode('login');
            }}
          >
            Sign in
          </button>
        </div>

        {mode === 'signup' ? (
          <form onSubmit={submitSignup} className="card" style={{ padding: 12 }}>
            <label>
              <div className="muted">Email</div>
              <input
                name="email"
                value={signupEmail}
                onChange={(event) => setSignupEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label>
              <div className="muted">Username (lowercase, 3 to 20 chars)</div>
              <input
                name="username"
                value={signupUsername}
                onChange={(event) => setSignupUsername(event.target.value)}
                placeholder="errlmember"
                required
              />
            </label>
            <label>
              <div className="muted">Password (8+ chars)</div>
              <input
                name="password"
                type="password"
                value={signupPassword}
                onChange={(event) => setSignupPassword(event.target.value)}
                placeholder="Password"
                required
              />
            </label>
            <button type="submit" disabled={status.type === 'loading'}>
              Create account
            </button>
          </form>
        ) : (
          <form onSubmit={submitLogin} className="card" style={{ padding: 12 }}>
            <label>
              <div className="muted">Email (or username for legacy accounts)</div>
              <input
                name="identifier"
                value={loginIdentifier}
                onChange={(event) => setLoginIdentifier(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label>
              <div className="muted">Password</div>
              <input
                name="password"
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="Password"
                required
              />
            </label>
            <button type="submit" disabled={status.type === 'loading'}>
              Sign in
            </button>
          </form>
        )}

        {status.type !== 'idle' ? <div className="notice">{status.message}</div> : null}
      </div>
    </div>
  );
}
