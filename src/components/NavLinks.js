'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useUiPrefs } from './UiPrefsProvider';
import { getForumStrings } from '../lib/forum-texts';

export default function NavLinks({ isAdmin, isSignedIn, variant = 'all' }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });

  const primaryLinks = [
    { href: '/feed', label: 'Feed' },
    { href: '/announcements', label: strings.tabs.announcements },
    { href: '/events', label: strings.tabs.events },
    { href: '/devlog', label: 'Development' },
    { href: '/lobby', label: 'General' },
    { href: '/music', label: strings.tabs.music },
    { href: '/projects', label: strings.tabs.projects },
    { href: '/shitposts', label: strings.tabs.shitposts },
  ];

  const moreLinks = [
    { href: '/art-nostalgia', label: 'Art & Nostalgia' },
    { href: '/bugs-rant', label: 'Bugs & Rants' },
    { href: '/lore-memories', label: 'Lore & Memories' },
  ];

  const links =
    variant === 'primary'
      ? primaryLinks
      : variant === 'more'
      ? moreLinks
      : [...primaryLinks, ...moreLinks];

  const isActive = (href) => {
    return pathname.startsWith(href);
  };

  const handleLinkClick = (e, href) => {
    // If not signed in, show message and prevent navigation
    if (!isSignedIn) {
      e.preventDefault();
      alert('Please sign in to access this page.');
      return;
    }

    // For "more" variant links, ensure navigation happens
    if (variant === 'more') {
      e.preventDefault();
      router.push(href);
    }
    // For other variants, let default navigation happen
  };

  return (
    <>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={isActive(link.href) ? 'active' : ''}
          onClick={(e) => handleLinkClick(e, link.href)}
        >
          {link.label}
        </a>
      ))}
    </>
  );
}
