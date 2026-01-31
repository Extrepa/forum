/**
 * Feature flags for profile and related UI.
 * Read from env (e.g. NEXT_PUBLIC_PROFILE_MOOD=0 to disable).
 * Defaults: mood/music on; gallery/notes/files off until implemented.
 */

function envBool(name, defaultValue) {
  const v = process.env[name];
  if (v === undefined || v === '') return defaultValue;
  return v === '1' || v === 'true' || v === 'yes';
}

const profileFlags = {
  profile_mood: envBool('NEXT_PUBLIC_PROFILE_MOOD', true),
  profile_music: envBool('NEXT_PUBLIC_PROFILE_MUSIC', true),
  profile_backgrounds: envBool('NEXT_PUBLIC_PROFILE_BACKGROUNDS', false),
  lately_cards: envBool('NEXT_PUBLIC_LATELY_CARDS', true),
  gallery: envBool('NEXT_PUBLIC_PROFILE_GALLERY', false),
  notes: envBool('NEXT_PUBLIC_PROFILE_NOTES', false),
  files: envBool('NEXT_PUBLIC_PROFILE_FILES', false),
};

function isProfileFlagEnabled(flag) {
  return Boolean(profileFlags[flag]);
}

module.exports = {
  profileFlags,
  isProfileFlagEnabled,
};
