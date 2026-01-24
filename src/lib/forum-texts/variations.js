function clampIndex(index, length) {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}

export function formatTemplate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = vars?.[key];
    return value == null ? `{${key}}` : String(value);
  });
}

export function pick(items, seed) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const idx = clampIndex(Math.floor(seed ?? 0) % items.length, items.length);
  return items[idx];
}

export function getTimeOfDay(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'lateNight';
}

const TIME_BASED_GREETINGS = {
  standard: {
    morning: ['Rise and drip, {username}.', 'Good morning, portal traveler.', 'The goo is fresh. The portal is warm.'],
    afternoon: ['Afternoon vibes detected, {username}.', 'Portal status: mildly active.', 'The drip cycle continues.'],
    evening: [
      'Evening glow activated, {username}.',
      'Portal winding down… or heating up?',
      'The realms are quieter now. Perfect for deep thoughts.'
    ],
    lateNight: ['3am portal hours. Errl approves.', 'Late-night drips hit different.', 'The portal is open. The goo is listening.']
  },
  lore: {
    morning: ['Rise and drip, {username}.', 'Good morning, Nomad. The drip that followed us home.', 'Pulled together by chance and light. Good morning.'],
    afternoon: ['Afternoon vibes detected, {username}.', 'Consistency inside chaos. Portal status: mildly active.', 'The Nomad network is awake.'],
    evening: ['Evening glow activated, {username}.', 'Face never changes. Body expresses everything.', 'The realms are quieter now. Perfect for deep thoughts.'],
    lateNight: ['3am portal hours. Errl approves.', 'Nomads are still awake. Join them.', 'The drip cycle continues.']
  }
};

export function getTimeBasedGreetingTemplate({ useLore = false, date = new Date() } = {}) {
  const timeOfDay = getTimeOfDay(date);
  const set = useLore ? TIME_BASED_GREETINGS.lore : TIME_BASED_GREETINGS.standard;
  const options = set[timeOfDay] || set.afternoon;
  const seed = date.getDate() + date.getMonth() * 31 + date.getFullYear() * 366 + (useLore ? 7 : 0);
  const template = pick(options, seed) || 'Welcome back, {username}.';
  return { template, timeOfDay };
}

export function renderTemplateParts(template, varName) {
  const token = `{${varName}}`;
  const idx = template.indexOf(token);
  if (idx === -1) {
    return { hasVar: false, before: template, after: '' };
  }
  const before = template.slice(0, idx);
  const after = template.slice(idx + token.length);
  return { hasVar: true, before, after };
}

export function getTimeBasedGreeting({ username, useLore = false, date = new Date() } = {}) {
  const { template } = getTimeBasedGreetingTemplate({ useLore, date });
  return formatTemplate(template, { username: username ?? 'friend' });
}

