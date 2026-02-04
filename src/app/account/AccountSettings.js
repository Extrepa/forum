'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUiPrefs } from '../../components/UiPrefsProvider';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';

/* ---------------------------------------------
   UTILITIES
--------------------------------------------- */

function countEnabledSiteNotifs(site) {
  return Object.values(site).filter(Boolean).length;
}

function anySiteNotifsEnabled(site) {
  return Object.values(site).some(Boolean);
}

function deliverySummary(delivery, hasPhone) {
  const parts = [];
  if (delivery.email) parts.push("Email");
  if (delivery.sms && hasPhone) parts.push("SMS");
  if (!parts.length) return "Off";
  return parts.join(" + ");
}

function validateNotificationPrefs({ prefs, hasPhone }) {
  const siteAny = anySiteNotifsEnabled(prefs.site);

  if (prefs.delivery.sms && !hasPhone) {
    return { ok: false, message: "Add a phone number before enabling SMS notifications." };
  }

  if (siteAny && !prefs.delivery.email) {
    return { ok: false, message: "Enable Email notifications to receive site alerts." };
  }

  return { ok: true };
}

/* ---------------------------------------------
   COMPONENTS
--------------------------------------------- */

function SettingsCard({ title, subtitle, actions, children }) {
  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
          <h3 className="section-title" style={{ margin: 0, borderBottom: 'none', fontSize: '18px' }}>{title}</h3>
          {subtitle && <span className="muted" style={{ fontSize: '13px' }}>{subtitle}</span>}
        </div>
        {actions}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Row({ label, description, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '8px 0' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 500 }}>{label}</div>
        {description && <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>{description}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{right}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '12px 0' }} />;
}

function PrimaryButton(props) {
  return (
    <button
      {...props}
      style={{
        width: '100%',
        borderRadius: '999px',
        padding: '12px 16px',
        fontWeight: 600,
        background: 'linear-gradient(90deg, rgba(52, 225, 255, 0.8), rgba(176, 38, 255, 0.8), rgba(255, 107, 0, 0.8))',
        color: '#000',
        border: 'none',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.5 : 1,
        ...props.style
      }}
    />
  );
}

function SecondaryButton(props) {
  const className = ['secondary-button', props.className].filter(Boolean).join(' ');
  return (
    <button
      {...props}
      className={className}
      style={{
        borderRadius: '999px',
        fontWeight: 600,
        background: 'linear-gradient(120deg, #54b0ff, #ff2dc3)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: '#050505',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.5 : 1,
        ...props.style
      }}
    />
  );
}

function EditSheet({ open, title, onClose, children }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="edit-sheet-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(2px)',
        }}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '600px', // Max width for desktop
          background: '#06131a', // Match theme or var(--card)
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderBottom: 'none',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease-out',
          marginBottom: 0, // Stick to bottom on mobile
          overflow: 'hidden',
        }}
        className="edit-sheet-panel"
      >
        <div className="edit-sheet-header" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--button-bg-secondary)',
              border: 'none',
              color: 'var(--text-color-muted)',
              fontSize: '18px',
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
              boxShadow: '0 0 8px rgba(0, 220, 255, 0.3)', // Added glow effect
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--button-bg-secondary-hover)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 220, 255, 0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--button-bg-secondary)'; e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 220, 255, 0.3)'; }}
          >
            ×
          </button>
        </div>
        <div className="edit-sheet-content">
          {children}
        </div>
      </div>
      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .edit-sheet-overlay {
          align-items: flex-start;
          padding: 32px 0 16px;
          overflow-y: auto;
        }
        .edit-sheet-panel {
          max-width: 640px;
          width: min(95%, 640px);
          max-height: none;
        }
        .edit-sheet-content {
          padding: 20px;
        }
        .notifications-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 12px;
        }
        .notification-card {
          min-height: 0;
        }
        .toggle-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 6px 0;
          font-size: 14px;
        }
        .toggle-line input {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.1);
          box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.4);
          position: relative;
          cursor: pointer;
          transition: background 0.25s ease, border 0.25s ease, transform 0.25s ease;
        }
        .toggle-line input::after {
          content: '';
          position: absolute;
          inset: 0;
          margin: auto;
          width: 8px;
          height: 8px;
          background: none;
          transform: rotate(45deg) scale(0);
          border: solid #fff;
          border-width: 0 0 2px 2px;
          border-radius: 1px;
          transition: transform 0.2s ease;
        }
        .toggle-line input:checked {
          background: linear-gradient(120deg, #54b0ff, #b026ff);
          border-color: transparent;
        }
        .toggle-line input:checked::after {
          transform: rotate(45deg) scale(1);
        }
        .toggle-line input:focus-visible {
          outline: none;
          border-color: #54b0ff;
          box-shadow: 0 0 0 3px rgba(84, 176, 255, 0.35);
        }
        .notification-alerts {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }
        .notification-alert {
          padding: 12px 16px;
          border-radius: 14px;
          border: 1px solid rgba(255, 215, 0, 0.5);
          background: rgba(255, 215, 0, 0.12);
          color: #fff7d4;
          font-size: 13px;
          font-weight: 500;
        }
        @media (min-width: 768px) {
          .edit-sheet-overlay {
            align-items: center;
            padding: 0;
          }
          .edit-sheet-panel {
            border-radius: 16px;
            margin-bottom: auto;
            margin-top: auto;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
        }
      `}</style>
    </div>
  );
}

/* ---------------------------------------------
   EDITORS
--------------------------------------------- */

function ContactEditor({ draft, onChange, saving, onSave }) {
  return (
    <div className="stack" style={{ gap: '16px' }}>
      <label>
        <div className="muted" style={{ marginBottom: '4px' }}>Email</div>
        <input
          value={draft.email}
          onChange={(e) => onChange({ ...draft, email: e.target.value })}
          placeholder="you@example.com"
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.05)', color: '#fff' }}
        />
      </label>

      <label>
        <div className="muted" style={{ marginBottom: '4px' }}>Phone</div>
        <input
          value={draft.phone ?? ""}
          onChange={(e) => onChange({ ...draft, phone: e.target.value })}
          placeholder="+15551234567"
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.05)', color: '#fff' }}
        />
        <div className="muted" style={{ fontSize: '12px', marginTop: '4px' }}>Needed for SMS notifications.</div>
      </label>

      <PrimaryButton disabled={saving || !draft.email.trim()} onClick={onSave}>
        {saving ? 'Saving...' : 'Save contact info'}
      </PrimaryButton>
    </div>
  );
}

function PasswordEditor({ draft, onChange, saving, onSave }) {
  const newPwOk = draft.newPassword.length >= 8;
  const oldPwOk = draft.oldPassword.length > 0;

  return (
    <div className="stack" style={{ gap: '16px' }}>
      <label>
        <div className="muted" style={{ marginBottom: '4px' }}>Old password</div>
        <input
          type="password"
          value={draft.oldPassword}
          onChange={(e) => onChange({ ...draft, oldPassword: e.target.value })}
          placeholder="Current password"
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.05)', color: '#fff' }}
        />
      </label>

      <label>
        <div className="muted" style={{ marginBottom: '4px' }}>New password</div>
        <input
          type="password"
          value={draft.newPassword}
          onChange={(e) => onChange({ ...draft, newPassword: e.target.value })}
          placeholder="New password (8+ chars)"
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.05)', color: '#fff' }}
        />
        {!newPwOk && <div className="muted" style={{ fontSize: '12px', marginTop: '4px' }}>Minimum 8 characters.</div>}
      </label>

      <PrimaryButton disabled={saving || !oldPwOk || !newPwOk} onClick={onSave}>
        {saving ? 'Updating...' : 'Update password'}
      </PrimaryButton>
    </div>
  );
}

function ToggleLine({ label, checked, onChange, disabled }) {
  return (
    <label className="toggle-line" style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
      <span>{label}</span>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)} 
        disabled={disabled}
      />
    </label>
  );
}

function NotificationsEditor({ user, draft, setDraft, validation, saving, onSave }) {
  const hasPhone = Boolean(user.phone && user.phone.trim().length > 0);
  const siteAny = anySiteNotifsEnabled(draft.site);
  const isAdmin = user.role === 'admin';
  const admin = draft.admin ?? { newUserSignups: false, newForumThreads: false, newForumReplies: false };

  return (
    <div className="stack" style={{ gap: '16px' }}>
      <div className="notifications-grid">
        <div className="card notification-card" style={{ padding: '16px', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>Site notifications</div>
          <div className="muted" style={{ fontSize: '13px', marginBottom: '6px' }}>Choose what triggers alerts.</div>
          <Divider />

          <ToggleLine label="RSVP notifications" checked={draft.site.rsvp} onChange={(v) =>
            setDraft(d => ({ ...d, site: { ...d.site, rsvp: v } }))
          } />
          <ToggleLine label="Like notifications" checked={draft.site.likes} onChange={(v) =>
            setDraft(d => ({ ...d, site: { ...d.site, likes: v } }))
          } />
          <ToggleLine label="Project update notifications" checked={draft.site.projectUpdates} onChange={(v) =>
            setDraft(d => ({ ...d, site: { ...d.site, projectUpdates: v } }))
          } />
          <ToggleLine label="Mention notifications" checked={draft.site.mentions} onChange={(v) =>
            setDraft(d => ({ ...d, site: { ...d.site, mentions: v } }))
          } />
          <ToggleLine label="Reply notifications" checked={draft.site.replies} onChange={(v) =>
            setDraft(d => ({ ...d, site: { ...d.site, replies: v } }))
          } />
          <ToggleLine label="Comment notifications" checked={draft.site.comments} onChange={(v) =>
            setDraft(d => ({ ...d, site: { ...d.site, comments: v } }))
          } />
        </div>

        <div className="card notification-card" style={{ padding: '16px', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>Delivery channels</div>
          <div className="muted" style={{ fontSize: '13px', marginBottom: '6px' }}>
            Email is required when site notifications are enabled. SMS requires a phone number.
          </div>
          <Divider />

          <ToggleLine
            label="Email notifications"
            checked={draft.delivery.email}
            onChange={(v) => setDraft(d => ({ ...d, delivery: { ...d.delivery, email: v } }))}
          />

          <ToggleLine 
            label="Text (SMS) notifications"
            checked={draft.delivery.sms}
            disabled={!hasPhone}
            onChange={(v) => setDraft(d => ({ ...d, delivery: { ...d.delivery, sms: v } }))}
          />
          {!hasPhone && <div className="muted" style={{ fontSize: '12px', marginTop: '4px' }}>Add a phone number to enable SMS.</div>}

        </div>

        {isAdmin && (
          <div className="card notification-card" style={{ padding: '16px', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Admin notifications</div>
            <div className="muted" style={{ fontSize: '13px', marginBottom: '6px' }}>Extra alerts for moderation/monitoring.</div>
            <Divider />

            <ToggleLine label="New user signups" checked={admin.newUserSignups} onChange={(v) =>
              setDraft(d => ({ ...d, admin: { ...(d.admin ?? admin), newUserSignups: v } }))
            } />
            <ToggleLine label="New forum threads" checked={admin.newForumThreads} onChange={(v) =>
              setDraft(d => ({ ...d, admin: { ...(d.admin ?? admin), newForumThreads: v } }))
            } />
            <ToggleLine label="New forum replies" checked={admin.newForumReplies} onChange={(v) =>
              setDraft(d => ({ ...d, admin: { ...(d.admin ?? admin), newForumReplies: v } }))
            } />
          </div>
        )}
      </div>

      {!validation.ok && (
        <div className="notification-alerts">
          <div className="notification-alert">
            {validation.message}
          </div>
        </div>
      )}

      <PrimaryButton disabled={saving || !validation.ok} onClick={onSave}>
        {saving ? 'Saving...' : 'Save preferences'}
      </PrimaryButton>
    </div>
  );
}

/* ---------------------------------------------
   MAIN COMPONENT
--------------------------------------------- */

export default function AccountSettings({ user: initialUser }) {
  const router = useRouter();
  const { 
    loreEnabled, setLoreEnabled,
    uiColorMode, setUiColorMode,
    uiBorderColor, setUiBorderColor,
    uiInvertColors, setUiInvertColors
  } = useUiPrefs();

  const [user, setUser] = useState(initialUser);
  const [openPanel, setOpenPanel] = useState('none');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', message: null });

  // Use useEffect to update user if initialUser changes (e.g. parent refetch)
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  // Derived state for preferences
  const notifPrefs = {
    site: {
      rsvp: user?.notify_rsvp_enabled !== undefined
        ? Boolean(user.notify_rsvp_enabled)
        : (user?.notifyRsvpEnabled !== undefined ? Boolean(user.notifyRsvpEnabled) : true),
      likes: user?.notify_like_enabled !== undefined
        ? Boolean(user.notify_like_enabled)
        : (user?.notifyLikeEnabled !== undefined ? Boolean(user.notifyLikeEnabled) : true),
      projectUpdates: user?.notify_update_enabled !== undefined
        ? Boolean(user.notify_update_enabled)
        : (user?.notifyUpdateEnabled !== undefined ? Boolean(user.notifyUpdateEnabled) : true),
      mentions: user?.notify_mention_enabled !== undefined
        ? Boolean(user.notify_mention_enabled)
        : (user?.notifyMentionEnabled !== undefined ? Boolean(user.notifyMentionEnabled) : true),
      replies: user?.notify_reply_enabled !== undefined
        ? Boolean(user.notify_reply_enabled)
        : (user?.notifyReplyEnabled !== undefined ? Boolean(user.notifyReplyEnabled) : true),
      comments: user?.notify_comment_enabled !== undefined
        ? Boolean(user.notify_comment_enabled)
        : (user?.notifyCommentEnabled !== undefined ? Boolean(user.notifyCommentEnabled) : true),
    },
    delivery: {
      email: user?.notify_email_enabled !== undefined
        ? Boolean(user.notify_email_enabled)
        : Boolean(user?.notifyEmailEnabled),
      sms: user?.notify_sms_enabled !== undefined
        ? Boolean(user.notify_sms_enabled)
        : Boolean(user?.notifySmsEnabled),
    },
    admin: {
      newUserSignups: user?.notify_admin_new_user_enabled !== undefined
        ? Boolean(user.notify_admin_new_user_enabled)
        : Boolean(user?.notifyAdminNewUserEnabled),
      newForumThreads: user?.notify_admin_new_post_enabled !== undefined
        ? Boolean(user.notify_admin_new_post_enabled)
        : Boolean(user?.notifyAdminNewPostEnabled),
      newForumReplies: user?.notify_admin_new_reply_enabled !== undefined
        ? Boolean(user.notify_admin_new_reply_enabled)
        : Boolean(user?.notifyAdminNewReplyEnabled),
    }
  };

  const siteUi = {
    defaultLandingPage: user?.defaultLandingPage || 'feed',
    loreMode: loreEnabled,
    colorTheme: uiColorMode,
    invertColors: uiInvertColors,
  };

  // Local draft states
  const [contactDraft, setContactDraft] = useState({ email: '', phone: '' });
  const [pwDraft, setPwDraft] = useState({ oldPassword: '', newPassword: '' });
  const [notifDraft, setNotifDraft] = useState(notifPrefs);

  // Sync drafts when opening panels
  useEffect(() => {
    if (openPanel === 'editContact' && user) {
      setContactDraft({ email: user.email || '', phone: user.phone || '' });
    }
    if (openPanel === 'changePassword') {
      setPwDraft({ oldPassword: '', newPassword: '' });
    }
    if (openPanel === 'editNotifications' || openPanel === 'editAdminNotifications') {
      setNotifDraft(notifPrefs);
    }
  }, [openPanel, user]); // Removed notifPrefs dependency to avoid reset loop if user object identity changes

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) setUser(data.user);
    } catch (_) {}
  };

  /* --- ACTIONS --- */

  const handleSaveContact = async () => {
    setSaving(true);
    try {
      // Save email
      if (contactDraft.email !== user.email) {
        const res = await fetch('/api/auth/set-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: contactDraft.email })
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update email');
        }
      }
      // Save phone
      if (contactDraft.phone !== user.phone) {
        const res = await fetch('/api/auth/set-phone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: contactDraft.phone || null })
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update phone');
        }
      }
      await refreshUser();
      setOpenPanel('none');
      setStatus({ type: 'success', message: 'Contact info updated.' });
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: pwDraft.oldPassword, newPassword: pwDraft.newPassword })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to change password');
      }
      setOpenPanel('none');
      setStatus({ type: 'success', message: 'Password updated.' });
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifs = async () => {
    setSaving(true);
    try {
      const payload = {
        emailEnabled: notifDraft.delivery.email,
        smsEnabled: notifDraft.delivery.sms,
        rsvpEnabled: notifDraft.site.rsvp,
        likeEnabled: notifDraft.site.likes,
        updateEnabled: notifDraft.site.projectUpdates,
        mentionEnabled: notifDraft.site.mentions,
        replyEnabled: notifDraft.site.replies,
        commentEnabled: notifDraft.site.comments,
        // Admin prefs included here
        adminNewUserEnabled: notifDraft.admin?.newUserSignups,
        adminNewPostEnabled: notifDraft.admin?.newForumThreads,
        adminNewReplyEnabled: notifDraft.admin?.newForumReplies,
      };

      const res = await fetch('/api/auth/notification-prefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save preferences');
      }
      await refreshUser();
      setOpenPanel('none');
      setStatus({ type: 'success', message: 'Preferences saved.' });
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSiteUi = async (patch) => {
    // If updating landing page
    if (patch.defaultLandingPage) {
      try {
        await fetch('/api/auth/landing-pref', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ landingPage: patch.defaultLandingPage })
        });
        await refreshUser();
        setStatus({ type: 'success', message: 'Landing page preference saved.' });
      } catch (err) {
        setStatus({ type: 'error', message: err.message });
      }
    }

    // If updating UI prefs
    const newUi = { 
      loreEnabled: patch.loreMode !== undefined ? patch.loreMode : siteUi.loreMode,
      colorMode: patch.colorTheme !== undefined ? patch.colorTheme : siteUi.colorTheme,
      borderColor: uiBorderColor, // keep existing
      invertColors: patch.invertColors !== undefined ? patch.invertColors : siteUi.invertColors
    };

    if (patch.loreMode !== undefined || patch.colorTheme !== undefined || patch.invertColors !== undefined) {
      const envLore = process.env.NEXT_PUBLIC_ERRL_USE_LORE === 'true';
      if (envLore && patch.loreMode !== undefined) return; // Locked

      try {
        await fetch('/api/auth/ui-prefs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUi)
        });
        // Update context
        if (patch.loreMode !== undefined) setLoreEnabled(patch.loreMode);
        if (patch.colorTheme !== undefined) setUiColorMode(patch.colorTheme);
        if (patch.invertColors !== undefined) setUiInvertColors(patch.invertColors);
        setStatus({ type: 'success', message: 'Display settings saved.' });
      } catch (err) {
        setStatus({ type: 'error', message: err.message });
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = 'https://forum.errl.wtf';
    } catch (_) {}
  };

  /* --- RENDER HELPERS --- */
  
  if (!user) return <div className="muted">Loading account...</div>;

  const enabledCount = countEnabledSiteNotifs(notifPrefs.site);
  const delivery = deliverySummary(notifPrefs.delivery, Boolean(user.phone));
  const adminOn = user.role === 'admin' && notifPrefs.admin
    ? Object.values(notifPrefs.admin).some(Boolean)
    : false;
  
  const notifValidation = validateNotificationPrefs({ prefs: notifDraft, hasPhone: Boolean(user.phone) || Boolean(contactDraft.phone) });

  const preferredColorIndex = user?.preferredUsernameColorIndex ?? user?.preferred_username_color_index ?? null;
  const colorIndex = getUsernameColorIndex(user.username, { preferredColorIndex });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Notice/Status */}
      {status.type === 'success' && (
        <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(0, 245, 160, 0.15)', color: '#00f5a0', border: '1px solid rgba(0, 245, 160, 0.3)' }}>
          {status.message}
        </div>
      )}

      <div className="account-grid">
        {/* LEFT COLUMN */}
        <div className="stack" style={{ gap: '20px' }}>
          <SettingsCard
            title="Account"
            subtitle="At-a-glance info + quick edits."
          >
            <div className="stack" style={{ gap: '0' }}>
              <Row label="Signed in as" right={<Username name={user.username} colorIndex={colorIndex} />} />
              <Row label="Email" right={<span className="muted">{user.email}</span>} />
              <Row label="Phone" right={<span className="muted">{user.phone || 'Not added'}</span>} />
            </div>
            <Divider />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <SecondaryButton onClick={() => setOpenPanel('editContact')} style={{ width: '100%', textAlign: 'center' }}>Edit contact info</SecondaryButton>
              <SecondaryButton onClick={() => setOpenPanel('changePassword')} style={{ width: '100%', textAlign: 'center' }}>Change password</SecondaryButton>
            </div>
          </SettingsCard>

          <SettingsCard
            title="Notifications"
            subtitle="Summary first. Edit when you feel the need."
            actions={<SecondaryButton onClick={() => setOpenPanel('editNotifications')}>Edit</SecondaryButton>}
          >
            <div className="stack" style={{ gap: '0' }}>
              <Row label="Site notifications" right={<span className="muted">{enabledCount} enabled</span>} />
              <Row label="Delivery" right={<span className="muted">{delivery}</span>} />
              {user.role === 'admin' && (
                <Row 
                  label="Admin alerts" 
                  right={
                    <span className="muted">{adminOn ? "On" : "Off"}</span>
                  } 
                />
              )}
            </div>
          </SettingsCard>
        </div>

        {/* RIGHT COLUMN */}
        <div className="stack" style={{ gap: '20px' }}>
          <SettingsCard
            title="Site & UI"
            subtitle="Compact settings."
          >
            <div className="stack" style={{ gap: '0' }}>
              <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px', marginBottom: '4px' }}>Site behavior</div>
              <Row 
                label="Default landing page" 
                right={
                  <select 
                    className="account-select"
                    value={siteUi.defaultLandingPage}
                    onChange={(e) => handleSaveSiteUi({ defaultLandingPage: e.target.value })}
                  >
                    {["feed", "home"].map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
                  </select>
                }
              />
              <Row 
                label="Lore mode" 
                description="Swap plain microcopy for Errl-flavored text."
                right={
                  <input 
                    type="checkbox" 
                    checked={siteUi.loreMode} 
                    onChange={(e) => handleSaveSiteUi({ loreMode: e.target.checked })}
                    disabled={process.env.NEXT_PUBLIC_ERRL_USE_LORE === 'true'}
                  />
                }
              />
              
              <Divider />
              
              <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px', marginBottom: '4px' }}>UI</div>
              <Row 
                label="Color theme" 
                right={
                  <select 
                    className="account-select"
                    value={siteUi.colorTheme}
                    onChange={(e) => handleSaveSiteUi({ colorTheme: parseInt(e.target.value) })}
                  >
                    <option value="0">Rainbow (Default)</option>
                    <option value="1">Black & White</option>
                    <option value="2">Custom Neon</option>
                  </select>
                }
              />
              <Row 
                label="Invert colors" 
                right={
                  <input 
                    type="checkbox" 
                    checked={siteUi.invertColors} 
                    onChange={(e) => handleSaveSiteUi({ invertColors: e.target.checked })}
                  />
                }
              />
            </div>
          </SettingsCard>

          <div style={{ borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0, 0, 0, 0.2)', padding: '20px' }}>
            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                borderRadius: '999px',
                padding: '12px',
                fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ff6b6b',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Sheets */}
      <EditSheet open={openPanel === 'editContact'} title="Edit contact info" onClose={() => setOpenPanel('none')}>
        <ContactEditor draft={contactDraft} onChange={setContactDraft} saving={saving} onSave={handleSaveContact} />
      </EditSheet>

      <EditSheet open={openPanel === 'changePassword'} title="Change password" onClose={() => setOpenPanel('none')}>
        <PasswordEditor draft={pwDraft} onChange={setPwDraft} saving={saving} onSave={handleSavePassword} />
      </EditSheet>

      <EditSheet open={openPanel === 'editNotifications'} title="Edit notifications" onClose={() => setOpenPanel('none')}>
        <NotificationsEditor user={user} draft={notifDraft} setDraft={setNotifDraft} validation={notifValidation} saving={saving} onSave={handleSaveNotifs} />
      </EditSheet>

      <style jsx>{`
        .account-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        @media (min-width: 1024px) {
          .account-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            align-items: start;
          }
        }
      `}</style>
      <style jsx global>{`
        .secondary-button {
          padding: 8px 16px;
          font-size: 13px;
          letter-spacing: 0.01em;
          transition: transform 0.2s ease;
        }
        .secondary-button:active {
          transform: translateY(1px);
        }
        .secondary-button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.4);
        }
        .secondary-button:disabled {
          cursor: not-allowed;
        }
        @media (max-width: 767px) {
          .secondary-button {
            padding: 6px 12px;
            font-size: 11px;
            letter-spacing: 0.02em;
          }
        }
        .account-select {
          min-width: 110px;
          padding: 8px 10px 8px 12px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.35);
          background-image: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(2, 10, 20, 0.65)),
            url("data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2012%209%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201l5%205%205-5%22%20stroke%3D%22%23fff%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E");
          background-position: 0 0, right 12px center;
          background-repeat: no-repeat;
          background-size: 100% 100%, 12px 9px;
          color: #fff;
          font-size: 13px;
          cursor: pointer;
          appearance: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          padding-right: 34px;
        }
        .account-select:focus-visible {
          outline: none;
          border-color: #54b0ff;
          box-shadow: 0 0 0 3px rgba(84, 176, 255, 0.25);
        }
        .account-select option {
          background: #03121a;
          color: #fff;
        }
        .account-select::-ms-expand {
          display: none;
        }
        @media (max-width: 767px) {
          .account-select {
            font-size: 12px;
            min-width: 90px;
          }
        }
      `}</style>
    </div>
  );
}
