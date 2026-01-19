'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  const getBackPath = () => {
    // Home page - no back button
    if (pathname === '/') {
      return null;
    }

    // Detail pages (e.g., /forum/[id], /projects/[id], /music/[id])
    // Go back to the list page
    const detailPageMatch = pathname.match(/^\/(forum|projects|music|timeline|events|shitposts)\/([^/]+)$/);
    if (detailPageMatch) {
      return `/${detailPageMatch[1]}`;
    }

    // List pages - go back to home
    return '/';
  };

  const backPath = getBackPath();

  if (!backPath) {
    return null;
  }

  const handleClick = (e) => {
    e.preventDefault();
    router.push(backPath);
  };

  return (
    <button
      onClick={handleClick}
      className="back-button"
      aria-label="Go back"
      title="Go back"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 19-7-7 7-7"></path>
        <path d="M19 12H5"></path>
      </svg>
    </button>
  );
}
