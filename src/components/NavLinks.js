'use client';

import { usePathname } from 'next/navigation';
import { useUiPrefs } from './UiPrefsProvider';
import { getForumStrings } from '../lib/forum-texts';

export default function NavLinks({ isAdmin, isSignedIn }) {
  const pathname = usePathname();
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });

  const links = [
    { href: '/feed', label: 'Feed' },
    { href: '/announcements', label: strings.tabs.announcements },
    { href: '/events', label: strings.tabs.events },
    ...(isSignedIn ? [{ href: '/devlog', label: 'Development' }] : []),
    { href: '/lobby', label: 'Lobby' },
    { href: '/music', label: strings.tabs.music },
    { href: '/projects', label: strings.tabs.projects },
    { href: '/shitposts', label: strings.tabs.shitposts },
  ];

  const isActive = (href) => {
    return pathname.startsWith(href);
  };

  return (
    <>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={isActive(link.href) ? 'active' : ''}
        >
          {link.label}
        </a>
      ))}
    </>
  );
}
