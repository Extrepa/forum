'use client';

export const MOOD_OPTIONS = [
  { value: '', text: '', emoji: '' },
  { value: 'chillin', text: 'Chillin', emoji: '\u{1F60C}' },
  { value: 'vibing', text: 'Vibing', emoji: '\u2728' },
  { value: 'drippy', text: 'Drippy', emoji: '\u{1F4A7}' },
  { value: 'weird', text: 'Weird', emoji: '\u{1F92A}' },
  { value: 'building', text: 'Building', emoji: '\u{1F6E0}\uFE0F' },
  { value: 'lost-in-the-sauce', text: 'Lost in the sauce', emoji: '\u{1F525}' },
  { value: 'on-fire', text: 'On fire', emoji: '\u{1F525}' },
  { value: 'creative', text: 'Creative', emoji: '\u{1F3A8}' },
  { value: 'flow', text: 'Flow', emoji: '\u{1F30A}' },
  { value: 'sparkly', text: 'Sparkly', emoji: '\u2728' },
  { value: 'night-mood', text: 'Night mood', emoji: '\u{1F319}' },
  { value: 'rainbow', text: 'Rainbow', emoji: '\u{1F308}' },
  { value: 'music', text: 'Music', emoji: '\u{1F3B5}' },
  { value: 'coffee', text: 'Coffee', emoji: '\u2615' },
  { value: 'blossom', text: 'Blossom', emoji: '\u{1F338}' },
  { value: 'butterfly', text: 'Butterfly', emoji: '\u{1F98B}' },
  { value: 'dizzy', text: 'Dizzy', emoji: '\u{1F4AB}' },
  { value: 'determined', text: 'Determined', emoji: '\u{1F624}' },
  { value: 'strong', text: 'Strong', emoji: '\u{1F4AA}' },
  { value: 'cosmic', text: 'Cosmic', emoji: '\u{1F30C}' },
  { value: 'lightning', text: 'Lightning', emoji: '\u26A1' },
  { value: 'neon', text: 'Neon', emoji: '\u{1F49C}' },
  { value: 'liminal', text: 'Liminal', emoji: '\u{1F6AA}' },
  { value: 'glow', text: 'Glow', emoji: '\u2728' },
  { value: 'alive', text: 'Alive', emoji: '\u{1F49A}' },
  { value: 'happy', text: 'Happy', emoji: '\u{1F60A}' },
  { value: 'thinking', text: 'Thinking', emoji: '\u{1F914}' },
  { value: 'cool', text: 'Cool', emoji: '\u{1F60E}' },
  { value: 'moved', text: 'Moved', emoji: '\u{1F979}' },
  { value: 'tired', text: 'Tired', emoji: '\u{1F634}' },
  { value: 'soft', text: 'Soft', emoji: '\u{1F97A}' },
  { value: 'silly', text: 'Silly', emoji: '\u{1F643}' },
  { value: 'dark', text: 'Dark', emoji: '\u{1F5A4}' },
  { value: 'grateful', text: 'Grateful', emoji: '\u{1F64F}' },
  { value: 'peaceful', text: 'Peaceful', emoji: '\u{1F9D8}' },
  { value: 'curious', text: 'Curious', emoji: '\u{1F928}' },
  { value: 'dreamy', text: 'Dreamy', emoji: '\u{1F4AD}' },
  { value: 'cozy', text: 'Cozy', emoji: '\u{1F6CB}\uFE0F' },
  { value: 'grounded', text: 'Grounded', emoji: '\u{1F30D}' },
  { value: 'focused', text: 'Focused', emoji: '\u{1F3AF}' },
  { value: 'hyped', text: 'Hyped', emoji: '\u{1F389}' },
  { value: 'blessed', text: 'Blessed', emoji: '\u{1F607}' },
  { value: 'chill', text: 'Chill', emoji: '\u{1F60C}' },
  { value: 'shy', text: 'Shy', emoji: '\u{1F648}' },
  { value: 'excited', text: 'Excited', emoji: '\u{1F929}' },
  { value: 'relaxed', text: 'Relaxed', emoji: '\u{1F60C}' },
  { value: 'hopeful', text: 'Hopeful', emoji: '\u{1F331}' },
  { value: 'love', text: 'Love', emoji: '\u2764\uFE0F' },
];

const MOOD_GRADIENTS = {
  chillin: 'linear-gradient(120deg, #4dd0ff, #34e1ff, #8ed5ff)',
  vibing: 'linear-gradient(120deg, #ff5bff, #d63dff)',
  drippy: 'linear-gradient(120deg, #4dd0ff, #ff34f5)',
  weird: 'linear-gradient(120deg, #fdff75, #ff75a8)',
  building: 'linear-gradient(120deg, #f5a623, #34ecff)',
  'lost-in-the-sauce': 'linear-gradient(120deg, #ff5c33, #ffbb4c)',
  'on-fire': 'linear-gradient(120deg, #ff8f00, #ff1744)',
  creative: 'linear-gradient(120deg, #b76ba3, #6d7df8)',
  flow: 'linear-gradient(120deg, #27c4ff, #1c1cff)',
  sparkly: 'linear-gradient(120deg, #ffd54f, #e040fb)',
  'night-mood': 'linear-gradient(120deg, #1f4bff, #6b1dd1)',
  rainbow: 'linear-gradient(120deg, #ff34f5, #34e1ff, #f5ffb7)',
  music: 'linear-gradient(120deg, #ff3d81, #6148ff)',
  coffee: 'linear-gradient(120deg, #8d6e63, #ffd89a)',
  blossom: 'linear-gradient(120deg, #ffc5d2, #ff8ed6)',
  butterfly: 'linear-gradient(120deg, #d500f9, #ff6cd6)',
  dizzy: 'linear-gradient(120deg, #ffd966, #ff66d8)',
  determined: 'linear-gradient(120deg, #ff3d00, #ff9100)',
  strong: 'linear-gradient(120deg, #ff6b00, #d400ff)',
  cosmic: 'linear-gradient(120deg, #2c2c54, #6b38ff, #0ff4f4)',
  lightning: 'linear-gradient(120deg, #fff176, #ffd600)',
  neon: 'linear-gradient(120deg, #ff00c8, #00f7ff)',
  liminal: 'linear-gradient(120deg, #5df9c5, #3d32ff)',
  glow: 'linear-gradient(120deg, #f5ffb7, #00f5a0)',
  alive: 'linear-gradient(120deg, #00e676, #1de9b6)',
  happy: 'linear-gradient(120deg, #ffd540, #ff6b24)',
  thinking: 'linear-gradient(120deg, #5b78ff, #29b6f6)',
  cool: 'linear-gradient(120deg, #4dd0e1, #1976d2)',
  moved: 'linear-gradient(120deg, #ff9f80, #ff5da5)',
  tired: 'linear-gradient(120deg, #b0bec5, #8e9eab)',
  soft: 'linear-gradient(120deg, #ff9ae5, #f5b7c2)',
  silly: 'linear-gradient(120deg, #ff5cf0, #ffab64)',
  dark: 'linear-gradient(120deg, #1f1b24, #4b0082)',
  grateful: 'linear-gradient(120deg, #ffb347, #ffcc33)',
  peaceful: 'linear-gradient(120deg, #80deea, #26c6da)',
  curious: 'linear-gradient(120deg, #ffa726, #42a5f5)',
  dreamy: 'linear-gradient(120deg, #c1b2ff, #f8bbd0)',
  cozy: 'linear-gradient(120deg, #795548, #ffab91)',
  grounded: 'linear-gradient(120deg, #4caf50, #2e7d32)',
  focused: 'linear-gradient(120deg, #2979ff, #3f48cc)',
  hyped: 'linear-gradient(120deg, #ff6f00, #f50057)',
  blessed: 'linear-gradient(120deg, #fbe38d, #c9ff8f)',
  chill: 'linear-gradient(120deg, #4fc3f7, #29b6f6)',
  shy: 'linear-gradient(120deg, #f8bbd0, #f06292)',
  excited: 'linear-gradient(120deg, #ffca28, #ff5252)',
  relaxed: 'linear-gradient(120deg, #9be7ff, #00b0ff)',
  hopeful: 'linear-gradient(120deg, #c9ff8f, #63e6be)',
  love: 'linear-gradient(120deg, #ff6f91, #ffdbac)',
};

const MOOD_ACCENT_COLORS = {
  chillin: '#34e1ff',
  vibing: '#d63dff',
  drippy: '#ff34f5',
  weird: '#ff75a8',
  building: '#34ecff',
  'lost-in-the-sauce': '#ff5c33',
  'on-fire': '#ff1744',
  creative: '#6d7df8',
  flow: '#1c1cff',
  sparkly: '#ffd54f',
  'night-mood': '#6b1dd1',
  rainbow: '#ff34f5',
  music: '#6148ff',
  coffee: '#8d6e63',
  blossom: '#ff8ed6',
  butterfly: '#d500f9',
  dizzy: '#ffd966',
  determined: '#ff3d00',
  strong: '#ff6b00',
  cosmic: '#6b38ff',
  lightning: '#ffd600',
  neon: '#00f7ff',
  liminal: '#3d32ff',
  glow: '#f5ffb7',
  alive: '#00e676',
  happy: '#ffd540',
  thinking: '#29b6f6',
  cool: '#1976d2',
  moved: '#ff5da5',
  tired: '#8e9eab',
  soft: '#f5b7c2',
  silly: '#ffab64',
  dark: '#4b0082',
  grateful: '#ffb347',
  peaceful: '#26c6da',
  curious: '#ffa726',
  dreamy: '#f8bbd0',
  cozy: '#ffab91',
  grounded: '#4caf50',
  focused: '#3f48cc',
  hyped: '#f50057',
  blessed: '#c9ff8f',
  chill: '#29b6f6',
  shy: '#f06292',
  excited: '#ff5252',
  relaxed: '#00b0ff',
  hopeful: '#63e6be',
  love: '#ff6f91',
};

const DEFAULT_GRADIENT = 'linear-gradient(120deg, rgba(52, 225, 255, 0.8), rgba(255, 52, 245, 0.8))';
const DEFAULT_ACCENT = '#34e1ff';

function normalizeMoodText(text) {
  return (text ?? '').trim().toLowerCase();
}

function findMoodValueByText(text) {
  const normalized = normalizeMoodText(text);
  if (!normalized) return '';
  const match = MOOD_OPTIONS.find((option) => {
    const optionText = (option.text ?? '').trim().toLowerCase();
    return option.value === normalized || optionText === normalized;
  });
  return match ? match.value : normalized;
}

function hashMoodGradient(text) {
  const normalized = normalizeMoodText(text) || 'custom';
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) % 360;
  }
  const hueA = hash;
  const hueB = (hash + 70) % 360;
  return `linear-gradient(120deg, hsl(${hueA} 90% 70%), hsl(${hueB} 80% 65%))`;
}

export function getMoodOutlineGradient(moodText) {
  const moodValue = findMoodValueByText(moodText);
  if (!moodValue) return DEFAULT_GRADIENT;
  return MOOD_GRADIENTS[moodValue] ?? hashMoodGradient(moodText);
}

export function getMoodAccentColor(moodText) {
  const moodValue = findMoodValueByText(moodText);
  return MOOD_ACCENT_COLORS[moodValue] ?? DEFAULT_ACCENT;
}

export function getMoodChipStyle(moodText) {
  const gradient = getMoodOutlineGradient(moodText);
  const accent = getMoodAccentColor(moodText);
  return {
    borderColor: 'transparent',
    borderImageSource: gradient,
    borderImageSlice: 1,
    borderImageWidth: 1,
    borderImageOutset: 0,
    borderImageRepeat: 'stretch',
    boxShadow: `0 0 14px ${accent}33`,
  };
}
