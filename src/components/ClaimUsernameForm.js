'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Username from './Username';
import { getUsernameColorIndex } from '../lib/usernameColor';
import { useUiPrefs } from './UiPrefsProvider';

export default function ClaimUsernameForm({ noCardWrapper = false }) {
  const router = useRouter();
  const [status, setStatus] = useState({ type: 'idle', message: null });
  const [mode, setMode] = useState('login'); // signup | login
  const { loreEnabled, setLoreEnabled } = useUiPrefs();

  const [me, setMe] = useState(null);
  const [editingEmail, setEditingEmail] = useState(false);

  // signup
  const [signupEmail, setSignupEmail] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupNotifyEmail, setSignupNotifyEmail] = useState(true);
  const [signupNotifySms, setSignupNotifySms] = useState(false);

  // login (email or username)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // account settings
  const [newEmail, setNewEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [notifyEmailEnabled, setNotifyEmailEnabled] = useState(false);
  const [notifySmsEnabled, setNotifySmsEnabled] = useState(false);
  const [uiLoreEnabled, setUiLoreEnabled] = useState(false);
  const [defaultLandingPage, setDefaultLandingPage] = useState('feed');

  const validatePassword = (value) => {
    const pw = String(value || '').trim();
    if (pw.length < 8) return 'Password must be at least 8 characters.';
    if (/\s/.test(pw)) return 'Password cannot contain spaces.';
    return null;
  };

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
        setEditingEmail(false);
        setNewEmail(payload.user?.email || '');
        setNewPhone(payload.user?.phone || '');
        setNotifyEmailEnabled(!!payload.user?.notifyEmailEnabled);
        setNotifySmsEnabled(!!payload.user?.notifySmsEnabled);
        setUiLoreEnabled(!!payload.user?.uiLoreEnabled);
        setLoreEnabled(!!payload.user?.uiLoreEnabled);
        setDefaultLandingPage(payload.user?.defaultLandingPage || 'feed');
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
      setEditingEmail(false);
      setNewEmail(payload.user?.email || '');
      setNewPhone(payload.user?.phone || '');
      setNotifyEmailEnabled(!!payload.user?.notifyEmailEnabled);
      setNotifySmsEnabled(!!payload.user?.notifySmsEnabled);
      setUiLoreEnabled(!!payload.user?.uiLoreEnabled);
      setLoreEnabled(!!payload.user?.uiLoreEnabled);
      setDefaultLandingPage(payload.user?.defaultLandingPage || 'feed');
    } catch (error) {
      setMe(null);
    }
  };

  const submitUiPrefs = async (event) => {
    event.preventDefault();
    const envLore = process.env.NEXT_PUBLIC_ERRL_USE_LORE === 'true';
    if (envLore) {
      setStatus({ type: 'success', message: 'Lore mode is forced on by server config.' });
      setUiLoreEnabled(true);
      setLoreEnabled(true);
      return;
    }

    setStatus({ type: 'loading', message: 'Saving display settings...' });
    try {
      const response = await fetch('/api/auth/ui-prefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loreEnabled: !!uiLoreEnabled })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to save display settings.');
      }
      setStatus({ type: 'success', message: 'Display settings saved.' });
      setLoreEnabled(!!payload.uiLoreEnabled);
      await refreshMe();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  const submitLandingPref = async (event) => {
    event.preventDefault();
    setStatus({ type: 'loading', message: 'Saving landing page preference...' });
    try {
      const response = await fetch('/api/auth/landing-pref', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landingPage: defaultLandingPage })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to save landing page preference.');
      }
      setStatus({ type: 'success', message: 'Landing page preference saved.' });
      await refreshMe();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  const submitNotificationPrefs = async (event) => {
    event.preventDefault();
    setStatus({ type: 'loading', message: 'Saving notification settings...' });
    try {
      const phoneTrimmed = String(newPhone || '').trim();
      if (notifySmsEnabled && !phoneTrimmed) {
        throw new Error('Enter a phone number before enabling SMS notifications.');
      }
      const phoneResponse = await fetch('/api/auth/set-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneTrimmed || null })
      });
      const phonePayload = await phoneResponse.json();
      if (!phoneResponse.ok) {
        throw new Error(phonePayload.error || 'Unable to save phone number.');
      }

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
    const trimmedPassword = String(signupPassword || '').trim();
    const pwError = validatePassword(trimmedPassword);
    if (pwError) {
      setStatus({ type: 'error', message: pwError });
      return;
    }
    setStatus({ type: 'loading', message: 'Creating account...' });

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail,
          username: signupUsername,
          password: trimmedPassword,
          notifyEmailEnabled: signupNotifyEmail,
          notifySmsEnabled: signupNotifySms
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
      setSignupNotifyEmail(true);
      setSignupNotifySms(false);
      await refreshMe();
      // Redirect to home page after successful signup
      router.push('/');
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
      // Redirect to home page after successful login
      router.push('/');
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
    if (me?.email && !editingEmail) {
      return;
    }
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
      setEditingEmail(false);
      await refreshMe();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  const submitChangePassword = async (event) => {
    event.preventDefault();
    const trimmedNewPassword = String(newPassword || '').trim();
    const pwError = validatePassword(trimmedNewPassword);
    if (pwError) {
      setStatus({ type: 'error', message: pwError });
      return;
    }
    setStatus({ type: 'loading', message: 'Saving password...' });
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: String(oldPassword || '').trim(), newPassword: trimmedNewPassword })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to change password.');
      }
      setStatus({ type: 'success', message: 'Password saved.' });
      setOldPassword('');
      setNewPassword('');
      await refreshMe();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  if (me?.username) {
    const colorIndex = getUsernameColorIndex(me.username);
    const canConfigureNotifications = !!me.email && !!me.hasPassword;
    const envLore = process.env.NEXT_PUBLIC_ERRL_USE_LORE === 'true';
    const Wrapper = noCardWrapper ? 'div' : 'div';
    const wrapperProps = noCardWrapper ? {} : { className: 'card' };
    return (
      <Wrapper {...wrapperProps}>
        <div className="notice">
          Signed in as <Username name={me.username} colorIndex={colorIndex} />
        </div>
        <p className="muted">Your account is active on this device.</p>

        <div className="account-columns">
          <div className="account-col">
            <form onSubmit={submitSetEmail} className="card" style={{ padding: 12 }}>
              <div className="muted" style={{ marginBottom: 8 }}>
                Email
              </div>
              {me.email && !editingEmail ? (
                <div className="stack" style={{ gap: 10 }}>
                  <input name="email" value={me.email} disabled />
                  <button
                    type="button"
                    onClick={() => {
                      setStatus({ type: 'idle', message: null });
                      setEditingEmail(true);
                      setNewEmail(me.email || '');
                    }}
                    disabled={status.type === 'loading'}
                  >
                    Change email
                  </button>
                </div>
              ) : (
                <div className="stack" style={{ gap: 10 }}>
                  <input
                    name="email"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    placeholder={me.email || 'you@example.com'}
                    required
                  />
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button type="submit" disabled={status.type === 'loading'}>
                      {me.email ? 'Save email' : 'Set email'}
                    </button>
                    {me.email ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEmail(false);
                          setNewEmail(me.email || '');
                        }}
                        disabled={status.type === 'loading'}
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </form>

            <form onSubmit={submitChangePassword} className="card" style={{ padding: 12 }}>
              {me.hasPassword ? (
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
                {me.hasPassword ? 'Change password' : 'Set password'}
              </button>
            </form>

            {canConfigureNotifications ? (
              <form onSubmit={submitNotificationPrefs} className="card" style={{ padding: 12 }}>
                <div className="muted" style={{ marginBottom: 8 }}>
                  Phone Number
                </div>
                <label>
                  <div className="muted">Phone number (required for SMS)</div>
                  <input
                    name="phone"
                    value={newPhone}
                    onChange={(event) => setNewPhone(event.target.value)}
                    placeholder={me.phone || '+15551234567'}
                  />
                </label>
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
                    disabled={!String(newPhone || '').trim()}
                  />
                </label>
                {!String(newPhone || '').trim() ? (
                  <div className="muted" style={{ fontSize: 13 }}>
                    Add a phone number to enable SMS.
                  </div>
                ) : null}
                <button type="submit" disabled={status.type === 'loading'}>
                  Save notification settings
                </button>
              </form>
            ) : null}
          </div>

          <div className="account-col">
            <section className="card" style={{ padding: 12 }}>
              <h3 className="section-title" style={{ marginBottom: '16px' }}>Site Settings</h3>
              
              <form onSubmit={submitUiPrefs} style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                <div className="muted" style={{ marginBottom: 8 }}>
                  Lore Mode
                </div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span>Lore mode</span>
                  <input
                    type="checkbox"
                    checked={envLore ? true : !!uiLoreEnabled}
                    onChange={(e) => {
                      setUiLoreEnabled(e.target.checked);
                      if (!envLore) setLoreEnabled(e.target.checked);
                    }}
                    disabled={envLore || status.type === 'loading'}
                  />
                </label>
                <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
                  {envLore
                    ? 'Forced on by server config.'
                    : loreEnabled
                    ? 'On: microcopy gets more lore-y.'
                    : 'Off: microcopy stays more plain.'}
                </div>
                <button type="submit" disabled={status.type === 'loading'}>
                  Save display settings
                </button>
              </form>

              <form onSubmit={submitLandingPref}>
                <div className="muted" style={{ marginBottom: 8 }}>
                  Default Landing Page
                </div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span>Landing page</span>
                  <select
                    value={defaultLandingPage}
                    onChange={(e) => setDefaultLandingPage(e.target.value)}
                    disabled={status.type === 'loading'}
                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(52, 225, 255, 0.2)', background: 'rgba(2, 7, 10, 0.4)', color: 'var(--ink)' }}
                  >
                    <option value="feed">Feed</option>
                    <option value="home">Home</option>
                  </select>
                </label>
                <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
                  Choose which page loads when you visit the site.
                </div>
                <button type="submit" disabled={status.type === 'loading'}>
                  Save landing page preference
                </button>
              </form>

              <div style={{ 
                marginTop: '24px', 
                paddingTop: '24px', 
                borderTop: '1px solid var(--border)',
                opacity: 0.5,
                pointerEvents: 'none',
                cursor: 'not-allowed'
              }}>
                <div className="muted" style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                  Future Settings
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="muted" style={{ fontSize: 13 }}>Feed preferences</div>
                  <div className="muted" style={{ fontSize: 13 }}>Notification preferences</div>
                  <div className="muted" style={{ fontSize: 13 }}>Color settings</div>
                  <div className="muted" style={{ fontSize: 13 }}>Movement/animation settings</div>
                </div>
              </div>
            </section>

            <button type="button" onClick={submitLogout} disabled={status.type === 'loading'} style={{ marginTop: '16px' }}>
              Sign out
            </button>
          </div>
        </div>

        {status.type !== 'idle' ? <div className="notice">{status.message}</div> : null}
      </Wrapper>
    );
  }

  const Wrapper = noCardWrapper ? 'div' : 'div';
  const wrapperProps = noCardWrapper ? {} : { className: 'card' };
  return (
    <Wrapper {...wrapperProps} style={noCardWrapper ? {} : { padding: '20px' }}>
      <div className="auth-form-container" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 25%', minWidth: '200px', paddingRight: '24px', borderRight: '1px solid rgba(52, 225, 255, 0.2)' }}>
          <div style={{ position: 'sticky', top: '20px' }}>
            <h4 className="section-title" style={{ marginBottom: '12px', fontSize: '18px' }}>Welcome to the Errl Forum</h4>
            <p className="muted" style={{ marginBottom: '16px', lineHeight: '1.6' }}>
              {mode === 'login' ? (
                <>
                  If you have an account, please sign in to the right. If you do not, please click "Create an account" below.
                </>
              ) : (
                <>
                  Join the community! Create your account to start posting, commenting, and connecting with other Errl members.
                </>
              )}
            </p>
            <p className="muted" style={{ fontSize: '14px', lineHeight: '1.5', fontStyle: 'italic', color: 'var(--errl-accent-3)' }}>
              Born on an overhead projector, mixing oil and water and light—a spark of awe brought to life.
            </p>
          </div>
        </div>
        <div style={{ flex: '1', minWidth: 0 }}>
          {mode === 'login' ? (
            <>
              <h3 className="section-title" style={{ marginBottom: '16px' }}>Sign in</h3>
              <p className="muted" style={{ marginBottom: '20px' }}>
                Sign in with your username or email.
              </p>
              <form onSubmit={submitLogin}>
                <label>
                  <div className="muted">Email or username</div>
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
              <button
                type="button"
                onClick={() => {
                  setStatus({ type: 'idle', message: null });
                  setMode('signup');
                }}
                disabled={status.type === 'loading'}
                style={{
                  marginTop: '12px',
                  width: '100%',
                  background: 'linear-gradient(135deg, rgba(255, 52, 245, 0.9), rgba(52, 225, 255, 0.9))',
                  color: '#001018',
                  fontWeight: 600,
                  fontSize: '15px',
                  boxShadow: '0 0 18px rgba(255, 52, 245, 0.45)'
                }}
              >
                Create an account
              </button>
              {status.type !== 'idle' ? <div className="notice" style={{ marginTop: '16px' }}>{status.message}</div> : null}
            </>
          ) : (
            <>
              <h3 className="section-title" style={{ marginBottom: '16px' }}>Create account</h3>
              <p className="muted" style={{ marginBottom: '20px' }}>
                Create an account with email, username, and password to post from any device.
              </p>
              <form onSubmit={submitSignup}>
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
                <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                  <div className="muted" style={{ marginBottom: '8px' }}>Notification preferences</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <input
                      type="checkbox"
                      checked={signupNotifyEmail}
                      onChange={(e) => setSignupNotifyEmail(e.target.checked)}
                    />
                    <span className="muted" style={{ fontSize: '14px' }}>Email notifications for replies and comments</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={signupNotifySms}
                      onChange={(e) => setSignupNotifySms(e.target.checked)}
                    />
                    <span className="muted" style={{ fontSize: '14px' }}>SMS notifications (requires phone number)</span>
                  </label>
                </div>
                <button type="submit" disabled={status.type === 'loading'}>
                  Create account
                </button>
              </form>
              <button
                type="button"
                onClick={() => {
                  setStatus({ type: 'idle', message: null });
                  setMode('login');
                }}
                disabled={status.type === 'loading'}
                style={{
                  marginTop: '12px',
                  width: '100%',
                  background: 'linear-gradient(135deg, rgba(255, 52, 245, 0.9), rgba(52, 225, 255, 0.9))',
                  color: '#001018',
                  fontWeight: 600,
                  fontSize: '15px',
                  boxShadow: '0 0 18px rgba(255, 52, 245, 0.45)'
                }}
              >
                Sign in instead
              </button>
              {status.type !== 'idle' ? <div className="notice" style={{ marginTop: '16px' }}>{status.message}</div> : null}
            </>
          )}
        </div>
      </div>
    </Wrapper>
  );
}
