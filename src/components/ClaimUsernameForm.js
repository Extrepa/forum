'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Username from './Username';
import { getUsernameColorIndex } from '../lib/usernameColor';
import { useUiPrefs } from './UiPrefsProvider';
import { useRotatingPlaceholder } from '../lib/useRotatingPlaceholder';

export default function ClaimUsernameForm({ noCardWrapper = false }) {
  const router = useRouter();
  const [status, setStatus] = useState({ type: 'idle', message: null });
  const [mode, setMode] = useState('login'); // signup | login - defaults to login, will be updated by useEffect based on session
  const { 
    loreEnabled, setLoreEnabled,
    setUiColorMode: setGlobalColorMode,
    setUiBorderColor: setGlobalBorderColor,
    setUiInvertColors: setGlobalInvertColors
  } = useUiPrefs();

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
  const [loginIdentifierFocused, setLoginIdentifierFocused] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(false);

  // signup focus tracking
  const [signupEmailFocused, setSignupEmailFocused] = useState(false);
  const [signupUsernameFocused, setSignupUsernameFocused] = useState(false);

  // Rotating placeholder suggestions - memoized to prevent effect restarts
  const USERNAME_SUGGESTIONS = useMemo(() => [
    'DripGoblin',
    'GooGroove',
    'BassBlob',
    'NeonNomad',
    'PortalPunk',
    'SlimeSignal',
    'WinampWizard',
    'DialupDJ',
    'LagWizard',
    'NuggetMage',
    'GlowstickGremlin',
    'MixtapeMage',
    'SavePointSnacks',
    'LootGoblin',
    'QuestSnack',
    'ArcadeAftertaste',
    'FinalBoss',
    'GGNoob',
    'NoScopeNugget',
    'TacoTactician',
    'CrunchwrapKing',
    'SauceGoblin',
    'MySpacePhantom',
    'BlockbusterBandit',
    'xXxDripLordxXx',
  ], []);

  const EMAIL_SUGGESTIONS = useMemo(() => [
    'dripgoblin2004@hotmail.com',
    'googroove@yahoo.com',
    'bassblob@aol.com',
    'neonnomad2003@hotmail.com',
    'portalpunk@yahoo.com',
    'slimesignal@msn.com',
    'winampwizard2002@hotmail.com',
    'dialupdj@aol.com',
    'lagwizard@yahoo.com',
    'nuggetmage2004@hotmail.com',
    'glowstickgremlin@msn.com',
    'mixtapemage@yahoo.com',
    'savepointsnacks@hotmail.com',
    'lootgoblin@aol.com',
    'questsnack@yahoo.com',
    'arcadeaftertaste@msn.com',
    'finalboss2001@hotmail.com',
    'ggnoob@yahoo.com',
    'noscope_nugget@aol.com',
    'tacotactician@hotmail.com',
    'crunchwrapking@yahoo.com',
    'saucegoblin@msn.com',
    'myspacephantom@aol.com',
    'blockbusterbandit@hotmail.com',
    'driplordxxx@yahoo.com',
  ], []);

  // Combined suggestions for login (can be email or username) - memoized
  const LOGIN_IDENTIFIER_SUGGESTIONS = useMemo(() => [...USERNAME_SUGGESTIONS, ...EMAIL_SUGGESTIONS], [USERNAME_SUGGESTIONS, EMAIL_SUGGESTIONS]);

  // Rotating placeholders
  const loginIdentifierActive = loginIdentifier.length === 0;
  const signupEmailActive = signupEmail.length === 0;
  const signupUsernameActive = signupUsername.length === 0;

  const loginIdentifierPlaceholder = useRotatingPlaceholder(LOGIN_IDENTIFIER_SUGGESTIONS, loginIdentifierActive, { minMs: 3000, maxMs: 5000 });
  const signupEmailPlaceholder = useRotatingPlaceholder(EMAIL_SUGGESTIONS, signupEmailActive, { minMs: 3000, maxMs: 5000 });
  const signupUsernamePlaceholder = useRotatingPlaceholder(USERNAME_SUGGESTIONS, signupUsernameActive, { minMs: 3000, maxMs: 5000 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedIdentifier = window.localStorage.getItem('errl_forum_remembered_identifier');
    if (savedIdentifier) {
      setLoginIdentifier(savedIdentifier);
      setRememberLogin(true);
    }
  }, []);

  // account settings
  const [newEmail, setNewEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [notifyEmailEnabled, setNotifyEmailEnabled] = useState(false);
  const [notifySmsEnabled, setNotifySmsEnabled] = useState(false);
  const [notifyRsvpEnabled, setNotifyRsvpEnabled] = useState(true);
  const [notifyLikeEnabled, setNotifyLikeEnabled] = useState(true);
  const [notifyUpdateEnabled, setNotifyUpdateEnabled] = useState(true);
  const [notifyMentionEnabled, setNotifyMentionEnabled] = useState(true);
  const [notifyReplyEnabled, setNotifyReplyEnabled] = useState(true);
  const [notifyCommentEnabled, setNotifyCommentEnabled] = useState(true);
  const [notifyAdminNewUserEnabled, setNotifyAdminNewUserEnabled] = useState(false);
  const [notifyAdminNewPostEnabled, setNotifyAdminNewPostEnabled] = useState(false);
  const [notifyAdminNewReplyEnabled, setNotifyAdminNewReplyEnabled] = useState(false);
  const [uiLoreEnabled, setUiLoreEnabled] = useState(false);
  const [uiColorMode, setUiColorMode] = useState(0);
  const [uiBorderColor, setUiBorderColor] = useState('#34e1ff');
  const [uiInvertColors, setUiInvertColors] = useState(false);
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
        const user = payload.user || null;
        setMe(user);
        setEditingEmail(false);
        setNewEmail(user?.email || '');
        setNewPhone(user?.phone || '');
        setNotifyEmailEnabled(!!user?.notifyEmailEnabled);
        setNotifySmsEnabled(!!user?.notifySmsEnabled);
        setNotifyRsvpEnabled(user?.notifyRsvpEnabled ?? true);
        setNotifyLikeEnabled(user?.notifyLikeEnabled ?? true);
        setNotifyUpdateEnabled(user?.notifyUpdateEnabled ?? true);
        setNotifyMentionEnabled(user?.notifyMentionEnabled ?? true);
        setNotifyReplyEnabled(user?.notifyReplyEnabled ?? true);
        setNotifyCommentEnabled(user?.notifyCommentEnabled ?? true);
        setNotifyAdminNewUserEnabled(!!user?.notifyAdminNewUserEnabled);
        setNotifyAdminNewPostEnabled(!!user?.notifyAdminNewPostEnabled);
        setNotifyAdminNewReplyEnabled(!!user?.notifyAdminNewReplyEnabled);
        setUiLoreEnabled(!!user?.uiLoreEnabled);
        setLoreEnabled(!!user?.uiLoreEnabled);
        setUiColorMode(user?.uiColorMode ?? 0);
        setUiBorderColor(user?.uiBorderColor || '#34e1ff');
        setUiInvertColors(!!user?.uiInvertColors);
        setDefaultLandingPage(user?.defaultLandingPage || 'feed');
        
        // Set default mode based on whether user exists
        // If no user, default to login (existing users more common than new signups)
        // Note: If user exists, this form won't be rendered (handled by parent page)
        if (!user) {
          setMode('login');
        }
      } catch (error) {
        // No session, default to login for returning visitors
        setMode('login');
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [setLoreEnabled]);

  const refreshMe = async () => {
    try {
      const response = await fetch('/api/auth/me', { method: 'GET' });
      const payload = await response.json();
      const user = payload.user || null;
      setMe(user);
      setEditingEmail(false);
      setNewEmail(user?.email || '');
      setNewPhone(user?.phone || '');
      setNotifyEmailEnabled(!!user?.notifyEmailEnabled);
      setNotifySmsEnabled(!!user?.notifySmsEnabled);
      setNotifyRsvpEnabled(user?.notifyRsvpEnabled ?? true);
      setNotifyLikeEnabled(user?.notifyLikeEnabled ?? true);
      setNotifyUpdateEnabled(user?.notifyUpdateEnabled ?? true);
      setNotifyMentionEnabled(user?.notifyMentionEnabled ?? true);
      setNotifyReplyEnabled(user?.notifyReplyEnabled ?? true);
      setNotifyCommentEnabled(user?.notifyCommentEnabled ?? true);
      setNotifyAdminNewUserEnabled(!!user?.notifyAdminNewUserEnabled);
      setNotifyAdminNewPostEnabled(!!user?.notifyAdminNewPostEnabled);
      setNotifyAdminNewReplyEnabled(!!user?.notifyAdminNewReplyEnabled);
      setUiLoreEnabled(!!user?.uiLoreEnabled);
      setLoreEnabled(!!user?.uiLoreEnabled);
      setUiColorMode(user?.uiColorMode ?? 0);
      setUiBorderColor(user?.uiBorderColor || '#34e1ff');
      setUiInvertColors(!!user?.uiInvertColors);
      setDefaultLandingPage(user?.defaultLandingPage || 'feed');
      return user; // Return user for navigation logic
    } catch (error) {
      setMe(null);
      return null;
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
        body: JSON.stringify({ 
          loreEnabled: !!uiLoreEnabled,
          colorMode: uiColorMode,
          borderColor: uiBorderColor,
          invertColors: !!uiInvertColors
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to save display settings.');
      }
      setStatus({ type: 'success', message: 'Display settings saved.' });
      setLoreEnabled(!!payload.uiLoreEnabled);
      setGlobalColorMode(payload.uiColorMode);
      setGlobalBorderColor(payload.uiBorderColor);
      setGlobalInvertColors(!!payload.uiInvertColors);
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

      const response = await fetch('/api/auth/notification-prefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emailEnabled: notifyEmailEnabled, 
          smsEnabled: notifySmsEnabled,
          rsvpEnabled: notifyRsvpEnabled,
          likeEnabled: notifyLikeEnabled,
          updateEnabled: notifyUpdateEnabled,
          mentionEnabled: notifyMentionEnabled,
          replyEnabled: notifyReplyEnabled,
          commentEnabled: notifyCommentEnabled,
          adminNewUserEnabled: notifyAdminNewUserEnabled,
          adminNewPostEnabled: notifyAdminNewPostEnabled,
          adminNewReplyEnabled: notifyAdminNewReplyEnabled
        })
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
      const user = await refreshMe();
      // Navigate to preferred landing page (or home if not set)
      // Force a full reload so server auth state is guaranteed to refresh.
      const landingPage = user?.defaultLandingPage || defaultLandingPage || 'home';
      if (typeof window !== 'undefined') {
        window.location.href = landingPage === 'feed' ? '/feed' : '/';
      } else {
        router.replace(landingPage === 'feed' ? '/feed' : '/');
      }
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
      try {
        if (typeof window !== 'undefined') {
          if (rememberLogin && loginIdentifier) {
            window.localStorage.setItem('errl_forum_remembered_identifier', loginIdentifier);
          } else {
            window.localStorage.removeItem('errl_forum_remembered_identifier');
          }
        }
      } catch (e) {
        // ignore storage errors
      }
      setLoginIdentifier('');
      setLoginPassword('');
      const user = await refreshMe();
      // Navigate to preferred landing page (or home if not set)
      // Force a full reload so server auth state is guaranteed to refresh.
      const landingPage = user?.defaultLandingPage || defaultLandingPage || 'home';
      if (typeof window !== 'undefined') {
        window.location.href = landingPage === 'feed' ? '/feed' : '/';
      } else {
        router.replace(landingPage === 'feed' ? '/feed' : '/');
      }
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
    // Redirect to forum.errl.wtf (sign-in screen)
    window.location.href = 'https://forum.errl.wtf';
  };

  const submitContactInfo = async (event) => {
    event.preventDefault();
    setStatus({ type: 'loading', message: 'Saving contact info...' });
    try {
      // Save email if editing or not set
      if (!me?.email || editingEmail) {
        const emailResponse = await fetch('/api/auth/set-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: newEmail })
        });
        const emailPayload = await emailResponse.json();
        if (!emailResponse.ok) {
          throw new Error(emailPayload.error || 'Unable to set email.');
        }
      }

      // Save phone
      const phoneTrimmed = String(newPhone || '').trim();
      const phoneResponse = await fetch('/api/auth/set-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneTrimmed || null })
      });
      const phonePayload = await phoneResponse.json();
      if (!phoneResponse.ok) {
        throw new Error(phonePayload.error || 'Unable to save phone number.');
      }

      setStatus({ type: 'success', message: 'Contact info saved.' });
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
    const colorIndex = getUsernameColorIndex(me.username, { preferredColorIndex: me.preferredUsernameColorIndex });
    const canConfigureNotifications = !!me.email && !!me.hasPassword;
    const envLore = process.env.NEXT_PUBLIC_ERRL_USE_LORE === 'true';
    const Wrapper = noCardWrapper ? 'div' : 'div';
    const wrapperProps = noCardWrapper ? {} : { className: 'card' };
    return (
      <Wrapper {...wrapperProps}>
        <div className="notice" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ minWidth: 0, flex: '1 1 auto', wordBreak: 'keep-all', overflowWrap: 'normal' }}>
            Signed in as <Username name={me.username} colorIndex={colorIndex} />
          </span>
          <button
            type="button"
            onClick={submitLogout}
            disabled={status.type === 'loading'}
            style={{
              fontSize: '11px',
              padding: 0,
              margin: 0,
              border: 'none',
              borderRadius: 0,
              background: 'transparent',
              color: 'var(--muted)',
              cursor: status.type === 'loading' ? 'not-allowed' : 'pointer',
              opacity: status.type === 'loading' ? 0.6 : 1,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              textDecoration: 'none',
              outline: 'none',
              boxShadow: 'none'
            }}
            onMouseEnter={(e) => {
              if (status.type !== 'loading') {
                e.currentTarget.style.color = 'var(--accent)';
                e.currentTarget.style.textShadow = '0 0 8px rgba(52, 225, 255, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (status.type !== 'loading') {
                e.currentTarget.style.color = 'var(--muted)';
                e.currentTarget.style.textShadow = 'none';
              }
            }}
          >
            Sign out
          </button>
        </div>
        <p className="muted">Your account is active on this device.</p>

        <div className="account-columns">
          <div className="account-col">
            <form onSubmit={submitContactInfo} className="card" style={{ padding: 12 }}>
              <h3 className="section-title" style={{ marginBottom: '4px', borderBottom: 'none' }}>
                Contact Info
              </h3>
              <div className="stack" style={{ gap: 10 }}>
                <label>
                  <div className="muted">Email</div>
                  <input
                    name="email"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    placeholder={me.email || 'you@example.com'}
                    disabled={!!me.email && !editingEmail}
                    style={{ opacity: (!!me.email && !editingEmail) ? 0.6 : 1 }}
                    required
                  />
                </label>
                <label>
                  <div className="muted">Phone number</div>
                  <input
                    name="phone"
                    value={newPhone}
                    onChange={(event) => setNewPhone(event.target.value)}
                    placeholder={me.phone || '+15551234567'}
                    disabled={!!me.email && !editingEmail}
                    style={{ opacity: (!!me.email && !editingEmail) ? 0.6 : 1 }}
                  />
                </label>
                <div className="stack" style={{ gap: 10 }}>
                  {(!me.email || editingEmail) ? (
                    <>
                      <button type="submit" disabled={status.type === 'loading'}>
                        {me.email ? 'Save contact info' : 'Set contact info'}
                      </button>
                      {me.email ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEmail(false);
                            setNewEmail(me.email || '');
                            setNewPhone(me.phone || '');
                          }}
                          disabled={status.type === 'loading'}
                        >
                          Cancel
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingEmail(true);
                      }}
                      disabled={status.type === 'loading'}
                    >
                      Edit contact info
                    </button>
                  )}
                </div>
              </div>
            </form>

            <form onSubmit={submitChangePassword} className="card" style={{ padding: 12 }}>
              <h3 className="section-title" style={{ marginBottom: '4px', borderBottom: 'none' }}>
                Password
              </h3>
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

            <div className="card" style={{ padding: 12 }}>
              <h3 className="section-title" style={{ marginBottom: '12px', borderBottom: 'none' }}>
                Notification Preferences
              </h3>
              <div className="muted" style={{ fontSize: 13, marginBottom: 12, lineHeight: '1.4' }}>
                Choose which activities trigger notifications on the site. If you enable Email or Text delivery below, those site notifications will also be sent to your external contact points.
              </div>

              <div className="stack" style={{ gap: 10 }}>
                <div className="muted" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
                  Site Notifications
                </div>
                
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span>RSVP notifications</span>
                  <input
                    type="checkbox"
                    checked={notifyRsvpEnabled}
                    onChange={(e) => setNotifyRsvpEnabled(e.target.checked)}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span>Like notifications</span>
                  <input
                    type="checkbox"
                    checked={notifyLikeEnabled}
                    onChange={(e) => setNotifyLikeEnabled(e.target.checked)}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span>Project update notifications</span>
                  <input
                    type="checkbox"
                    checked={notifyUpdateEnabled}
                    onChange={(e) => setNotifyUpdateEnabled(e.target.checked)}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span>Mention notifications</span>
                  <input
                    type="checkbox"
                    checked={notifyMentionEnabled}
                    onChange={(e) => setNotifyMentionEnabled(e.target.checked)}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span>Reply notifications</span>
                  <input
                    type="checkbox"
                    checked={notifyReplyEnabled}
                    onChange={(e) => setNotifyReplyEnabled(e.target.checked)}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span>Comment notifications</span>
                  <input
                    type="checkbox"
                    checked={notifyCommentEnabled}
                    onChange={(e) => setNotifyCommentEnabled(e.target.checked)}
                  />
                </label>

                <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }}></div>

                <div className="muted" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Delivery Channels
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
                    disabled={!String(newPhone || '').trim()}
                  />
                </label>
                {!String(newPhone || '').trim() ? (
                  <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>
                    Add a phone number to enable SMS.
                  </div>
                ) : null}

                <button 
                  type="button" 
                  onClick={submitNotificationPrefs}
                  disabled={status.type === 'loading'}
                  style={{ marginTop: 8 }}
                >
                  Save preferences
                </button>
              </div>
            </div>

            {me?.role === 'admin' ? (
              <div className="card" style={{ padding: 12 }}>
                <h3 className="section-title" style={{ marginBottom: '12px', borderBottom: 'none' }}>
                  Admin Notifications
                </h3>
                <div className="muted" style={{ fontSize: 13, marginBottom: 12, lineHeight: '1.4' }}>
                  Extra alerts for admin activity monitoring. These are in addition to your standard notification preferences.
                </div>
                <div className="stack" style={{ gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span>New user signups</span>
                    <input
                      type="checkbox"
                      checked={notifyAdminNewUserEnabled}
                      onChange={(e) => setNotifyAdminNewUserEnabled(e.target.checked)}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span>New forum threads</span>
                    <input
                      type="checkbox"
                      checked={notifyAdminNewPostEnabled}
                      onChange={(e) => setNotifyAdminNewPostEnabled(e.target.checked)}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span>New forum replies</span>
                    <input
                      type="checkbox"
                      checked={notifyAdminNewReplyEnabled}
                      onChange={(e) => setNotifyAdminNewReplyEnabled(e.target.checked)}
                    />
                  </label>
                  <button 
                    type="button" 
                    onClick={submitNotificationPrefs}
                    disabled={status.type === 'loading'}
                    style={{ marginTop: 8 }}
                  >
                    Save preferences
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="account-col">
            <section className="card" style={{ padding: 12 }}>
              <h3 className="section-title" style={{ marginBottom: '16px' }}>Site Settings</h3>
              
              <form onSubmit={submitLandingPref} style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
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

              <form onSubmit={submitUiPrefs}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontWeight: 500 }}>Lore mode</span>
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
                    ? 'Lore Mode transforms the interface\'s microcopy—the small bits of text like labels, button hints, and form placeholders—to match the thematic "lore" of the Errl universe.'
                    : 'When off, microcopy (the functional text like labels and placeholders) remains plain and straightforward, rather than being replaced by Errl-themed thematic text.'}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0', paddingTop: '16px' }}>
                  <div className="muted" style={{ marginBottom: 12, fontWeight: 500, color: 'var(--ink)' }}>
                    Color Settings
                  </div>
                  
                  <div className="stack" style={{ gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span>Color theme</span>
                      <select
                        value={uiColorMode}
                        onChange={(e) => setUiColorMode(parseInt(e.target.value))}
                        disabled={status.type === 'loading'}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(52, 225, 255, 0.2)', background: 'rgba(2, 7, 10, 0.4)', color: 'var(--ink)', width: 'auto' }}
                      >
                        <option value="0">Rainbow (Default)</option>
                        <option value="1">Black & White</option>
                        <option value="2">Custom Neon Border</option>
                      </select>
                    </label>

                    {uiColorMode === 2 && (
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <span>Border color</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="color"
                            value={uiBorderColor}
                            onChange={(e) => setUiBorderColor(e.target.value)}
                            disabled={status.type === 'loading'}
                            style={{ padding: 0, width: 32, height: 32, border: 'none', background: 'none', cursor: 'pointer' }}
                          />
                          <input
                            type="text"
                            value={uiBorderColor}
                            onChange={(e) => setUiBorderColor(e.target.value)}
                            disabled={status.type === 'loading'}
                            style={{ padding: '4px 8px', width: 80, fontSize: 12, minHeight: 0 }}
                          />
                        </div>
                      </label>
                    )}

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span>Invert colors</span>
                      <input
                        type="checkbox"
                        checked={uiInvertColors}
                        onChange={(e) => setUiInvertColors(e.target.checked)}
                        disabled={status.type === 'loading'}
                      />
                    </label>
                  </div>
                </div>

                <button type="submit" disabled={status.type === 'loading'} style={{ marginTop: 8 }}>
                  Save display settings
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
                  <div className="muted" style={{ fontSize: 13 }}>Movement/animation settings</div>
                </div>
              </div>
            </section>
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
      <div className="auth-form-container" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        <div style={{ flex: '1 1 50%', minWidth: 0, paddingRight: '24px', borderRight: '1px solid rgba(52, 225, 255, 0.2)' }}>
          <div style={{ position: 'sticky', top: '20px' }}>
            <h4 className="section-title" style={{ marginBottom: '12px', fontSize: '18px' }}>Welcome to the Errl Forum</h4>
            <p className="muted" style={{ marginBottom: '16px', lineHeight: '1.6' }}>
              {mode === 'login' ? (
                <>
                  Errl is a character shaped by music, creativity, and community. This forum is an extension of him — a space built to share ideas, projects, events, and inspiration without noise or pressure.
                  <br />
                  <br />
                  Influenced by early-internet creativity and renegade culture, Errl moves slowly and intentionally here.
                  <br />
                  <br />
                  If you arrived through someone you trust, you’re in the right place.{' '}
                  <span className="errl-depth" role="text">
                    <span className="errl-depth__lead">Errl has </span>
                    <span className="errl-depth__word" aria-label="depth">
                      <span className="errl-depth__letter">d</span>
                      <span className="errl-depth__letter">e</span>
                      <span className="errl-depth__letter">p</span>
                      <span className="errl-depth__letter">t</span>
                      <span className="errl-depth__letter">h</span>
                      <span className="errl-depth__punct">.</span>
                    </span>
                  </span>
                </>
              ) : (
                <>
                  Join the community! Create your account to start posting, commenting, and connecting with other Errl members.
                </>
              )}
            </p>
          </div>
        </div>
        <div style={{ flex: '1 1 50%', minWidth: 0, width: '100%', maxWidth: '100%' }}>
          {mode === 'login' ? (
            <>
              <h3 className="section-title" style={{ marginBottom: '20px' }}>Sign in</h3>
              <form onSubmit={submitLogin}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <label htmlFor="login-identifier" className="muted">Email or username</label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted)' }}>
                      <input
                        type="checkbox"
                        checked={rememberLogin}
                        onChange={(event) => setRememberLogin(event.target.checked)}
                      />
                      Remember me
                    </label>
                  </div>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '100%' }}>
                    <input
                      id="login-identifier"
                      name="identifier"
                      value={loginIdentifier}
                      onChange={(event) => setLoginIdentifier(event.target.value)}
                      onFocus={() => setLoginIdentifierFocused(true)}
                      onBlur={() => setLoginIdentifierFocused(false)}
                      placeholder={loginIdentifier ? '' : (loginIdentifierActive ? loginIdentifierPlaceholder.placeholder : 'you@example.com')}
                      autoComplete="username"
                      required
                      style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                    />
                    {!loginIdentifier && loginIdentifierActive && (
                      <div
                        className="rotating-placeholder-overlay"
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                          color: 'var(--muted)',
                          fontSize: '16px',
                          zIndex: 0,
                          opacity: loginIdentifierPlaceholder.opacity * 0.4,
                          transition: 'opacity 0.6s ease-in-out',
                          maxWidth: 'calc(100% - 24px)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {loginIdentifierPlaceholder.placeholder}
                      </div>
                    )}
                  </div>
                </div>
                <label>
                  <div className="muted">Password</div>
                  <input
                    name="password"
                    type="password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    placeholder="Password"
                    required
                    style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                  />
                </label>
                <button type="submit" disabled={status.type === 'loading'} style={{ width: '100%' }}>
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
                  <div style={{ position: 'relative', width: '100%', maxWidth: '100%' }}>
                    <input
                      name="email"
                      value={signupEmail}
                      onChange={(event) => setSignupEmail(event.target.value)}
                      onFocus={() => setSignupEmailFocused(true)}
                      onBlur={() => setSignupEmailFocused(false)}
                      placeholder={signupEmail ? '' : (signupEmailActive ? signupEmailPlaceholder.placeholder : 'you@example.com')}
                      autoComplete="email"
                      required
                      style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                    />
                    {!signupEmail && signupEmailActive && (
                      <div
                        className="rotating-placeholder-overlay"
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                          color: 'var(--muted)',
                          fontSize: '16px',
                          zIndex: 0,
                          opacity: signupEmailPlaceholder.opacity * 0.4,
                          transition: 'opacity 0.6s ease-in-out',
                          maxWidth: 'calc(100% - 24px)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {signupEmailPlaceholder.placeholder}
                      </div>
                    )}
                  </div>
                </label>
                <label>
                  <div className="muted">Username (lowercase, 3 to 20 chars)</div>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '100%' }}>
                    <input
                      name="username"
                      value={signupUsername}
                      onChange={(event) => setSignupUsername(event.target.value)}
                      onFocus={() => setSignupUsernameFocused(true)}
                      onBlur={() => setSignupUsernameFocused(false)}
                      placeholder={signupUsername ? '' : (signupUsernameActive ? signupUsernamePlaceholder.placeholder : 'errlmember')}
                      autoComplete="username"
                      required
                      style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                    />
                    {!signupUsername && signupUsernameActive && (
                      <div
                        className="rotating-placeholder-overlay"
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                          color: 'var(--muted)',
                          fontSize: '16px',
                          zIndex: 0,
                          opacity: signupUsernamePlaceholder.opacity * 0.4,
                          transition: 'opacity 0.6s ease-in-out',
                          maxWidth: 'calc(100% - 24px)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {signupUsernamePlaceholder.placeholder}
                      </div>
                    )}
                  </div>
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
                    style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
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
                <button type="submit" disabled={status.type === 'loading'} style={{ width: '100%' }}>
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
