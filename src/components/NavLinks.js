'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useUiPrefs } from './UiPrefsProvider';
import { getForumStrings } from '../lib/forum-texts';

function getPrimaryLinks(strings) {
  return [
    { href: '/feed', label: 'Feed' },
    { href: '/announcements', label: strings.tabs.announcements },
    { href: '/events', label: strings.tabs.events },
    { href: '/devlog', label: 'Development' },
    { href: '/lobby', label: 'General' },
    { href: '/music', label: strings.tabs.music },
    { href: '/projects', label: strings.tabs.projects },
    { href: '/shitposts', label: strings.tabs.shitposts },
  ];
}

function getMoreLinks() {
  return [
    { href: '/art-nostalgia', label: 'Art & Nostalgia' },
    { href: '/bugs-rant', label: 'Bugs & Rants' },
    { href: '/lore-memories', label: 'Lore & Memories' },
  ];
}

function getLinks(strings, variant) {
  const primaryLinks = getPrimaryLinks(strings);
  const moreLinks = getMoreLinks();

  if (variant === 'primary') return primaryLinks;
  if (variant === 'more') return moreLinks;
  return [...primaryLinks, ...moreLinks];
}

export default function NavLinks({
  isSignedIn,
  variant = 'all',
  easterEgg,
  filterQuery = '',
  onNavigate,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });

  const normalizedQuery = filterQuery.trim().toLowerCase();
  const links = getLinks(strings, variant).filter((link) => {
    if (!normalizedQuery) return true;
    return link.label.toLowerCase().includes(normalizedQuery);
  });

  const isActive = (href) => {
    return pathname.startsWith(href);
  };

  const handleLinkClick = (e, href) => {
    if (!isSignedIn) {
      e.preventDefault();
      return;
    }

    if (variant === 'more' || variant === 'all' || typeof onNavigate === 'function') {
      e.preventDefault();
      router.push(href);
      onNavigate?.(href);
    }
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
