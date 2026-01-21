import { errlForumStrings } from './strings';

export { errlForumStrings };
export {
  formatTemplate,
  getTimeBasedGreeting,
  getTimeBasedGreetingTemplate,
  getTimeOfDay,
  pick,
  renderTemplateParts
} from './variations';

export function isLoreEnabled() {
  return process.env.NEXT_PUBLIC_ERRL_USE_LORE === 'true';
}

export function getForumStrings({ useLore = false } = {}) {
  const baseEasterEggs = errlForumStrings.easterEggs || [];
  if (!useLore) return { ...errlForumStrings, easterEggs: baseEasterEggs };

  const lore = errlForumStrings.loreAlternatives || {};
  return {
    ...errlForumStrings,
    header: { ...errlForumStrings.header, ...(lore.header || {}) },
    hero: { ...errlForumStrings.hero, ...(lore.hero || {}) },
    actions: { ...errlForumStrings.actions, ...(lore.actions || {}) },
    footer: { ...errlForumStrings.footer, ...(lore.footer || {}) },
    easterEggs: lore.easterEggs || baseEasterEggs
  };
}

export function getEasterEgg({ useLore = isLoreEnabled(), date = new Date() } = {}) {
  const strings = getForumStrings({ useLore });
  const eggs = strings.easterEggs || [];
  if (!eggs.length) return null;
  const seed = date.getDate() + date.getMonth() * 31 + date.getFullYear() * 366 + (useLore ? 7 : 0);
  return eggs[Math.abs(seed) % eggs.length] || null;
}

