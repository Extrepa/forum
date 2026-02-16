'use client';

import { useMemo, useState } from 'react';
import Username from './Username';
import { getUsernameColorIndex } from '../lib/usernameColor';

export default function EventEngagementSection({
  eventId,
  user,
  initialAttending,
  initialAttendees,
  canRSVP = true,
  eventHasPassed = false,
  canInvite = false,
  invitableUsers = [],
}) {
  const [attending, setAttending] = useState(Boolean(initialAttending));
  const [attendees, setAttendees] = useState(initialAttendees || []);
  const [savingRSVP, setSavingRSVP] = useState(false);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState(() => new Set());
  const [selectedRoles, setSelectedRoles] = useState(() => new Set());
  const [inviteAll, setInviteAll] = useState(false);
  const [inviteFilter, setInviteFilter] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteNotice, setInviteNotice] = useState('');

  const attendeeLabel = eventHasPassed ? 'attended' : 'attending';
  const attendeeTitle = attendees.map((a) => a.username).filter(Boolean).join(', ');
  const roleLabel = (role) => {
    if (role === 'user') return 'Driplets';
    if (role === 'drip_nomad') return 'Drip Nomads';
    if (role === 'mod') return 'Mods';
    if (role === 'admin') return 'Admins';
    return role;
  };

  const availableRoles = useMemo(
    () => Array.from(new Set(invitableUsers.map((u) => u.role).filter(Boolean))).sort(),
    [invitableUsers]
  );

  const filteredUsers = useMemo(() => {
    if (!inviteFilter.trim()) return invitableUsers;
    const needle = inviteFilter.trim().toLowerCase();
    return invitableUsers.filter((u) => u.username.toLowerCase().includes(needle));
  }, [invitableUsers, inviteFilter]);

  const refreshAttendees = async () => {
    const attendeesRes = await fetch(`/api/events/${eventId}/attendees`);
    if (!attendeesRes.ok) return;
    const attendeesData = await attendeesRes.json();
    setAttendees(attendeesData.attendees || []);
  };

  const handleAttendingChange = async (e) => {
    if (!canRSVP || savingRSVP) return;
    const newValue = e.target.checked;
    const previousValue = attending;
    setAttending(newValue);
    setSavingRSVP(true);
    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Failed to update attendance');
      }
      await refreshAttendees();
    } catch (error) {
      setAttending(previousValue);
      console.error('Failed to update attendance:', error);
    } finally {
      setSavingRSVP(false);
    }
  };

  const toggleUser = (userId) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleRole = (role) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  const submitInvites = async () => {
    if (inviteSubmitting) return;
    setInviteSubmitting(true);
    setInviteNotice('');
    try {
      const response = await fetch(`/api/events/${eventId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_all: inviteAll,
          role_groups: Array.from(selectedRoles),
          user_ids: Array.from(selectedUsers),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to send invites.');
      }
      setInviteNotice(`Invites sent: ${payload.sent_count || 0}${payload.already_invited_count ? ` (${payload.already_invited_count} already invited)` : ''}.`);
      setSelectedUsers(new Set());
      setSelectedRoles(new Set());
      setInviteAll(false);
    } catch (error) {
      setInviteNotice(error?.message || 'Failed to send invites.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  return (
    <section className="card">
      <h3 className="section-title" style={{ marginTop: 0 }}>Attending</h3>

      {attendees.length > 0 ? (
        <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--ink)' }} title={attendeeTitle}>
            {attendees.length} {attendees.length === 1 ? 'person' : 'people'} {attendeeLabel}:
          </strong>{' '}
          {attendees.slice(0, 5).map((a, i) => (
            <span key={a.id}>
              <Username
                name={a.username}
                colorIndex={getUsernameColorIndex(a.username, {
                  preferredColorIndex:
                    a.preferred_username_color_index !== null && a.preferred_username_color_index !== undefined
                      ? Number(a.preferred_username_color_index)
                      : null,
                })}
              />
              {i < Math.min(attendees.length, 5) - 1 ? ', ' : ''}
            </span>
          ))}
          {attendees.length > 5 ? <span className="muted"> and {attendees.length - 5} more</span> : null}
        </div>
      ) : (
        <p className="muted" style={{ marginTop: 0 }}>No one has marked attending yet.</p>
      )}

      {user && !eventHasPassed ? (
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <input
            type="checkbox"
            checked={attending}
            onChange={handleAttendingChange}
            disabled={!canRSVP || savingRSVP}
          />
          <span>I&apos;m attending</span>
        </label>
      ) : user ? null : (
        <p className="muted" style={{ marginBottom: '10px' }}>Sign in to mark attendance.</p>
      )}

      {!canRSVP ? (
        <p className="muted" style={{ marginTop: 0, marginBottom: '10px', fontSize: '12px' }}>
          RSVP is closed because this event already happened.
        </p>
      ) : null}

      {canInvite ? (
        <>
          <div className="list-divider" style={{ margin: '12px 0' }} />
          <button type="button" onClick={() => setShowInvitePanel((v) => !v)}>
            {showInvitePanel ? 'Close Invite People' : 'Invite People'}
          </button>
          {showInvitePanel ? (
            <div style={{ marginTop: '10px', border: '1px solid var(--line)', borderRadius: '10px', padding: '12px' }}>
              <h4 className="section-title" style={{ marginTop: 0, marginBottom: '10px', fontSize: '14px' }}>
                Invite People
              </h4>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input type="checkbox" checked={inviteAll} onChange={(e) => setInviteAll(e.target.checked)} />
                  <span>Invite all users</span>
                </label>
                {availableRoles.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                    {availableRoles.map((role) => (
                      <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="checkbox"
                          checked={selectedRoles.has(role)}
                          onChange={() => toggleRole(role)}
                        />
                        <span>{roleLabel(role)}</span>
                      </label>
                    ))}
                  </div>
                ) : null}
                <label>
                  <div className="muted">Search users</div>
                  <input
                    type="text"
                    value={inviteFilter}
                    onChange={(e) => setInviteFilter(e.target.value)}
                    placeholder="Filter by username"
                  />
                </label>
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--line)', borderRadius: '8px', padding: '8px' }}>
                {filteredUsers.length === 0 ? (
                  <p className="muted" style={{ margin: 0 }}>No matching users.</p>
                ) : (
                  filteredUsers.map((member) => (
                    <label key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(member.id)}
                        onChange={() => toggleUser(member.id)}
                      />
                      <span>{member.username}</span>
                      <span className="muted" style={{ fontSize: '12px' }}>({roleLabel(member.role)})</span>
                      {Number(member.already_invited || 0) === 1 ? (
                        <span className="muted" style={{ fontSize: '11px' }}>invited</span>
                      ) : null}
                    </label>
                  ))
                )}
              </div>
              <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button type="button" onClick={submitInvites} disabled={inviteSubmitting}>
                  {inviteSubmitting ? 'Sending…' : 'Send invites'}
                </button>
                {inviteNotice ? <span className="muted" style={{ fontSize: '12px' }}>{inviteNotice}</span> : null}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
