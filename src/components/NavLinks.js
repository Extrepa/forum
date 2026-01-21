'use client';

import { usePathname } from 'next/navigation';
import { getForumStrings, isLoreEnabled } from '../lib/forum-texts';

export default function NavLinks({ isAdmin, isSignedIn }) {
  const pathname = usePathname();
  const strings = getForumStrings({ useLore: isLoreEnabled() });

  const links = [
    { href: '/timeline', label: strings.tabs.announcements },
    { href: '/events', label: strings.tabs.events },
    ...(isSignedIn ? [{ href: '/devlog', label: 'Dev Log' }] : []),
    { href: '/forum', label: strings.tabs.general },
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
