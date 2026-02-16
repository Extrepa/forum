'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUiPrefs } from '../../components/UiPrefsProvider';
import Username from '../../components/Username';
import CreatePostModal from '../../components/CreatePostModal';
import { getUsernameColorIndex } from '../../lib/usernameColor';
import {
  NEW_CONTENT_SECTION_KEYS,
  ALL_NEW_CONTENT_KEYS,
  parseNewContentSectionsJson,
  defaultNewContentSections,
  defaultNewContentSectionsAllTrue
} from '../../lib/notificationSections';
import {
  ADMIN_EVENT_KEYS,
  ALL_ADMIN_EVENT_KEYS,
  parseAdminEventsJson,
  defaultAdminEvents
} from '../../lib/adminNotificationEvents';
import { isDripNomadUser } from '../../lib/roles';

/* ---------------------------------------------
   UTILITIES
--------------------------------------------- */

function countEnabledSiteNotifs(site) {
  return Object.values(site).filter(Boolean).length;
}

function anySiteNotifsEnabled(prefs) {
  const site = prefs.site || {};
  if (Object.values(site).some(Boolean)) return true;
  const sections = prefs.newForumThreadSections || {};
  if (site.newForumThreads && Object.values(sections).some(Boolean)) return true;
  return false;
}

function deliverySummary(delivery, hasPhone) {
  const parts = [];
  if (delivery.email) parts.push("Email");
  if (delivery.sms && hasPhone) parts.push("SMS");
  if (!parts.length) return "Off";
  return parts.join(" + ");
}

function validateNotificationPrefs({ prefs, hasPhone }) {
  const siteAny = anySiteNotifsEnabled(prefs);

  if (prefs.delivery.sms && !hasPhone) {
    return { ok: false, message: "Add a phone number before enabling SMS notifications." };
  }

  if (siteAny && !prefs.delivery.email) {
    return { ok: false, message: "Enable Email notifications to receive site alerts." };
  }

  return { ok: true };
}

/** Normalize notif prefs for stable dirty comparison (key order can differ after edits). */
function notifPrefsSnapshot(prefs) {
  if (!prefs) return '{}';
  const site = prefs.site && typeof prefs.site === 'object'
    ? Object.keys(prefs.site).sort().map((k) => `${k}:${!!prefs.site[k]}`).join(',')
    : '';
  const sections = prefs.newForumThreadSections && typeof prefs.newForumThreadSections === 'object'
    ? JSON.stringify(Object.keys(prefs.newForumThreadSections).sort().map((k) => ({ k, v: !!prefs.newForumThreadSections[k] })))
    : '{}';
  const delivery = prefs.delivery && typeof prefs.delivery === 'object'
    ? `email:${!!prefs.delivery.email},sms:${!!prefs.delivery.sms}`
    : '';
  const admin = prefs.admin && typeof prefs.admin === 'object'
    ? Object.keys(prefs.admin).sort().map((k) => `${k}:${!!prefs.admin[k]}`).join(',')
    : '';
  const adminEvents = prefs.adminEvents && typeof prefs.adminEvents === 'object'
    ? JSON.stringify(Object.keys(prefs.adminEvents).sort().map((k) => ({ k, v: !!prefs.adminEvents[k] })))
    : '{}';
  return JSON.stringify({ site, sections, delivery, admin, adminEvents });
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
      type={props.type ?? 'button'}
      className={className}
      style={{
        borderRadius: '999px',
        fontWeight: 600,
        background: 'linear-gradient(135deg, rgba(52, 225, 255, 0.9), rgba(255, 52, 245, 0.9))',
        border: 'none',
        color: '#001018',
        boxShadow: '0 0 10px rgba(52, 225, 255, 0.35)',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.5 : 1,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        outline: 'none',
        ...props.style
      }}
    />
  );
}

function EditSheet({ open, title, onClose, children, dirty = false }) {
  const requestClose = () => {
    if (dirty && !window.confirm('You have unsaved changes. Discard them and close?')) {
      return;
    }
    onClose();
  };

  return (
    <CreatePostModal
      isOpen={open}
      onClose={requestClose}
      title={title}
      className="account-edit-modal"
      variant="wide"
      maxWidth="780px"
      maxHeight="90vh"
      confirmOnUnsavedChanges={false}
    >
      {children}
      <style jsx global>{`
        .account-edit-modal {
          border-radius: 24px;
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
          margin: 0;
          width: auto;
          height: auto;
          accent-color: var(--accent);
          appearance: auto;
          cursor: pointer;
          vertical-align: middle;
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
        .collapsible-trigger-errl {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid rgba(52, 225, 255, 0.2);
          background: rgba(52, 225, 255, 0.06);
          color: rgba(255, 255, 255, 0.92);
          font: inherit;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .collapsible-trigger-errl:hover {
          background: rgba(52, 225, 255, 0.1);
          border-color: rgba(52, 225, 255, 0.3);
        }
        .collapsible-trigger-label {
          flex: 1;
          text-align: left;
          font-weight: 500;
        }
        .collapsible-trigger-chevron {
          flex-shrink: 0;
          font-size: 10px;
          opacity: 0.85;
        }
        .collapsible-trigger-content {
          margin-top: 10px;
        }
        @media (max-width: 640px) {
          .account-edit-modal {
            border-radius: 16px;
          }
        }
      `}</style>
    </CreatePostModal>
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

function CollapsibleSection({ label, expanded, onToggle, children }) {
  return (
    <div style={{ marginTop: '10px' }}>
      <button
        type="button"
        className="collapsible-trigger-errl"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span className="collapsible-trigger-label">{label}</span>
        <span className="collapsible-trigger-chevron" aria-hidden="true">
          {expanded ? '\u25B2' : '\u25BC'}
        </span>
      </button>
      {expanded && <div className="collapsible-trigger-content">{children}</div>}
    </div>
  );
}

function NotificationsEditor({ user, draft, setDraft, validation, saving, onSave, dirty = false }) {
  const hasPhone = Boolean(user.phone && user.phone.trim().length > 0);
  const siteAny = anySiteNotifsEnabled(draft);
  const isAdmin = user.role === 'admin';
  const canUseNomadNotifs = isDripNomadUser(user); // Nomad section options only for drip_nomad and admin
  const admin = draft.admin ?? { newUserSignups: false, newForumThreads: false, newForumReplies: false };
  const sectionPrefs = draft.newForumThreadSections || defaultNewContentSections();
  const setSection = (key, value) => setDraft((d) => ({
    ...d,
    newForumThreadSections: { ...(d.newForumThreadSections || defaultNewContentSections()), [key]: value }
  }));
  const [showForumSections, setShowForumSections] = useState(false);
  const [showAdminEvents, setShowAdminEvents] = useState(false);
  const sectionKeysForSections = canUseNomadNotifs
    ? NEW_CONTENT_SECTION_KEYS.sections
    : NEW_CONTENT_SECTION_KEYS.sections.filter(({ key }) => key !== 'nomads');

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
          <ToggleLine label="New forum threads" checked={draft.site.newForumThreads} onChange={(v) =>
            setDraft(d => ({
              ...d,
              site: { ...d.site, newForumThreads: v },
              ...(v ? { newForumThreadSections: defaultNewContentSectionsAllTrue() } : {})
            }))
          } />
          <div className="muted" style={{ fontSize: '12px', marginTop: '2px', marginBottom: '4px' }}>Get notified when new threads or posts are created.</div>
          {draft.site.newForumThreads && (
            <CollapsibleSection
              label={showForumSections ? 'Hide forum sections' : 'Choose which forum sections...'}
              expanded={showForumSections}
              onToggle={() => setShowForumSections((v) => !v)}
            >
              <div style={{ marginLeft: '8px', paddingLeft: '12px', borderLeft: '2px solid rgba(52, 225, 255, 0.25)', marginTop: '6px', marginBottom: '8px' }}>
                <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Lobby</div>
                {NEW_CONTENT_SECTION_KEYS.lobby.map(({ key, label }) => (
                  <ToggleLine key={key} label={label} checked={!!sectionPrefs[key]} onChange={(v) => setSection(key, v)} />
                ))}
                <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '10px', marginBottom: '6px' }}>Sections</div>
                {sectionKeysForSections.map(({ key, label }) => (
                  <ToggleLine key={key} label={label} checked={!!sectionPrefs[key]} onChange={(v) => setSection(key, v)} />
                ))}
              </div>
            </CollapsibleSection>
          )}
          {canUseNomadNotifs && (
            <>
              <ToggleLine label="Nomad section activity" checked={draft.site.nomadActivity} onChange={(v) =>
                setDraft(d => ({ ...d, site: { ...d.site, nomadActivity: v } }))
              } />
              <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>When there&apos;s new content in the Nomad section.</div>
            </>
          )}
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
            <div style={{ marginTop: '10px' }}>
              <CollapsibleSection
                label={showAdminEvents ? 'Hide post/user alerts' : 'Post manipulation & user changes...'}
                expanded={showAdminEvents}
                onToggle={() => setShowAdminEvents((v) => !v)}
              >
                <div style={{ marginTop: '6px' }}>
                {ADMIN_EVENT_KEYS.map(({ key, label }) => {
                  const adminEv = draft.adminEvents || defaultAdminEvents();
                  return (
                    <ToggleLine
                      key={key}
                      label={label}
                      checked={!!adminEv[key]}
                      onChange={(v) => setDraft((d) => ({
                        ...d,
                        adminEvents: { ...(d.adminEvents || defaultAdminEvents()), [key]: v }
                      }))}
                    />
                  );
                })}
                </div>
              </CollapsibleSection>
            </div>
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

      <p className="muted" style={{ fontSize: '12px', marginTop: '4px', marginBottom: '12px' }}>
        Enable email and the triggers you want to get reminded about activity across the forum (replies, mentions, likes, etc.). Add a phone number to also get SMS.
      </p>

      <PrimaryButton
        disabled={saving || !validation.ok}
        onClick={onSave}
        title={dirty ? 'You have unsaved changes' : undefined}
        style={dirty ? { boxShadow: '0 0 16px rgba(52, 225, 255, 0.5)', outline: '2px solid rgba(52, 225, 255, 0.6)' } : undefined}
      >
        {saving ? 'Saving...' : dirty ? 'Save preferences (unsaved changes)' : 'Save preferences'}
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
  const [status, setStatus] = useState({ type: 'idle', message: null, context: 'global' });

  // Use useEffect to update user if initialUser changes (e.g. parent refetch)
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  // Derived state for preferences
  const notifPrefs = useMemo(() => {
    const rawSections = user?.notify_new_content_sections ?? user?.notifyNewContentSections;
    const parsed = parseNewContentSectionsJson(rawSections);
    const defaultSections = defaultNewContentSections();
    const newForumThreadSections = Object.fromEntries(
      ALL_NEW_CONTENT_KEYS.map((k) => [k, Object.prototype.hasOwnProperty.call(parsed, k) ? !!parsed[k] : defaultSections[k]])
    );
    return {
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
      newForumThreads: user?.notify_new_forum_threads_enabled !== undefined
        ? Boolean(user.notify_new_forum_threads_enabled)
        : (user?.notifyNewForumThreadsEnabled !== undefined ? Boolean(user.notifyNewForumThreadsEnabled) : false),
      nomadActivity: user?.notify_nomad_activity_enabled !== undefined
        ? Boolean(user.notify_nomad_activity_enabled)
        : (user?.notifyNomadActivityEnabled !== undefined ? Boolean(user.notifyNomadActivityEnabled) : false),
    },
    newForumThreadSections,
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
    },
    adminEvents: (() => {
      const raw = user?.notify_admin_events ?? user?.notifyAdminEvents;
      const parsed = parseAdminEventsJson(raw);
      const def = defaultAdminEvents();
      return Object.fromEntries(
        ALL_ADMIN_EVENT_KEYS.map((k) => [k, Object.prototype.hasOwnProperty.call(parsed, k) ? !!parsed[k] : def[k]])
      );
    })()
    };
  }, [user]);

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
  const [customNeonHexInput, setCustomNeonHexInput] = useState(uiBorderColor || '#34e1ff');

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
  }, [openPanel, user, notifPrefs]);

  // Keep custom neon hex input in sync with context when theme is Custom Neon
  useEffect(() => {
    const resolved = (uiBorderColor && /^#[0-9A-Fa-f]{6}$/.test(uiBorderColor)) ? uiBorderColor : '#34e1ff';
    setCustomNeonHexInput(resolved);
  }, [uiColorMode, uiBorderColor]);

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
      setStatus({ type: 'success', message: 'Contact info updated.', context: 'global' });
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
      setStatus({ type: 'success', message: 'Password updated.', context: 'global' });
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
        newForumThreadsEnabled: notifDraft.site.newForumThreads,
        nomadActivityEnabled: notifDraft.site.nomadActivity,
        newForumThreadSections: notifDraft.newForumThreadSections || {},
        // Admin prefs included here
        adminNewUserEnabled: notifDraft.admin?.newUserSignups,
        adminNewPostEnabled: notifDraft.admin?.newForumThreads,
        adminNewReplyEnabled: notifDraft.admin?.newForumReplies,
        adminEvents: notifDraft.adminEvents || {},
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
      setStatus({ type: 'success', message: 'Preferences saved.', context: 'global' });
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
        setStatus({ type: 'success', message: 'Landing page preference saved.', context: 'ui' });
      } catch (err) {
        setStatus({ type: 'error', message: err.message, context: 'ui' });
      }
    }

    // If updating UI prefs
    const newBorderColor = patch.borderColor !== undefined ? patch.borderColor : uiBorderColor;
    const newUi = {
      loreEnabled: patch.loreMode !== undefined ? patch.loreMode : siteUi.loreMode,
      colorMode: patch.colorTheme !== undefined ? patch.colorTheme : siteUi.colorTheme,
      borderColor: newBorderColor,
      invertColors: patch.invertColors !== undefined ? patch.invertColors : siteUi.invertColors
    };

    const uiPrefsDirty =
      patch.loreMode !== undefined ||
      patch.colorTheme !== undefined ||
      patch.invertColors !== undefined ||
      patch.borderColor !== undefined;

    if (uiPrefsDirty) {
      const envLore = process.env.NEXT_PUBLIC_ERRL_USE_LORE === 'true';
      if (envLore && patch.loreMode !== undefined) return; // Locked

      try {
        await fetch('/api/auth/ui-prefs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUi)
        });
        if (patch.loreMode !== undefined) setLoreEnabled(patch.loreMode);
        if (patch.colorTheme !== undefined) setUiColorMode(patch.colorTheme);
        if (patch.invertColors !== undefined) setUiInvertColors(patch.invertColors);
        if (patch.borderColor !== undefined) setUiBorderColor(patch.borderColor);
        setStatus({ type: 'success', message: 'Display settings saved.', context: 'ui' });
      } catch (err) {
        setStatus({ type: 'error', message: err.message, context: 'ui' });
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

  const contactDirty = contactDraft.email !== (user?.email || '') || (contactDraft.phone || '') !== (user?.phone || '');
  const passwordDirty = Boolean(pwDraft.oldPassword || pwDraft.newPassword);
  const notifDirty = notifPrefsSnapshot(notifDraft) !== notifPrefsSnapshot(notifPrefs);

  const enabledCount = countEnabledSiteNotifs(notifPrefs.site);
  const delivery = deliverySummary(notifPrefs.delivery, Boolean(user.phone));
  const adminOn = user.role === 'admin' && notifPrefs.admin
    ? Object.values(notifPrefs.admin).some(Boolean)
    : false;
  
  const notifValidation = validateNotificationPrefs({ prefs: notifDraft, hasPhone: Boolean(user.phone) || Boolean(contactDraft.phone) });

  const preferredColorIndex = user?.preferredUsernameColorIndex ?? user?.preferred_username_color_index ?? null;
  const colorIndex = getUsernameColorIndex(user.username, { preferredColorIndex });

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto' }}>
      {/* Notice/Status */}
      {status.type === 'success' && status.context !== 'ui' && (
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
                      className="account-native-select"
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
                      className="account-native-select"
                      value={siteUi.colorTheme}
                      onChange={(e) => {
                      const mode = parseInt(e.target.value);
                      const payload = { colorTheme: mode };
                      if (mode === 2 && !(uiBorderColor && /^#[0-9A-Fa-f]{6}$/.test(uiBorderColor))) {
                        payload.borderColor = '#34e1ff';
                      }
                      handleSaveSiteUi(payload);
                    }}
                    >
                    <option value="0">Rainbow (Default)</option>
                    <option value="1">Black & White</option>
                    <option value="2">Custom Neon</option>
                  </select>
                }
              />
              {siteUi.colorTheme === 2 && (
                <Row
                  label="Neon color"
                  description="Border and glow color for Custom Neon theme."
                  right={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={(uiBorderColor && /^#[0-9A-Fa-f]{6}$/.test(uiBorderColor)) ? uiBorderColor : '#34e1ff'}
                        onChange={(e) => {
                          const hex = e.target.value;
                          setCustomNeonHexInput(hex);
                          setUiBorderColor(hex);
                          handleSaveSiteUi({ borderColor: hex });
                        }}
                        style={{
                          padding: 0,
                          width: 32,
                          height: 32,
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: 6,
                          background: 'transparent',
                          cursor: 'pointer'
                        }}
                        title="Pick neon color"
                      />
                      <input
                        type="text"
                        value={customNeonHexInput}
                        onChange={(e) => setCustomNeonHexInput(e.target.value)}
                        onBlur={() => {
                          const v = customNeonHexInput.trim();
                          const withHash = v.startsWith('#') ? v : v ? '#' + v : '';
                          const normalized = /^#[0-9A-Fa-f]{6}$/.test(withHash) ? withHash : (uiBorderColor && /^#[0-9A-Fa-f]{6}$/.test(uiBorderColor) ? uiBorderColor : '#34e1ff');
                          setCustomNeonHexInput(normalized);
                          if (normalized !== (uiBorderColor || '#34e1ff')) {
                            setUiBorderColor(normalized);
                            handleSaveSiteUi({ borderColor: normalized });
                          }
                        }}
                        placeholder="#34e1ff"
                        style={{
                          padding: '4px 8px',
                          width: 80,
                          fontSize: 12,
                          minHeight: 0,
                          borderRadius: 6,
                          border: '1px solid rgba(255,255,255,0.25)',
                          background: 'rgba(255,255,255,0.05)',
                          color: 'inherit'
                        }}
                      />
                    </div>
                  }
                />
              )}
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

          {status.context === 'ui' && status.message && (
            <div
              style={{
                marginTop: '8px',
                padding: '12px',
                borderRadius: '10px',
                border: status.type === 'error' ? '1px solid rgba(255, 107, 107, 0.6)' : '1px solid rgba(0, 245, 160, 0.5)',
                background: status.type === 'error' ? 'rgba(255, 107, 107, 0.08)' : 'rgba(0, 245, 160, 0.12)',
                color: status.type === 'error' ? '#ff8a8a' : '#00f5a0',
                fontSize: '13px',
                lineHeight: '1.4',
                wordBreak: 'break-word',
              }}
            >
              {status.message}
            </div>
          )}

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
      <EditSheet open={openPanel === 'editContact'} title="Edit contact info" onClose={() => setOpenPanel('none')} dirty={contactDirty}>
        <ContactEditor draft={contactDraft} onChange={setContactDraft} saving={saving} onSave={handleSaveContact} />
      </EditSheet>

      <EditSheet open={openPanel === 'changePassword'} title="Change password" onClose={() => setOpenPanel('none')} dirty={passwordDirty}>
        <PasswordEditor draft={pwDraft} onChange={setPwDraft} saving={saving} onSave={handleSavePassword} />
      </EditSheet>

      <EditSheet open={openPanel === 'editNotifications'} title="Edit notifications" onClose={() => setOpenPanel('none')} dirty={notifDirty}>
        <NotificationsEditor user={user} draft={notifDraft} setDraft={setNotifDraft} validation={notifValidation} saving={saving} onSave={handleSaveNotifs} dirty={notifDirty} />
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
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 14px;
          font-size: 12px;
          letter-spacing: 0.02em;
          text-transform: none;
          border-radius: 999px;
          background: linear-gradient(135deg, rgba(52, 225, 255, 0.9), rgba(255, 52, 245, 0.9));
          color: #001018;
          border: none;
          box-shadow: 0 0 10px rgba(52, 225, 255, 0.35);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          outline: none;
        }
        .secondary-button:hover:not(:disabled) {
          box-shadow: 0 0 14px rgba(52, 225, 255, 0.45);
        }
        .secondary-button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(52, 225, 255, 0.5);
        }
        .secondary-button:active:not(:disabled) {
          transform: translateY(1px);
        }
        .secondary-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
          box-shadow: none;
        }
        @media (max-width: 767px) {
          .secondary-button {
            padding: 6px 12px;
            font-size: 11px;
          }
        }
        .account-native-select {
          appearance: auto;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 4px;
          padding: 4px 8px;
          font: inherit;
          color: inherit;
          box-shadow: none;
          cursor: pointer;
          min-width: 0;
          max-width: 100%;
        }
        .account-native-select:focus-visible {
          outline: 2px solid rgba(52, 225, 255, 0.8);
          outline-offset: 1px;
        }
      `}</style>
    </div>
  );
}
