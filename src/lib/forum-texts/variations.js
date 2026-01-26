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
  // Convert to PST/PDT timezone for consistent time-of-day detection
  const pstFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    hour12: false
  });
  const hour = parseInt(pstFormatter.format(date), 10);
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'lateNight';
}

// 24 unique messages for each hour (0-23)
const HOURLY_GREETINGS = {
  home: {
    standard: [
    'Midnight portal hours. The goo never sleeps, {username}.', // 0
    '1am vibes. Errl is watching. The drip continues.', // 1
    '2am portal energy. Late-night thoughts welcome here, {username}.', // 2
    '3am portal hours. Errl approves, {username}.', // 3
    '4am stillness. The portal breathes with you, {username}.', // 4
    '5am pre-dawn glow. Fresh drips incoming, {username}.', // 5
    '6am portal awakening. Rise and drip, {username}.', // 6
    '7am morning goo. The portal is fresh, {username}.', // 7
    '8am portal breakfast. Good morning, {username}.', // 8
    '9am drip cycle begins. Portal status: active, {username}.', // 9
    '10am portal vibes. The goo is warm, {username}.', // 10
    '11am mid-morning drip. Portal traveler, {username}.', // 11
    'Noon portal peak. Maximum drip detected, {username}.', // 12
    '1pm afternoon vibes. Portal status: mildly active, {username}.', // 13
    '2pm portal energy. The drip cycle continues, {username}.', // 14
    '3pm portal flow. Consistency inside chaos, {username}.', // 15
    '4pm portal glow. Afternoon drips hit different, {username}.', // 16
    '5pm portal transition. Evening approaches, {username}.', // 17
    '6pm portal evening. The realms are quieter now, {username}.', // 18
    '7pm evening glow activated, {username}.', // 19
    '8pm portal winding down… or heating up, {username}?', // 20
    '9pm portal hours. Perfect for deep thoughts, {username}.', // 21
    '10pm portal night. The goo is listening, {username}.', // 22
    '11pm late-night drips. The portal is open, {username}.' // 23
    ],
    lore: [
    'Midnight portal hours. Errl was born May 1, 2015. The drip continues, {username}.', // 0
    '1am Nomad hours. The drip that followed us home, {username}.', // 1
    '2am portal energy. Pulled together by chance and light, {username}.', // 2
    '3am portal hours. Errl approves, Nomad {username}.', // 3
    '4am stillness. Face never changes. Body expresses everything, {username}.', // 4
    '5am pre-dawn glow. From Mayday Heyday to the Portal, {username}.', // 5
    '6am portal awakening. Rise and drip, Nomad {username}.', // 6
    '7am morning goo. Good morning, {username}. The Nomad network is awake.', // 7
    '8am portal breakfast. Consistency inside chaos. Good morning, {username}.', // 8
    '9am drip cycle begins. The Nomads made it real, {username}.', // 9
    '10am portal vibes. Geoff found Errl in the projector goo, {username}.', // 10
    '11am mid-morning drip. The world melts; the vibe holds, {username}.', // 11
    'Noon portal peak. Effervescent Remnant of Radical Liminality, {username}.', // 12
    '1pm afternoon vibes. Portal status: mildly active, Nomad {username}.', // 13
    '2pm portal energy. The Nomad network is awake, {username}.', // 14
    '3pm portal flow. Consistency inside chaos, {username}.', // 15
    '4pm portal glow. The drip cycle continues, {username}.', // 16
    '5pm portal transition. Evening approaches, Nomad {username}.', // 17
    '6pm portal evening. The realms are quieter now, {username}.', // 18
    '7pm evening glow activated, {username}. Face never changes.', // 19
    '8pm portal winding down… or heating up, {username}?', // 20
    '9pm portal hours. Perfect for deep thoughts, Nomad {username}.', // 21
    '10pm portal night. Nomads are still awake. Join them, {username}.', // 22
    '11pm late-night drips. The portal is open. The goo is listening, {username}.' // 23
    ]
  },
  feed: {
    standard: [
      'Midnight feed hours. Fresh drips are flowing, {username}.', // 0
      '1am feed vibes. The latest activity never sleeps, {username}.', // 1
      '2am feed energy. Late-night updates welcome here, {username}.', // 2
      '3am feed hours. New posts are dropping, {username}.', // 3
      '4am feed stillness. The activity stream breathes with you, {username}.', // 4
      '5am feed glow. Fresh updates incoming, {username}.', // 5
      '6am feed awakening. Rise and check the latest, {username}.', // 6
      '7am feed fresh. New activity detected, {username}.', // 7
      '8am feed breakfast. Good morning, {username}. Check your feed.', // 8
      '9am feed active. Latest updates are rolling in, {username}.', // 9
      '10am feed vibes. The activity stream is warm, {username}.', // 10
      '11am feed mid-morning. Fresh posts await, {username}.', // 11
      'Noon feed peak. Maximum activity detected, {username}.', // 12
      '1pm feed afternoon. Portal activity is active, {username}.', // 13
      '2pm feed energy. The latest updates continue, {username}.', // 14
      '3pm feed flow. Consistency in the activity stream, {username}.', // 15
      '4pm feed glow. Afternoon updates hit different, {username}.', // 16
      '5pm feed transition. Evening activity approaches, {username}.', // 17
      '6pm feed evening. The activity stream is quieter now, {username}.', // 18
      '7pm feed glow. Evening updates activated, {username}.', // 19
      '8pm feed winding down… or heating up, {username}?', // 20
      '9pm feed hours. Perfect time to catch up, {username}.', // 21
      '10pm feed night. The activity stream is listening, {username}.', // 22
      '11pm feed late-night. Fresh updates are still flowing, {username}.' // 23
    ],
    lore: [
      'Midnight feed hours. Errl was born May 1, 2015. The activity continues, {username}.', // 0
      '1am feed Nomad hours. The latest drips that followed us home, {username}.', // 1
      '2am feed energy. Pulled together by chance and light. Check your feed, {username}.', // 2
      '3am feed hours. Errl approves, Nomad {username}. New posts await.', // 3
      '4am feed stillness. Face never changes. Activity expresses everything, {username}.', // 4
      '5am feed glow. From Mayday Heyday to the Portal, {username}.', // 5
      '6am feed awakening. Rise and check the latest, Nomad {username}.', // 6
      '7am feed fresh. Good morning, {username}. The Nomad network is active.', // 7
      '8am feed breakfast. Consistency inside chaos. Good morning, {username}.', // 8
      '9am feed active. The Nomads made it real, {username}.', // 9
      '10am feed vibes. Geoff found Errl in the projector goo, {username}.', // 10
      '11am feed mid-morning. The world melts; the activity holds, {username}.', // 11
      'Noon feed peak. Effervescent Remnant of Radical Liminality, {username}.', // 12
      '1pm feed afternoon. Portal activity is active, Nomad {username}.', // 13
      '2pm feed energy. The Nomad network is awake, {username}.', // 14
      '3pm feed flow. Consistency inside chaos, {username}.', // 15
      '4pm feed glow. The activity stream continues, {username}.', // 16
      '5pm feed transition. Evening updates approach, Nomad {username}.', // 17
      '6pm feed evening. The activity stream is quieter now, {username}.', // 18
      '7pm feed glow. Evening updates activated, {username}. Face never changes.', // 19
      '8pm feed winding down… or heating up, {username}?', // 20
      '9pm feed hours. Perfect time to catch up, Nomad {username}.', // 21
      '10pm feed night. Nomads are still active. Join them, {username}.', // 22
      '11pm feed late-night. The activity stream is open. Fresh updates await, {username}.' // 23
    ]
  }
};

export function getTimeBasedGreetingTemplate({ useLore = false, date = new Date(), context = 'home' } = {}) {
  // Convert to PST/PDT timezone for consistent greetings
  // Use Intl.DateTimeFormat to get the hour in PST/PDT
  const pstFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    hour12: false
  });
  const hour = parseInt(pstFormatter.format(date), 10); // 0-23 in PST/PDT
  const contextSet = HOURLY_GREETINGS[context] || HOURLY_GREETINGS.home;
  const messages = useLore ? contextSet.lore : contextSet.standard;
  const template = messages[hour] || messages[12]; // Default to noon if somehow invalid
  const timeOfDay = getTimeOfDay(date); // Keep for backwards compatibility
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

