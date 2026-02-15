'use client';

import { useEffect, useState } from 'react';
import Username from './Username';
import { getUsernameColorIndex } from '../lib/usernameColor';

export default function EventRSVP({ eventId, initialAttending, initialAttendees }) {
  const [attending, setAttending] = useState(initialAttending);
  const [attendees, setAttendees] = useState(initialAttendees || []);
  const [loading, setLoading] = useState(false);

  const getPreferredColorIndex = (attendee) => {
    const raw = attendee?.preferred_username_color_index;
    if (raw === null || raw === undefined) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const toggleRSVP = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setAttending(data.attending);
        // Refresh attendees list
        const attendeesResponse = await fetch(`/api/events/${eventId}/attendees`);
        const attendeesData = await attendeesResponse.json();
        if (attendeesData.attendees) {
          setAttendees(attendeesData.attendees);
        }
      }
    } catch (error) {
      console.error('Failed to toggle RSVP:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h3 className="section-title">Attendees</h3>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={attending}
          onChange={toggleRSVP}
          disabled={loading}
        />
        <span>I&apos;m attending</span>
      </label>
      {attendees.length > 0 ? (
        <div className="list">
          {attendees.map((attendee) => {
            const preferredColorIndex = getPreferredColorIndex(attendee);
            return (
              <div key={attendee.id} className="list-item">
              <Username
                name={attendee.username}
                colorIndex={getUsernameColorIndex(attendee.username, {
                  preferredColorIndex,
                })}
                preferredColorIndex={preferredColorIndex}
              />
              </div>
            );
          })}
        </div>
      ) : (
        <p className="muted">No attendees yet.</p>
      )}
    </section>
  );
}
