'use client';

import { usePathname } from 'next/navigation';

export default function NavLinks() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home' },
    { href: '/timeline', label: 'Announcements' },
    { href: '/events', label: 'Events' },
    { href: '/forum', label: 'General' },
    { href: '/music', label: 'Music' },
    { href: '/projects', label: 'Projects' },
    { href: '/shitposts', label: 'Shitposts' },
  ];

  const isActive = (href) => {
    if (href === '/') {
      return pathname === '/';
    }
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
