'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
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
  const [rightColumnTarget, setRightColumnTarget] = useState(null);

  const hasMood = isProfileFlagEnabled('profile_mood') && (moodText || moodEmoji);
  const hasSong = isProfileFlagEnabled('profile_music') && songUrl;
  const moodDescriptor = (moodText?.trim() || moodEmoji?.trim() || '');
  const moodChipStyle = getMoodChipStyle(moodDescriptor);
  const songProviderInfo = {
    youtube: { label: 'YouTube', icon: '/icons/social/youtube.png' },
    soundcloud: { label: 'SoundCloud', icon: '/icons/social/soundcloud.png' },
    spotify: { label: 'Spotify', icon: '/icons/social/spotify.svg' },
  }[songProvider];

  const songProviderLabel = songProviderInfo?.label ?? (initialSongProviderLabel ?? 'Song');


  useEffect(() => {
    setMoodText(initialMoodText ?? '');
    setMoodEmoji(initialMoodEmoji ?? '');
    setSongUrl(initialSongUrl ?? '');
    setSongProvider((initialSongProvider ?? '').toLowerCase().trim());
    setSongAutoplayEnabled(Boolean(initialSongAutoplayEnabled));
    setHeadline(initialHeadline ?? '');
  }, [initialMoodText, initialMoodEmoji, initialSongUrl, initialSongProvider, initialSongAutoplayEnabled, initialHeadline]);

  useEffect(() => {
    const target = document.querySelector('[data-profile-mood-song-right-column-slot]');
    if (target) {
      setRightColumnTarget(target);
    }
  }, []);

  const hasHeadline = Boolean(headline?.trim());
  if (!hasMood && !hasSong && !hasHeadline) {
    return (
      <div className="profile-card-mood-song">
        <div className="muted" style={{ fontSize: '13px' }}>No mood or song set yet.</div>
      </div>
    );
  }

  const rightColumn = (
    <div className="profile-mood-song-block-right-column">
      {hasSong && (songProvider === 'youtube' || songProvider === 'soundcloud' || songProvider === 'spotify') ? (
        <ProfileSongPlayer
          provider={songProvider}
          songUrl={songUrl}
          autoPlay={songAutoplayEnabled}
          providerLabel={songProviderLabel}
          embedStyle="profile_full_height" /* Use new style for full card height */
        />
      ) : hasSong ? (
        <div className="profile-song-compact">
          {songProviderInfo?.icon && (
            <Image
              src={songProviderInfo.icon}
              alt={songProviderInfo.label}
              width={16}
              height={16}
              className="profile-song-provider-icon"
            />
          )}
          <span className="profile-song-provider">{songProviderLabel}</span>
          <a href={songUrl} target="_blank" rel="noopener noreferrer" className="profile-song-link">
            {songUrl}
          </a>
        </div>
      ) : null}
    </div>
  );

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
          {hasHeadline ? (
            <div className="profile-status-line" style={{ marginTop: hasMood ? '8px' : '0' }}>
              {headline}
            </div>
          ) : null}
        </div>
      </div>
      {rightColumnTarget ? createPortal(rightColumn, rightColumnTarget) : rightColumn}
    </>
  );
}
