'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useUiPrefs } from './UiPrefsProvider';
import { getForumStrings } from '../lib/forum-texts';

export default function NavLinks({ isAdmin, isSignedIn, variant = 'all', easterEgg }) {
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
    if (!isSignedIn) {
      e.preventDefault();
      return;
    }
    // For "more" variant links, ensure navigation happens
    if (variant === 'more') {
      e.preventDefault();
      router.push(href);
    }
    // For "all" variant (mobile menu), ensure navigation happens
    // This prevents the menu from closing before navigation completes
    if (variant === 'all') {
      // Let default navigation happen, but ensure it proceeds
      // The pathname change will close the menu via useEffect in SiteHeader
    }
    // For other variants, let default navigation happen
    // Note: Pages themselves handle authentication checks, so we don't block navigation here
  };

  return (
    <>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={[
            isActive(link.href) ? 'active' : '',
            link.href === '/feed' && easterEgg?.armed ? 'nav-link-egg-armed' : '',
            link.href === '/feed' && easterEgg?.dragging ? 'nav-link-egg-hidden' : ''
          ]
            .filter(Boolean)
            .join(' ')}
          data-egg-hidden={link.href === '/feed' && easterEgg?.dragging ? 'true' : undefined}
          ref={link.href === '/feed' ? easterEgg?.feedRef : null}
          onDoubleClick={link.href === '/feed' ? easterEgg?.onArm : undefined}
          onPointerDown={link.href === '/feed' ? easterEgg?.onDragStart : undefined}
          onClick={(e) => handleLinkClick(e, link.href)}
        >
          {link.label}
        </a>
      ))}
    </>
  );
}
