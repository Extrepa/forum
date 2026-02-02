'use client';

import { useState, useEffect } from 'react';
import ProfileSongPlayer from './ProfileSongPlayer';
import { isProfileFlagEnabled } from '../lib/featureFlags';
import { getMoodChipStyle } from '../lib/moodThemes';

/**
 * Renders mood/song/player on public profile. When server didn't return mood/song
 * but it's the current user's profile, fetches GET /api/account/profile-extras
 * so data still shows (e.g. when stats extras query failed).
 */
export default function ProfileMoodSongBlock({
  initialMoodText,
  initialMoodEmoji,
  initialSongUrl,
  initialSongProvider,
  initialSongAutoplayEnabled,
  initialHeadline,
  isOwnProfile,
  songProviderLabel: initialSongProviderLabel,
}) {
  const [moodText, setMoodText] = useState(initialMoodText ?? '');
  const [moodEmoji, setMoodEmoji] = useState(initialMoodEmoji ?? '');
  const [songUrl, setSongUrl] = useState(initialSongUrl ?? '');
  const [songProvider, setSongProvider] = useState((initialSongProvider ?? '').toLowerCase().trim());
  const [songAutoplayEnabled, setSongAutoplayEnabled] = useState(Boolean(initialSongAutoplayEnabled));
  const [headline, setHeadline] = useState(initialHeadline ?? '');
  const [fetched, setFetched] = useState(false);

  const hasMood = isProfileFlagEnabled('profile_mood') && (moodText || moodEmoji);
  const hasSong = isProfileFlagEnabled('profile_music') && songUrl;
  const moodDescriptor = (moodText?.trim() || moodEmoji?.trim() || '');
  const moodChipStyle = getMoodChipStyle(moodDescriptor);
  const songProviderLabel = songProvider
    ? songProvider.charAt(0).toUpperCase() + songProvider.slice(1)
    : (initialSongProviderLabel ?? 'Song');

  useEffect(() => {
    if (fetched || !isOwnProfile) return;
    if (initialMoodText || initialMoodEmoji || initialSongUrl) return;
    let cancelled = false;
    fetch('/api/account/profile-extras')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setMoodText(data.profileMoodText ?? '');
        setMoodEmoji(data.profileMoodEmoji ?? '');
        setSongUrl(data.profileSongUrl ?? '');
        setSongProvider((data.profileSongProvider ?? '').toLowerCase().trim());
        setSongAutoplayEnabled(Boolean(data.profileSongAutoplayEnabled));
        setHeadline(data.profileHeadline ?? '');
        setFetched(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isOwnProfile, initialMoodText, initialMoodEmoji, initialSongUrl, fetched]);

  if (!hasMood && !hasSong) {
    return (
      <div className="profile-card-mood-song">
        <div className="muted" style={{ fontSize: '13px' }}>No mood or song set yet.</div>
      </div>
    );
  }

  return (
    <>
      <div className="profile-mood-song-block-desktop-layout">
        <div className="profile-mood-song-block-left-column">
          {hasMood && (
            <div className="profile-mood-chip" style={moodChipStyle}>
              {moodEmoji && <span>{moodEmoji}</span>}
              <span>{moodText}</span>
            </div>
          )}
          {headline ? (
            <div className="profile-headline" style={{ marginTop: '8px', fontSize: '14px' }}>{headline}</div>
          ) : null}
        </div>
        <div className="profile-mood-song-block-right-column">
          {hasSong && (songProvider === 'youtube' || songProvider === 'soundcloud' || songProvider === 'spotify') ? (
            <ProfileSongPlayer
              provider={songProvider}
              songUrl={songUrl}
              autoPlay
              providerLabel={songProviderLabel}
              embedStyle="profile_full_height" /* Use new style for full card height */
            />
          ) : hasSong ? (
            <div className="profile-song-compact">
              <span className="profile-song-provider">{songProviderLabel}</span>
              <a href={songUrl} target="_blank" rel="noopener noreferrer" className="profile-song-link">
                {songUrl}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
